// Use consistent CDN module imports (same version)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

// Your Firebase config (you already had it)
const firebaseConfig = {
  apiKey: "AIzaSyDgRZ1MhrubdPzqsl1Olgssz15mAw2dw4c",
  authDomain: "health-care-record-managment.firebaseapp.com",
  projectId: "health-care-record-managment",
  storageBucket: "health-care-record-managment.firebasestorage.app",
  messagingSenderId: "646771881752",
  appId: "1:646771881752:web:f98f128e982bc401a0506d",
  measurementId: "G-TKC8RGVB2N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

// Export auth and the createUserWithEmailAndPassword helper so your HTML module can import them
export { auth, createUserWithEmailAndPassword };
