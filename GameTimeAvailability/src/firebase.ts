// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, type Auth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, type Firestore, connectFirestoreEmulator } from "firebase/firestore";

/**
 * FETCH FIREBASE CONFIG AUTOMATICALLY
 * In production, Firebase Hosting provides this at a reserved URL.
 * In development, we proxy this request to the Firebase Hosting emulator via vite.config.ts.
 */
const response = await fetch("/__/firebase/init.json");
const firebaseConfig = await response.json();

const app = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// Connect to emulators when running locally
const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
if (import.meta.env.DEV || isLocalhost) {
  try {
    connectAuthEmulator(auth, "http://localhost:9099");
    connectFirestoreEmulator(db, "localhost", 8080);
    console.info("🔧 Connected to Firebase emulators using automatic config");
  } catch (e) {
    console.warn("Failed to connect to emulators:", e);
  }
}
