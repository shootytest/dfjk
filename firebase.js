import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getDatabase, ref, set, onValue, get, child, query, increment, update, runTransaction } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";
import { getAuth, onAuthStateChanged, updateProfile, GoogleAuthProvider, EmailAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup, signInWithPopup, signInWithEmailAndPassword, signInWithCredential, updateEmail, getAdditionalUserInfo, signOut } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { scores } from "./settings.js";
import { ui } from "./ui.js";

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
  databaseURL: "https://examp13-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "examp13",
  storageBucket: "examp13.firebasestorage.app",
  messagingSenderId: "492299880282",
  appId: "1:492299880282:web:04384022e86b98517bd563"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
auth.useDeviceLanguage();
const provider = new GoogleAuthProvider();

onAuthStateChanged(auth, (u) => {
  firebase.user = u;
  firebase.signed_in = !!u;
  ui.make_account();
});

const color = {
  red: "#db6353",
  yellow: "#cfc04c",
  green: "#54f088",
  blue: "#7a8eff",
  purple: "#9c7aff",
};

const stored_result = {
  text: "",
  color: "",
};
function display_result(text, color) {
  stored_result.text = text;
  stored_result.color = color;
  const p = document.getElementById("result");
  if (p != null) {
    p.innerHTML = text;
    p.style.color = color;
  }
};

const then_function = async (result) => {
  console.log(result);
  // This gives you a Google Access Token. You can use it to access the Google API.
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const token = credential?.accessToken;
  // The signed-in user info.
  const user_ = result.user;
  // IdP data available using getAdditionalUserInfo(result)
  const additional = getAdditionalUserInfo(result);
  if (additional.isNewUser) {
    let email = user_.email;
    if (email.endsWith("@example.com")) {
      email = email.substring(0, email.length - 12);
    }
    const o = {
      username: user_.providerData[0]?.displayName ?? user_.displayName ?? "unknown",
      email: email,
    };
    firebase.set(`/users/${user_.uid}/`, o).then(() => {
      firebase.save_scores(user_.uid);
      display_result(`registered successfully with username "<b>${o.username}</b>"!`, color.green);
    }).catch((error) => {
      console.error(error);
      display_result(`failed to register for some reason...`, color.red);
      /*delete_user(() => {
        display_result(`failed to register fully: account created successfully but data is not stored! No account was created!`, color.red);
      });*/
    });
  }
  else {

    firebase.get(`/scores/${user_.uid}/`, (other_map) => {
      firebase.merge_scores(other_map);
      firebase.save_scores(user_.uid).then(() => {
        display_result(`signed in successfully!`, color.green);
      }).catch(console.error);
    });
    
    /*
    if (first_better) {
      const new_result = await read_levels();
      firebase.set(`/userinfo/${user_.uid}/progress`, new_result).then(() => {
        display_result(`signed in successfully!`, color.green);
      }).catch((error) => {
        console.error(error);
        display_result(`failed to sign in fully: local progress is better than saved progress but syncing didn't work!`, color.red);
      });
    } else {
      display_result(`signed in successfully!`, color.green);
    }
    */

  }
};

const catch_function = (error) => {
  console.error(error);
  const error_code = error?.code;
  if (error_code === "auth/wrong-password" || error_code === "auth/invalid-login-credentials") {
    display_result("Invalid password!", color.red);
  } else if (error_code === "auth/invalid-email") {
    display_result("Invalid username?!", color.red);
  } else if (error_code === "auth/credential-already-in-use") {
    display_result("Did you mean to sign in?", color.yellow);
    const credential = GoogleAuthProvider.credentialFromError(error);
    // linking = false;
    signInWithCredential(auth, credential).then(then_function).catch(catch_function);
  } else {
    display_result("Did you close the popup?", color.yellow);
  }
};

