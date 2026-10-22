// Inside Chat — Configuración central de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAEE5fVYD8uAPV_r8uK4bEGBZDlQlBnKsY",
  authDomain: "inside-30b7d.firebaseapp.com",
  databaseURL: "https://inside-30b7d-default-rtdb.firebaseio.com",
  projectId: "inside-30b7d",
  storageBucket: "inside-30b7d.firebasestorage.app",
  messagingSenderId: "322776562224",
  appId: "1:322776562224:web:77ddfbd269c705d49e8bf5",
  measurementId: "G-SF29F8WMR5"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

// Utilidades compartidas
export function avatarInitial(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0][0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function showAlert(el, type, text) {
  el.textContent = text;
  el.className = "alert " + type;
}
