import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase web configuration with fallbacks for Vercel deployment
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBo-ujfmyElCmfVH7PuJ8DKQvf2P2LlK7s",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "eksathe-swapno.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "eksathe-swapno",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "eksathe-swapno.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "69137827689",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:69137827689:web:b1d7d8e6c79a29583ee91f"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
