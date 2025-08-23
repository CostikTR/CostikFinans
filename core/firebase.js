import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// ÖNEMLİ: Canlıda bu anahtarları environment'a taşıyın.
const firebaseConfig = {
  apiKey: "AIzaSyDx17NJkAZknMvRyDlNuFYaMdlMGFa-QmQ",
  authDomain: "finans-sitem.firebaseapp.com",
  databaseURL: "https://finans-sitem-default-rtdb.firebaseio.com",
  projectId: "finans-sitem",
  storageBucket: "finans-sitem.appspot.com",
  messagingSenderId: "117402758273",
  appId: "1:117402758273:web:93a296f43e393352057180",
  measurementId: "G-WLLK7B3WB5"
};

export const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
