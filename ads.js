import { auth, db } from "./firebase.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    collection,
    getDocs,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ==============================
// Elements
// ==============================

const adsList = document.getElementById("adsList");
const balanceEl = document.getElementById("balance");

// ==============================
// Back Button
// ==============================

window.goBack = function () {

    window.location.href = "index.html";

};

// ==============================
// Load User & Ads
// ==============================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "index.html";
        return;

    }

    try {

        // -------------------------
        // Load User Data
        // -------------------------

        const userRef = doc(db, "users", user.uid);

        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {

            alert("User data not found.");

            return;

        }

        const userData = userSnap.data();

        balanceEl.textContent = Number(userData.balance ?? 0).toFixed(2);

        // -------------------------
        // Load Ads
        // -------------------------

        adsList.innerHTML = "";

        const adsSnapshot = await getDocs(collection(db, "ads"));

        if (adsSnapshot.empty) {

            adsList.innerHTML = `
                <div class="ad-card">
                    <h3>No Ads Available</h3>
                    <p>Please check back later.</p>
                </div>
            `;

            return;

        }

        adsSnapshot.forEach((adDoc) => {

            const adData = adDoc.data();

            const claimed =
                userData.adsClaimed?.[adDoc.id] || false;

            const adCard = document.createElement("div");

            adCard.className = "ad-card";

            adCard.innerHTML = `

                <h3>${adData.title}</h3>

                <div class="reward">

                    💰 Reward: $${adData.reward}

                </div>

                ${
                    claimed
                    ?

                    `<div class="claimed">

                        ✅ Already Claimed

                    </div>`

                    :

                    `<button
                        class="watch-btn"
                        onclick="watchAd('${adDoc.id}')">

                        <i class="fa-solid fa-play"></i>

                        Watch & Earn

                    </button>`

                }

            `;

            adsList.appendChild(adCard);

        });

    }

    catch (error) {

        console.error(error);

        adsList.innerHTML = `

            <div class="ad-card">

                <h3>Error</h3>

                <p>${error.message}</p>

            </div>

        `;

    }

});

// ==============================
// Watch Ad
// ==============================

window.watchAd = function (adId) {

    window.location.href = `watch.html?ad=${adId}`;

};