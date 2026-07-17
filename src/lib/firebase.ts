import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

const isPlaceholder = !firebaseConfig.apiKey || firebaseConfig.apiKey === "PLACEHOLDER";

let app;
let auth: any = null;
let db: any = null;

if (!isPlaceholder) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

export { auth, db };
export const isFirebaseConfigured = !isPlaceholder && auth !== null;

// User session types
export interface UserSession {
  uid: string;
  email: string;
  displayName?: string;
  isMock?: boolean;
}

// Local Session Helpers for sandbox/development fallback if Firebase keys aren't set up yet
const LOCAL_SESSION_KEY = "wc_user_session";
const LOCAL_USERS_DB_KEY = "wc_stored_users";

export function getLocalSession(): UserSession | null {
  try {
    const sessionStr = localStorage.getItem(LOCAL_SESSION_KEY);
    return sessionStr ? JSON.parse(sessionStr) : null;
  } catch {
    return null;
  }
}

export function setLocalSession(session: UserSession | null) {
  try {
    if (session) {
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(LOCAL_SESSION_KEY);
    }
    // Dispatch storage event to notify other windows or hooks in App
    window.dispatchEvent(new Event("storage"));
  } catch (error) {
    console.error("Error setting local user session", error);
  }
}
