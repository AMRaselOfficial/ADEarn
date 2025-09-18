// script.js
import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment,
  collection,
  query,
  where,
  getDocs,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const authSection = document.getElementById("auth-section");
const dashboard = document.getElementById("dashboard");
const userEmailEl = document.getElementById("userEmail");
const myReferralEl = document.getElementById("myReferral");
const balanceEl = document.getElementById("balance");

// ------------------- Registration -------------------
window.register = async function () {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const referralCode = document.getElementById("referralCode").value.trim();

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Generate random referral code for new user
    const myCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    let userData = {
      email: user.email,
      balance: 0,
      referralCode: myCode,
      referredBy: null,
      adsClaimed: {}
    };

    // Handle referral code
    if (referralCode) {
      const refQuery = query(collection(db, "users"), where("referralCode", "==", referralCode));
      const refSnap = await getDocs(refQuery);

      if (!refSnap.empty) {
        const refUser = refSnap.docs[0];
        userData.referredBy = referralCode;

        // Add referral bonuses
        userData.balance += 5; // new user bonus
        await updateDoc(doc(db, "users", refUser.id), { balance: increment(3) }); // inviter bonus
      }
    }

    // Save user to Firestore
    await setDoc(doc(db, "users", user.uid), userData);
    alert("Registered successfully!");
  } catch (error) {
    alert(error.message);
  }
};

// ------------------- Login -------------------
window.login = async function () {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    alert(error.message);
  }
};

// ------------------- Logout -------------------
window.logout = async function () {
  await signOut(auth);
};

// ------------------- Ads Section Redirect -------------------
window.goToAds = function () {
  window.location.href = "ads.html";
};

// ------------------- Real-time Dashboard -------------------
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Show dashboard
    authSection.classList.add("hidden");
    dashboard.classList.remove("hidden");

    // Real-time listener for user document
    const userDocRef = doc(db, "users", user.uid);
    onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        userEmailEl.textContent = data.email;
        myReferralEl.textContent = data.referralCode;
        balanceEl.textContent = data.balance ?? 0;
      }
    });
  } else {
    // Show login/register
    authSection.classList.remove("hidden");
    dashboard.classList.add("hidden");
  }
});