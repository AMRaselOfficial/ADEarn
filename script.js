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

// ------------------- Elements -------------------
const authSection = document.getElementById("auth-section");
const dashboard = document.getElementById("dashboard");
const userEmailEl = document.getElementById("userEmail");
const myReferralEl = document.getElementById("myReferral");
const balanceEl = document.getElementById("balance");

// ------------------- Message System -------------------
function showMessage(text, type = "success", duration = 3000) {
  let messageEl = document.getElementById("message");
  if (!messageEl) {
    messageEl = document.createElement("div");
    messageEl.id = "message";
    messageEl.className = "message hidden";
    document.body.appendChild(messageEl);
  }

  messageEl.textContent = text;

  if (type === "error") messageEl.style.backgroundColor = "#f44336"; // red
  else if (type === "info") messageEl.style.backgroundColor = "#2196f3"; // blue
  else messageEl.style.backgroundColor = "#4caf50"; // green

  messageEl.classList.remove("hidden");
  messageEl.classList.add("show");

  setTimeout(() => {
    messageEl.classList.remove("show");
    messageEl.classList.add("hidden");
  }, duration);
}

// ------------------- Registration -------------------
window.register = async function () {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const referralCode = document.getElementById("referralCode").value.trim();

  if (!email || !password) {
    showMessage("Please enter email and password", "error");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const myCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    let userData = {
      email: user.email,
      balance: 0,
      referralCode: myCode,
      referredBy: null,
      adsClaimed: {}
    };

    if (referralCode) {
      const refQuery = query(collection(db, "users"), where("referralCode", "==", referralCode));
      const refSnap = await getDocs(refQuery);

      if (!refSnap.empty) {
        const refUser = refSnap.docs[0];
        userData.referredBy = referralCode;

        userData.balance += 5;
        await updateDoc(doc(db, "users", refUser.id), { balance: increment(3) });
      }
    }

    await setDoc(doc(db, "users", user.uid), userData);
    showMessage("Registered successfully!", "success");
  } catch (error) {
    showMessage(error.message, "error");
  }
};

// ------------------- Login -------------------
window.login = async function () {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    showMessage("Please enter email and password", "error");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    showMessage("Login successful!", "success");
  } catch (error) {
    showMessage(error.message, "error");
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
    authSection.classList.add("hidden");
    dashboard.classList.remove("hidden");

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
    authSection.classList.remove("hidden");
    dashboard.classList.add("hidden");
  }
});
// withdrawal script
import { doc, getDoc, updateDoc, setDoc, serverTimestamp, collection } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

async function requestWithdrawal() {
  const user = auth.currentUser;
  const amount = parseFloat(document.getElementById("withdrawAmount").value);
  const messageEl = document.getElementById("withdrawMessage");

  if (!user) {
    messageEl.textContent = "You must be logged in!";
    messageEl.style.color = "red";
    return;
  }

  if (!amount || amount < 100) {
    messageEl.textContent = "Minimum withdrawal is $100";
    messageEl.style.color = "red";
    return;
  }

  const userRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userRef);
  const userData = userDoc.data();

  if (userData.balance < amount) {
    messageEl.textContent = "Insufficient balance!";
    messageEl.style.color = "red";
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

  messageEl.textContent = `Withdrawal request of $${amount} submitted!`;
  messageEl.style.color = "green";
}