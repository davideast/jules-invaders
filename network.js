
import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import {
  getDatabase,
  ref,
  query,
  orderByChild,
  limitToLast,
  onValue,
  runTransaction,
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDYQQu4yqhv6SbKWJMYWQlikxxV7OEkoFo",
  authDomain: "jules-invaders.firebaseapp.com",
  projectId: "jules-invaders",
  storageBucket: "jules-invaders.firebasestorage.app",
  messagingSenderId: "430967323203",
  appId: "1:430967323203:web:e9959c5c67cce237a2f2f6",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

let sessionId = new URLSearchParams(window.location.search).get("session_id");
if (!sessionId) {
  sessionId = Math.random().toString(36).substring(2, 9);
  window.history.replaceState({}, document.title, "?session_id=" + sessionId);
}

function updatePlayerScore(uid, score) {
  const playerRef = ref(db, `sessions/${sessionId}/${uid}`);
  runTransaction(playerRef, (playerData) => {
    if (playerData) {
      playerData.score = Math.max(playerData.score || 0, score);
      playerData.lastUpdate = Date.now();
    }
    return playerData;
  });
}

function setupSessionListener(uid) {
  const sessionsRef = ref(db, "sessions");
  const recentSessionsQuery = query(
    sessionsRef,
    orderByChild("lastUpdate"),
    limitToLast(1000)
  );

  const playerList = document.getElementById("playerList");
  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === "characterData") {
        const target = mutation.target.parentElement;
        if (target && target.tagName === "LI") {
          target.classList.add("score-updated");
          target.addEventListener(
            "animationend",
            () => {
              target.classList.remove("score-updated");
            },
            { once: true }
          );
        }
      }
    }
  });

  observer.observe(playerList, {
    subtree: true,
    characterData: true,
  });

  onValue(recentSessionsQuery, (snapshot) => {
    const sessions = snapshot.val() || {};
    const allPlayers = [];

    for (const sId in sessions) {
      const players = sessions[sId];
      for (const pId in players) {
        if (typeof players[pId] === "object" && players[pId] !== null) {
          allPlayers.push({
            id: pId,
            sessionId: sId,
            ...players[pId],
          });
        }
      }
    }

    allPlayers.sort((a, b) => b.score - a.score);

    // Efficiently update the list without clearing it completely
    allPlayers.forEach((player) => {
      let li = playerList.querySelector(
        `[data-player-id="${player.id}"][data-session-id="${player.sessionId}"]`
      );
      if (!li) {
        li = document.createElement("li");
        li.dataset.playerId = player.id;
        li.dataset.sessionId = player.sessionId;
        playerList.appendChild(li);
      }
      li.textContent = `${player.name}: ${player.score}`;
      if (player.id === uid) {
        li.classList.add("current-player-score");
      }
    });
  });
}

function init() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      const uid = user.uid;
      const playerRef = ref(db, `sessions/${sessionId}/${uid}`);
      const playerName = `Pilot ${uid.substring(0, 4).toUpperCase()}`;

      const playerData = {
        name: playerName,
        score: 0,
        lastUpdate: Date.now(),
      };

      runTransaction(playerRef, (currentData) => {
        if (currentData === null) {
          return playerData;
        }
      });

      window.addEventListener("GE_SCORE_UPDATED", (event) => {
        const {
          score
        } = event.detail;
        updatePlayerScore(uid, score);
      });

      setupSessionListener(uid);
    } else {
      signInAnonymously(auth);
    }
  });
}

export {
  init
};
