// watch.js
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

// ------------------- Auth Check -------------------
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // Fetch ad document
  const adDoc = await getDoc(doc(db, "ads", adId));
  if (!adDoc.exists()) {
    adTitleEl.textContent = "Ad not found!";
    showMessage("Ad not found!", "error");
    return;
  }

  const adData = adDoc.data();
  adTitleEl.textContent = adData.title;
  adFrame.src = adData.url;

  // Fetch user document
  const userDoc = await getDoc(doc(db, "users", user.uid));
  const userData = userDoc.data();

  // Check daily ad claim
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const lastClaimed = userData.adsClaimed?.[adId] ?? null;

  if (lastClaimed === today) {
    showMessage("You already claimed this ad today. Come back after 12:00 AM!", "info");
    timerEl.textContent = "0";
    return;
  }

  // Start 60-second countdown
  let seconds = 60;
  timerEl.textContent = seconds;

  const interval = setInterval(async () => {
    seconds--;
    timerEl.textContent = seconds;

    if (seconds <= 0) {
      clearInterval(interval);

      // Update user balance and mark ad as claimed today
      await updateDoc(doc(db, "users", user.uid), {
        balance: increment(adData.reward),
        [`adsClaimed.${adId}`]: today
      });

      showMessage(`You earned $${adData.reward}!`, "success");

      // Redirect back to ads page
      window.location.href = "ads.html";
    }
  }, 1000);
});