import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

// Use available credentials in the workspace
const firebaseConfig = {
  projectId: process.env.GOOGLE_CLOUD_PROJECT || "stratos-1d3dd",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function injectFacebookCredentials() {
  console.log("🚀 Injecting Facebook Global Credentials...");

  const clientId = process.env.FACEBOOK_CLIENT_ID;
  const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("❌ FACEBOOK_CLIENT_ID and FACEBOOK_CLIENT_SECRET must be set in environment.");
    process.exit(1);
  }

  const credentials = {
    facebook: {
      clientId,
      clientSecret
    },
    updatedAt: new Date().toISOString()
  };

  try {
    // Save to the global settings collection used by our Zero-Prisma strategy
    await db.collection('global_settings').doc('oauth_credentials').set(credentials, { merge: true });
    console.log("✅ Facebook credentials saved to Firestore!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to save credentials:", error);
    process.exit(1);
  }
}

injectFacebookCredentials();