export const firebase = {

  user: auth.currentUser,
  signed_in: false,
  stored_username: "",

  listen: (path, listener, error_function) => {
    return onValue(ref(db, path), (snapshot) => {
      listener(snapshot.val());
    }, error_function);
  },
  get: (path, getter_function, error_function) => {
    return onValue(ref(db, path), (snapshot) => {
      getter_function(snapshot.val());
    }, error_function, {
      onlyOnce: true,
    });
  },
  promise_get: async (path, getter_function, error_function) => {
    return new Promise((resolve, reject) => {
      firebase.get(path, function(data) {
        if (getter_function != null) {
          getter_function(data);
        }
        resolve(data);
      }, function(error) {
        if (error_function != null) {
          error_function(error);
        }
        reject(error);
      });
    });
  },
  set: (path, value) => {
    return set(ref(db, path), value);
  },
  update: (updates) => {
    return update(ref(db), updates);
  },
  bare_transaction: (path, setter_function) => {
    runTransaction(ref(db, path), (old_data) => {
      if (old_data == null) {
        return null;
      }
      return setter_function(old_data);
    });
  },
  transaction: (path, setter_function) => {
    firebase.get(path, (_) => { // _ = unused locally cached data
      runTransaction(ref(db, path), (old_data) => {
        if (old_data == null) {
          return null;
        }
        return setter_function(old_data);
      });
    });
  },
  increment: (path, number = 1) => {
    return set(ref(db, path), increment(number));
  },
  remove: (path) => {
    return ref(db, path)?.remove();
  },
  
  register_user: function (username, password) {
    const email = username + "@example.com";
    firebase.stored_username = username;
    createUserWithEmailAndPassword(auth, email, password).then(then_function).catch(catch_function);
  },
  login_user: function(username, password) {
    firebase.stored_username = username;
    const email = (users[username].alt ? users[username].email : username) + "@example.com";
    signInWithEmailAndPassword(auth, email, password).then(then_function).catch(catch_function);
  },

  register_goggle_user: function(username) {
    firebase.stored_username = username;
    signInWithPopup(auth, provider).then(then_function).catch(catch_function);
  },
  login_goggle_user: function(username) {
    firebase.stored_username = username;
    signInWithPopup(auth, provider).then(then_function).catch(catch_function);
  },

  logout_user: function(clear_scores, resolve_fn = () => {}) {
    signOut(auth)
      .then(() => {
        display_result(`signed out successfully!`, color.green);
        if (clear_scores) scores.clear();
        resolve_fn();
      }).catch((error) => {
        display_result(`failed to log out for some reason! (check console)`, color.red);
        console.error(error);
      });
  },

  save_scores: function(uid) {
    scores.recalculate_skills();
    firebase.set(`/users/${uid}/peak`, scores.peak_skill);
    firebase.set(`/users/${uid}/skill`, scores.total_skill);
    return firebase.set(`/scores/${uid}/`, scores.map);
  },

  merge_scores: function(other_map) {
    for (const k in other_map) {
      const otherlist = other_map[k];
      if (scores.map[k] == undefined) scores.map[k] = otherlist;
      else {
        const scorelist = scores.map[k];
        for (const o of otherlist) {
          if (scores.check_contains(scorelist, o)) {

          } else {
            scorelist.push(otherlist);
          }
        }
        scorelist.sort(scores.compare_fn);
        if (scorelist.length > 10) scorelist.length = 10;
      }
    }
    return scores.map;
  },

  get_scores: function(chart_name, fn) {
    firebase.get("/scores/", (all_scores) => {
      firebase.get("/users/", (all_users) => {
        const result = [];
        for (const uid in all_scores) {
          const s = all_scores[uid][chart_name]?.[0];
          if (s) result.push({
            uid: uid,
            username: all_users[uid].username,
            userskill: all_users[uid].skill,
            score: s,
          });
        }
        result.sort(scores.compare_fn);
        fn(result);
      });
    });
  },

  get_leaderboard: function(fn) {
    firebase.get(`/users/`, (all_users) => {
      const result = [];
      for (const uid in all_users) {
        const o = all_users[uid];
        result.push({
          uid: uid,
          username: o.username,
          peak: o.peak,
          skill: o.skill,
        });
      }
      result.sort(scores.compare_fn);
      fn(result);
    });
  },

  get username() {
    return firebase.user?.displayName ?? firebase.user?.providerData[0].displayName;
  },

  change_username(new_username) {
    if (!firebase.user) return;
    if (firebase.username === new_username) {
      display_result("username is the same!", color.yellow);
      return;
    }
    updateProfile(firebase.user, {
      displayName: new_username,
    }).then(() => {
      firebase.set(`/users/${firebase.user.uid}/username/`, new_username).then(() => {
        display_result(`updated to <b>${firebase.username}</b>!`, color.green);
        document.getElementById("change_input").value = firebase.username;
      }).catch((e) => {
        display_result("failed to update?!?!", color.red);
        console.error(e);
      });
    }).catch((e) => {
      display_result("failed to update...", color.red);
      console.error(e);
    });
  },

  redisplay_result() {
    display_result(stored_result.text, stored_result.color);
  },

};