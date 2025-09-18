// Helper to show messages
function showMessage(el, text, color="red") {
  el.textContent = text;
  el.style.color = color;
  setTimeout(()=>el.textContent="", 3000);
}

// Register
window.register = async function() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const referralCodeInput = document.getElementById("referralCode").value.trim().toUpperCase();
  const authMessageEl = document.getElementById("authMessage");

  if (!email || !password) {
    showMessage(authMessageEl, "Please enter email and password");
    return;
  }

  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
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
      const usersRef = db.collection("users");
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

    await db.collection("users").doc(user.uid).set(userData);

  } catch(err) {
    showMessage(authMessageEl, err.message);
  }
};

// Login
window.login = async function() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const authMessageEl = document.getElementById("authMessage");

  if (!email || !password) {
    showMessage(authMessageEl, "Please enter email and password");
    return;
  }

  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch(err) {
    showMessage(authMessageEl, err.message);
  }
};

// Logout
window.logout = function() {
  auth.signOut();
};

// Auth state
auth.onAuthStateChanged(async (user) => {
  const authSection = document.getElementById("auth-section");
  const dashboard = document.getElementById("dashboard");
  const userEmailEl = document.getElementById("userEmail");
  const myReferralEl = document.getElementById("myReferral");
  const balanceEl = document.getElementById("balance");

  if (user) {
    authSection.classList.add("hidden");
    dashboard.classList.remove("hidden");

    const userDoc = await db.collection("users").doc(user.uid).get();
    const data = userDoc.data();
    userEmailEl.textContent = data.email;
    myReferralEl.textContent = data.referralCode;
    balanceEl.textContent = data.balance;
  } else {
    authSection.classList.remove("hidden");
    dashboard.classList.add("hidden");
  }
});

// Withdraw
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

  const userRef = db.collection("users").doc(user.uid);
  const docSnap = await userRef.get();
  const data = docSnap.data();

  if (data.balance < amount) {
    showMessage(messageEl, "Insufficient balance!");
    return;
  }

  await userRef.update({ balance: data.balance - amount });

  await db.collection("withdrawals").add({
    userId: user.uid,
    email: user.email,
    amount: amount,
    status: "pending",
    date: firebase.firestore.FieldValue.serverTimestamp()
  });

  showMessage(messageEl, `Withdrawal request of $${amount} submitted!`, "green");
};

// Watch Ad
window.goToAd = async function(adId) {
  const user = auth.currentUser;
  const adMessageEl = document.getElementById("adMessage");
  if (!user) {
    showMessage(adMessageEl, "Login first!");
    return;
  }

  const userRef = db.collection("users").doc(user.uid);
  const userDoc = await userRef.get();
  const data = userDoc.data();

  // Check daily claim
  const today = new Date().toDateString();
  if (data.adsClaimed && data.adsClaimed[adId] === today) {
    showMessage(adMessageEl, "You already claimed this ad today.");
    return;
  }

  // Show ad page (simple example, wait 60s)
  showMessage(adMessageEl, "Ad started, wait 60s...", "green");

  setTimeout(async () => {
    await userRef.update({
      [`adsClaimed.${adId}`]: today,
      balance: firebase.firestore.FieldValue.increment(1) // reward $1 for example
    });
    showMessage(adMessageEl, "Ad claimed! +$1", "green");
  }, 60000);
};