# StratOS Agency Flutter App

A full-stack social media agency management mobile application built with Flutter and Firebase.

## 🚀 Getting Started

### 1. Prerequisites
- [Flutter SDK](https://docs.flutter.dev/get-started/install) (>= 3.0.0)
- [Firebase CLI](https://firebase.google.com/docs/cli)
- [FlutterFire CLI](https://firebase.google.com/docs/flutter/setup)

### 2. Firebase Configuration
This project requires a Firebase project. To configure it:
1. Run `flutterfire configure` in the root directory.
2. This will generate `lib/firebase_options.dart`.
3. Ensure you have enabled **Google Sign-In** and **Firestore** in the Firebase Console.

### 3. AI Integration
- Obtain a Gemini API key from [Google AI Studio](https://aistudio.google.com/).
- In `lib/main.dart`, replace `'YOUR_GEMINI_API_KEY'` with your actual key.

### 4. Build and Run
```bash
flutter pub get
flutter run
```

## 📁 Project Structure
- `lib/models/`: Data models for Clients, Posts, and Crisis Events.
- `lib/services/`: Firebase and Gemini AI service integrations.
- `lib/screens/`: UI for Login, Dashboard, and Management views.

## 🛡️ Security Rules
The `firebase/firestore.rules` file contains the recommended security configuration for your database. Deploy it using:
```bash
firebase deploy --only firestore:rules
```
