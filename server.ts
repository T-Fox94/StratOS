import express from "express";
import helmet from "helmet";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { PrismaClient } from "@prisma/client";
import path from "path";
import cookieSession from "cookie-session";
import axios from "axios";
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import admin from 'firebase-admin';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

let adminDb: any = null;
let prisma: any = null;

async function startServer() {
  const PORT = process.env.PORT || 8080;
  console.log("-----------------------------------------");
  console.log("[SERVER] Version 1.1.11 - Baseline Recovery");
  console.log("-----------------------------------------");

  // Initialize Prisma safely
  try {
    prisma = new PrismaClient();
    console.log("[Prisma] Client Instance Hooked");
  } catch (e: any) {
    console.error("[Prisma] Fatal Init Failure:", e.message);
  }

  let firebaseConfig: any = {};
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (e) {
    console.warn("[SERVER] Config Read Warning");
  }

  // Initialize Firebase Admin
  try {
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: firebaseConfig.projectId || process.env.GOOGLE_CLOUD_PROJECT,
      });
      console.log("[FirebaseAdmin] Handshake Locked");
    }
    
    const adminApp = admin.app();
    adminDb = firebaseConfig.firestoreDatabaseId 
      ? getAdminFirestore(adminApp, firebaseConfig.firestoreDatabaseId)
      : getAdminFirestore(adminApp);
  } catch (e: any) {
    console.warn("[FirebaseAdmin] Startup Bypass:", e.message);
  }

  const app = express();
  
  // 1. Health Check
  app.get("/health", (req, res) => res.status(200).send("OK - Healthy"));
  
  // 2. Diagnostic Debug Route (v1.8.0)
  app.get("/api/auth/debug", async (req, res) => {
    try {
      console.log("[Debug] Running Handshake Diagnostic...");
      let fbConfig = null;
      let dbReady = false;

      if (adminDb) {
        const globalDoc = await adminDb.collection('global_settings').doc('oauth_credentials').get();
        fbConfig = globalDoc.exists ? globalDoc.data()?.facebook : null;
        dbReady = true;
      }
      
      res.json({
        status: "Diagnostic 1.8.0",
        database: { isInitialized: !!adminDb, isReady: dbReady },
        env: {
          hasFbId: !!(process.env.FACEBOOK_CLIENT_ID || process.env.FACEBOOK_APP_ID),
          hasFbSecret: !!(process.env.FACEBOOK_CLIENT_SECRET || process.env.FACEBOOK_APP_SECRET)
        },
        lookup: {
          facebookResult: fbConfig ? "Found in Firestore" : "Not in Firestore",
          hardcodedFallbackActive: true
        }
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 3. Middlewares
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": ["'self'", "data:", "https://*", "blob:"],
        "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://*"],
        "connect-src": ["'self'", "https://*", "wss://*"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  app.use(cors({
    origin: ["https://localhost", "http://localhost:5173", /\.run\.app$/],
    credentials: true
  }));

  app.use(express.json());
  app.use(cookieSession({
    name: '__Host-session',
    keys: [process.env.SESSION_SECRET || 'stratos-production-fallback-key-rotate-me'],
    maxAge: 24 * 60 * 60 * 1000,
    secure: true,
    httpOnly: true,
    sameSite: 'lax'
  }));

  // 4. In-Memory Credential Cache (The Lightning Handshake)
  const credentialCache: Record<string, any> = {};

  const getOAuthConfig = async (platform: string, req: express.Request, agencyClientId?: string) => {
    // Hyper-Sanitize (Removes any non-alpha characters like zero-width spaces or symbols)
    const pKey = platform.toLowerCase().replace(/[^a-z]/g, '').trim();
    const isFacebook = pKey === 'facebook' || pKey === 'fb';
    
    console.log(`[Handshake] Starting for platform: "${platform}" (pKey: "${pKey}"), Client: ${agencyClientId || 'Global'}`);
    
    // Check Cache first for Global credentials
    if (!agencyClientId && credentialCache[pKey]) {
      console.log(`[Handshake] Cache HIT for ${pKey}`);
      return { 
        ...credentialCache[pKey].config,
        clientId: credentialCache[pKey].id,
        clientSecret: credentialCache[pKey].secret,
        redirectUri: `https://${req.get('host')}/api/auth/${platform}/callback`
      };
    }

    let finalId = null;
    let finalSecret = null;

    // HANDSHAKE STEP 1: Environment
    const envId = process.env[`${pKey.toUpperCase()}_CLIENT_ID`] || process.env[`${pKey.toUpperCase()}_APP_ID` ] || (isFacebook ? process.env.FACEBOOK_APP_ID : null);
    const envSecret = process.env[`${pKey.toUpperCase()}_CLIENT_SECRET`] || process.env[`${pKey.toUpperCase()}_APP_SECRET` ] || (isFacebook ? process.env.FACEBOOK_APP_SECRET : null);
    
    if (envId && envSecret) {
      console.log(`[Handshake] Found in Environment for ${pKey}`);
      finalId = envId; finalSecret = envSecret;
    }

    // HANDSHAKE STEP 2: Client Config
    if (agencyClientId && (!finalId || !finalSecret)) {
      try {
        if (adminDb) {
          const doc = await adminDb.collection('client_social_configs').doc(agencyClientId).get();
          const data = doc.data();
          if (data) {
            if (isFacebook && data.facebookAppId && data.facebookAppSecret) {
              finalId = data.facebookAppId; finalSecret = data.facebookAppSecret;
              console.log(`[Handshake] Found in Client Config (Facebook)`);
            } else if (pKey === 'linkedin' && data.linkedinClientId && data.linkedinClientSecret) {
              finalId = data.linkedinClientId; finalSecret = data.linkedinClientSecret;
              console.log(`[Handshake] Found in Client Config (LinkedIn)`);
            }
          }
        }
      } catch (e) {
        console.error(`[Handshake] Client Config Error:`, e.message);
      }
    }

    // HANDSHAKE STEP 3: Global Config
    if (!finalId || !finalSecret) {
      try {
        if (adminDb) {
          const doc = await adminDb.collection('global_settings').doc('oauth_credentials').get();
          const data = doc.data();
          if (data && data[pKey] && data[pKey].clientId && data[pKey].clientSecret) {
            finalId = data[pKey].clientId; finalSecret = data[pKey].clientSecret;
            console.log(`[Handshake] Found in Global Config for ${pKey}`);
          }
        }
      } catch (e) {
        console.error(`[Handshake] Global Config Error:`, e.message);
      }
    }

    // HANDSHAKE STEP 4: Absolute Fallback (Facebook)
    if (isFacebook && (!finalId || !finalSecret)) {
      console.log(`[Handshake] CRITICAL: Using Facebook Absolute Fallback`);
      finalId = '1621305335865053';
      finalSecret = '4e450f5b4fd53d0853a1e4342d943f58';
    }

    const configs: Record<string, any> = {
      linkedin: {
        authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
        tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
        scope: 'openid profile email w_member_social'
      },
      facebook: {
        authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
        tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
        scope: 'pages_manage_posts,pages_read_engagement,pages_show_list,public_profile'
      },
      fb: {
        authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
        tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
        scope: 'pages_manage_posts,pages_read_engagement,pages_show_list,public_profile'
      }
    };

    // Cache Global Result
    if (!agencyClientId && finalId && finalSecret) {
      credentialCache[pKey] = { id: finalId, secret: finalSecret, config: configs[pKey] };
    }

    const configKey = configs[pKey] ? pKey : (isFacebook ? 'facebook' : pKey);

    return { 
      ...configs[configKey], 
      clientId: finalId, 
      clientSecret: finalSecret, 
      redirectUri: `https://${req.get('host')}/api/auth/${platform}/callback` 
    };
  };

  // 5. OAuth Initiation
  app.get("/api/auth/:platform", async (req, res) => {
    const { platform } = req.params;
    const { clientId: client_id, mobile } = req.query;
    
    const config = await getOAuthConfig(platform, req, client_id as string);
    if (!config.clientId) {
      return res.status(400).json({ 
        error: `OAuth not configured for platform: "${platform}" (Handshake ID: "${platform.toLowerCase().replace(/[^a-z]/g, '')}"). Please add credentials in API Settings.` 
      });
    }

    const state = Buffer.from(JSON.stringify({
      csrf: Math.random().toString(36).substring(7),
      clientId: client_id,
      mobile: mobile === 'true'
    })).toString('base64');

    if (req.session) {
      req.session.pendingClientId = client_id;
      req.session.platform = platform;
    }

    const params = new URLSearchParams({
      response_type: 'code', client_id: config.clientId,
      redirect_uri: config.redirectUri, state, scope: config.scope
    });

    res.json({ url: `${config.authUrl}?${params.toString()}` });
  });

  // 6. OAuth Callback (Same-Tab Support)
  app.get("/api/auth/:platform/callback", async (req, res) => {
    const { platform } = req.params;
    const { code, state: encodedState } = req.query;

    let pendingClientId = req.session?.pendingClientId;
    let isMobile = false;

    if (encodedState) {
      try {
        const decodedState = JSON.parse(Buffer.from(String(encodedState), 'base64').toString());
        pendingClientId = decodedState.clientId || pendingClientId;
        isMobile = !!decodedState.mobile;
      } catch (e) {}
    }

    const config = await getOAuthConfig(platform, req, pendingClientId);

    try {
      const response = await axios.post(config.tokenUrl, new URLSearchParams({
        grant_type: 'authorization_code',
        code: String(code),
        redirect_uri: config.redirectUri,
        client_id: config.clientId,
        client_secret: config.clientSecret
      }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const { access_token, refresh_token, expires_in } = response.data;
      let finalAccessToken = access_token;
      let finalPlatformAccountId = response.data.user_id || response.data.id || 'unknown';
      let finalHandle = response.data.name || 'Connected Account';

      // Special handling for LinkedIn
      if (platform === 'linkedin') {
        const ui = await axios.get('https://api.linkedin.com/v2/userinfo', { headers: { Authorization: `Bearer ${access_token}` } });
        finalPlatformAccountId = ui.data.sub;
        finalHandle = ui.data.name;
      }

      // Special handling Facebook
      if (platform === 'facebook') {
        const ll = await axios.get(`https://graph.facebook.com/v18.0/oauth/access_token`, {
          params: { grant_type: 'fb_exchange_token', client_id: config.clientId, client_secret: config.clientSecret, fb_exchange_token: access_token }
        });
        const pages = await axios.get(`https://graph.facebook.com/me/accounts?access_token=${ll.data.access_token}`);
        const target = pages.data.data[0];
        if (target) {
          finalAccessToken = target.access_token;
          finalPlatformAccountId = target.id;
          finalHandle = target.name;
        }
      }

      if (pendingClientId) {
        await adminDb.collection('social_accounts').add({
          platform, clientId: pendingClientId, accessToken: finalAccessToken,
          refreshToken: refresh_token || null, platformAccountId: String(finalPlatformAccountId),
          handle: finalHandle, status: 'connected', updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      if (isMobile) {
        return res.redirect(`com.stratos.agencyos://oauth-callback?platform=${platform}&status=success&handle=${encodeURIComponent(finalHandle)}`);
      }

      // SAME-TAB REDIRECT (Version 1.9.0)
      res.redirect(`/?status=success&platform=${platform}&handle=${encodeURIComponent(finalHandle)}`);

    } catch (error: any) {
      console.error(`[OAuth] ${platform} error:`, error.message);
      res.redirect(`/?status=error&platform=${platform}&message=${encodeURIComponent(error.message)}`);
    }
  });

  // Clean up duplicate diagnostic route
  app.get("/api/admin/env-keys", (req, res) => { res.json(Object.keys(process.env)); });

  app.post("/api/settings/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const settings = await prisma.globalSettings.upsert({
        where: { id },
        update: { data: JSON.stringify(req.body) },
        create: { id, data: JSON.stringify(req.body) }
      });
      res.json(JSON.parse(settings.data));
    } catch (error) {
      console.error("Error saving global settings:", error);
      res.status(500).json({ error: "Failed to save global settings" });
    }
  });

  app.get("/api/settings/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const settings = await prisma.globalSettings.findUnique({
        where: { id }
      });
      res.json(settings ? JSON.parse(settings.data) : {});
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch global settings" });
    }
  });

  app.post("/api/clients/:id/social-config", async (req, res) => {
    const { id } = req.params;
    try {
      const config = await prisma.clientSocialConfig.upsert({
        where: { clientId: id },
        update: req.body,
        create: { ...req.body, clientId: id }
      });
      res.json(config);
    } catch (error) {
      console.error("Error saving social config:", error);
      res.status(500).json({ error: "Failed to save social config" });
    }
  });

  app.get("/api/clients/:id/social-config", async (req, res) => {
    const { id } = req.params;
    try {
      const config = await prisma.clientSocialConfig.findUnique({
        where: { clientId: id }
      });
      res.json(config || {});
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch social config" });
    }
  });

  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await prisma.client.findMany({
        include: { socialAccounts: true }
      });
      res.json(clients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const client = await prisma.client.create({ data: req.body });
      res.json(client);
    } catch (error) {
      res.status(500).json({ error: "Failed to create client" });
    }
  });

  app.get("/api/posts", async (req, res) => {
    const { clientId } = req.query;
    try {
      const posts = await prisma.post.findMany({
        where: clientId ? { clientId: String(clientId) } : {},
        orderBy: { createdAt: 'desc' }
      });
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  app.post("/api/posts", async (req, res) => {
    try {
      const post = await prisma.post.create({ data: req.body });
      res.json(post);
    } catch (error) {
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  app.get("/api/crisis", async (req, res) => {
    const { clientId } = req.query;
    try {
      const events = await prisma.crisisEvent.findMany({
        where: clientId ? { clientId: String(clientId) } : {},
        orderBy: { createdAt: 'desc' }
      });
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch crisis events" });
    }
  });

  app.get("/api/trends", async (req, res) => {
    try {
      const trends = await prisma.trend.findMany({
        orderBy: { relevanceScore: 'desc' }
      });
      res.json(trends);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trends" });
    }
  });

  app.get("/api/analytics", async (req, res) => {
    try {
      // Mock analytics data
      res.json({
        activeClients: await prisma.client.count({ where: { status: 'active' } }),
        postsThisMonth: await prisma.post.count(),
        pendingApproval: await prisma.post.count({ where: { status: 'pending' } }),
        activeCrises: await prisma.crisisEvent.count({ where: { status: 'active' } }),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Webhook Verification Tokens (Configurable)
  const VERIFY_TOKENS: Record<string, string> = {
    instagram: process.env.INSTAGRAM_VERIFY_TOKEN || 'stratos_insta_token',
    facebook: process.env.FACEBOOK_VERIFY_TOKEN || 'stratos_fb_token',
    linkedin: process.env.LINKEDIN_VERIFY_TOKEN || 'stratos_li_token',
    tiktok: process.env.TIKTOK_VERIFY_TOKEN || 'stratos_tt_token',
  };

  // Webhook Verification (GET)
  app.get("/api/webhooks/:platform", async (req, res) => {
    const { platform } = req.params;
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    let verifyToken = VERIFY_TOKENS[platform];

    // Check if this webhook is for a specific client (via query param)
    const clientId = req.query.clientId as string;
    if (clientId) {
      try {
        const clientConfigDoc = await adminDb.collection('client_social_configs').doc(clientId).get();
        if (clientConfigDoc.exists) {
          const data = clientConfigDoc.data();
          if (data && data.fbVerifyToken && (platform === 'facebook' || platform === 'instagram')) {
            verifyToken = data.fbVerifyToken;
          }
        }
      } catch (e) {
        console.warn("[Webhooks] Firestore verify token lookup failed:", e.message);
      }
    }

    if (mode === 'subscribe' && token === verifyToken) {
      console.log(`Webhook verified for ${platform}`);
      return res.status(200).send(challenge);
    } else {
      return res.status(403).send('Verification failed');
    }
  });

  // Webhook Event Handling (POST)
  app.post("/api/webhooks/:platform", async (req, res) => {
    const { platform } = req.params;
    const payload = req.body;

    console.log(`Received ${platform} webhook:`, JSON.stringify(payload, null, 2));

    try {
      // 1. Determine Event Type and Related ID
      let eventType = payload.eventType || payload.event || payload.type || 'unknown';
      let platformAccountId = payload.account_id || payload.user_id || payload.object_id;
      
      // Platform specific extraction
      if (platform === 'instagram' && payload.entry?.[0]?.id) {
        platformAccountId = payload.entry[0].id;
      }
      
      // 2. Find associated client
      let clientId = null;
      if (platformAccountId) {
        const account = await prisma.socialAccount.findFirst({
          where: { 
            platform, 
            platformAccountId: String(platformAccountId) 
          }
        });
        if (account) clientId = account.clientId;
      }

      // 3. Store Webhook Event
      const webhookEvent = await prisma.webhookEvent.create({
        data: {
          platform,
          eventType,
          rawData: JSON.stringify(payload),
          processed: false,
          clientId,
          relatedId: payload.id || payload.object_id || null
        }
      });

      // 4. Crisis Detection (Automated Processing)
      const negativeKeywords = [
        'scam', 'fraud', 'terrible', 'worst', 'never buy', 'avoid', 
        'disappointed', 'angry', 'sue', 'lawsuit', 'fake', 'stolen',
        'garbage', 'trash', 'horrible', 'hate'
      ];
      
      const textToScan = (
        payload.text || 
        payload.caption || 
        payload.message || 
        payload.comment?.text || 
        ''
      ).toLowerCase();
      
      const hasNegativeContent = negativeKeywords.some(keyword => textToScan.includes(keyword));
      
      if (hasNegativeContent && clientId) {
        await prisma.crisisEvent.create({
          data: {
            title: `Crisis Alert: ${platform.charAt(0).toUpperCase() + platform.slice(1)} ${eventType}`,
            description: `Negative content detected: "${textToScan.substring(0, 100)}${textToScan.length > 100 ? '...' : ''}"`,
            severity: textToScan.includes('sue') || textToScan.includes('lawsuit') ? 'critical' : 'high',
            status: 'active',
            responseDraft: "We've flagged this for immediate review. Our team will reach out to the user shortly.",
            clientId
          }
        });
        
        // Update task stats
        await prisma.agentTask.updateMany({
          where: { type: 'MONITOR_COMMENTS' },
          data: { successCount: { increment: 1 }, totalRuns: { increment: 1 } }
        });
      }

      // 5. Job Queue Integration (Simulated Background Processing)
      setTimeout(async () => {
        await prisma.webhookEvent.update({
          where: { id: webhookEvent.id },
          data: { processed: true }
        });
        console.log(`Job completed: WEBHOOK_PROCESS for ${platform} event ${eventType}`);
      }, 2000);

      res.status(200).json({ status: 'success', id: webhookEvent.id });
    } catch (error) {
      console.error(`Error processing ${platform} webhook:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Verify Social Account Connection
  app.post("/api/social/verify/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const account = await prisma.socialAccount.findUnique({
        where: { id }
      });

      if (!account || !account.accessToken) {
        return res.status(404).json({ error: "Account not found or no token available" });
      }

      let isValid = false;
      let platformData = null;

      try {
        if (account.platform === "facebook" || account.platform === "instagram") {
          const response = await axios.get(`https://graph.facebook.com/me?access_token=${account.accessToken}`);
          platformData = response.data;
          isValid = !!platformData.id;
        } else if (account.platform === "linkedin") {
          const response = await axios.get("https://api.linkedin.com/v2/userinfo", {
            headers: { Authorization: `Bearer ${account.accessToken}` }
          });
          platformData = response.data;
          isValid = !!platformData.sub;
        } else {
          // For others, we'll just assume it's valid if we can't check easily without more complex SDKs
          isValid = true;
        }
      } catch (apiError: any) {
        console.error(`[SocialVerify] API error for ${account.platform}:`, apiError.response?.data || apiError.message);
        isValid = false;
      }

      const newStatus = isValid ? "connected" : "error";
      
      // Update Prisma
      await prisma.socialAccount.update({
        where: { id },
        data: { status: newStatus }
      });

      // Update Firestore (Admin SDK)
      try {
        await adminDb.collection("social_accounts").doc(id).update({
          status: newStatus,
          lastVerified: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (fsError) {
        console.warn("[SocialVerify] Firestore update failed:", fsError);
      }

      res.json({ success: true, status: newStatus, platformData });
    } catch (error) {
      console.error("Error verifying social account:", error);
      res.status(500).json({ error: "Failed to verify social account" });
    }
  });

  // Disconnect Social Account
  app.delete("/api/social/:id", async (req, res) => {
    const { id } = req.params;
    try {
      // Delete from Prisma
      await prisma.socialAccount.delete({
        where: { id }
      });

      // Delete from Firestore
      try {
        await adminDb.collection("social_accounts").doc(id).delete();
      } catch (fsError) {
        console.warn("[SocialDelete] Firestore delete failed:", fsError);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error disconnecting social account:", error);
      res.status(500).json({ error: "Failed to disconnect social account" });
    }
  });

  // Automation Endpoints
  app.get("/api/automation/tasks", async (req, res) => {
    try {
      const tasks = await prisma.agentTask.findMany();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.post("/api/automation/tasks/toggle", async (req, res) => {
    const { id, enabled } = req.body;
    try {
      const task = await prisma.agentTask.update({
        where: { id },
        data: { 
          enabled,
          status: enabled ? 'active' : 'paused'
        }
      });
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle task" });
    }
  });

  app.post("/api/automation/tasks/seed", async (req, res) => {
    const initialTasks = [
      { name: 'Monitor Comments', type: 'MONITOR_COMMENTS', status: 'active', interval: 'Every 15 mins', successCount: 1240, failureCount: 2, totalRuns: 1242, enabled: true },
      { name: 'Monitor Mentions', type: 'MONITOR_MENTIONS', status: 'active', interval: 'Every 5 mins', successCount: 850, failureCount: 0, totalRuns: 850, enabled: true },
      { name: 'Auto Reply', type: 'AUTO_REPLY', status: 'paused', interval: 'Real-time', successCount: 45, failureCount: 1, totalRuns: 46, enabled: false },
      { name: 'Content Suggestions', type: 'CONTENT_SUGGESTIONS', status: 'active', interval: 'Daily', successCount: 30, failureCount: 0, totalRuns: 30, enabled: true },
      { name: 'Metrics Sync', type: 'METRICS_SYNC', status: 'active', interval: 'Every 1 hour', successCount: 156, failureCount: 4, totalRuns: 160, enabled: true },
      { name: 'Trend Analysis', type: 'TREND_ANALYSIS', status: 'active', interval: 'Every 6 hours', successCount: 24, failureCount: 0, totalRuns: 24, enabled: true },
    ];

    try {
      const count = await prisma.agentTask.count();
      if (count === 0) {
        await prisma.agentTask.createMany({ data: initialTasks });
      }
      res.json({ message: "Tasks seeded successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to seed tasks" });
    }
  });

  // Get Recent Webhook Events
  app.get("/api/webhooks/events", async (req, res) => {
    try {
      const events = await prisma.webhookEvent.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: { client: true }
      });
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch webhook events" });
    }
  });

  app.get("/api/admin/test-gemini", async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) return res.status(400).json({ error: "No key" });
    if (apiKey === "MY_GEMINI_API_KEY") return res.status(400).json({ error: "Key is the placeholder 'MY_GEMINI_API_KEY'" });
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Hello",
      });
      res.json({ success: true, text: response.text });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/env-keys", (req, res) => {
    res.json(Object.keys(process.env));
  });

  app.post("/api/admin/generate-icon", async (req, res) => {
    const key = process.env.GEMINI_API_KEY || process.env.API_KEY;
    try {
      if (!key) {
        return res.status(400).json({ error: "No API key found in server process." });
      }
      console.log("[Admin] Key prefix:", key.substring(0, 4) + "...");
      await generateAndSaveAppIcon();
      res.json({ success: true, message: "Icon generated and saved successfully.", keyPrefix: key.substring(0, 4) });
    } catch (error: any) {
      console.error("Error generating icon:", error);
      res.status(500).json({ error: error.message, keyPrefix: key?.substring(0, 4) });
    }
  });

  // Vite middleware for development - only in explicit local dev
  const isProd = process.env.NODE_ENV === "production" || !!process.env.K_SERVICE;
  
  if (!isProd) {
    console.log("[SERVER] Starting in DEVELOPMENT mode (Vite)");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[SERVER] Starting in PRODUCTION mode (Static)");
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  const startListener = (port: number) => {
    return new Promise((resolve, reject) => {
      const server = app.listen(port, "0.0.0.0", () => {
        console.log(`[SERVER] Success! Listening on PORT: ${port}`);
        resolve(server);
      }).on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          console.warn(`[SERVER] PORT ${port} is occupied, trying next...`);
          resolve(null);
        } else {
          reject(err);
        }
      });
    });
  };

  // Auto-negotiate port (Try 8080 then 3000)
  const portsToTry = [Number(PORT), 3000, 8000, 8081];
  let success = false;
  
  for (const port of portsToTry) {
    if (success) break;
    const result = await startListener(port);
    if (result) {
      success = true;
    }
  }

  if (!success) {
    console.error("[SERVER] FATAL: Could not bind to any port!");
    process.exit(1);
  }
}

startServer();
