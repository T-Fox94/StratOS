# StratOS Agency Platform Documentation

## Overview
StratOS is a comprehensive social media agency management platform designed to streamline client management, content creation, and performance tracking.

## Key Features
- **Client Management**: Centralized hub for managing client profiles, brand guidelines, and monthly quotas.
- **Social Account Integration**: Securely connect and manage multiple social media platforms (Instagram, Facebook, LinkedIn, TikTok, Twitter).
- **Content Creation & Scheduling**: AI-powered content generation and a visual calendar for scheduling posts.
- **Analytics Dashboard**: Real-time performance tracking with AI-driven insights and automated report generation (PowerPoint).
- **Crisis Management**: Real-time monitoring of social sentiment and crisis event tracking.
- **Scope Guardian**: Manage and bill for out-of-scope requests.

## Security Architecture
- **Authentication**: Firebase Authentication (Google Login) for secure user access.
- **Database**: Firestore for real-time data synchronization.
- **Security Rules**: Robust Firestore Security Rules enforcing least-privilege access and data validation.
- **Sensitive Data**: All sensitive credentials (OAuth secrets, API keys) are managed server-side or via environment variables. No hardcoded secrets in the frontend.

## Deployment Guide
### 1. Environment Variables
Ensure the following environment variables are configured in your hosting environment:
- `GEMINI_API_KEY`: For AI-powered features.
- `SESSION_SECRET`: For secure session management.
- `OAUTH_CLIENT_ID` & `OAUTH_CLIENT_SECRET`: For social platform integrations.

### 2. Firebase Configuration
- Update `firebase-applet-config.json` with your production Firebase project credentials.
- Deploy Firestore Security Rules using `firebase deploy --only firestore:rules`.

### 3. OAuth Redirect URIs
Add the following redirect URIs to your OAuth provider dashboards:
- `https://<your-app-url>/auth/callback`

## Development
- **Frontend**: React, Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend**: Node.js, Express, Prisma (SQLite/PostgreSQL).
- **State Management**: Zustand with persistence.
- **Build Tool**: Vite.

---
*Generated on March 16, 2026*
