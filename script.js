// script.js
import { auth, db } from "./firebase.js";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
  doc, setDoc, getDoc, getDocs, updateDoc, collection, query, where 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- Register ---
async function register() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const referralCode = document.getElementById("referralCode").value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // Generate random referral code for new user
    const myReferral = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Save new user in Firestore
    await setDoc(doc(db, "users", uid), {
      email: email,
      referralCode: myReferral,
      invitedBy: referralCode || null,
      balance: referralCode ? 5 : 0, // $5 for using friend's code
      createdAt: new Date()
    });

    if (referralCode) {
      // Reward friend $3
      const q = query(collection(db, "users"), where("referralCode", "==", referralCode));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const friendDoc = snap.docs[0];
        const newBalance = friendDoc.data().balance + 3;
        await updateDoc(doc(db, "users", friendDoc.id), { balance: newBalance });
      }
    }

    alert("Registration successful!");
  } catch (error) {
    alert(error.message);
  }
}

// --- Login ---
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    const userDoc = await getDoc(doc(db, "users", uid));
    const data = userDoc.data();

    document.getElementById("auth-section").classList.add("hidden");
    document.getElementById("dashboard").classList.remove("hidden");

    document.getElementById("userEmail").innerText = data.email;
    document.getElementById("myReferral").innerText = data.referralCode;
    document.getElementById("balance").innerText = data.balance.toFixed(2);

  } catch (error) {
    alert(error.message);
  }
}

// --- Logout ---
function logout() {
  signOut(auth);
  location.reload();
}

// Make functions accessible from HTML buttons
window.register = register;
window.login = login;
window.logout = logout;