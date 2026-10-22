// Inside Chat — Sala de chat en tiempo real
import { auth, db, avatarInitial, formatTime } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import {
  ref, push, set, onValue, onChildAdded, serverTimestamp,
  query, orderByChild, limitToLast, update, remove, onDisconnect
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-database.js";

let currentUser = null;
let currentChannel = "general";
let loadedIds = new Set();
let typingTimer = null;
let typingRef = null;
let unsubMessages = null;

const messagesEl = document.getElementById("messages");
const inputEl = document.getElementById("messageInput");
const composer = document.getElementById("composer");
const channelTitle = document.getElementById("channelTitle");
const channelSub = document.getElementById("channelSub");
const onlineList = document.getElementById("onlineList");
const onlineCount = document.getElementById("onlineCount");
const typingIndicator = document.getElementById("typingIndicator");
const typingName = document.getElementById("typingName");

// ---------- Protección de sesión ----------
onAuthStateChanged(auth, (user) => {
  if (!user) { location.replace("index.html"); return; }
  currentUser = user;
  initChat();
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  if (typingRef) await remove(typingRef).catch(() => {});
  await signOut(auth);
});

// ---------- Inicialización ----------
function initChat() {
  const name = currentUser.displayName || currentUser.email.split("@")[0];
  document.getElementById("myName").textContent = name;
  document.getElementById("myEmail").textContent = currentUser.email;
  document.getElementById("myAvatar").textContent = avatarInitial(name);

  setupPresence();
  setupOnlineList();
  loadChannel(currentChannel);
  setupTyping();
  setupChannels();
  setupMobileMenu();
}

// ---------- Presencia (usuarios en línea) ----------
function setupPresence() {
  const myRef = ref(db, "presence/" + currentUser.uid);
  const name = currentUser.displayName || currentUser.email.split("@")[0];
  set(myRef, { name, online: true, lastSeen: serverTimestamp() });
  onDisconnect(myRef).remove();
}

function setupOnlineList() {
  onValue(ref(db, "presence"), (snap) => {
    const data = snap.val() || {};
    const users = Object.entries(data)
      .filter(([uid]) => uid !== currentUser.uid)
      .map(([uid, u]) => ({ uid, ...u }));

    onlineCount.textContent = users.length + 1;
    if (users.length === 0) {
      onlineList.innerHTML = '<p class="empty-note">Eres el único conectado</p>';
      return;
    }
    onlineList.innerHTML = users.map(u => `
      <div class="online-user">
        <div class="avatar">${avatarInitial(u.name)}</div>
        <span>${escapeHtml(u.name)}</span>
        <span class="status"></span>
      </div>
    `).join("");
  });
}

// ---------- Canales ----------
function setupChannels() {
  document.querySelectorAll(".channel").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".channel").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentChannel = btn.dataset.channel;
      channelTitle.textContent = "# " + currentChannel;
      channelSub.textContent = "Sala " + currentChannel + " — conversación en tiempo real";
      loadChannel(currentChannel);
    });
  });
}

function setupMobileMenu() {
  const sidebar = document.getElementById("sidebar");
  document.getElementById("menuToggle").addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });
  document.querySelectorAll(".channel").forEach(b =>
    b.addEventListener("click", () => sidebar.classList.remove("open"))
  );
}

// ---------- Cargar mensajes de un canal ----------
function loadChannel(channel) {
  if (unsubMessages) unsubMessages();
  loadedIds.clear();
  messagesEl.innerHTML = '<div class="day-divider"><span>Hoy</span></div>';

  const q = query(ref(db, "messages/" + channel), orderByChild("timestamp"), limitToLast(100));

  unsubMessages = onChildAdded(q, (snap) => {
    const msg = snap.val();
    if (!msg || loadedIds.has(snap.key)) return;
    loadedIds.add(snap.key);
    renderMessage(snap.key, msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  });
}

function renderMessage(id, msg) {
  const isMe = msg.uid === currentUser.uid;
  const row = document.createElement("div");
  row.className = "msg-row" + (isMe ? " me" : "");
  row.innerHTML = `
    <div class="avatar msg-avatar">${avatarInitial(msg.name)}</div>
    <div class="bubble">
      <div class="msg-meta">
        <span class="msg-author">${escapeHtml(msg.name)}</span>
        <span class="msg-time">${msg.timestamp ? formatTime(msg.timestamp) : ""}</span>
      </div>
      <div class="msg-text">${escapeHtml(msg.text)}</div>
    </div>
  `;
  messagesEl.appendChild(row);
}

// ---------- Enviar mensaje ----------
composer.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = inputEl.value.trim();
  if (!text || !currentUser) return;

  const name = currentUser.displayName || currentUser.email.split("@")[0];
  const msgRef = push(ref(db, "messages/" + currentChannel));
  await set(msgRef, {
    uid: currentUser.uid,
    name: name,
    text: text,
    timestamp: serverTimestamp()
  });

  inputEl.value = "";
  inputEl.focus();
  if (typingRef) remove(typingRef).catch(() => {});
});

// ---------- Indicador de "escribiendo…" ----------
function setupTyping() {
  const typingPath = () => `typing/${currentChannel}/${currentUser.uid}`;

  inputEl.addEventListener("input", () => {
    if (!inputEl.value.trim()) {
      if (typingRef) { remove(typingRef).catch(() => {}); typingRef = null; }
      return;
    }
    if (!typingRef) {
      typingRef = ref(db, typingPath());
      set(typingRef, { name: currentUser.displayName || currentUser.email.split("@")[0] });
    }
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      if (typingRef) { remove(typingRef).catch(() => {}); typingRef = null; }
    }, 2000);
  });

  inputEl.addEventListener("blur", () => {
    if (typingRef) { remove(typingRef).catch(() => {}); typingRef = null; }
  });

  // Escuchar quién escribe
  onValue(ref(db, "typing/" + currentChannel), (snap) => {
    const data = snap.val() || {};
    const others = Object.entries(data)
      .filter(([uid]) => uid !== currentUser.uid)
      .map(([, v]) => v.name);
    if (others.length) {
      typingName.textContent = others.join(", ") + (others.length > 1 ? " están escribiendo" : " está escribiendo");
      typingIndicator.hidden = false;
    } else {
      typingIndicator.hidden = true;
    }
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
