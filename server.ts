import express from "express";
import helmet from "helmet";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { PrismaClient } from "@prisma/client";
import path from "path";
import cookieSession from "cookie-session";
import axios from "axios";
import admin from 'firebase-admin';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

let adminDb: any = null;
let prisma: any = null;

async function startServer() {
  const PORT = process.env.PORT || 8080;
  console.log("-----------------------------------------");
  console.log("[SERVER] Version 3.6.8 - CRASH PROOFED");
  console.log("-----------------------------------------");

  process.on('unhandledRejection', (reason, promise) => {
    console.error('[CRASH GUARD] Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (err) => {
    console.error('[CRASH GUARD] Uncaught Exception:', err.message);
  });

  // 1. DB Init
  try {
    prisma = new PrismaClient();
    console.log("[Prisma] Client Active");
  } catch (e: any) { console.error("[Prisma] Init Error:", e.message); }

  let fbConfig: any = {};
  try {
    const cp = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(cp)) fbConfig = JSON.parse(fs.readFileSync(cp, 'utf8'));
  } catch (e) {}

  try {
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: fbConfig.projectId || process.env.GOOGLE_CLOUD_PROJECT,
      });
    }
    adminDb = fbConfig.firestoreDatabaseId ? getAdminFirestore(admin.app(), fbConfig.firestoreDatabaseId) : getAdminFirestore(admin.app());
    console.log("[Firebase] Handshake Locked");
  } catch (e: any) { console.warn("[Firebase] Init Bypass:", e.message); }

  const app = express();
  const credentialCache: Record<string, any> = {};

  // 2. Health & Manifest
  app.get("/health", (req, res) => res.json({ status: "OK", version: "3.6.8", platform: process.platform }));
  
  // 3. Middlewares
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: ["https://localhost", "http://localhost:5173", /\.run\.app$/], credentials: true }));
  app.use(express.json());
  app.use(cookieSession({
    name: '__Host-session',
    keys: [process.env.SESSION_SECRET || 'stratos-production-fallback'],
    maxAge: 24 * 60 * 60 * 1000, secure: true, httpOnly: true, sameSite: 'lax'
  }));

  // 4. THE HANDSHAKE
  const getOAuthConfig = async (platform: string, req: express.Request, agencyClientId?: string) => {
    const pKey = platform.toLowerCase().replace(/[^a-z]/g, '').trim();
    const isFB = pKey === 'facebook' || pKey === 'fb';
    
    console.log(`[Handshake] Processing: "${platform}" (${pKey})`);
    
    if (!agencyClientId && credentialCache[pKey]) return { ...credentialCache[pKey].config, clientId: credentialCache[pKey].id, clientSecret: credentialCache[pKey].secret, redirectUri: `https://${req.get('host')}/api/auth/${platform}/callback` };

    let fId = null; let fSecret = null;
    
    // Env
    const eId = process.env[`${pKey.toUpperCase()}_CLIENT_ID`] || process.env[`${pKey.toUpperCase()}_APP_ID`] || (isFB ? process.env.FACEBOOK_APP_ID : null);
    const eSecret = process.env[`${pKey.toUpperCase()}_CLIENT_SECRET`] || process.env[`${pKey.toUpperCase()}_APP_SECRET`] || (isFB ? process.env.FACEBOOK_APP_SECRET : null);
    if (eId && eSecret) { fId = eId; fSecret = eSecret; }

    // Firestore Client
    if (agencyClientId && (!fId || !fSecret)) {
      try {
        const d = await adminDb.collection('client_social_configs').doc(agencyClientId).get();
        if (d.exists) {
          const dt = d.data();
          if (isFB && dt.facebookAppId) { fId = dt.facebookAppId; fSecret = dt.facebookAppSecret; }
          else if (pKey === 'linkedin' && dt.linkedinClientId) { fId = dt.linkedinClientId; fSecret = dt.linkedinClientSecret; }
        }
      } catch (e) {}
    }

    // Firestore Global
    if (!fId || !fSecret) {
      try {
        const d = await adminDb.collection('global_settings').doc('oauth_credentials').get();
        if (d.exists && d.data()[pKey]) { fId = d.data()[pKey].clientId; fSecret = d.data()[pKey].clientSecret; }
      } catch (e) {}
    }

    // ABSOLUTE FALLBACK
    if (isFB && (!fId || !fSecret)) {
      console.log("[Handshake] EMERGENCY FACEBOOK FALLBACK ACTIVATED");
      fId = '1621305335865053'; fSecret = '4e450f5b4fd53d0853a1e4342d943f58';
    }

    const configs: Record<string, any> = {
      linkedin: { authUrl: 'https://www.linkedin.com/oauth/v2/authorization', tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken', scope: 'openid profile email w_member_social' },
      facebook: { authUrl: 'https://www.facebook.com/v18.0/dialog/oauth', tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token', scope: 'pages_show_list,public_profile' }
    };
    const cKey = configs[pKey] ? pKey : (isFB ? 'facebook' : pKey);

    if (!agencyClientId && fId && fSecret) credentialCache[pKey] = { id: fId, secret: fSecret, config: configs[cKey] };

    return { ...configs[cKey], clientId: fId, clientSecret: fSecret, redirectUri: `https://${req.get('host')}/api/auth/${platform}/callback` };
  };

  // 5. Routes
  app.get("/api/auth/:platform", async (req, res) => {
    const { platform } = req.params;
    const { clientId } = req.query;
    const config = await getOAuthConfig(platform, req, clientId as string);
    if (!config.clientId) {
      console.error(`[Handshake] FAILED: No config for "${platform}".`);
      return res.status(400).json({ error: `V3.6 ERROR: OAuth not configured for "${platform}". Check settings.` });
    }
    
    // Handle "undefined" strings from frontend
    const finalClientId = (clientId === 'undefined' || !clientId) ? null : clientId;

    const state = Buffer.from(JSON.stringify({ csrf: Math.random().toString(36), clientId: finalClientId, mobile: req.query.mobile === 'true' })).toString('base64');
    if (req.session) { req.session.pendingClientId = finalClientId; }
    
    const finalUrl = `${config.authUrl}?response_type=code&client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&state=${state}&scope=${encodeURIComponent(config.scope)}`;
    console.log(`[Handshake] REDIRECTING TO: ${finalUrl}`);
    res.json({ url: finalUrl });
  });

  app.get("/api/auth/:platform/callback", async (req, res) => {
    const { platform } = req.params;
    const { code, state } = req.query;
    let clientId = req.session?.pendingClientId;
    let isMobile = false;
    if (state) {
      try {
        const d = JSON.parse(Buffer.from(String(state), 'base64').toString());
        clientId = d.clientId || clientId; isMobile = !!d.mobile;
      } catch (e) {}
    }

    const config = await getOAuthConfig(platform, req, clientId);
    try {
      const resp = await axios.post(config.tokenUrl, new URLSearchParams({ grant_type: 'authorization_code', code: String(code), redirect_uri: config.redirectUri, client_id: config.clientId, client_secret: config.clientSecret }));
      let token = resp.data.access_token;
      let pId = resp.data.id || 'unknown';
      let handle = resp.data.name || 'Account';

      if (platform === 'linkedin') {
        const ui = await axios.get('https://api.linkedin.com/v2/userinfo', { headers: { Authorization: `Bearer ${token}` } });
        pId = ui.data.sub; handle = ui.data.name;
      }
      if (platform === 'facebook') {
        const ll = await axios.get(`https://graph.facebook.com/v18.0/oauth/access_token`, { params: { grant_type: 'fb_exchange_token', client_id: config.clientId, client_secret: config.clientSecret, fb_exchange_token: token } });
        const pages = await axios.get(`https://graph.facebook.com/me/accounts?access_token=${ll.data.access_token}`);
        if (pages.data.data[0]) { token = pages.data.data[0].access_token; pId = pages.data.data[0].id; handle = pages.data.data[0].name; }
      }
      if (clientId) {
        await adminDb.collection('social_accounts').add({ platform, clientId, accessToken: token, handle, status: 'connected', platformAccountId: String(pId), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      }
      if (isMobile) return res.redirect(`com.stratos.agencyos://oauth-callback?platform=${platform}&status=success`);
      res.redirect(`/?status=success&platform=${platform}&handle=${encodeURIComponent(handle)}`);
    } catch (e: any) { res.redirect(`/?status=error&message=${encodeURIComponent(e.message)}`); }
  });

  // Prisma API Proxies
  app.get("/api/clients", async (req, res) => { res.json(await prisma.client.findMany({ include: { socialAccounts: true } })); });
  app.get("/api/posts", async (req, res) => { res.json(await prisma.post.findMany({ where: req.query.clientId ? { clientId: String(req.query.clientId) } : {}, orderBy: { createdAt: 'desc' } })); });
  app.get("/api/settings/:id", async (req, res) => { const s = await prisma.globalSettings.findUnique({ where: { id: req.params.id } }); res.json(s ? JSON.parse(s.data) : {}); });
  app.post("/api/settings/:id", async (req, res) => { const s = await prisma.globalSettings.upsert({ where: { id: req.params.id }, update: { data: JSON.stringify(req.body) }, create: { id: req.params.id, data: JSON.stringify(req.body) } }); res.json(JSON.parse(s.data)); });
  app.delete("/api/social/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await prisma.socialAccount.delete({ where: { id } });
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/debug-paths", (req, res) => {
    const dPath = path.join(process.cwd(), "dist");
    try {
      const files = fs.readdirSync(process.cwd());
      const distFiles = fs.existsSync(dPath) ? fs.readdirSync(dPath) : ['DIST_MISSING'];
      res.json({ cwd: process.cwd(), rootFiles: files, distFiles: distFiles });
    } catch (e: any) { res.json({ error: e.message }); }
  });

  app.get("/api/debug-env", (req, res) => {
    res.json({ env: process.env.NODE_ENV, service: process.env.K_SERVICE });
  });

  // Static Assets
  const isProd = process.env.NODE_ENV === "production" || !!process.env.K_SERVICE;
  if (!isProd) {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa", base: '/' });
    app.use(vite.middlewares);
  } else {
    const dPath = path.join(process.cwd(), "dist");
    console.log(`[Static] Serving from: ${dPath} (Exists: ${fs.existsSync(dPath)})`);
    app.use(express.static(dPath));
    app.get("*", (req, res) => { res.sendFile(path.join(dPath, "index.html")); });
  }

  app.listen(PORT, "0.0.0.0", () => { console.log(`[SERVER] Version 3.6.8 Running on ${PORT}`); });
}

startServer();
