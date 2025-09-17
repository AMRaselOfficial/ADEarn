// script.js
import { auth, db } from "./firebase.js";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
  doc, setDoc, getDoc, getDocs, updateDoc, collection, query, where 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Loading screen
const loading = document.getElementById("loading");
function showLoading() { loading.classList.remove("hidden"); }
function hideLoading() { loading.classList.add("hidden"); }

// --- Register ---
async function register() {
  showLoading();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const referralCode = document.getElementById("referralCode").value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    const myReferral = Math.random().toString(36).substring(2, 8).toUpperCase();

    await setDoc(doc(db, "users", uid), {
      email: email,
      referralCode: myReferral,
      invitedBy: referralCode || null,
      balance: referralCode ? 5 : 0,
      createdAt: new Date()
    });

    if (referralCode) {
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
  } finally {
    hideLoading();
  }
}

// --- Login ---
async function login() {
  showLoading();
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
  } finally {
    hideLoading();
  }
}

// --- Logout ---
function logout() {
  signOut(auth);
  location.reload();
}

// --- Persistent Login ---
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const uid = user.uid;
    const userDoc = await getDoc(doc(db, "users", uid));
    const data = userDoc.data();

    document.getElementById("auth-section").classList.add("hidden");
    document.getElementById("dashboard").classList.remove("hidden");

    document.getElementById("userEmail").innerText = data.email;
    document.getElementById("myReferral").innerText = data.referralCode;
    document.getElementById("balance").innerText = data.balance.toFixed(2);
  }
  hideLoading();
});

// Make functions accessible from HTML
window.register = register;
window.login = login;
window.logout = logout;