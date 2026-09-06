(() => {
 "use strict";

 const DB = "https://seistudiomessageboard-default-rtdb.firebaseio.com";
 const VERCEL_HOME = "https://seistudio.vercel.app/";
 const NEOCITIES_HOME = "https://seioutloud.neocities.org/";
 // Writes go through the main site's Vercel API, which holds the
 // Firebase Admin SDK. Same token contract as the main site, so one
 // login covers both. Never put credentials in this file.
 const API_BASE = "https://seistudio.vercel.app";
 const TOKEN_KEY = "sei_admin_token";
 const TOKEN_TTL = 8 * 60 * 60 * 1000;
 const TEXT_MAX_CHARS = 190;
 const BOB = 8;

 const STAR_IMAGES = [
  "https://res.cloudinary.com/seioutloud/image/upload/v1785883450/star1-Photoroom-dithered_kvazvx.png",
  "https://res.cloudinary.com/seioutloud/image/upload/v1785883444/star12-Photoroom-dithered_dhnkag.png",
  "https://res.cloudinary.com/seioutloud/image/upload/v1785883443/star3-Photoroom-dithered_ocimst.png",
  "https://res.cloudinary.com/seioutloud/image/upload/v1785883443/star4-Photoroom-dithered_nxmwei.png",
  "https://res.cloudinary.com/seioutloud/image/upload/v1785883443/star5-Photoroom-dithered_zmy7ty.png",
  "https://res.cloudinary.com/seioutloud/image/upload/v1785883443/star6-Photoroom-dithered_rodvan.png",
  "https://res.cloudinary.com/seioutloud/image/upload/v1785883443/star7-Photoroom-dithered_rtm0t0.png",
  "https://res.cloudinary.com/seioutloud/image/upload/v1785883443/star8-Photoroom-dithered_px54if.png",
  "https://res.cloudinary.com/seioutloud/image/upload/v1785883443/star9-Photoroom-dithered_woklhx.png",
 ];

 const field = document.getElementById("field");
 const status = document.getElementById("fieldStatus");
 const noteLayer = document.getElementById("noteLayer");

 let letters = [];
 let openNote = null;

 /* ── BACK LINK ──────────────────────────── */
 function setBackLink() {
  const link = document.getElementById("backLink");
  if (!link) return;
  const host = location.hostname || "";
  link.href = host.endsWith("neocities.org") ? NEOCITIES_HOME : VERCEL_HOME;
 }

 /* ── TEXT HELPERS ───────────────────────── */
 // HelvetiPixel has no curly-quote/dash glyphs; fold them to ASCII.
 function foldPunct(s) {
  return String(s)
   .replace(/[\u2018\u2019\u201B\u2032]/g, "'")
   .replace(/[\u201C\u201D\u201F\u2033]/g, '"')
   .replace(/[\u2013\u2014\u2015]/g, "-")
   .replace(/\u2026/g, "...")
   .replace(/\u00A0/g, " ");
 }

 function esc(s) {
  const d = document.createElement("div");
  d.textContent = foldPunct(s);
  return d.innerHTML;
 }

 function stripTags(s) {
  const d = document.createElement("div");
  d.innerHTML = String(s);
  return d.textContent || "";
 }

 function toParagraphs(body) {
  return stripTags(body)
   .split(/\n\s*\n|\n/)
   .map((p) => p.trim())
   .filter(Boolean)
   .map((p) => `<p>${esc(p)}</p>`)
   .join("");
 }

 /* ── DETERMINISTIC RANDOM PER LETTER ────── */
 // Same letter always gets the same star + tilt + drift, so a
 // re-render (resize) doesn't reshuffle the constellation's look.
 function seedFrom(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
   h ^= str.charCodeAt(i);
   h = Math.imul(h, 16777619);
  }
  return h >>> 0;
 }

 function rngFrom(seed) {
  let s = seed || 1;
  return () => {
   s ^= s << 13;
   s ^= s >>> 17;
   s ^= s << 5;
   s >>>= 0;
   return s / 4294967296;
  };
 }

 /* ── NON-CLASHING PLACEMENT ─────────────── */
 // Jittered grid (stratified sampling): every star owns one cell and
 // is inset inside it, so overlap is impossible at any count, while
 // spare cells + per-cell jitter keep the scatter looking organic.
 const PAD = 4;

 // Smallest comfortable star: a real finger needs more than a cursor.
 function tapFloor() {
  return window.matchMedia("(hover: none)").matches ? 44 : 34;
 }

 // Plans the grid and the sky height together, so the space reserved is
 // always the space laid out. A roomy sky gets an aspect-ratio grid with
 // spare cells for organic scatter; a tight one packs columns by width
 // alone and grows taller, giving every row a full tap-sized cell.
 function plan(count, w, h) {
  const need = tapFloor() + PAD;
  const boxW = Math.max(w - PAD * 2, 20);
  const boxH = Math.max(h - PAD * 2, 20);

  for (let spare = 1.7; spare >= 1; spare -= 0.1) {
   const cells = Math.max(Math.round(count * spare), count);
   const cols = Math.min(
    Math.max(1, Math.round(Math.sqrt((cells * boxW) / boxH))),
    cells
   );
   const rows = Math.max(1, Math.ceil(cells / cols));
   const cellW = boxW / cols;
   const cellH = boxH / rows;
   if (Math.min(cellW, cellH - BOB) >= need) {
    return { cols, rows, cellW, cellH, height: h };
   }
  }

  const cols = Math.max(1, Math.min(Math.floor(boxW / need), count));
  const rows = Math.ceil(count / cols);
  const cellH = need + BOB;
  return {
   cols,
   rows,
   cellW: boxW / cols,
   cellH,
   height: rows * cellH + PAD * 2,
  };
 }

 function layout(count, w, baseSize, { cols, rows, cellW, cellH }) {
  const floor = tapFloor();
  const gap = Math.min(cellW, cellH) > 70 ? 10 : 4;
  // A star may never outgrow its cell, or neighbours would collide,
  // but it may not drop below the tap floor while the cell allows it.
  const cap = Math.min(cellW, cellH - BOB);
  const roomy = Math.min(baseSize, cellW - gap, cellH - gap - BOB);
  const least = Math.min(floor, cap);
  const maxSize = Math.max(roomy, least);

  const pool = [];
  for (let r = 0; r < rows; r++) {
   for (let c = 0; c < cols; c++) pool.push({ r, c });
  }
  for (let i = pool.length - 1; i > 0; i--) {
   const j = Math.floor(Math.random() * (i + 1));
   [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, count).map(({ r, c }) => {
   const size = Math.max(
    Math.min(Math.round(maxSize * (0.84 + Math.random() * 0.16)), Math.floor(cap)),
    Math.min(Math.floor(least), Math.floor(cap))
   );
   const half = size / 2;
   // Stay inside the owned cell, reserving BOB of upward travel, so
   // neither neighbours nor the frame can ever be touched.
   const x =
    PAD + c * cellW + half + Math.random() * Math.max(cellW - size, 0);
   const y =
    PAD +
    r * cellH +
    half +
    BOB +
    Math.random() * Math.max(cellH - size - BOB, 0);
   return { x, y, size };
  });
 }

 function starSize(fieldW) {
  if (fieldW < 420) return 48;
  if (fieldW < 700) return 58;
  if (fieldW < 1100) return 68;
  return 78;
 }

 const starButtons = new Map();

 /* ── RENDER ─────────────────────────────── */
 function render() {
  if (!field) return;
  field.style.height = "";
  let rect = field.getBoundingClientRect();
  const w = rect.width;
  if (!w || !rect.height || !letters.length) return;

  // One plan drives both the reserved height and the placement, so the
  // grid can never be recomputed against a different sky.
  let p0 = plan(letters.length, w, rect.height);
  let fieldW = w;
  if (p0.height > rect.height) {
   field.style.height = p0.height + "px";
   // A taller sky can raise a scrollbar, which narrows the field. Star
   // sizes are pixels but positions are percentages, so re-plan at the
   // settled width or the two would disagree and stars could collide.
   const settled = field.getBoundingClientRect();
   if (Math.abs(settled.width - fieldW) > 0.5) {
    fieldW = settled.width;
    p0 = plan(letters.length, fieldW, p0.height);
    field.style.height = p0.height + "px";
   }
  }
  const h = p0.height;

  const placements = layout(letters.length, fieldW, starSize(fieldW), p0);

  const frag = document.createDocumentFragment();
  starButtons.clear();
  letters.forEach((letter, i) => {
   const p = placements[i];
   const btn = document.createElement("button");
   btn.type = "button";
   btn.className = "star";
   btn.setAttribute("role", "listitem");
   btn.setAttribute(
    "aria-label",
    "Unsent " + (letter._kind === "text" ? "text" : "letter") + " — open to read"
   );
   btn.style.setProperty("--size", Math.round(p.size) + "px");
   btn.style.left = ((p.x / fieldW) * 100).toFixed(3) + "%";
   btn.style.top = ((p.y / h) * 100).toFixed(3) + "%";
   btn.style.setProperty("--tilt", (letter._r2 * 60 - 30).toFixed(1) + "deg");
   btn.style.setProperty("--bob-dur", (5.5 + letter._r3 * 4).toFixed(2) + "s");
   btn.style.setProperty("--bob-delay", (letter._r1 * -6).toFixed(2) + "s");

   const img = document.createElement("img");
   img.src = letter._img;
   img.alt = "";
   img.loading = i < 6 ? "eager" : "lazy";
   img.decoding = "async";
   img.draggable = false;
   btn.appendChild(img);

   btn.addEventListener("click", () => toggleNote(letter, btn));

   starButtons.set(letter.id, btn);
   frag.appendChild(btn);
  });

  field.replaceChildren(frag);
 }

 function noteTools(letter) {
  const wrap = document.createElement("div");
  wrap.className = "note-tools";

  const edit = document.createElement("button");
  edit.type = "button";
  edit.className = "note-tool";
  edit.textContent = "EDIT";
  edit.addEventListener("click", (e) => {
   e.stopPropagation();
   openCompose(letter);
  });

  const del = document.createElement("button");
  del.type = "button";
  del.className = "note-tool is-danger";
  del.textContent = "DELETE";
  del.addEventListener("click", (e) => {
   e.stopPropagation();
   removeLetter(letter);
  });

  wrap.append(edit, del);
  return wrap;
 }

 /* ── NOTES ──────────────────────────────── */
 function closeNote() {
  if (!openNote) return;
  const { el, scrim, star } = openNote;
  openNote = null;
  el.classList.add("is-closing");
  if (scrim) scrim.classList.add("is-closing");
  star?.classList.remove("is-open");
  document.documentElement.classList.remove("note-locked");
  const done = () => {
   el.remove();
   scrim?.remove();
  };
  el.addEventListener("animationend", done, { once: true });
  setTimeout(done, 320);
 }

 function positionNote(el, star) {
  const s = star.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // offsetWidth/Height = untransformed layout size, so the entry
  // scale animation can't skew the maths.
  const nw = el.offsetWidth;
  const nh = el.offsetHeight;
  const m = 12;

  // Prefer top-right of the star, mirroring the mockup; flip when tight.
  let x = s.right - s.width * 0.22;
  if (x + nw > vw - m) x = s.left + s.width * 0.22 - nw;
  x = Math.min(Math.max(x, m), Math.max(vw - nw - m, m));

  let y = s.top + s.height * 0.28 - nh;
  let originY = "100%";
  if (y < m) {
   y = s.bottom - s.height * 0.28;
   originY = "0%";
  }
  if (y + nh > vh - m) y = Math.max(vh - nh - m, m);

  const cx = s.left + s.width / 2 - x;
  el.style.setProperty("--nx", Math.round(x) + "px");
  el.style.setProperty("--ny", Math.round(y) + "px");
  el.style.setProperty(
   "--origin-x",
   Math.round(Math.min(Math.max(cx, 0), nw)) + "px"
  );
  el.style.setProperty("--origin-y", originY);
 }

 function centreNote(el) {
  el.style.setProperty(
   "--nx",
   Math.round(Math.max((window.innerWidth - el.offsetWidth) / 2, 12)) + "px"
  );
  el.style.setProperty(
   "--ny",
   Math.round(Math.max((window.innerHeight - el.offsetHeight) / 2, 12)) + "px"
  );
  el.style.setProperty("--origin-x", "50%");
  el.style.setProperty("--origin-y", "50%");
 }

 function toggleNote(letter, star) {
  const wasSame = openNote && openNote.id === letter.id;
  closeNote();
  if (wasSame) return;

  const isMobile = window.matchMedia("(max-width: 620px)").matches;
  const el = document.createElement("div");
  el.className = "note note--" + letter._kind;
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", isMobile ? "true" : "false");
  el.setAttribute("aria-label", "Unsent " + letter._kind);

  const head =
   letter._kind === "letter"
    ? `<div class="note-head">to: ${esc(letter.to || "???")}<b>${esc(
       letter.subject || "(untitled)"
      )}</b></div>`
    : "";

  el.innerHTML =
   `<button class="note-close" type="button" aria-label="Close">x</button>` +
   head +
   `<div class="note-body" tabindex="0">${letter._html}</div>`;

  if (isAdmin()) el.appendChild(noteTools(letter));

  let scrim = null;
  if (isMobile) {
   scrim = document.createElement("div");
   scrim.className = "note-scrim";
   scrim.addEventListener("click", closeNote);
   noteLayer.appendChild(scrim);
  }

  noteLayer.appendChild(el);
  star.classList.add("is-open");
  openNote = { id: letter.id, el, scrim, star };

  if (isMobile) {
   document.documentElement.classList.add("note-locked");
   centreNote(el);
  } else {
   positionNote(el, star);
  }

  el.querySelector(".note-close").addEventListener("click", closeNote);
  el.querySelector(".note-close").focus({ preventScroll: true });
 }

 /* ── LOAD ───────────────────────────────── */
 function classify(letter) {
  const plain = stripTags(letter.body || "").trim();
  return plain.length <= TEXT_MAX_CHARS && !/\n\s*\n/.test(plain)
   ? "text"
   : "letter";
 }

 function prepare(list) {
  return list.map((l) => {
   const rand = rngFrom(seedFrom(l.id));
   const r1 = rand();
   const r2 = rand();
   const r3 = rand();
   return Object.assign({}, l, {
    _kind: classify(l),
    _html: toParagraphs(l.body || ""),
    _img: STAR_IMAGES[Math.floor(rand() * STAR_IMAGES.length)],
    _r1: r1,
    _r2: r2,
    _r3: r3,
   });
  });
 }

 async function load() {
  try {
   const res = await fetch(DB + "/content/letters.json", { cache: "no-store" });
   if (!res.ok) throw new Error("HTTP " + res.status);
   const data = await res.json();
   const list = Object.entries(data || {}).map(([id, v]) =>
    Object.assign({ id }, v)
   );
   list.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
   letters = prepare(list.filter((l) => (l.body || "").trim()));

   if (!letters.length) {
    status.textContent = "no stars folded yet. come back soon.";
    return;
   }
   // Shuffle placement order so drawing order doesn't cluster by date.
   for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
   }
   render();
   openFromHash();
  } catch (err) {
   console.error("starmail:", err);
   status.textContent = "the sky is cloudy tonight. couldn't reach the stars.";
  }
 }

 /* ── DEEP LINK ──────────────────────────── */
 // Supports #letter/ID (from the main site's "recent updates" widget)
 // and #text/ID for symmetry, though every entry renders as one of
 // the two kinds regardless of which hash form links to it.
 function openFromHash() {
  const m = /^#(?:letter|text)\/(.+)$/.exec(location.hash);
  if (!m) return;
  const id = decodeURIComponent(m[1]);
  const letter = letters.find((l) => l.id === id);
  const star = starButtons.get(id);
  if (!letter || !star) return;
  // Let layout settle before measuring the star's position.
  requestAnimationFrame(() => {
   star.scrollIntoView({ block: "center", behavior: "auto" });
   toggleNote(letter, star);
  });
 }

 /* ── ADMIN: AUTH ────────────────────────── */
 function session() {
  try {
   const raw = sessionStorage.getItem(TOKEN_KEY);
   if (!raw) return null;
   const s = JSON.parse(raw);
   if (!s || !s.token || Date.now() - s.ts >= TOKEN_TTL) return null;
   return s;
  } catch (_) {
   return null;
  }
 }

 function isAdmin() {
  return !!session();
 }

 function setAdminUI(on) {
  const bar = document.getElementById("adminBar");
  if (bar) bar.hidden = !on;
 }

 async function api(path, body) {
  const res = await fetch(API_BASE + path, {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify(body),
  });
  const out = await res
   .json()
   .catch(() => ({ ok: false, reason: "Bad response" }));
  if (!out.ok) throw new Error(out.reason || "Request failed");
  return out;
 }

 // Mirrors the main site's adminWrite contract.
 function write(op, payload) {
  const s = session();
  if (!s) throw new Error("Session expired");
  const body = {
   token: s.token,
   ts: s.ts,
   op,
   path: "content/letters",
  };
  if (op === "push") body.data = payload;
  if (op === "update") {
   body.id = payload.id;
   body.data = payload.data;
  }
  if (op === "remove") body.id = payload.id;
  return api("/api/admin-write", body);
 }

 /* ── ADMIN: SHEETS ──────────────────────── */
 let editing = null;
 let lastFocus = null;

 function openSheet(id) {
  lastFocus = document.activeElement;
  closeNote();
  const sheet = document.getElementById(id);
  sheet.hidden = false;
  document.documentElement.classList.add("note-locked");
  const first = sheet.querySelector(
   ".sheet-input:not([hidden]):not([readonly])"
  );
  if (first) setTimeout(() => first.focus(), 30);
 }

 function closeSheet(id) {
  const sheet = document.getElementById(id);
  sheet.hidden = true;
  document.documentElement.classList.remove("note-locked");
  const err = sheet.querySelector(".sheet-error");
  if (err) err.hidden = true;
  lastFocus?.focus?.();
 }

 function openLogin() {
  document.getElementById("passInput").value = "";
  openSheet("loginSheet");
 }

 async function doLogin() {
  const input = document.getElementById("passInput");
  const err = document.getElementById("loginError");
  const btn = document.getElementById("loginGo");
  const pw = input.value;
  if (!pw) return;
  err.hidden = true;
  btn.disabled = true;
  try {
   const out = await api("/api/admin-auth", { password: pw });
   sessionStorage.setItem(
    TOKEN_KEY,
    JSON.stringify({ token: out.token, ts: out.ts })
   );
   input.value = "";
   closeSheet("loginSheet");
   setAdminUI(true);
  } catch (e) {
   err.textContent =
    e.message === "Invalid credentials"
     ? "// ACCESS DENIED."
     : "// " + e.message.toUpperCase();
   err.hidden = false;
   input.select();
  } finally {
   btn.disabled = false;
  }
 }

 function openCompose(letter) {
  editing = letter || null;
  document.getElementById("composeTitle").textContent = letter
   ? "// REFOLD THIS STAR"
   : "// FOLD A NEW STAR";
  document.getElementById("composeSave").textContent = letter
   ? "SAVE"
   : "SEAL";
  document.getElementById("fTo").value = letter?.to || "";
  document.getElementById("fSubject").value = letter?.subject || "";
  document.getElementById("fBody").value = letter?.body || "";
  openSheet("composeSheet");
 }

 async function saveCompose() {
  const err = document.getElementById("composeError");
  const btn = document.getElementById("composeSave");
  const to = document.getElementById("fTo").value.trim();
  const subject = document.getElementById("fSubject").value.trim();
  const body = document.getElementById("fBody").value.trim();

  err.hidden = true;
  if (!body) {
   err.textContent = "// A LETTER NEEDS A BODY.";
   err.hidden = false;
   document.getElementById("fBody").focus();
   return;
  }
  if (!isAdmin()) {
   err.textContent = "// SESSION EXPIRED. LOG IN AGAIN.";
   err.hidden = false;
   return;
  }

  const label = btn.textContent;
  btn.disabled = true;
  btn.textContent = "...";
  try {
   if (editing) {
    const data = {
     to,
     subject,
     body,
     timestamp: editing.timestamp || Date.now(),
    };
    await write("update", { id: editing.id, data });
    // Mutate in place: each star's click handler closes over its letter
    // object, and the sky keeps its layout instead of reshuffling.
    Object.assign(editing, data, {
     _kind: classify(data),
     _html: toParagraphs(body),
    });
    editing = null;
    closeSheet("composeSheet");
    closeNote();
   } else {
    const data = { to, subject, body, timestamp: Date.now() };
    const out = await write("push", data);
    letters.push(prepare([Object.assign({ id: out.id }, data)])[0]);
    closeSheet("composeSheet");
    if (status && status.isConnected) status.remove();
    render();
   }
  } catch (e) {
   err.textContent = "// COULD NOT SAVE: " + e.message.toUpperCase();
   err.hidden = false;
  } finally {
   btn.disabled = false;
   btn.textContent = label;
  }
 }

 async function removeLetter(letter) {
  if (!isAdmin()) return;
  const name = letter.subject || letter.to || "this letter";
  if (!window.confirm('Delete "' + name + '" forever?')) return;
  try {
   await write("remove", { id: letter.id });
   closeNote();
   letters = letters.filter((l) => l.id !== letter.id);
   render();
   if (!letters.length) location.reload();
  } catch (e) {
   window.alert("// COULD NOT DELETE: " + e.message);
  }
 }

 /* ── ADMIN: WIRING ──────────────────────── */
 function initAdmin() {
  // Hidden trigger: triple-click/tap the moon.
  const moon = document.getElementById("moon");
  let taps = 0;
  let timer = null;
  moon?.addEventListener("click", () => {
   taps++;
   clearTimeout(timer);
   timer = setTimeout(() => (taps = 0), 600);
   if (taps < 3) return;
   taps = 0;
   if (isAdmin()) {
    setAdminUI(true);
    openCompose(null);
   } else {
    openLogin();
   }
  });

  document.getElementById("loginForm").addEventListener("submit", (e) => {
   e.preventDefault();
   doLogin();
  });
  document
   .getElementById("loginCancel")
   .addEventListener("click", () => closeSheet("loginSheet"));

  document
   .getElementById("newLetterBtn")
   .addEventListener("click", () => openCompose(null));
  document.getElementById("composeSave").addEventListener("click", saveCompose);
  document.getElementById("composeCancel").addEventListener("click", () => {
   editing = null;
   closeSheet("composeSheet");
  });
  document.getElementById("fBody").addEventListener("keydown", (e) => {
   if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveCompose();
  });

  document.getElementById("logoutBtn").addEventListener("click", () => {
   try {
    sessionStorage.removeItem(TOKEN_KEY);
   } catch (_) {}
   setAdminUI(false);
   closeNote();
  });

  ["loginSheet", "composeSheet"].forEach((id) => {
   const sheet = document.getElementById(id);
   sheet.addEventListener("pointerdown", (e) => {
    if (e.target === sheet) closeSheet(id);
   });
  });

  if (isAdmin()) setAdminUI(true);
 }

 /* ── STARFIELD BACKDROP ─────────────────── */
 function starfield() {
  const cv = document.getElementById("starfield");
  if (!cv) return;
  const ctx = cv.getContext("2d");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let dots = [];
  let raf = null;
  let t = 0;

  function build() {
   const dpr = Math.min(window.devicePixelRatio || 1, 2);
   const w = window.innerWidth;
   const h = window.innerHeight;
   cv.width = Math.round(w * dpr);
   cv.height = Math.round(h * dpr);
   ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
   const n = Math.round((w * h) / 7000);
   dots = Array.from({ length: n }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: Math.random() * 1.15 + 0.25,
    a: Math.random() * 0.55 + 0.15,
    sp: Math.random() * 0.9 + 0.25,
    ph: Math.random() * Math.PI * 2,
   }));
  }

  function draw() {
   ctx.clearRect(0, 0, cv.width, cv.height);
   for (const d of dots) {
    const tw = reduce ? 1 : 0.62 + 0.38 * Math.sin(t * d.sp + d.ph);
    ctx.globalAlpha = Math.max(d.a * tw, 0);
    ctx.fillStyle = "#eaf0ff";
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fill();
   }
   ctx.globalAlpha = 1;
  }

  function loop() {
   t += 0.016;
   draw();
   raf = requestAnimationFrame(loop);
  }

  build();
  draw();
  if (!reduce) loop();

  return () => {
   if (raf) cancelAnimationFrame(raf);
   build();
   draw();
   if (!reduce) loop();
  };
 }

 /* ── EVENTS ─────────────────────────────── */
 setBackLink();
 initAdmin();
 const rebuildField = starfield();

 let rt = null;
 let lastW = window.innerWidth;
 window.addEventListener("resize", () => {
  clearTimeout(rt);
  rt = setTimeout(() => {
   rebuildField?.();
   // Ignore mobile toolbar height-only changes to avoid reshuffling.
   const w = window.innerWidth;
   if (Math.abs(w - lastW) > 2 || !openNote) {
    lastW = w;
    closeNote();
    render();
   }
  }, 180);
 });

 window.addEventListener("orientationchange", closeNote);

 window.addEventListener("hashchange", openFromHash);

 document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  // Close the topmost layer first.
  const sheet = ["composeSheet", "loginSheet"].find(
   (id) => !document.getElementById(id).hidden
  );
  if (sheet) {
   if (sheet === "composeSheet") editing = null;
   closeSheet(sheet);
   return;
  }
  closeNote();
 });

 document.addEventListener("pointerdown", (e) => {
  if (!openNote) return;
  if (e.target.closest(".note") || e.target.closest(".star")) return;
  closeNote();
 });

 // Keep a note pinned to its star when the tall-sky layout scrolls.
 window.addEventListener(
  "scroll",
  () => {
   if (!openNote || openNote.scrim) return;
   positionNote(openNote.el, openNote.star);
  },
  { passive: true }
 );

 load();
})();
