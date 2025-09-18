import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Elements
const adTitleEl = document.getElementById("adTitle");
const adFrame = document.getElementById("adFrame");
const timerEl = document.getElementById("timer");

// Get adId from URL
const params = new URLSearchParams(window.location.search);
const adId = params.get("ad");

let seconds = 60;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // Get ad data
  const adDoc = await getDoc(doc(db, "ads", adId));
  if (!adDoc.exists()) {
    adTitleEl.textContent = "Ad not found!";
    return;
  }

  const adData = adDoc.data();
  adTitleEl.textContent = adData.title;
  adFrame.src = adData.url; // your promotional ad link

  // Start timer
  const interval = setInterval(async () => {
    seconds--;
    timerEl.textContent = seconds;

    if (seconds <= 0) {
      clearInterval(interval);

      // Update user balance & mark ad as claimed
      await updateDoc(doc(db, "users", user.uid), {
        balance: increment(adData.reward),
        [`adsClaimed.${adId}`]: true
      });

      alert(`You earned $${adData.reward}!`);
      window.location.href = "ads.html"; // back to ads page
    }
  }, 1000);

  // If user leaves early (close tab / navigate), no reward automatically
});