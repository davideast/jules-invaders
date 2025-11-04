// --- Firebase and Leaderboard Logic ---
let lastScoreUpdateTime = 0;
const scoreUpdateThrottle = 500; // ms

import { db, auth, ref, set, onValue, update, query, limitToLast, signInAnonymously, onAuthStateChanged } from './firebase-init.js';
import { score, gameOver, updateScore } from './script.js';

export function setupRealtimeLeaderboard() {

    let sessionId = new URLSearchParams(window.location.search).get('session_id');
    if (!sessionId) {
        sessionId = Math.random().toString(36).substring(2, 9);
        window.history.replaceState({}, document.title, "?session_id=" + sessionId);
    }

    onAuthStateChanged(auth, (user) => {
        if (user) {
            const uid = user.uid;
            const playerRef = ref(db, `sessions/${sessionId}/${uid}`);
            const playerName = `Pilot ${uid.substring(0, 4).toUpperCase()}`;
            set(playerRef, { name: playerName, score: 0 });

            window.addEventListener('beforeunload', () => {
                set(playerRef, null);
            });

            const sessionsRef = query(ref(db, 'sessions'), limitToLast(1000));
            onValue(sessionsRef, (snapshot) => {
                const sessionsData = snapshot.val();
                if (sessionsData) {
                    const playerList = document.getElementById('playerList');
                    playerList.innerHTML = '';
                    const allPlayers = [];

                    Object.entries(sessionsData).forEach(([sessionId, sessionPlayers]) => {
                        Object.entries(sessionPlayers).forEach(([id, data]) => {
                            allPlayers.push({ id, ...data, sessionId });
                        });
                    });

                    allPlayers.sort((a, b) => b.score - a.score);

                    allPlayers.forEach(player => {
                        const li = document.createElement('li');
                        li.textContent = `${player.name}: ${player.score}`;
                        if (player.id === uid) {
                            li.classList.add('current-player-score');
                        } else if (player.sessionId === sessionId) {
                            li.classList.add('active-session-score');
                        }
                        playerList.appendChild(li);
                    });
                }
            });

            // This is the hook for score updates
            setInterval(() => {
                const now = Date.now();
                if (!gameOver && now - lastScoreUpdateTime > scoreUpdateThrottle) {
                    update(playerRef, { score: score });
                    lastScoreUpdateTime = now;
                }
            }, scoreUpdateThrottle);
        } else {
            signInAnonymously(auth);
        }
    });
}
