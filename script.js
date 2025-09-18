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

  const today = new Date().toDateString();
  if (data.adsClaimed && data.adsClaimed[adId] === today) {
    showMessage(adMessageEl, "You already claimed this ad today.");
    return;
  }

  showMessage(adMessageEl, "Ad started, wait 60s...", "green");

  setTimeout(async () => {
    await userRef.update({
      [`adsClaimed.${adId}`]: today,
      balance: firebase.firestore.FieldValue.increment(1)
    });
    showMessage(adMessageEl, "Ad claimed! +$1", "green");
  }, 60000);
};