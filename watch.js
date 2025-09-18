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

// Message system
function showMessage(text, type = "success", duration = 3000) {
  let messageEl = document.getElementById("message");
  if (!messageEl) {
    messageEl = document.createElement("div");
    messageEl.id = "message";
    messageEl.className = "message hidden";
    document.body.appendChild(messageEl);
  }

  messageEl.textContent = text;

  if (type === "error") messageEl.style.backgroundColor = "#f44336";
  else if (type === "info") messageEl.style.backgroundColor = "#2196f3";
  else messageEl.style.backgroundColor = "#4caf50";

  messageEl.classList.remove("hidden");
  messageEl.classList.add("show");

  setTimeout(() => {
    messageEl.classList.remove("show");
    messageEl.classList.add("hidden");
  }, duration);
}

// Auth check
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // Fetch ad
  const adDoc = await getDoc(doc(db, "ads", adId));
  if (!adDoc.exists()) {
    adTitleEl.textContent = "Ad not found!";
    return;
  }

  const adData = adDoc.data();
  adTitleEl.textContent = adData.title;
  adFrame.src = adData.url;

  let seconds = 60;
  const interval = setInterval(async () => {
    seconds--;
    timerEl.textContent = seconds;

    if (seconds <= 0) {
      clearInterval(interval);

      await updateDoc(doc(db, "users", user.uid), {
        balance: increment(adData.reward),
        [`adsClaimed.${adId}`]: true
      });

      showMessage(`You earned $${adData.reward}!`, "success");
      window.location.href = "ads.html";
    }
  }, 1000);
});