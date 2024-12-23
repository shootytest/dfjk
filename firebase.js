import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getDatabase, ref, set, onValue, get, child, query, increment, update, runTransaction } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";
import { getAuth, onAuthStateChanged, updateProfile, GoogleAuthProvider, EmailAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup, updateEmail } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";

/*
window.fire = {
  
  initializeApp: initializeApp,

  getDatabase: getDatabase,
  ref: ref,
  set: set,
  get: get,
  child: child,
  query: query,
  increment: increment,
  update: update,
  runTransaction: runTransaction,
  onValue: onValue,

  getAuth: getAuth,
  onAuthStateChanged: onAuthStateChanged,
  updateEmail: updateEmail,
  updateProfile: updateProfile,
  GoogleAuthProvider: GoogleAuthProvider,
  EmailAuthProvider: EmailAuthProvider,
  reauthenticateWithCredential: reauthenticateWithCredential,
  reauthenticateWithPopup: reauthenticateWithPopup,

};
*/

const firebaseConfig = {
  apiKey: "AIzaSyB8fdyD-iz2Wk2lQUC7fTR10NiZDpL5Jp0",
  authDomain: "examp13.firebaseapp.com",
  projectId: "examp13",
  storageBucket: "examp13.firebasestorage.app",
  messagingSenderId: "492299880282",
  appId: "1:492299880282:web:04384022e86b98517bd563"
};

const app = initializeApp(firebaseConfig);

function display_result(text, color) {
  const p = document.getElementById("result");
  if (p != null) {
    p.innerHTML = text;
    p.style.color = color;
  }
};

export const firebase = {

  register_user: (username, password) => {
    const email = username + "@example.com";
    stored_username = username;
    createUserWithEmailAndPassword(auth, email, password).then(then_function).catch(catch_function);
  },
  login_user: (username, password) => {
    stored_username = username;
    const email = (users[username].alt ? users[username].email : username) + "@example.com";
    signInWithEmailAndPassword(auth, email, password).then(then_function).catch(catch_function);
  },

  register_goggle_user: (username) => {
    stored_username = username;
    signInWithPopup(auth, provider).then(then_function).catch(catch_function);
  },
  login_goggle_user: (username = null) => {
    stored_username = username;
    signInWithPopup(auth, provider).then(then_function).catch(catch_function);
  },

  logout_user: (resolve_fn) => {
    signOut(auth)
      .then(() => {
        resolve_fn();
      }).catch((error) => {
        display_result(`Failed to log out for some reason! (check console)`, "red");
        console.error(error);
      });
  },

};