import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

// Use available credentials in the workspace
const firebaseConfig = {
  projectId: "stratos-1d3dd",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function injectFacebookCredentials() {
  console.log("🚀 Injecting Facebook Global Credentials...");
  
  const credentials = {
    facebook: {
      clientId: "1621305335865053",
      clientSecret: "4e450f5b4fd53d0853a1e4342d943f58"
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
