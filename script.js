// script.js

// ---------------- Helper ----------------
function showMessage(el, text, color="red") {
  el.textContent = text;
  el.style.color = color;
  setTimeout(()=>el.textContent="", 3000);
}

// ---------------- Registration ----------------
function register() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const referralCodeInput = document.getElementById("referralCode").value.trim().toUpperCase();
  const authMessageEl = document.getElementById("authMessage");

  if (!email || !password) {
    showMessage(authMessageEl, "Please enter email and password");
    return;
  }

  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(async (userCredential) => {
      const user = userCredential.user;
      const myReferral = Math.random().toString(36).substring(2,8).toUpperCase();

      let userData = {
        email: email,
        balance: 0,
        referralCode: myReferral,
        referredBy: null,
        adsClaimed: {}
      };

      if (referralCodeInput) {
        // Check if referral exists
        const usersRef = firebase.firestore().collection("users");
        const query = await usersRef.where("referralCode","==",referralCodeInput).get();
        if (!query.empty) {
          const refUid = query.docs[0].id;
          await usersRef.doc(refUid).update({
            balance: firebase.firestore.FieldValue.increment(3)
          });
          userData.balance = 5;
          userData.referredBy = referralCodeInput;
        }
      }

      await firebase.firestore().collection("users").doc(user.uid).set(userData);
    })
    .catch(err => showMessage(authMessageEl, err.message));
}

// ---------------- Login ----------------
function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const authMessageEl = document.getElementById("authMessage");

  if (!email || !password) {
    showMessage(authMessageEl, "Please enter email and password");
    return;
  }

  firebase.auth().signInWithEmailAndPassword(email, password)
    .catch(err => showMessage(authMessageEl, err.message));
}

// ---------------- Logout ----------------
function logout() {
  firebase.auth().signOut();
}

// ---------------- Auth State ----------------
firebase.auth().onAuthStateChanged(async (user) => {
  const authSection = document.getElementById("auth-section");
  const dashboard = document.getElementById("dashboard");
  const userEmailEl = document.getElementById("userEmail");
  const myReferralEl = document.getElementById("myReferral");
  const balanceEl = document.getElementById("balance");

  if (user) {
    authSection.classList.add("hidden");
    dashboard.classList.remove("hidden");

    const userDoc = await firebase.firestore().collection("users").doc(user.uid).get();
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
function requestWithdrawal() {
  const user = firebase.auth().currentUser;
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

  const userRef = firebase.firestore().collection("users").doc(user.uid);
  userRef.get().then(async (docSnap) => {
    const data = docSnap.data();
    if (data.balance < amount) {
      showMessage(messageEl, "Insufficient balance!");
      return;
    }

    await userRef.update({
      balance: data.balance - amount
    });

    // Create withdrawal request
    await firebase.firestore().collection("withdrawals").add({
      userId: user.uid,
      email: user.email,
      amount: amount,
      status: "pending",
      date: firebase.firestore.FieldValue.serverTimestamp()
    });

    showMessage(messageEl, `Withdrawal request of $${amount} submitted!`, "green");
  });
}