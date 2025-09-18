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
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();