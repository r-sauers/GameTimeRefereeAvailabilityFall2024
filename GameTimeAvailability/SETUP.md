# SETUP.md

## 1️⃣ Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/) and click **Add project**.
2. Give it a name (e.g., `gametime-referee`).
3. Disable Google Analytics unless you need it.
4. Click **Create project** and wait for provisioning.

## 2️⃣ Enable Services
- **Authentication** → **Sign‑in method** → enable **Email/Password**.
- **Firestore Database** → **Create database** → start in **test mode** (will be locked down by the security rules we provide).

## 3️⃣ Add Admin UID(s)
1. After you create an admin account (via the Auth UI or the Firebase CLI), note its UID.
2. In Firestore, create a collection called **`admins`**.
3. Add a document with the UID as the document ID (no fields required). This marks that user as an admin.

## 4️⃣ Copy the Firebase config
1. In the Firebase console, go to **Project settings** → **General** → **Your apps**.
2. Add a **Web app** (if you haven’t already) and copy the config object.
3. Paste the values into the `.env.example` file at the project root and rename the file to `.env` (the Vite dev server will read it automatically).

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 5️⃣ Install dependencies (already done)
```bash
npm install
```

## 6️⃣ Run the dev server
```bash
npm run dev
```
Open `http://localhost:5173` – you should see the login screen.

## 7️⃣ Deploy to Render (later)
- Ensure the same environment variables are added in the Render dashboard.
- The `render.yaml` file in the repo will build the Vite app and serve the `dist` folder.

---
**Enjoy your new premium Referee Availability app!**
