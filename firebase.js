// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD8an0WUr3uTlwshXH37oBVoM6pnc5ujNo",
  authDomain: "adearnrasel.firebaseapp.com",
  projectId: "adearnrasel",
  storageBucket: "adearnrasel.appspot.com",
  messagingSenderId: "1037623431608",
  appId: "1:1037623431608:web:3063f44b7db7c03b133f4d",
  measurementId: "G-8MBXZM85JS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };