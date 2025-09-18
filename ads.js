import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Elements
const adsList = document.getElementById("adsList");
const balanceEl = document.getElementById("balance");

// Redirect back to dashboard
window.goBack = function() {
  window.location.href = "index.html";
};

// Load Ads for user
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // Show user balance
  const userDoc = await getDoc(doc(db, "users", user.uid));
  const userData = userDoc.data();
  balanceEl.textContent = userData.balance ?? 0;

  // Fetch all ads
  const adsSnapshot = await getDocs(collection(db, "ads"));

  adsSnapshot.forEach(adDoc => {
    const adData = adDoc.data();
    const claimed = userData.adsClaimed?.[adDoc.id] || false;

    const adDiv = document.createElement("div");
    adDiv.innerHTML = `
      <h3>${adData.title}</h3>
      <p>Reward: $${adData.reward}</p>
      ${claimed ? `<p>✅ Already Claimed</p>` : `<button onclick="watchAd('${adDoc.id}')">Watch & Earn</button>`}
    `;
    adsList.appendChild(adDiv);
  });
});

// Go to watch page
window.watchAd = function(adId) {
  window.location.href = `watch.html?ad=${adId}`;
};