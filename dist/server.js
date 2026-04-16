// server.ts
import express from "express";
import { createServer as createViteServer } from "vite";
import { PrismaClient } from "@prisma/client";
import path2 from "path";
import cookieSession from "cookie-session";
import axios from "axios";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import admin from "firebase-admin";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";

// firebase-applet-config.json
var firebase_applet_config_default = {
  projectId: "stratos-1d3dd",
  appId: "1:645192182585:web:1c743e6f583b23bb3dd6e8",
  apiKey: "AIzaSyBXxsE4iEQZo6-yV9nOTxqVrFRW31Mi7ug",
  authDomain: "stratos-1d3dd.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-fea3b390-d69d-4c49-9fc0-bc03b82a3ff0",
  storageBucket: "stratos-1d3dd.firebasestorage.app",
  messagingSenderId: "645192182585",
  measurementId: ""
};

// scripts/icon-generator.ts
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import sharp from "sharp";
async function generateAndSaveAppIcon() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    console.error("Neither GEMINI_API_KEY nor API_KEY is set in the environment.");
    return;
  }
  const ai = new GoogleGenAI({ apiKey });
  const prompt = "A professional, minimalist, and futuristic app icon for 'StratOS'. The design should feature a stylized 'S' integrated with a strategic grid or network pattern. Use a sophisticated color palette of deep navy, electric blue, and silver. High quality, clean lines, suitable for a mobile app icon.";
  console.log("Generating icon with Gemini...");
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [
        {
          text: prompt
        }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });
  let base64Data;
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      base64Data = part.inlineData.data;
      break;
    }
  }
  if (!base64Data) {
    console.error("No image data returned from Gemini.");
    return;
  }
  const buffer = Buffer.from(base64Data, "base64");
  const publicPath = path.join(process.cwd(), "public", "icon.png");
  if (!fs.existsSync(path.join(process.cwd(), "public"))) {
    fs.mkdirSync(path.join(process.cwd(), "public"), { recursive: true });
  }
  fs.writeFileSync(publicPath, buffer);
  console.log(`Saved web icon to ${publicPath}`);
  const androidResPath = path.join(process.cwd(), "android", "app", "src", "main", "res");
  const sizes = [
    { name: "mipmap-mdpi", size: 48 },
    { name: "mipmap-hdpi", size: 72 },
    { name: "mipmap-xhdpi", size: 96 },
    { name: "mipmap-xxhdpi", size: 144 },
    { name: "mipmap-xxxhdpi", size: 192 }
  ];
  if (fs.existsSync(androidResPath)) {
    for (const { name, size } of sizes) {
      const dir = path.join(androidResPath, name);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const iconPath = path.join(dir, "ic_launcher.png");
      const roundIconPath = path.join(dir, "ic_launcher_round.png");
      await sharp(buffer).resize(size, size).toFile(iconPath);
      const circleMask = Buffer.from(
        `<svg><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" /></svg>`
      );
      await sharp(buffer).resize(size, size).composite([{ input: circleMask, blend: "dest-in" }]).toFile(roundIconPath);
      console.log(`Saved Android icons to ${dir}`);
    }
  } else {
    console.warn("Android resource directory not found. Skipping Android icon generation.");
  }
  console.log("App icon generation and organization complete.");
}
if (import.meta.url.endsWith(process.argv[1])) {
  generateAndSaveAppIcon().catch(console.error);
}

