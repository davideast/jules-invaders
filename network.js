const {
    db,
    auth,
    ref,
    set,
    onValue,
    update,
    push,
    onDisconnect,
    serverTimestamp,
    signInAnonymously,
    onAuthStateChanged
} = window.firebase;

const scoreboardUl = document.querySelector('#scoreboard ul');

let sessionId;
let myUid;

function getSessionId() {
    const urlParams = new URLSearchParams(window.location.search);
    let sid = urlParams.get('session_id');
    if (!sid) {
        const sessionRef = push(ref(db, 'sessions'));
        sid = sessionRef.key;
        window.history.replaceState({}, document.title, "?session_id=" + sid);
    }
    return sid;
}

function renderScoreboard(players, myUid) {
    scoreboardUl.innerHTML = '';
    const sortedPlayers = Object.entries(players).sort(([, a], [, b]) => b.score - a.score);
    for (const [uid, player] of sortedPlayers) {
        const li = document.createElement('li');
        li.textContent = `Pilot ${uid.substring(0, 4)}: ${player.score}`;
        if (uid === myUid) {
            li.style.color = 'gold';
        }
        scoreboardUl.appendChild(li);
    }
}

function init() {
    sessionId = getSessionId();
    const sessionRef = ref(db, `sessions/${sessionId}`);

    onAuthStateChanged(auth, (user) => {
        if (user) {
            myUid = user.uid;
            const myPlayerRef = ref(db, `sessions/${sessionId}/players/${myUid}`);
            set(myPlayerRef, { score: 0 });
            onDisconnect(myPlayerRef).remove();

            onValue(ref(db, `sessions/${sessionId}/players`), (snapshot) => {
                const players = snapshot.val();
                if (players) {
                    renderScoreboard(players, myUid);
                }
            });
        }
    });

    signInAnonymously(auth).catch((error) => {
        console.error("Anonymous sign-in failed:", error);
    });

    window.addEventListener('GE_SCORE_UPDATED', (event) => {
        const { score: localScore } = event.detail;
        const scoreRef = ref(db, `sessions/${sessionId}/players/${myUid}/score`);

        runTransaction(scoreRef, (currentRemoteScore) => {
            if (currentRemoteScore === null || localScore > currentRemoteScore) {
                return localScore;
            }
            return; // Abort the transaction
        });
    });
}

init();