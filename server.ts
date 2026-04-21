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

const prisma = new PrismaClient();

async function startServer() {
  console.log("-----------------------------------------");
  console.log("[SERVER] Version 1.1.3 - Bulletproof Boot");
  console.log("-----------------------------------------");

  let firebaseConfig: any = {};
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (e) {
    console.warn("[SERVER] Could not load firebase-applet-config.json");
  }

  // Initialize Firebase Admin for server-side operations
  let adminDb: any = null;
  try {
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: firebaseConfig.projectId,
      });
      console.log("[FirebaseAdmin] Initialized");
    }
    
    const adminApp = admin.app();
    adminDb = firebaseConfig.firestoreDatabaseId 
      ? getAdminFirestore(adminApp, firebaseConfig.firestoreDatabaseId)
      : getAdminFirestore(adminApp);
  } catch (e: any) {
    console.warn("[FirebaseAdmin] Startup check (ADC):", e.message);
  }

  const app = express();
  const PORT = process.env.PORT || 8080;

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
    origin: [
      "https://localhost", 
      "http://localhost:5173", 
      /\.run\.app$/  // Allow all your Google Cloud Run subdomains
    ],
    credentials: true
  }));

  app.use(express.json());
  app.use(cookieSession({
    name: '__Host-session', // Prefixed for extra security
    keys: [process.env.SESSION_SECRET || 'stratos-production-fallback-key-rotate-me'],
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: true,
    httpOnly: true,
    sameSite: 'lax'
  }));

  // OAuth Configuration Helper
  const getOAuthConfig = async (platform: string, req: express.Request, clientIdParam?: string) => {
    // AI Studio provides APP_URL and SHARED_APP_URL environment variables
    const APP_URL = process.env.APP_URL || 'http://localhost:3000';
    const SHARED_URL = process.env.SHARED_APP_URL || APP_URL;
    
    // Determine which base URL to use based on the request host
    const host = req.get('host') || '';
    const isShared = host.includes('ais-pre');
    const baseUrl = isShared ? SHARED_URL : APP_URL;
    
    const envKeys = Object.keys(process.env);
    console.log(`[OAuth] Diagnostic: Checking environment for "${platform}"...`);
    
    // Fuzzy lookup: Check for both PLATFORM_CLIENT_ID and PLATFORM_APP_ID
    const possibleClientIdKeys = [`${platform.toUpperCase()}_CLIENT_ID`, `${platform.toUpperCase()}_APP_ID` ];
    const possibleClientSecretKeys = [`${platform.toUpperCase()}_CLIENT_SECRET`, `${platform.toUpperCase()}_APP_SECRET` ];
    
    let clientId = null;
    let clientSecret = null;

    // Direct check first
    for (const key of possibleClientIdKeys) {
      if (process.env[key]) {
        clientId = process.env[key];
        console.log(`[OAuth] Found Client ID in Env using key: ${key}`);
        break;
      }
    }
    
    for (const key of possibleClientSecretKeys) {
      if (process.env[key]) {
        clientSecret = process.env[key];
        console.log(`[OAuth] Found Client Secret in Env using key: ${key}`);
        break;
      }
    }

    // 1. Check for client-specific credentials in Firestore first (Persistence for Cloud Run)
    if (clientIdParam) {
      console.log(`[OAuth] Fetching client config for: ${clientIdParam} from Firestore`);
      try {
        const clientConfigDoc = await adminDb.collection('client_social_configs').doc(clientIdParam).get();
        if (clientConfigDoc.exists) {
          const data = clientConfigDoc.data();
          if (data) {
            console.log(`[OAuth] Found Firestore settings for ${clientIdParam}. Checking for ${platform} keys...`);
            if (platform === 'facebook' && data.facebookAppId && data.facebookAppSecret) {
              clientId = data.facebookAppId;
              clientSecret = data.facebookAppSecret;
              console.log(`[OAuth] Overriding with client-specific Facebook keys from Firestore`);
            } else if (platform === 'instagram' && data.instagramAppId && data.instagramAppSecret) {
              clientId = data.instagramAppId;
              clientSecret = data.instagramAppSecret;
            } else if (platform === 'linkedin' && data.linkedinClientId && data.linkedinClientSecret) {
              clientId = data.linkedinClientId;
              clientSecret = data.linkedinClientSecret;
            } else if (platform === 'tiktok' && data.tiktokKey && data.tiktokSecret) {
              clientId = data.tiktokKey;
              clientSecret = data.tiktokSecret;
            } else if (platform === 'twitter' && data.twitterClientId && data.twitterClientSecret) {
              clientId = data.twitterClientId;
              clientSecret = data.twitterClientSecret;
            }
          }
        }
      } catch (fsError: any) {
        console.warn("[OAuth] Firestore client config lookup failed:", fsError.message);
      }
    }

    // 3. Fallback to Firestore global settings if still missing
    if (!clientId || !clientSecret) {
      try {
        const globalSettingsDoc = await adminDb.collection('global_settings').doc('oauth_credentials').get();
        if (globalSettingsDoc.exists) {
          const data = globalSettingsDoc.data();
          if (data && data[platform]) {
            clientId = clientId || data[platform].clientId;
            clientSecret = clientSecret || data[platform].clientSecret;
            if (data[platform].clientId) console.log(`[OAuth] Using global Firestore credentials for ${platform}`);
          }
        }
      } catch (fsError: any) {
        console.warn("[OAuth] Firestore global settings lookup failed:", fsError.message);
      }
    }
    
    console.log(`[OAuth] Final evaluation for "${platform}":`, { 
      hasClientId: !!clientId, 
      hasClientSecret: !!clientSecret,
      clientIdPrefix: clientId ? clientId.substring(0, 4) + "****" : "none"
    });
    
    const configs: Record<string, any> = {
      linkedin: {
        authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
        tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
        scope: 'openid profile email w_member_social'
      },
      instagram: {
        authUrl: 'https://api.instagram.com/oauth/authorize',
        tokenUrl: 'https://api.instagram.com/oauth/access_token',
        scope: 'instagram_basic,instagram_content_publish,instagram_manage_comments,instagram_manage_insights'
      },
      tiktok: {
        authUrl: 'https://www.tiktok.com/v2/auth/authorize/',
        tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
        scope: 'user.info.basic,video.upload,video.publish'
      },
      twitter: {
        authUrl: 'https://twitter.com/i/oauth2/authorize',
        tokenUrl: 'https://api.twitter.com/2/oauth2/token',
        scope: 'tweet.read tweet.write users.read offline.access'
      },
      facebook: {
        authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
        tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
        scope: 'pages_manage_posts,pages_read_engagement,pages_show_list,public_profile'
      }
    };

    return { ...configs[platform], clientId, clientSecret, redirectUri };
  };

  // OAuth Initiation Routes
  app.get("/api/auth/:platform", async (req, res) => {
    const { platform } = req.params;
    const { clientId: client_id, mobile } = req.query; // The client ID from our agency database
    
    const config = await getOAuthConfig(platform, req, client_id as string);
    if (!config.clientId) {
      return res.status(400).json({ error: `OAuth not configured for ${platform}. Please add credentials in API Settings.` });
    }

    const state = JSON.stringify({
      csrf: Math.random().toString(36).substring(7),
      clientId: client_id,
      mobile: mobile === 'true'
    });
    const encodedState = Buffer.from(state).toString('base64');

    // Store agency client ID in session to associate token later (as fallback)
    if (req.session) {
      req.session.pendingClientId = client_id;
      req.session.platform = platform;
      req.session.isMobile = mobile === 'true';
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      state: encodedState,
      scope: config.scope
    });

    res.json({ url: `${config.authUrl}?${params.toString()}` });
  });

  // OAuth Callback Routes
  // OAuth Callback Routes
  app.get("/api/auth/:platform/callback", async (req, res) => {
    const { platform } = req.params;
    const { code, state: encodedState } = req.query;

    console.log(`[OAuth] Callback started for ${platform}. Code: ${code ? 'Yes' : 'No'}, State: ${encodedState ? 'Yes' : 'No'}`);
    
    let pendingClientId = req.session?.pendingClientId;
    if (pendingClientId) console.log(`[OAuth] Found pendingClientId in session: ${pendingClientId}`);
    
    // Fallback: Try to get clientId from state if session is lost
    if (!pendingClientId && encodedState) {
      try {
        const decodedState = JSON.parse(Buffer.from(String(encodedState), 'base64').toString());
        pendingClientId = decodedState.clientId;
        console.log(`[OAuth] Recovered clientId from state: ${pendingClientId}`);
      } catch (e) {
        console.error("[OAuth] Failed to decode state:", e.message);
      }
    }

    const config = await getOAuthConfig(platform, req, pendingClientId);

    try {
      console.log(`[OAuth] Exchanging code for token. Platform: ${platform}, Redirect: ${config.redirectUri}`);
      
      const response = await axios.post(config.tokenUrl, new URLSearchParams({
        grant_type: 'authorization_code',
        code: String(code),
        redirect_uri: config.redirectUri,
        client_id: config.clientId,
        client_secret: config.clientSecret
      }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      console.log(`[OAuth] Token exchange successful for ${platform}`);
      const { access_token, refresh_token, expires_in, user_id, account_id } = response.data;
      
      let finalAccessToken = access_token;
      let finalPlatformAccountId = user_id || account_id || response.data.id || response.data.user?.id || response.data.sub;
      let finalHandle = response.data.user?.username || response.data.name || 'Connected Account';

      // Special handling for LinkedIn OpenID Connect
      if (platform === 'linkedin') {
        try {
          const userinfoResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` }
          });
          const userinfo = userinfoResponse.data;
          finalPlatformAccountId = userinfo.sub;
          finalHandle = userinfo.name || `${userinfo.given_name} ${userinfo.family_name}`;
          console.log(`[OAuth] LinkedIn UserInfo:`, userinfo);
        } catch (liError: any) {
          console.error("Error fetching LinkedIn userinfo:", liError.response?.data || liError.message);
        }
      }

      // Special handling for Facebook to get Long-Lived and Page Access Tokens
      if (platform === 'facebook') {
        try {
          console.log("[OAuth] Exchanging Facebook short-lived token for long-lived token...");
          const longLivedResponse = await axios.get(`https://graph.facebook.com/v18.0/oauth/access_token`, {
            params: {
              grant_type: 'fb_exchange_token',
              client_id: config.clientId,
              client_secret: config.clientSecret,
              fb_exchange_token: access_token
            }
          });
          
          const longLivedToken = longLivedResponse.data.access_token;
          finalAccessToken = longLivedToken;

          console.log("[OAuth] Fetching Facebook pages...");
          const pagesResponse = await axios.get(`https://graph.facebook.com/me/accounts?access_token=${longLivedToken}`);
          const pages = pagesResponse.data.data;
          
          // Try to find a primary page or use the first one available
          const targetPage = pages.find((p: any) => p.name.includes('Ngoma Zatu') || p.tasks?.includes('CREATE_CONTENT')) || pages[0];
          
          if (targetPage) {
            console.log(`[OAuth] Linked to Facebook Page: ${targetPage.name}`);
            finalAccessToken = targetPage.access_token; // Page tokens from a long-lived user token are permanent!
            finalPlatformAccountId = targetPage.id;
            finalHandle = targetPage.name;
          }
        } catch (fbError: any) {
          console.error("Error fetching Facebook pages:", fbError.response?.data || fbError.message);
        }
      }
      
      // Save to Firestore (Permanent Cloud Storage) 
      if (pendingClientId) {
        const accountData = {
          platform,
          clientId: pendingClientId,
          accessToken: finalAccessToken,
          refreshToken: refresh_token || null,
          platformAccountId: finalPlatformAccountId ? String(finalPlatformAccountId) : null,
          handle: finalHandle,
          expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + (expires_in || 5184000) * 1000)), // Default 60 days for long-lived
          status: 'connected',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        try {
          await adminDb.collection('social_accounts').add(accountData);
          console.log(`[OAuth] Successfully saved ${platform} account to Firestore for client ${pendingClientId}`);
        } catch (dbError) {
          console.error(`[OAuth] Critical: Failed to save to Firestore:`, dbError.message);
        }
      }
      
      let isMobile = false;
      if (encodedState) {
        try {
          const decodedState = JSON.parse(Buffer.from(String(encodedState), 'base64').toString());
          isMobile = !!decodedState.mobile;
        } catch (e) {}
      }

      console.log(`[OAuth] Finalizing login. Mobile: ${isMobile}, Platform: ${platform}`);

      if (isMobile) {
        // Mobile Redirect via Custom URL Scheme
        const deepLink = `com.stratos.agencyos://oauth-callback?platform=${platform}&status=success&handle=${encodeURIComponent(finalHandle)}&token=${finalAccessToken}`;
        return res.redirect(deepLink);
      }
      
      res.send(`
        <html>
          <body style="background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
            <div style="text-align: center;">
              <h1 style="color: #6366f1;">Connection Successful!</h1>
              <p>Closing the secure window...</p>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ 
                    type: 'OAUTH_SUCCESS', 
                    platform: '${platform}',
                    token: '${finalAccessToken}',
                    handle: '${finalHandle}',
                    platformAccountId: '${finalPlatformAccountId}'
                  }, '*');
                  setTimeout(() => window.close(), 1000);
                } else {
                  // Fallback for missing opener
                  document.querySelector('p').innerText = "Account connected! You can now return to the app.";
                }
              </script>
            </div>
          </body>
        </html>
      `);
    } catch (error: any) {
      const errorData = error.response?.data;
      console.error(`[OAuth] ${platform} callback error:`, errorData || error.message);
      
      const detailedMessage = errorData 
        ? JSON.stringify(errorData, null, 2) 
        : error.message;

      res.status(500).send(`
        <div style="font-family: sans-serif; padding: 20px; color: #1e293b; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
          <h2 style="color: #ef4444; margin-top: 0;">Authentication Error</h2>
          <p>The ${platform} server rejected the request. This usually happens due to a credential or redirect mismatch.</p>
          
          <div style="margin-top: 20px;">
            <strong>${platform.toUpperCase()} Response Details:</strong>
            <pre style="background: #1e293b; color: #38bdf8; padding: 15px; border-radius: 8px; margin-top: 10px; overflow-x: auto;">${detailedMessage}</pre>
          </div>
          
          <div style="margin-top: 20px; font-size: 14px; color: #64748b;">
            <strong>Troubleshooting:</strong>
            <ul style="margin-top: 5px;">
              <li>Ensure your Redirect URIs match correctly in the ${platform} dashboard.</li>
              <li>Verify your Client ID and Secret are correct.</li>
              <li>Check if your ${platform} app has the necessary permissions (scopes).</li>
            </ul>
          </div>
        </div>
      `);
    }
  });

  // API Routes
  app.get("/api/auth/debug", async (req, res) => {
    try {
      console.log("[Debug] Starting Firestore auth check...");
      const globalDoc = await adminDb.collection('global_settings').doc('oauth_credentials').get();
      const fbConfig = globalDoc.exists ? globalDoc.data()?.facebook : null;
      
      const response = {
        status: "Diagnostic Active",
        timestamp: new Date().toISOString(),
        database: {
          exists: globalDoc.exists,
          projectId: admin.app().options.projectId || "application-default",
          facebookConfigFound: !!fbConfig,
          facebookKeys: fbConfig ? {
            hasClientId: !!fbConfig.clientId,
            hasClientSecret: !!fbConfig.clientSecret,
            clientIdPrefix: fbConfig.clientId ? fbConfig.clientId.substring(0, 4) + "****" : "none"
          } : "not_found"
        },
        environment: {
          hasFbClientId: !!process.env.FACEBOOK_CLIENT_ID,
          hasFbAppId: !!process.env.FACEBOOK_APP_ID
        }
      };
      
      res.json(response);
    } catch (e: any) {
      res.status(500).json({ error: e.message, stack: e.stack });
    }
  });

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

  // Root redirect/status
  app.get("/health", (req, res) => res.json({ status: "ok", version: "1.1.2" }));

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

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
