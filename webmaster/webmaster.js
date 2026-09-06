

/* ═══════════════════════════════════════════════════
   WEBMASTER PAGE — standalone script
   Shares localStorage keys with the main site so
   dark mode + petal prefs carry across pages.
═══════════════════════════════════════════════════ */

function escHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}

/* DARK MODE */
function toggleDark() {
  const dark = document.body.classList.toggle("dark");
  syncDarkButton(dark);
  try {
    localStorage.setItem("darkMode", dark ? "1" : "0");
  } catch (_) {}
}
function syncDarkButton(dark) {
  const btn = document.getElementById("darkToggle");
  if (!btn) return;
  btn.textContent = dark ? "◑ MODE" : "◐ MODE";
  btn.classList.toggle("is-active", dark);
}

/* PETALS */
(function () {
  let petalInterval = null;
  const field = document.createElement("div");
  field.id = "petal-field";
  document.documentElement.appendChild(field);

  const LIGHT_COLORS = ["#D0DEA9", "#E8B0B8", "#BE1A32", "#BFCA96"];
  const DARK_COLORS = ["#FA4055", "#FF8293", "#405FFA", "#8A9DF8"];
  const MAX_PETALS = 45;
  const SPAWN_INTERVAL = 350;
  let activeCount = 0;

  function spawnPetal() {
    if (activeCount >= MAX_PETALS) return;
    const isDark = document.body.classList.contains("dark");
    const palette = isDark ? DARK_COLORS : LIGHT_COLORS;
    const outer = document.createElement("span");
    const inner = document.createElement("span");
    outer.className = "petal-fall";
    inner.textContent = "✿";
    outer.style.left = Math.random() * 100 + "vw";
    outer.style.fontSize = Math.random() * 14 + 12 + "px";
    outer.style.color = palette[Math.floor(Math.random() * palette.length)];
    outer.style.setProperty("--petal-opacity", (Math.random() * 0.4 + 0.5).toFixed(2));
    outer.style.animationDuration = Math.random() * 6 + 7 + "s";
    inner.style.animationDuration = Math.random() * 3 + 2 + "s";
    outer.appendChild(inner);
    field.appendChild(outer);
    activeCount++;
    outer.addEventListener("animationend", (e) => {
      if (e.target === outer) {
        outer.remove();
        activeCount--;
      }
    });
  }

  function startPetals() {
    if (petalInterval) return;
    field.style.display = "";
    petalInterval = setInterval(spawnPetal, SPAWN_INTERVAL);
  }
  function stopPetals() {
    if (petalInterval) {
      clearInterval(petalInterval);
      petalInterval = null;
    }
    field.style.display = "none";
    field.innerHTML = "";
    activeCount = 0;
  }

  window.togglePetals = function () {
    if (petalInterval) {
      stopPetals();
      try {
        localStorage.setItem("sei_petals_off", "1");
      } catch (_) {}
      setButtonState(false);
    } else {
      startPetals();
      try {
        localStorage.removeItem("sei_petals_off");
      } catch (_) {}
      setButtonState(true);
    }
  };

  function setButtonState(on) {
    const btn = document.getElementById("petalToggleBtn");
    if (!btn) return;
    btn.textContent = on ? "✿ PETALS: ON" : "✿ PETALS: OFF";
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.classList.toggle("is-active", on);
  }

  function initPetals() {
    let off = false;
    try {
      off = !!localStorage.getItem("sei_petals_off");
    } catch (_) {}
    if (off || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      stopPetals();
      setButtonState(false);
    } else {
      startPetals();
      setButtonState(true);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPetals);
  } else {
    initPetals();
  }
})();


