// script.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, increment, serverTimestamp, collection } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ---------------- Firebase Config ----------------
import { firebaseConfig } from "./firebase.js";
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ---------------- UI Elements ----------------
const authSection = document.getElementById("auth-section");
const dashboard = document.getElementById("dashboard");
const userEmailEl = document.getElementById("userEmail");
const myReferralEl = document.getElementById("myReferral");
const balanceEl = document.getElementById("balance");
const authMessageEl = document.getElementById("authMessage");

// ---------------- Helper ----------------
function showMessage(el, text, color="red") {
  el.textContent = text;
  el.style.color = color;
  setTimeout(()=>el.textContent="", 3000);
}

// ---------------- Registration ----------------
window.register = async function() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const referralCodeInput = document.getElementById("referralCode").value.trim().toUpperCase();

  if (!email || !password) {
    showMessage(authMessageEl, "Please enter email and password");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Generate referral code
    const myReferral = Math.random().toString(36).substring(2,8).toUpperCase();

    // Prepare user data
    let userData = {
      email,
      balance: 0,
      referralCode: myReferral,
      referredBy: null,
      adsClaimed: {}
    };

    // Handle referral bonus
    if (referralCodeInput) {
      // Search for user with this referral code
      const usersSnap = await getDoc(doc(db, "users", referralCodeInput));
      const refUserQuery = await getDoc(doc(db, "users", referralCodeInput));
      // We'll assume referral exists manually for simplicity
      userData.referredBy = referralCodeInput;

      // Give bonus to referrer
      const queryRef = await db.collection("users").where("referralCode","==",referralCodeInput).get();
      if (!queryRef.empty) {
        const refUid = queryRef.docs[0].id;
        await updateDoc(doc(db, "users", refUid), {
          balance: increment(3)
        });
      }

      // Give bonus to new user
      userData.balance = 5;
    }

    await setDoc(doc(db, "users", user.uid), userData);

  } catch(err) {
    showMessage(authMessageEl, err.message);
  }
}

// ---------------- Login ----------------
window.login = async function() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    showMessage(authMessageEl, "Please enter email and password");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch(err) {
    showMessage(authMessageEl, err.message);
  }
}

// ---------------- Logout ----------------
window.logout = function() {
  signOut(auth);
}

// ---------------- Auth State ----------------
onAuthStateChanged(auth, async (user) => {
  if (user) {
    authSection.classList.add("hidden");
    dashboard.classList.remove("hidden");

    const userDoc = await getDoc(doc(db, "users", user.uid));
    const data = userDoc.data();
    userEmailEl.textContent = data.email;
    myReferralEl.textContent = data.referralCode;
    balanceEl.textContent = data.balance;
  } else {
    authSection.classList.remove("hidden");
    dashboard.classList.add("hidden");
  }
});

// ---------------- Withdrawal ----------------
window.requestWithdrawal = async function() {
  const user = auth.currentUser;
  const amount = parseFloat(document.getElementById("withdrawAmount").value);
  const messageEl = document.getElementById("withdrawMessage");

  if (!user) {
    showMessage(messageEl, "You must be logged in!");
    return;
  }

  if (!amount || amount < 100) {
    showMessage(messageEl, "Minimum withdrawal is $100");
    return;
  }

  const userRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userRef);
  const userData = userDoc.data();

  if (userData.balance < amount) {
    showMessage(messageEl, "Insufficient balance!");
    return;
  }

  // Deduct balance
  await updateDoc(userRef, {
    balance: userData.balance - amount
  });

  // Create withdrawal request
  const withdrawalRef = doc(collection(db, "withdrawals"));
  await setDoc(withdrawalRef, {
    userId: user.uid,
    email: user.email,
    amount: amount,
    status: "pending",
    date: serverTimestamp()
  });

  showMessage(messageEl, `Withdrawal request of $${amount} submitted!`, "green");
}