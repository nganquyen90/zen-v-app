import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB5icYhGMu-zhf05Dc1Ezjva6p_WkMO9Ag",
  authDomain: "zen-v-project.firebaseapp.com",
  projectId: "zen-v-project",
  storageBucket: "zen-v-project.firebasestorage.app",
  messagingSenderId: "759253391543",
  appId: "1:759253391543:web:4f19a94853a2d5980d1532",
  measurementId: "G-TWJTRDFSL7"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