/* FAVE CAROUSELS */
const FAVE_DATA = {
  monster: [
    { img: "https://res.cloudinary.com/seioutloud/image/upload/v1784842594/MH4U-Stygian_Zinogre_Icon_vjtxsw.webp", label: "Stygian Zinogre" },
    { img: "https://res.cloudinary.com/seioutloud/image/upload/v1784842588/MH4U-Zinogre_Icon_avs8bt.webp", label: "Zinogre" },
    { img: "https://res.cloudinary.com/seioutloud/image/upload/v1784842588/Frostfang_Barioth_by_Zinotsune_ibom2i.webp", label: "Frost Fang Barioth" },
    { img: "https://res.cloudinary.com/seioutloud/image/upload/v1784842588/MH4U-Najarala_Icon_pjxuca.webp", label: "Najarala" },
    { img: "https://res.cloudinary.com/seioutloud/image/upload/v1784842588/Brachydios_Icon_by_Zinotsune_vebgcw.webp", label: "Brachydios" },
    { img: "https://res.cloudinary.com/seioutloud/image/upload/v1784842588/MHGen-Malfestio_Icon_uphm7n.webp", label: "Malfestio" },
    { img: "https://res.cloudinary.com/seioutloud/image/upload/v1784842594/MH4U-Gore_Magala_Icon_qd7agm.webp", label: "Gore Magala" },
    { img: "https://res.cloudinary.com/seioutloud/image/upload/v1784842594/Akantor_Icon_by_Zinotsune_veykkg.webp", label: "Akantor" },
  ],
  pokemon: [
    { img: "https://res.cloudinary.com/seioutloud/image/upload/v1784843427/lucario_aigh6s.png", label: "Lucario" },
    { img: "https://res.cloudinary.com/seioutloud/image/upload/v1784843427/absol_g16nvz.png", label: "Absol" },
    { img: "https://res.cloudinary.com/seioutloud/image/upload/v1784843426/steelix_lxhpmn.png", label: "Steelix" },
    { img: "https://res.cloudinary.com/seioutloud/image/upload/v1784843425/scolipede_zvis1s.png", label: "Scolipede" },
    { img: "https://res.cloudinary.com/seioutloud/image/upload/v1784843424/rayquaza_gqrkov.png", label: "Rayquaza" },
    { img: "https://res.cloudinary.com/seioutloud/image/upload/v1784843424/zygarde_vth6tt.png", label: "Zygarde" },
    { img: "https://res.cloudinary.com/seioutloud/image/upload/v1784843422/masquerain_ixfdvj.png", label: "Masquerain" },
    { img: "https://res.cloudinary.com/seioutloud/image/upload/v1784843422/arcanine_fjabsv.png", label: "Arcanine" },
    { img: "https://res.cloudinary.com/seioutloud/image/upload/v1784843421/marowak_i6v5da.png", label: "Marowak" },
    { img: "https://res.cloudinary.com/seioutloud/image/upload/v1784843420/haxorus_emklz3.png", label: "Haxorus" },
    { img: "https://res.cloudinary.com/seioutloud/image/upload/v1784843419/heracross_wbmt41.png", label: "Heracross" },
    { img: "https://res.cloudinary.com/seioutloud/image/upload/v1784843419/espurr_d9ujey.png", label: "Espurr" },
    { img: "https://res.cloudinary.com/seioutloud/image/upload/v1784843414/meowstic_hklhpe.png", label: "Meowstic" },
    { img: "https://res.cloudinary.com/seioutloud/image/upload/v1784843418/quagsire_v20zt2.png", label: "Quagsire" },
    { img: "https://res.cloudinary.com/seioutloud/image/upload/v1784843415/mewtwo_zcuukm.png", label: "Mewtwo" },
    { img: "https://res.cloudinary.com/seioutloud/image/upload/v1784843415/yveltal_lubwor.png", label: "Yveltal" },
    { img: "https://res.cloudinary.com/seioutloud/image/upload/v1784843423/silvally_do3it3.png", label: "Silvally" },
    { img: "https://res.cloudinary.com/seioutloud/image/upload/v1784843415/gengar_xezeqi.png", label: "Gengar" },
  ],
};
const faveIndex = { monster: 0, pokemon: 0 };

function renderFaveCarousel(type) {
  const data = FAVE_DATA[type];
  const img = document.getElementById(type + "CarouselImg");
  if (!img || !data.length) return;
  const idx = faveIndex[type];
  img.src = data[idx].img;
  img.alt = data[idx].label;
  const cap = document.getElementById(type + "CarouselCaption");
  if (cap) cap.textContent = data[idx].label;
  const dots = document.getElementById(type + "CarouselDots");
  if (dots) dots.textContent = `${idx + 1} / ${data.length}`;
}
function faveCarouselNav(type, dir) {
  const data = FAVE_DATA[type];
  if (!data.length) return;
  faveIndex[type] = (faveIndex[type] + dir + data.length) % data.length;
  renderFaveCarousel(type);
}

