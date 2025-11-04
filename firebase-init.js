import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, set, onValue, update, query, limitToLast } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyDYQQu4yqhv6SbKWJMYWQlikxxV7OEkoFo",
    authDomain: "jules-invaders.firebaseapp.com",
    projectId: "jules-invaders",
    storageBucket: "jules-invaders.firebasestorage.app",
    messagingSenderId: "430967323203",
    appId: "1:430967323203:web:e9959c5c67cce237a2f2f6"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

export {
    db,
    auth,
    ref,
    set,
    onValue,
    update,
    query,
    limitToLast,
    signInAnonymously,
    onAuthStateChanged
};
