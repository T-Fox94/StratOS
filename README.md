# StratOS Agency OS

Comprehensive Social Media Operations Management platform for creative agencies with AI-powered crisis monitoring, scope guarding, and multi-platform content workflow.

## 🚀 Features

### 📊 Analytics & Reporting
- **Real-time Dashboard**: Monitor reach, engagement, and growth across all connected platforms.
- **PowerPoint Export**: Generate professional, client-ready performance reports compatible with Google Slides.
- **Platform Breakdown**: Detailed metrics for Instagram, LinkedIn, Facebook, TikTok, and Twitter.

### 🤖 AI & Automation
- **Crisis Monitoring**: Automated detection of negative sentiment and potential brand crises.
- **Content Analysis**: AI-powered insights into post performance and strategic recommendations.
- **Agent Tasks**: Background monitoring of mentions, comments, and automated metrics syncing.
- **AI Chat Widget**: Direct access to a Gemini-powered assistant for agency operations.

### 📅 Content & Workflow
- **Content Calendar**: Visual scheduling and management of social media posts.
- **Approval System**: Streamlined workflow for content review and stakeholder approval.
- **Creative Studio**: Tools for generating and refining social media content.

### 💼 Client & Scope Management
- **Client Profiles**: Manage multiple clients with industry-specific settings and risk profiles.
- **Scope Guarding**: Track project scope and billable hours to prevent scope creep.
- **Social Account Integration**: Secure OAuth-based connection for major social platforms.

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Motion.
- **Backend**: Node.js, Express.
- **Database**: Prisma (SQLite) for relational data & Firebase Firestore for real-time state.
- **Authentication**: Firebase Authentication.
- **Reporting**: pptxgenjs for PowerPoint generation.
- **AI**: Google Gemini (@google/genai).

## ⚙️ Setup & Configuration

### 1. Environment Variables
Create a `.env` file in the root directory based on `.env.example`. You **must** provide these for the application to be functional:

```env
# AI Engine
GEMINI_API_KEY=your_google_ai_studio_key

# OAuth Credentials (Required for social connections)
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
INSTAGRAM_CLIENT_ID=
INSTAGRAM_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
TIKTOK_CLIENT_ID=
TIKTOK_CLIENT_SECRET=
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=

# Session & Security
SESSION_SECRET=a_random_secure_string
```

### 2. Firebase Configuration
The platform requires a `firebase-applet-config.json` file in the root directory. If you are moving to a new Firebase project:
1. Create a new project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication** (Google Login) and **Firestore**.
3. Download your web app's configuration and update `firebase-applet-config.json`.
4. **CRITICAL**: Deploy the security rules to your project:
   ```bash
   # Install Firebase CLI if you haven't
   npm install -g firebase-tools
   # Login and initialize
   firebase login
   # Deploy the rules provided in this repo
   firebase deploy --only firestore:rules
   ```

### 3. OAuth Redirect URIs
For each social platform (LinkedIn, Facebook, etc.), you must update the **Authorized Redirect URIs** in their respective developer portals to match your production domain. 

**IMPORTANT**: LinkedIn and other providers require `https://`. The application is now configured to force secure redirects.

*   **LinkedIn**: `https://stratos-agency-os-645192182585.us-west1.run.app/api/auth/linkedin/callback`
*   **Facebook/Instagram**: `https://stratos-agency-os-645192182585.us-west1.run.app/api/auth/facebook/callback`
*   **TikTok**: `https://stratos-agency-os-645192182585.us-west1.run.app/api/auth/tiktok/callback`
*   **Twitter**: `https://stratos-agency-os-645192182585.us-west1.run.app/api/auth/twitter/callback`

### 4. Installation & Database
1. Install dependencies:
   ```bash
   npm install
   ```
2. Initialize the SQLite database and generate the Prisma client:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 🚢 Deployment

1. **Build**: Compile the React frontend:
   ```bash
   npm run build
   ```
2. **Start**: Launch the production Node.js server:
   ```bash
   NODE_ENV=production npm start
   ```
   The server will serve the static files from `dist/` and handle all API requests on port 3000.

## 🔒 Security

- **Firestore Rules**: Hardened security rules ensuring data isolation between clients and role-based access control (Admin, Manager, Editor, Client).
- **OAuth**: Secure server-side token exchange and storage.
- **PII Protection**: Strict rules against unauthorized access to personally identifiable information.

---
Developed with ❤️ by the StratOS Team.