/* PLAYLIST PLAYER */
const TRACKS = [
  { artist: "artist", title: "song one", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { artist: "artist", title: "song two", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { artist: "artist", title: "song three", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  { artist: "artist", title: "song four", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
  { artist: "artist", title: "song five", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
];

const player = {
  audio: new Audio(),
  index: 0,
  playing: false,
  shuffle: false,
};
player.audio.preload = "none";
player.audio.volume = 0.7;

function renderPlaylist() {
  const el = document.getElementById("playlistTracks");
  if (!el) return;
  el.innerHTML = TRACKS.map(
    (t, i) =>
      `<button class="wm-track${i === player.index && player.playing ? " is-playing" : ""}" onclick="playerPlayTrack(${i})">
        <span class="wm-track-artist">${escHtml(t.artist)}</span>
        <span class="wm-track-title">${escHtml(t.title)}</span>
      </button>`,
  ).join("");
}

function playerLoad(i) {
  player.index = (i + TRACKS.length) % TRACKS.length;
  player.audio.src = TRACKS[player.index].src;
}

function playerPlayTrack(i) {
  playerLoad(i);
  playerPlay();
}

function playerPlay() {
  player.audio
    .play()
    .then(() => {
      player.playing = true;
      syncPlayerUI();
    })
    .catch(() => {
      player.playing = false;
      syncPlayerUI();
    });
}

function playerPause() {
  player.audio.pause();
  player.playing = false;
  syncPlayerUI();
}

function playerTogglePlay() {
  if (player.playing) {
    playerPause();
    return;
  }
  if (!player.audio.src) playerLoad(player.index);
  playerPlay();
}

function playerSkip(dir) {
  let next;
  if (player.shuffle && TRACKS.length > 1) {
    do {
      next = Math.floor(Math.random() * TRACKS.length);
    } while (next === player.index);
  } else {
    next = player.index + dir;
  }
  const wasPlaying = player.playing;
  playerLoad(next);
  if (wasPlaying) playerPlay();
  else syncPlayerUI();
}

function playerShuffle() {
  player.shuffle = !player.shuffle;
  const btn = document.getElementById("plShuffleBtn");
  if (btn) {
    btn.classList.toggle("is-active", player.shuffle);
    btn.setAttribute("aria-pressed", player.shuffle ? "true" : "false");
  }
}

function playerSetVolume(v) {
  player.audio.volume = Math.min(1, Math.max(0, v / 100));
}

function syncPlayerUI() {
  const btn = document.getElementById("plPlayBtn");
  if (btn) {
    btn.textContent = player.playing ? "⏸" : "▶";
    btn.setAttribute("aria-label", player.playing ? "Pause" : "Play");
  }
  renderPlaylist();
}

player.audio.addEventListener("ended", () => playerSkip(1));
player.audio.addEventListener("error", () => {
  player.playing = false;
  syncPlayerUI();
});

/* DRAGGABLE COLLAGE WIDGETS */
(function () {
  const DRAG_MIN_WIDTH = 1081; // only when the collage grid is active
  let active = null;
  let startX = 0;
  let startY = 0;
  let baseX = 0;
  let baseY = 0;
  const offsets = new WeakMap();

  function canDrag() {
    return window.innerWidth >= DRAG_MIN_WIDTH;
  }

  function getOffset(el) {
    return offsets.get(el) || { x: 0, y: 0 };
  }

  function onPointerDown(e) {
    if (!canDrag() || e.button !== 0) return;
    const header = e.target.closest(".wm-widget-header");
    if (!header) return;
    const widget = header.closest(".wm-widget");
    if (!widget) return;
    active = widget;
    const o = getOffset(widget);
    baseX = o.x;
    baseY = o.y;
    startX = e.clientX;
    startY = e.clientY;
    widget.classList.add("is-dragging");
    header.setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!active) return;
    const x = baseX + (e.clientX - startX);
    const y = baseY + (e.clientY - startY);
    offsets.set(active, { x, y });
    active.style.transform = `translate(${x}px, ${y}px)`;
  }

  function onPointerUp() {
    if (!active) return;
    active.classList.remove("is-dragging");
    active = null;
  }

  function init() {
    document.querySelectorAll(".wm-widget").forEach((w) => {
      w.addEventListener("pointerdown", onPointerDown);
    });
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointercancel", onPointerUp);
    // clear positions when leaving desktop collage layout
    window.addEventListener("resize", () => {
      if (!canDrag()) {
        document.querySelectorAll(".wm-widget").forEach((w) => {
          w.style.transform = "";
          offsets.delete(w);
        });
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

/* BAG MODAL + FIREBASE */
const firebaseConfig = {
  apiKey: "AIzaSyD0WwCtdV5JH5V2BSzlNr_ybTwCtCrgxV4",
  authDomain: "seistudiomessageboard.firebaseapp.com",
  databaseURL: "https://seistudiomessageboard-default-rtdb.firebaseio.com",
  projectId: "seistudiomessageboard",
  storageBucket: "seistudiomessageboard.firebasestorage.app",
  messagingSenderId: "683797738985",
  appId: "1:683797738985:web:3e79b66988d1498fddc778",
};

let bagData = [];
let bagLoaded = false;

function loadBag() {
  if (bagLoaded) return;
  bagLoaded = true;
  try {
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    firebase
      .database()
      .ref("content/bag")
      .orderByChild("timestamp")
      .once("value")
      .then((snap) => {
        bagData = [];
        snap.forEach((child) => {
          bagData.push({ id: child.key, ...child.val() });
        });
        renderBag();
      })
      .catch(() => {
        bagLoaded = false;
        renderBagError();
      });
  } catch (_) {
    bagLoaded = false;
    renderBagError();
  }
}

function renderBag() {
  const el = document.getElementById("bagGrid");
  if (!el) return;
  if (!bagData.length) {
    el.innerHTML = '<span class="wm-hint">// nothing in the bag yet.</span>';
    return;
  }
  el.innerHTML = bagData
    .map((item) => {
      const visual = item.image
        ? `<img src="${escHtml(item.image)}" alt="${escHtml(item.label || "")}" loading="lazy" onerror="this.style.display='none'" />`
        : `<div class="bag-item-emoji">${escHtml(item.emoji || "👜")}</div>`;
      const note = item.note
        ? `<div class="bag-item-note">${escHtml(item.note)}</div>`
        : "";
      return `<div class="bag-item">${visual}<div class="bag-item-label">${escHtml(item.label || "")}</div>${note}</div>`;
    })
    .join("");
}

function renderBagError() {
  const el = document.getElementById("bagGrid");
  if (el) el.innerHTML = '<span class="wm-hint">// could not load the bag, try again later.</span>';
}

function openBagModal() {
  document.getElementById("bagModal").style.display = "flex";
  loadBag();
}
function closeBagModal() {
  document.getElementById("bagModal").style.display = "none";
}

/* INIT */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeBagModal();
});

document.addEventListener("DOMContentLoaded", () => {
  syncDarkButton(document.body.classList.contains("dark"));
  renderSelfieCarousel();
  renderFaveCarousel("monster");
  renderFaveCarousel("pokemon");
  renderPlaylist();
  const vol = document.getElementById("plVolume");
  if (vol) playerSetVolume(vol.value);
});


/* ═══════════════════════════════════════════════════
   BOY WALL — standalone script
   Shares localStorage keys with the main site so
   dark mode + petal prefs carry across pages.
═══════════════════════════════════════════════════ */

function escHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}

/* DARK MODE */
function toggleDark() {
  const dark = document.body.classList.toggle("dark");
  syncDarkButton(dark);
  try {
    localStorage.setItem("darkMode", dark ? "1" : "0");
  } catch (_) {}
}
function syncDarkButton(dark) {
  const btn = document.getElementById("darkToggle");
  if (!btn) return;
  btn.textContent = dark ? "◑ MODE" : "◐ MODE";
  btn.classList.toggle("is-active", dark);
}

/* PETALS — same behaviour as webmaster.js */
(function () {
  let petalInterval = null;
  const field = document.createElement("div");
  field.id = "petal-field";
  document.documentElement.appendChild(field);

  const LIGHT_COLORS = ["#D0DEA9", "#E8B0B8", "#BE1A32", "#BFCA96"];
  const DARK_COLORS = ["#FA4055", "#FF8293", "#405FFA", "#8A9DF8"];
  const MAX_PETALS = 45;
  const SPAWN_INTERVAL = 350;
  let activeCount = 0;

  function spawnPetal() {
    if (activeCount >= MAX_PETALS) return;
    const isDark = document.body.classList.contains("dark");
    const palette = isDark ? DARK_COLORS : LIGHT_COLORS;
    const outer = document.createElement("span");
    const inner = document.createElement("span");
    outer.className = "petal-fall";
    inner.textContent = "✿";
    outer.style.left = Math.random() * 100 + "vw";
    outer.style.fontSize = Math.random() * 14 + 12 + "px";
    outer.style.color = palette[Math.floor(Math.random() * palette.length)];
    outer.style.setProperty("--petal-opacity", (Math.random() * 0.4 + 0.5).toFixed(2));
    outer.style.animationDuration = Math.random() * 6 + 7 + "s";
    inner.style.animationDuration = Math.random() * 3 + 2 + "s";
    outer.appendChild(inner);
    field.appendChild(outer);
    activeCount++;
    outer.addEventListener("animationend", (e) => {
      if (e.target === outer) {
        outer.remove();
        activeCount--;
      }
    });
  }

  function startPetals() {
    if (petalInterval) return;
    field.style.display = "";
    petalInterval = setInterval(spawnPetal, SPAWN_INTERVAL);
  }
  function stopPetals() {
    if (petalInterval) {
      clearInterval(petalInterval);
      petalInterval = null;
    }
    field.style.display = "none";
    field.innerHTML = "";
    activeCount = 0;
  }

  window.togglePetals = function () {
    if (petalInterval) {
      stopPetals();
      try {
        localStorage.setItem("sei_petals_off", "1");
      } catch (_) {}
      setButtonState(false);
    } else {
      startPetals();
      try {
        localStorage.removeItem("sei_petals_off");
      } catch (_) {}
      setButtonState(true);
    }
  };

  function setButtonState(on) {
    const btn = document.getElementById("petalToggleBtn");
    if (!btn) return;
    btn.textContent = on ? "✿ PETALS: ON" : "✿ PETALS: OFF";
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.classList.toggle("is-active", on);
  }

  function initPetals() {
    let off = false;
    try {
      off = !!localStorage.getItem("sei_petals_off");
    } catch (_) {}
    if (off || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      stopPetals();
      setButtonState(false);
    } else {
      startPetals();
      setButtonState(true);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPetals);
  } else {
    initPetals();
  }
})();

/* ═══════════════════════════════════════════════════
   THE WALL — swap these placeholders for your own
   Cloudinary URLs. Fields:
     name  → who it is (required)
     note  → the unhinged little caption (optional)
     cat   → "actors" | "idols" | "anime" | "music"
     img   → image URL
     tape  → 1..4, picks a washi-tape colour (optional)
═══════════════════════════════════════════════════ */
const BOYWALL = [
  { name: "oscar isaac", note: "THE BLUEPRINT. Do not leave me alone with this man. .", cat: "actors", tape: 1, img: "https://picsum.photos/seed/bw-oscar/420/560" },
  { name: "choso", note: "brother of the year, sorry to everyone else", cat: "anime", tape: 2, img: "https://picsum.photos/seed/bw-choso/420/620" },
  { name: "iwaizumi hajime", note: "would fix my posture and my life", cat: "anime", tape: 3, img: "https://picsum.photos/seed/bw-iwa/420/500" },
  { name: "alucard", note: "victorian sadboy supremacy", cat: "anime", tape: 4, img: "https://picsum.photos/seed/bw-alucard/420/600" },
  { name: "tamaki suoh", note: "he is doing his best!!", cat: "anime", tape: 1, img: "https://picsum.photos/seed/bw-tamaki/420/540" },
  { name: "The Miyans", note: "the twins count as one entry. it's the rules.", cat: "anime", tape: 2, img: "https://picsum.photos/seed/bw-atsumu/420/580" },
  { name: "miguel o'hara", note: "not exclusive to the Spiderverse version, Edge of Time was my introduction to him", cat: "anime", tape: 3, img: "https://picsum.photos/seed/bw-miguel/420/520" },
  { name: "hyunjin", note: "art boy", cat: "idols", tape: 1, img: "https://picsum.photos/seed/bw-hyunjin/420/580" },
  { name: "wonwoo", note: "glasses. that's it. that's the note.", cat: "idols", tape: 2, img: "https://picsum.photos/seed/bw-wonwoo/420/540" },
  { name: "san", note: "unhinged in a way i respect", cat: "idols", tape: 3, img: "https://picsum.photos/seed/bw-san/420/600" },
  { name: "kim taehyung", note: "the jawline is a public safety issue", cat: "idols", tape: 4, img: "https://picsum.photos/seed/bw-tae/420/520" },
  { name: "young k", note: "day6 bassist, ruiner of hearts", cat: "idols", tape: 1, img: "https://picsum.photos/seed/bw-youngk/420/560" },
  { name: "dean", note: "he could sing the phone book", cat: "idols", tape: 2, img: "https://picsum.photos/seed/bw-dean/420/620" },
  { name: "manny jacinto", note: "the acolyte did things to me", cat: "actors", tape: 1, img: "https://picsum.photos/seed/bw-manny/420/540" },
  { name: "gojo satoru", note: "annoying. still on the wall.", cat: "anime", tape: 3, img: "https://picsum.photos/seed/bw-gojo/420/580" },
  { name: "saiki k.", note: "he wants no part of this wall", cat: "anime", tape: 4, img: "https://picsum.photos/seed/bw-saiki/420/540" },
  { name: "roy mustang", note: "snap. that's all he does. it works.", cat: "anime", tape: 1, img: "https://picsum.photos/seed/bw-roy/420/600" },
  { name: "vash the stampede", note: "sixty billion double dollar sweetheart", cat: "anime", tape: 2, img: "https://picsum.photos/seed/bw-vash/420/520" },
  { name: "spike spiegel", note: "whatever happens, happens.", cat: "anime", tape: 3, img: "https://picsum.photos/seed/bw-spike/420/560" },
];

/* ── FILTERS ────────────────────────────────────── */
const BW_CATS = [
  { id: "all", label: "everyone" },
  { id: "actors", label: "actors" },
  { id: "idols", label: "idols" },
  { id: "anime", label: "2D boys" },
  { id: "other", label: "other" },
];

let bwFilter = "all";
let bwOrder = [];
let bwVisible = [];
let bwLbIndex = 0;

/* caption corner rotation — keeps the wall from looking gridded */
const BW_CORNERS = ["is-br", "is-bl", "is-tl", "is-tr"];

function bwRenderFilters() {
  const el = document.getElementById("bwFilters");
  if (!el) return;
  el.innerHTML = BW_CATS.map((c) => {
    const n = c.id === "all" ? BOYWALL.length : BOYWALL.filter((b) => b.cat === c.id).length;
    if (!n) return "";
    return `<button class="bw-chip${c.id === bwFilter ? " is-on" : ""}"
      onclick="bwSetFilter('${c.id}')"
      aria-pressed="${c.id === bwFilter}">${escHtml(c.label)} <i>${n}</i></button>`;
  }).join("");
}

function bwSetFilter(id) {
  bwFilter = id;
  bwRenderFilters();
  bwRender();
}

function bwRender() {
  const wall = document.getElementById("bwWall");
  const empty = document.getElementById("bwEmpty");
  if (!wall) return;

  bwVisible = bwOrder.filter((b) => bwFilter === "all" || b.cat === bwFilter);

  wall.innerHTML = bwVisible
    .map((b, i) => {
      const corner = BW_CORNERS[i % BW_CORNERS.length];
      const cat = BW_CATS.find((c) => c.id === b.cat);
      return `<figure class="bw-pin bw-tape-${b.tape || ((i % 4) + 1)}"
        tabindex="0" role="button"
        aria-label="${escHtml(b.name)} — open larger"
        onclick="bwOpenLightbox(${i})"
        onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();bwOpenLightbox(${i});}">
        <img src="${escHtml(b.img)}" alt="${escHtml(b.name)}" loading="lazy"
          onerror="this.closest('.bw-pin').classList.add('is-broken');" />
        <figcaption class="bw-cap ${corner}">${escHtml(b.name)}</figcaption>
        ${cat ? `<span class="bw-pin-cat">${escHtml(cat.label)}</span>` : ""}
      </figure>`;
    })
    .join("");

  if (empty) empty.hidden = bwVisible.length > 0;

  const count = document.getElementById("bwCount");
  if (count) {
    count.textContent =
      bwFilter === "all"
        ? `${bwVisible.length} boys pinned`
        : `${bwVisible.length} of ${BOYWALL.length} pinned`;
  }
  const total = document.getElementById("bwTotal");
  if (total) total.textContent = BOYWALL.length;
}

function bwShuffle() {
  for (let i = bwOrder.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bwOrder[i], bwOrder[j]] = [bwOrder[j], bwOrder[i]];
  }
  bwRender();
  const wall = document.getElementById("bwWall");
  if (wall) {
    wall.classList.remove("is-reshuffled");
    void wall.offsetWidth;
    wall.classList.add("is-reshuffled");
  }
}

/* ── LIGHTBOX ───────────────────────────────────── */
function bwPaintLightbox() {
  const b = bwVisible[bwLbIndex];
  if (!b) return;
  const img = document.getElementById("bwLbImg");
  if (img) {
    img.src = b.img;
    img.alt = b.name;
  }
  const name = document.getElementById("bwLbName");
  if (name) name.textContent = b.name;
  const note = document.getElementById("bwLbNote");
  if (note) note.textContent = b.note || "";
  const cat = document.getElementById("bwLbCat");
  if (cat) {
    const c = BW_CATS.find((x) => x.id === b.cat);
    cat.textContent = c ? c.label : "on the wall";
  }
  const counter = document.getElementById("bwLbCounter");
  if (counter) counter.textContent = `${bwLbIndex + 1} / ${bwVisible.length}`;
}

function bwOpenLightbox(i) {
  const box = document.getElementById("bwLightbox");
  if (!box) return;
  bwLbIndex = i;
  bwPaintLightbox();
  box.classList.add("is-open");
  box.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function bwCloseLightbox() {
  const box = document.getElementById("bwLightbox");
  if (!box) return;
  box.classList.remove("is-open");
  box.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function bwLightboxNav(dir) {
  if (!bwVisible.length) return;
  bwLbIndex = (bwLbIndex + dir + bwVisible.length) % bwVisible.length;
  bwPaintLightbox();
}

document.addEventListener("keydown", (e) => {
  const box = document.getElementById("bwLightbox");
  if (!box || !box.classList.contains("is-open")) return;
  if (e.key === "Escape") bwCloseLightbox();
  if (e.key === "ArrowLeft") bwLightboxNav(-1);
  if (e.key === "ArrowRight") bwLightboxNav(1);
});

/* INIT */
document.addEventListener("DOMContentLoaded", () => {
  syncDarkButton(document.body.classList.contains("dark"));
  bwOrder = BOYWALL.slice();
  bwRenderFilters();
  bwRender();
});


/* ═══════════════════════════════════════════════════
   FANGIRLING — standalone script
   Shares localStorage keys with the main site so
   dark mode + petal prefs carry across pages.
═══════════════════════════════════════════════════ */

function escHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}

/* DARK MODE */
function toggleDark() {
  const dark = document.body.classList.toggle("dark");
  syncDarkButton(dark);
  try {
    localStorage.setItem("darkMode", dark ? "1" : "0");
  } catch (_) {}
}
function syncDarkButton(dark) {
  const btn = document.getElementById("darkToggle");
  if (!btn) return;
  btn.textContent = dark ? "◑ MODE" : "◐ MODE";
  btn.classList.toggle("is-active", dark);
}

/* PETALS — same behaviour as webmaster.js */
(function () {
  let petalInterval = null;
  const field = document.createElement("div");
  field.id = "petal-field";
  document.documentElement.appendChild(field);

  const LIGHT_COLORS = ["#D0DEA9", "#E8B0B8", "#BE1A32", "#BFCA96"];
  const DARK_COLORS = ["#FA4055", "#FF8293", "#405FFA", "#8A9DF8"];
  const MAX_PETALS = 45;
  const SPAWN_INTERVAL = 350;
  let activeCount = 0;

  function spawnPetal() {
    if (activeCount >= MAX_PETALS) return;
    const isDark = document.body.classList.contains("dark");
    const palette = isDark ? DARK_COLORS : LIGHT_COLORS;
    const outer = document.createElement("span");
    const inner = document.createElement("span");
    outer.className = "petal-fall";
    inner.textContent = "✿";
    outer.style.left = Math.random() * 100 + "vw";
    outer.style.fontSize = Math.random() * 14 + 12 + "px";
    outer.style.color = palette[Math.floor(Math.random() * palette.length)];
    outer.style.setProperty("--petal-opacity", (Math.random() * 0.4 + 0.5).toFixed(2));
    outer.style.animationDuration = Math.random() * 6 + 7 + "s";
    inner.style.animationDuration = Math.random() * 3 + 2 + "s";
    outer.appendChild(inner);
    field.appendChild(outer);
    activeCount++;
    outer.addEventListener("animationend", (e) => {
      if (e.target === outer) {
        outer.remove();
        activeCount--;
      }
    });
  }

  function startPetals() {
    if (petalInterval) return;
    field.style.display = "";
    petalInterval = setInterval(spawnPetal, SPAWN_INTERVAL);
  }
  function stopPetals() {
    if (petalInterval) {
      clearInterval(petalInterval);
      petalInterval = null;
    }
    field.style.display = "none";
    field.innerHTML = "";
    activeCount = 0;
  }

  window.togglePetals = function () {
    if (petalInterval) {
      stopPetals();
      try {
        localStorage.setItem("sei_petals_off", "1");
      } catch (_) {}
      setButtonState(false);
    } else {
      startPetals();
      try {
        localStorage.removeItem("sei_petals_off");
      } catch (_) {}
      setButtonState(true);
    }
  };

  function setButtonState(on) {
    const btn = document.getElementById("petalToggleBtn");
    if (!btn) return;
    btn.textContent = on ? "✿ PETALS: ON" : "✿ PETALS: OFF";
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.classList.toggle("is-active", on);
  }

  function initPetals() {
    let off = false;
    try {
      off = !!localStorage.getItem("sei_petals_off");
    } catch (_) {}
    if (off || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      stopPetals();
      setButtonState(false);
    } else {
      startPetals();
      setButtonState(true);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPetals);
  } else {
    initPetals();
  }
})();


/* ═══════════════════════════════════════════════════
   HALL OF FAME — swap these placeholders for your own.
   Fields:
     name   → character name (required)
     source → the media they're from
     img    → portrait URL (portrait crops look best)
     tags   → any of "oc" | "canon" | "private"
     blurb  → why they live rent free in your head
═══════════════════════════════════════════════════ */
const BLORBOS = [
  {
    name: "[name]",
    source: "[source media]",
    img: "",
    tags: ["oc", "private"],
    blurb:
      "// replace with a couple paragraphs on why you love this character and what your headcanons/dynamic with them look like.",
  },
  {
    name: "[name]",
    source: "[source media]",
    img: "",
    tags: ["canon"],
    blurb: "// why you love them.",
  },
  {
    name: "[name]",
    source: "[source media]",
    img: "",
    tags: ["oc"],
    blurb: "// why you love them.",
  },
];

const FG_TAG_LABELS = {
  oc: "OC SHIP",
  canon: "CANON SHIP",
  private: "PRIVATE",
};

function fgRenderCharas() {
  const grid = document.getElementById("fgCharaGrid");
  if (!grid) return;

  if (!BLORBOS.length) {
    grid.innerHTML =
      '<p class="fg-empty">// no one in the hall of fame yet. give it time.</p>';
    return;
  }

  grid.innerHTML = BLORBOS.map((c) => {
    const tags = (c.tags || [])
      .map(
        (t) =>
          `<span class="fg-tag is-${escHtml(t)}">${escHtml(
            FG_TAG_LABELS[t] || t,
          )}</span>`,
      )
      .join("");
    const visual = c.img
      ? `<img src="${escHtml(c.img)}" alt="${escHtml(c.name)}" loading="lazy"
          onerror="this.closest('.fg-chara-img').classList.add('is-empty');this.remove();" />`
      : "";
    return `<article class="fg-chara">
      <div class="fg-chara-img${c.img ? "" : " is-empty"}">${visual}</div>
      <div class="fg-chara-meta">
        <span class="fg-chara-name">${escHtml(c.name)}</span>
        <span class="fg-chara-source">${escHtml(c.source || "")}</span>
      </div>
      ${tags ? `<div class="fg-chara-tags">${tags}</div>` : ""}
      <div class="fg-chara-blurb-wrap">
        <p class="fg-chara-blurb">${escHtml(c.blurb || "")}</p>
      </div>
    </article>`;
  }).join("");

  grid.querySelectorAll(".fg-chara-blurb").forEach((p) => {
    const wrap = p.parentElement;
    if (p.scrollHeight <= p.clientHeight + 1) return;

    // only overflowing blurbs get a tab stop + fade hint
    p.tabIndex = 0;
    p.setAttribute("role", "region");
    p.setAttribute("aria-label", "character notes, scrollable");
    wrap.classList.add("is-clipped");

    // hide the "more ↓" hint once they've read to the bottom
    p.addEventListener("scroll", () => {
      const atEnd = p.scrollTop + p.clientHeight >= p.scrollHeight - 2;
      wrap.classList.toggle("is-ended", atEnd);
    });
  });

  const count = document.getElementById("fgCount");
  if (count) {
    count.textContent =
      BLORBOS.length === 1 ? "1 beloved" : `${BLORBOS.length} beloveds`;
  }
}

/* ═══════════════════════════════════════════════════
   FORMER FLAMES — the ones I've cooled off on.
   RESTRAINING ORDER — the ones I actively dislike.
   Fields (both lists):
     name  → character name (required)
     source→ the media they're from
     label → tiny chip; era for flames, "charge" for the order
     note  → one or two lines on the why
═══════════════════════════════════════════════════ */
const FORMER_FLAMES = [
  {
    name: "[name]",
    source: "[source media]",
    label: "[era, e.g. 2019]",
    note: "// what hooked you back then, and what quietly wore off.",
  },
  {
    name: "[name]",
    source: "[source media]",
    label: "",
    note: "// why the fixation cooled.",
  },
  {
    name: "[name]",
    source: "[source media]",
    label: "",
    note: "// why the fixation cooled.",
  },
];

const RESTRAINING_ORDER = [
  {
    name: "[name]",
    source: "[source media]",
    label: "[the charge]",
    note: "// what specifically rubs you the wrong way about them.",
  },
  {
    name: "[name]",
    source: "[source media]",
    label: "",
    note: "// why they're on the list.",
  },
  {
    name: "[name]",
    source: "[source media]",
    label: "",
    note: "// why they're on the list.",
  },
];

function fgRenderRoster(id, data, emptyMsg) {
  const list = document.getElementById(id);
  if (!list) return;

  if (!data.length) {
    list.outerHTML = `<p class="fg-empty">${escHtml(emptyMsg)}</p>`;
    return;
  }

  list.innerHTML = data
    .map(
      (c) => `<li class="fg-roster-item">
      <div class="fg-roster-head">
        <span class="fg-roster-name">${escHtml(c.name)}</span>
        ${
          c.label
            ? `<span class="fg-roster-label">${escHtml(c.label)}</span>`
            : ""
        }
      </div>
      ${
        c.source
          ? `<span class="fg-roster-source">${escHtml(c.source)}</span>`
          : ""
      }
      ${c.note ? `<p class="fg-roster-note">${escHtml(c.note)}</p>` : ""}
    </li>`,
    )
    .join("");
}

/* ── ANCHOR NAV — highlight the section you're reading ── */
function fgInitAnchors() {
  const links = Array.from(document.querySelectorAll(".fg-anchor"));
  if (!links.length) return;

  const targets = links
    .map((a) => {
      const id = a.getAttribute("href").slice(1);
      const el = document.getElementById(id);
      return el ? { a, el } : null;
    })
    .filter(Boolean);
  if (!targets.length) return;

  function markOn(a) {
    links.forEach((l) => l.classList.remove("is-on"));
    a.classList.add("is-on");
  }

  // clicking a chip marks it immediately, then holds while smooth-scroll runs —
  // otherwise the observer would overwrite the pick mid-flight
  let lockUntil = 0;
  targets.forEach(({ a }) => {
    a.addEventListener("click", () => {
      markOn(a);
      lockUntil = Date.now() + 1000;
    });
  });

  if (!("IntersectionObserver" in window)) return;

  const seen = new Map();
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => seen.set(e.target, e));
      if (Date.now() < lockUntil) return;
      // topmost section on screen wins; leftmost breaks ties between the
      // side-by-side cards, which share a top edge
      let best = null;
      seen.forEach((e) => {
        if (!e.isIntersecting) return;
        if (!best) {
          best = e;
          return;
        }
        const dy = e.boundingClientRect.top - best.boundingClientRect.top;
        if (dy < -2 || (Math.abs(dy) <= 2 &&
            e.boundingClientRect.left < best.boundingClientRect.left)) {
          best = e;
        }
      });
      if (!best) return;
      const match = targets.find((t) => t.el === best.target);
      if (!match) return;
      markOn(match.a);
    },
    { rootMargin: "-15% 0px -55% 0px", threshold: [0, 0.25, 1] },
  );

  targets.forEach(({ el }) => obs.observe(el));
}

/* INIT */
document.addEventListener("DOMContentLoaded", () => {
  syncDarkButton(document.body.classList.contains("dark"));
  fgRenderCharas();
  fgRenderRoster(
    "fgFlames",
    FORMER_FLAMES,
    "// nobody's cooled off yet.",
  );
  fgRenderRoster(
    "fgRestraining",
    RESTRAINING_ORDER,
    "// the docket is empty. for now.",
  );
  fgInitAnchors();
});