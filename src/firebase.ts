import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";

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

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('unavailable'))) {
      console.error("Please check your Firebase configuration. Ensure that you have created a Firestore database in the Firebase Console for the project 'zen-v-project'.");
    }
  }
}
testConnection();