// server.ts
var prisma = new PrismaClient();
var firebaseApp = initializeApp(firebase_applet_config_default);
var db = getFirestore(firebaseApp, firebase_applet_config_default.firestoreDatabaseId);
if (admin.apps.length === 0) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: firebase_applet_config_default.projectId
    });
    console.log("[FirebaseAdmin] Initialized with applicationDefault credentials");
  } catch (e) {
    console.error("[FirebaseAdmin] Initialization error, falling back to basic init:", e);
    admin.initializeApp({
      projectId: firebase_applet_config_default.projectId
    });
  }
}
var adminApp = admin.app();
console.log(`[FirebaseAdmin] App Name: ${adminApp.name}, Project ID: ${adminApp.options.projectId}`);
var adminDb = firebase_applet_config_default.firestoreDatabaseId ? getAdminFirestore(adminApp, firebase_applet_config_default.firestoreDatabaseId) : getAdminFirestore(adminApp);
console.log(`[FirebaseAdmin] Firestore initialized with Database ID: ${firebase_applet_config_default.firestoreDatabaseId || "(default)"}`);
async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3e3;
  app.use(express.json());
  app.use(cookieSession({
    name: "session",
    keys: [process.env.SESSION_SECRET || "stratos-secret-key"],
    maxAge: 24 * 60 * 60 * 1e3,
    // 24 hours
    secure: true,
    sameSite: "none"
  }));
  const getOAuthConfig = async (platform, req, clientIdParam) => {
    const APP_URL = process.env.APP_URL || "http://localhost:3000";
    const SHARED_URL = process.env.SHARED_APP_URL || APP_URL;
    const host = req.get("host") || "";
    const isShared = host.includes("ais-pre");
    const baseUrl = isShared ? SHARED_URL : APP_URL;
    const redirectUri = `${baseUrl}/api/auth/${platform}/callback`;
    console.log(`[OAuth] Using redirect_uri: ${redirectUri}`);
    let clientId = process.env[`${platform.toUpperCase()}_CLIENT_ID`];
    let clientSecret = process.env[`${platform.toUpperCase()}_CLIENT_SECRET`];
    console.log(`[OAuth] Initial credentials for ${platform}:`, { hasClientId: !!clientId, hasClientSecret: !!clientSecret });
    if (clientIdParam) {
      console.log(`[OAuth] Attempting to fetch client-specific credentials for: ${clientIdParam} from Prisma`);
      try {
        const clientConfig = await prisma.clientSocialConfig.findUnique({
          where: { clientId: clientIdParam }
        });
        if (clientConfig) {
          console.log(`[OAuth] Found client-specific config for ${clientIdParam} in Prisma`);
          if (platform === "facebook" && clientConfig.facebookAppId && clientConfig.facebookAppSecret) {
            clientId = clientConfig.facebookAppId;
            clientSecret = clientConfig.facebookAppSecret;
            console.log(`[OAuth] Using client-specific Facebook credentials from Prisma`);
          } else if (platform === "instagram" && clientConfig.instagramAppId && clientConfig.instagramAppSecret) {
            clientId = clientConfig.instagramAppId;
            clientSecret = clientConfig.instagramAppSecret;
          } else if (platform === "linkedin" && clientConfig.linkedinClientId && clientConfig.linkedinClientSecret) {
            clientId = clientConfig.linkedinClientId;
            clientSecret = clientConfig.linkedinClientSecret;
            console.log(`[OAuth] Using client-specific LinkedIn credentials from Prisma`);
          } else if (platform === "tiktok" && clientConfig.tiktokKey && clientConfig.tiktokSecret) {
            clientId = clientConfig.tiktokKey;
            clientSecret = clientConfig.tiktokSecret;
            console.log(`[OAuth] Using client-specific TikTok credentials from Prisma`);
          } else if (platform === "twitter" && clientConfig.twitterClientId && clientConfig.twitterClientSecret) {
            clientId = clientConfig.twitterClientId;
            clientSecret = clientConfig.twitterClientSecret;
            console.log(`[OAuth] Using client-specific Twitter credentials from Prisma`);
          }
        } else {
          console.log(`[OAuth] No client-specific config found for ${clientIdParam} in Prisma, checking Firestore fallback...`);
          try {
            const clientConfigDoc = await adminDb.collection("client_social_configs").doc(clientIdParam).get();
            if (clientConfigDoc.exists) {
              const data = clientConfigDoc.data();
              if (data) {
                if (platform === "facebook" && data.facebookAppId && data.facebookAppSecret) {
                  clientId = data.facebookAppId;
                  clientSecret = data.facebookAppSecret;
                } else if (platform === "instagram" && data.instagramAppId && data.instagramAppSecret) {
                  clientId = data.instagramAppId;
                  clientSecret = data.instagramAppSecret;
                } else if (platform === "linkedin" && data.linkedinClientId && data.linkedinClientSecret) {
                  clientId = data.linkedinClientId;
                  clientSecret = data.linkedinClientSecret;
                } else if (platform === "tiktok" && data.tiktokKey && data.tiktokSecret) {
                  clientId = data.tiktokKey;
                  clientSecret = data.tiktokSecret;
                } else if (platform === "twitter" && data.twitterClientId && data.twitterClientSecret) {
                  clientId = data.twitterClientId;
                  clientSecret = data.twitterClientSecret;
                }
              }
            }
          } catch (fsError) {
            console.warn("[OAuth] Firestore fallback failed (likely PERMISSION_DENIED):", fsError);
          }
        }
      } catch (e) {
        console.error("[OAuth] Error fetching client-specific credentials from Prisma:", e);
      }
    }
    if (!clientId || !clientSecret) {
      console.log(`[OAuth] Checking global settings in Prisma for ${platform}`);
      try {
        const globalSettings = await prisma.globalSettings.findUnique({
          where: { id: "oauth_credentials" }
        });
        if (globalSettings) {
          const data = JSON.parse(globalSettings.data);
          if (data && data[platform]) {
            clientId = clientId || data[platform].clientId;
            clientSecret = clientSecret || data[platform].clientSecret;
            console.log(`[OAuth] Using global Prisma credentials for ${platform}`);
          }
        }
        if (!clientId || !clientSecret) {
          console.log(`[OAuth] Checking process.env final fallback for ${platform}`);
          clientId = clientId || process.env[`${platform.toUpperCase()}_CLIENT_ID`];
          clientSecret = clientSecret || process.env[`${platform.toUpperCase()}_CLIENT_SECRET`];
        }
      } catch (e) {
        console.error("[OAuth] Error fetching global credentials from Prisma:", e);
      }
    }
    console.log(`[OAuth] Final evaluation for ${platform}:`, {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      envUsed: !clientId && !!process.env[`${platform.toUpperCase()}_CLIENT_ID`]
    });
    const configs = {
      linkedin: {
        authUrl: "https://www.linkedin.com/oauth/v2/authorization",
        tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
        scope: "openid profile email w_member_social"
      },
      instagram: {
        authUrl: "https://api.instagram.com/oauth/authorize",
        tokenUrl: "https://api.instagram.com/oauth/access_token",
        scope: "instagram_basic,instagram_content_publish,instagram_manage_comments,instagram_manage_insights"
      },
      tiktok: {
        authUrl: "https://www.tiktok.com/v2/auth/authorize/",
        tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
        scope: "user.info.basic,video.upload,video.publish"
      },
      twitter: {
        authUrl: "https://twitter.com/i/oauth2/authorize",
        tokenUrl: "https://api.twitter.com/2/oauth2/token",
        scope: "tweet.read tweet.write users.read offline.access"
      },
      facebook: {
        authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
        tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
        scope: "pages_manage_posts,pages_read_engagement,pages_show_list,public_profile"
      }
    };
    return { ...configs[platform], clientId, clientSecret, redirectUri };
  };
  app.get("/api/auth/:platform", async (req, res) => {
    const { platform } = req.params;
    const { clientId: client_id } = req.query;
    const config = await getOAuthConfig(platform, req, client_id);
    if (!config.clientId) {
      return res.status(400).json({ error: `OAuth not configured for ${platform}. Please add credentials in API Settings.` });
    }
    const state = JSON.stringify({
      csrf: Math.random().toString(36).substring(7),
      clientId: client_id
    });
    const encodedState = Buffer.from(state).toString("base64");
    if (req.session) {
      req.session.pendingClientId = client_id;
      req.session.platform = platform;
    }
    const params = new URLSearchParams({
      response_type: "code",
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      state: encodedState,
      scope: config.scope
    });
    res.json({ url: `${config.authUrl}?${params.toString()}` });
  });
  app.get("/api/auth/:platform/callback", async (req, res) => {
    const { platform } = req.params;
    const { code, state: encodedState } = req.query;
    let pendingClientId = req.session?.pendingClientId;
    if (!pendingClientId && encodedState) {
      try {
        const decodedState = JSON.parse(Buffer.from(String(encodedState), "base64").toString());
        pendingClientId = decodedState.clientId;
        console.log(`[OAuth] Recovered clientId from state: ${pendingClientId}`);
      } catch (e) {
        console.error("[OAuth] Failed to decode state:", e);
      }
    }
    const config = await getOAuthConfig(platform, req, pendingClientId);
    try {
      console.log(`[OAuth] Exchanging code for token. Platform: ${platform}, Redirect: ${config.redirectUri}`);
      const response = await axios.post(config.tokenUrl, new URLSearchParams({
        grant_type: "authorization_code",
        code: String(code),
        redirect_uri: config.redirectUri,
        client_id: config.clientId,
        client_secret: config.clientSecret
      }), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      });
      const { access_token, refresh_token, expires_in, user_id, account_id } = response.data;
      let finalAccessToken = access_token;
      let finalPlatformAccountId = user_id || account_id || response.data.id || response.data.user?.id || response.data.sub;
      let finalHandle = response.data.user?.username || response.data.name || "Connected Account";
      if (platform === "linkedin") {
        try {
          const userinfoResponse = await axios.get("https://api.linkedin.com/v2/userinfo", {
            headers: { Authorization: `Bearer ${access_token}` }
          });
          const userinfo = userinfoResponse.data;
          finalPlatformAccountId = userinfo.sub;
          finalHandle = userinfo.name || `${userinfo.given_name} ${userinfo.family_name}`;
          console.log(`[OAuth] LinkedIn UserInfo:`, userinfo);
        } catch (liError) {
          console.error("Error fetching LinkedIn userinfo:", liError.response?.data || liError.message);
        }
      }
      if (platform === "facebook") {
        try {
          const pagesResponse = await axios.get(`https://graph.facebook.com/me/accounts?access_token=${access_token}`);
          const pages = pagesResponse.data.data;
          const targetPage = pages.find((p) => p.name.includes("Ngoma Zatu")) || pages[0];
          if (targetPage) {
            finalAccessToken = targetPage.access_token;
            finalPlatformAccountId = targetPage.id;
            finalHandle = targetPage.name;
          }
        } catch (fbError) {
          console.error("Error fetching Facebook pages:", fbError.response?.data || fbError.message);
        }
      }
      if (pendingClientId) {
        await prisma.socialAccount.create({
          data: {
            platform,
            clientId: pendingClientId,
            accessToken: finalAccessToken,
            refreshToken: refresh_token || null,
            platformAccountId: finalPlatformAccountId ? String(finalPlatformAccountId) : null,
            handle: finalHandle,
            expiresAt: new Date(Date.now() + (expires_in || 3600) * 1e3),
            status: "connected"
          }
        });
      }
      res.send(`
        <html>
          <body>
            <script>
              window.opener.postMessage({ 
                type: 'OAUTH_SUCCESS', 
                platform: '${platform}',
                token: '${finalAccessToken}',
                handle: '${finalHandle}',
                platformAccountId: '${finalPlatformAccountId}'
              }, '*');
              window.close();
            </script>
            <p>Connection successful! You can close this window.</p>
          </body>
        </html>
      `);
    } catch (error) {
      const errorData = error.response?.data;
      console.error(`[OAuth] ${platform} callback error:`, errorData || error.message);
      const detailedMessage = errorData ? JSON.stringify(errorData, null, 2) : error.message;
      res.status(500).send(`
        <div style="font-family: sans-serif; padding: 20px; color: #1e293b; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
          <h2 style="color: #ef4444; margin-top: 0;">Authentication Error</h2>
          <p>The ${platform} server rejected the request. This usually happens due to a credential or redirect mismatch.</p>
          
          <div style="margin-top: 20px;">
            <strong>LinkedIn Response Details:</strong>
            <pre style="background: #1e293b; color: #38bdf8; padding: 15px; border-radius: 8px; margin-top: 10px; overflow-x: auto;">${detailedMessage}</pre>
          </div>
          
          <div style="margin-top: 20px; font-size: 14px; color: #64748b;">
            <strong>Troubleshooting:</strong>
            <ul style="margin-top: 5px;">
              <li>Check if "Marketing Developer Platform" is added to your LinkedIn app.</li>
              <li>Ensure your Redirect URIs match exactly.</li>
              <li>Verify your Client Secret hasn't expired.</li>
            </ul>
          </div>
        </div>
      `);
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
        orderBy: { createdAt: "desc" }
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
        orderBy: { createdAt: "desc" }
      });
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch crisis events" });
    }
  });
  app.get("/api/trends", async (req, res) => {
    try {
      const trends = await prisma.trend.findMany({
        orderBy: { relevanceScore: "desc" }
      });
      res.json(trends);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trends" });
    }
  });
  app.get("/api/analytics", async (req, res) => {
    try {
      res.json({
        activeClients: await prisma.client.count({ where: { status: "active" } }),
        postsThisMonth: await prisma.post.count(),
        pendingApproval: await prisma.post.count({ where: { status: "pending" } }),
        activeCrises: await prisma.crisisEvent.count({ where: { status: "active" } })
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });
  const VERIFY_TOKENS = {
    instagram: process.env.INSTAGRAM_VERIFY_TOKEN || "stratos_insta_token",
    facebook: process.env.FACEBOOK_VERIFY_TOKEN || "stratos_fb_token",
    linkedin: process.env.LINKEDIN_VERIFY_TOKEN || "stratos_li_token",
    tiktok: process.env.TIKTOK_VERIFY_TOKEN || "stratos_tt_token"
  };
  app.get("/api/webhooks/:platform", async (req, res) => {
    const { platform } = req.params;
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    let verifyToken = VERIFY_TOKENS[platform];
    const clientId = req.query.clientId;
    if (clientId) {
      try {
        const clientConfig = await prisma.clientSocialConfig.findUnique({
          where: { clientId }
        });
        if (clientConfig && clientConfig.fbVerifyToken && (platform === "facebook" || platform === "instagram")) {
          verifyToken = clientConfig.fbVerifyToken;
        } else {
          const clientConfigDoc = await adminDb.collection("client_social_configs").doc(clientId).get();
          if (clientConfigDoc.exists) {
            const data = clientConfigDoc.data();
            if (data && data.fbVerifyToken && (platform === "facebook" || platform === "instagram")) {
              verifyToken = data.fbVerifyToken;
            }
          }
        }
      } catch (e) {
        console.warn("Error fetching client-specific verify token (likely PERMISSION_DENIED):", e);
      }
    }
    if (mode === "subscribe" && token === verifyToken) {
      console.log(`Webhook verified for ${platform}`);
      return res.status(200).send(challenge);
    } else {
      return res.status(403).send("Verification failed");
    }
  });
  app.post("/api/webhooks/:platform", async (req, res) => {
    const { platform } = req.params;
    const payload = req.body;
    console.log(`Received ${platform} webhook:`, JSON.stringify(payload, null, 2));
    try {
      let eventType = payload.eventType || payload.event || payload.type || "unknown";
      let platformAccountId = payload.account_id || payload.user_id || payload.object_id;
      if (platform === "instagram" && payload.entry?.[0]?.id) {
        platformAccountId = payload.entry[0].id;
      }
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
      const negativeKeywords = [
        "scam",
        "fraud",
        "terrible",
        "worst",
        "never buy",
        "avoid",
        "disappointed",
        "angry",
        "sue",
        "lawsuit",
        "fake",
        "stolen",
        "garbage",
        "trash",
        "horrible",
        "hate"
      ];
      const textToScan = (payload.text || payload.caption || payload.message || payload.comment?.text || "").toLowerCase();
      const hasNegativeContent = negativeKeywords.some((keyword) => textToScan.includes(keyword));
      if (hasNegativeContent && clientId) {
        await prisma.crisisEvent.create({
          data: {
            title: `Crisis Alert: ${platform.charAt(0).toUpperCase() + platform.slice(1)} ${eventType}`,
            description: `Negative content detected: "${textToScan.substring(0, 100)}${textToScan.length > 100 ? "..." : ""}"`,
            severity: textToScan.includes("sue") || textToScan.includes("lawsuit") ? "critical" : "high",
            status: "active",
            responseDraft: "We've flagged this for immediate review. Our team will reach out to the user shortly.",
            clientId
          }
        });
        await prisma.agentTask.updateMany({
          where: { type: "MONITOR_COMMENTS" },
          data: { successCount: { increment: 1 }, totalRuns: { increment: 1 } }
        });
      }
      setTimeout(async () => {
        await prisma.webhookEvent.update({
          where: { id: webhookEvent.id },
          data: { processed: true }
        });
        console.log(`Job completed: WEBHOOK_PROCESS for ${platform} event ${eventType}`);
      }, 2e3);
      res.status(200).json({ status: "success", id: webhookEvent.id });
    } catch (error) {
      console.error(`Error processing ${platform} webhook:`, error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
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
          isValid = true;
        }
      } catch (apiError) {
        console.error(`[SocialVerify] API error for ${account.platform}:`, apiError.response?.data || apiError.message);
        isValid = false;
      }
      const newStatus = isValid ? "connected" : "error";
      await prisma.socialAccount.update({
        where: { id },
        data: { status: newStatus }
      });
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
  app.delete("/api/social/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await prisma.socialAccount.delete({
        where: { id }
      });
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
          status: enabled ? "active" : "paused"
        }
      });
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle task" });
    }
  });
  app.post("/api/automation/tasks/seed", async (req, res) => {
    const initialTasks = [
      { name: "Monitor Comments", type: "MONITOR_COMMENTS", status: "active", interval: "Every 15 mins", successCount: 1240, failureCount: 2, totalRuns: 1242, enabled: true },
      { name: "Monitor Mentions", type: "MONITOR_MENTIONS", status: "active", interval: "Every 5 mins", successCount: 850, failureCount: 0, totalRuns: 850, enabled: true },
      { name: "Auto Reply", type: "AUTO_REPLY", status: "paused", interval: "Real-time", successCount: 45, failureCount: 1, totalRuns: 46, enabled: false },
      { name: "Content Suggestions", type: "CONTENT_SUGGESTIONS", status: "active", interval: "Daily", successCount: 30, failureCount: 0, totalRuns: 30, enabled: true },
      { name: "Metrics Sync", type: "METRICS_SYNC", status: "active", interval: "Every 1 hour", successCount: 156, failureCount: 4, totalRuns: 160, enabled: true },
      { name: "Trend Analysis", type: "TREND_ANALYSIS", status: "active", interval: "Every 6 hours", successCount: 24, failureCount: 0, totalRuns: 24, enabled: true }
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
  app.get("/api/webhooks/events", async (req, res) => {
    try {
      const events = await prisma.webhookEvent.findMany({
        take: 50,
        orderBy: { createdAt: "desc" },
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
    const { GoogleGenAI: GoogleGenAI2 } = await import("@google/genai");
    const ai = new GoogleGenAI2({ apiKey });
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Hello"
      });
      res.json({ success: true, text: response.text });
    } catch (error) {
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
    } catch (error) {
      console.error("Error generating icon:", error);
      res.status(500).json({ error: error.message, keyPrefix: key?.substring(0, 4) });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path2.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path2.join(process.cwd(), "dist", "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
