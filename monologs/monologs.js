var posts = [];

function post(date, title, body) {
  var stamp = /^(\d{1,2})\.(\d{1,2})\.(\d{2})$/.exec(String(date).trim());

  if (!stamp) {
    console.warn('MONOlogs: post "' + title + '" has date "' + date + '". Expected mm.dd.yy, for example 07.05.26.');
  }

  var pad = function (n) { return n.length === 1 ? "0" + n : n; };
  var display = stamp ? pad(stamp[1]) + "." + pad(stamp[2]) + "." + stamp[3] : String(date);
  var sortKey = stamp ? "20" + stamp[3] + pad(stamp[1]) + pad(stamp[2]) : "";

  var paragraphs = String(body)
    .replace(/\r\n?/g, "\n")
    .split(/\n[ \t]*\n/)
    .map(function (block) { return block.replace(/\s*\n\s*/g, " ").trim(); })
    .filter(function (block) { return block !== ""; });

  posts.push({
    id: "p" + (posts.length + 1),
    title: String(title).trim(),
    date: display,
    sortKey: sortKey,
    body: paragraphs
  });
}

/* ─── posts ───────────────────────────────────────────────
   To add a post, copy one block below and edit it.
   Newest or oldest order does not matter, the sort handles it.

   post("mm.dd.yy", "title", `
   Paragraph one. Line breaks inside a paragraph
   are fine, they get joined together.

   A blank line starts a new paragraph.
   `);
   ──────────────────────────────────────────────────────── */

post("01.14.26", "blog title 1", `
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
tempor incididunt ut labore et dolore magna aliqua. Quis ipsum suspendisse
ultrices gravida. Risus commodo viverra maecenas accumsan lacus vel facilisis.

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
tempor incididunt ut labore et dolore magna aliqua.

Risus commodo viverra maecenas accumsan lacus vel facilisis.
`);

post("02.28.26", "blog title 2", `
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
tempor incididunt ut labore et dolore magna aliqua.

Quis ipsum suspendisse ultrices gravida. Risus commodo viverra maecenas
accumsan lacus vel facilisis.
`);

post("03.09.26", "blog title 3", `
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
tempor incididunt ut labore et dolore magna aliqua.

Quis ipsum suspendisse ultrices gravida.

Risus commodo viverra maecenas accumsan lacus vel facilisis.

Lorem ipsum dolor sit amet, consectetur adipiscing elit.
`);

post("04.22.26", "blog title 4", `
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
tempor incididunt ut labore et dolore magna aliqua.

Quis ipsum suspendisse ultrices gravida. Risus commodo viverra maecenas
accumsan lacus vel facilisis.
`);

post("05.30.26", "blog title 5", `
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
tempor incididunt ut labore et dolore magna aliqua.

Quis ipsum suspendisse ultrices gravida.

Risus commodo viverra maecenas accumsan lacus vel facilisis.
`);

post("06.17.26", "blog title 6", `
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
tempor incididunt ut labore et dolore magna aliqua.

Quis ipsum suspendisse ultrices gravida.

Risus commodo viverra maecenas accumsan lacus vel facilisis.

Lorem ipsum dolor sit amet, consectetur adipiscing elit.

Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
`);

post("07.05.26", "blog title 7", `
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
tempor incididunt ut labore et dolore magna aliqua.

Quis ipsum suspendisse ultrices gravida.

Risus commodo viverra maecenas accumsan lacus vel facilisis.
`);

var PER_PAGE = 6;

var THEME_KEY = "monologs-theme";
var RAIN_KEY = "monologs-rain";
var THEME_COLORS = { light: "#F3F3F3", dark: "#0C0C0C" };
var SKY = {
  light: "https://res.cloudinary.com/seioutloud/image/upload/v1786046832/clouds-Photoroom-dithered_kxjugi.png",
  dark: "https://res.cloudinary.com/seioutloud/image/upload/v1786048619/clouds-Photoroom-dithered_1_xulywm.png"
};

var sortOrder = "newest";
var page = 1;
var currentId = null;

var sortBtn = document.getElementById("sortBtn");
var pager = document.getElementById("pager");
var pagerStatus = document.getElementById("pagerStatus");
var prevBtn = document.getElementById("prevBtn");
var nextBtn = document.getElementById("nextBtn");
var rainBtn = document.getElementById("rainBtn");
var modeBtn = document.getElementById("modeBtn");
var rainLayer = document.getElementById("rain");
var themeMeta = document.querySelector('meta[name="theme-color"]');
var indexList = document.getElementById("indexList");
var readerHint = document.getElementById("readerHint");
var postContent = document.getElementById("postContent");
var postTitle = document.getElementById("postTitle");
var postDate = document.getElementById("postDate");
var postBody = document.getElementById("postBody");
var reader = document.getElementById("reader");

function currentTheme() {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function applyTheme(theme) {
  var isDark = theme === "dark";

  if (isDark) {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }

  if (themeMeta) themeMeta.setAttribute("content", THEME_COLORS[isDark ? "dark" : "light"]);

  modeBtn.setAttribute("aria-pressed", String(isDark));
  modeBtn.setAttribute("title", isDark ? "Switch to light mode" : "Switch to dark mode");
}

function setTheme(theme) {
  applyTheme(theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (e) {}
}

applyTheme(currentTheme());

function toggleTheme() {
  setTheme(currentTheme() === "dark" ? "light" : "dark");
}

modeBtn.addEventListener("click", toggleTheme);

var DROP_COUNT = 34;
var SPLASH_CAP = 8;
var reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
var dropsBuilt = false;
var liveSplashes = 0;

function buildDrops() {
  if (dropsBuilt || reduceMotionQuery.matches) return;
  dropsBuilt = true;

  var fragment = document.createDocumentFragment();

  for (var i = 0; i < DROP_COUNT; i++) {
    var depth = Math.random();
    var drop = document.createElement("span");
    drop.className = "drop";
    drop.style.left = (Math.random() * 100).toFixed(3) + "vw";
    drop.style.setProperty("--drop-size", (1.6 + depth * 2.2).toFixed(2) + "px");
    drop.style.setProperty("--drop-speed", (10 - depth * 4.2).toFixed(2) + "s");
    drop.style.setProperty("--drop-delay", "-" + (Math.random() * 10).toFixed(2) + "s");
    drop.style.setProperty("--drop-peak", (0.3 + depth * 0.35).toFixed(2));
    drop.style.setProperty("--drop-drift", (2 + Math.random() * 12).toFixed(1) + "px");
    fragment.appendChild(drop);
  }

  rainLayer.appendChild(fragment);

  rainLayer.addEventListener("animationiteration", function (event) {
    if (event.animationName !== "rise") return;
    if (liveSplashes >= SPLASH_CAP) return;
    if (!rainLayer.classList.contains("is-on")) return;
    if (document.hidden) return;
    if (Math.random() > 0.75) return;
    spawnSplash(event.target);
  });
}

function spawnSplash(drop) {
  var splash = document.createElement("span");
  splash.className = "splash";
  splash.style.left = drop.style.left;
  splash.style.setProperty("--splash-peak", drop.style.getPropertyValue("--drop-peak"));
  liveSplashes++;

  splash.addEventListener("animationend", function () {
    splash.remove();
    liveSplashes--;
  });

  rainLayer.appendChild(splash);
}

function applyRain(on) {
  rainLayer.classList.toggle("is-on", on);
  rainBtn.setAttribute("aria-pressed", String(on));
  rainBtn.setAttribute("title", on ? "Turn rain off" : "Turn rain on");
  if (on) buildDrops();
}

var storedRain = null;
try {
  storedRain = localStorage.getItem(RAIN_KEY);
} catch (e) {}

applyRain(storedRain !== "off");

rainBtn.addEventListener("click", function () {
  var on = rainBtn.getAttribute("aria-pressed") !== "true";
  applyRain(on);
  try {
    localStorage.setItem(RAIN_KEY, on ? "on" : "off");
  } catch (e) {}
});

window.addEventListener("load", function () {
  var next = new Image();
  next.src = SKY[currentTheme() === "dark" ? "light" : "dark"];
});

var systemScheme = window.matchMedia("(prefers-color-scheme: dark)");
var onSchemeChange = function (event) {
  var stored = null;
  try {
    stored = localStorage.getItem(THEME_KEY);
  } catch (e) {}
  if (!stored) applyTheme(event.matches ? "dark" : "light");
};

if (systemScheme.addEventListener) {
  systemScheme.addEventListener("change", onSchemeChange);
} else if (systemScheme.addListener) {
  systemScheme.addListener(onSchemeChange);
}

function sortedPosts() {
  var copy = posts.slice();
  copy.sort(function (a, b) {
    if (a.sortKey === b.sortKey) return 0;
    return a.sortKey < b.sortKey ? -1 : 1;
  });
  if (sortOrder === "newest") copy.reverse();
  return copy;
}

function totalPages() {
  return Math.max(1, Math.ceil(posts.length / PER_PAGE));
}

function renderIndex() {
  var ordered = sortedPosts();
  var pages = totalPages();

  if (page > pages) page = pages;
  if (page < 1) page = 1;

  var start = (page - 1) * PER_PAGE;
  var slice = ordered.slice(start, start + PER_PAGE);
  var activeId = currentId;

  indexList.innerHTML = "";

  slice.forEach(function (post) {
    var li = document.createElement("li");
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "index-item";
    btn.textContent = post.title;
    btn.dataset.id = post.id;
    btn.setAttribute("aria-controls", "postContent");
    btn.setAttribute("aria-current", post.id === activeId ? "true" : "false");
    if (post.id === activeId) btn.classList.add("is-active");
    btn.addEventListener("click", function () {
      selectPost(post.id);
    });
    li.appendChild(btn);
    indexList.appendChild(li);
  });

  pager.hidden = pages < 2;
  pagerStatus.textContent = page + " / " + pages;
  prevBtn.disabled = page === 1;
  nextBtn.disabled = page === pages;
}

function goToPage(next) {
  var pages = totalPages();
  if (next < 1 || next > pages) return;
  page = next;
  renderIndex();
}

function fillPost(post) {
  postTitle.textContent = post.title;
  postDate.textContent = post.date;
  postBody.innerHTML = "";
  post.body.forEach(function (paragraph) {
    var p = document.createElement("p");
    p.textContent = paragraph;
    postBody.appendChild(p);
  });
  readerHint.textContent = post.title + " selected.";
  postContent.classList.add("has-content");
  reader.scrollTop = 0;
}

function selectPost(id) {
  var post = posts.filter(function (p) { return p.id === id; })[0];
  if (!post) return;

  currentId = id;

  Array.prototype.forEach.call(document.querySelectorAll(".index-item"), function (btn) {
    var active = btn.dataset.id === id;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-current", active ? "true" : "false");
  });

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion) {
    fillPost(post);
    return;
  }

  postContent.classList.add("is-hidden");
  window.setTimeout(function () {
    fillPost(post);
    requestAnimationFrame(function () {
      postContent.classList.remove("is-hidden");
    });
  }, 180);
}

sortBtn.addEventListener("click", function () {
  sortOrder = sortOrder === "newest" ? "oldest" : "newest";
  sortBtn.textContent = sortOrder;
  sortBtn.setAttribute("title", sortOrder === "newest" ? "Showing newest first" : "Showing oldest first");
  page = 1;
  renderIndex();
});

prevBtn.addEventListener("click", function () {
  goToPage(page - 1);
});

nextBtn.addEventListener("click", function () {
  goToPage(page + 1);
});

sortBtn.setAttribute("title", "Showing newest first");
renderIndex();
openFromHash();

/* ─── deep link ───────────────────────────────────────────
   Supports #log/pN (from the main site's "recent updates"
   widget). Finds which page the post falls on given the
   current sort order, navigates there, then opens it. */
function openFromHash() {
  var m = /^#log\/(.+)$/.exec(location.hash);
  if (!m) return;
  var id = decodeURIComponent(m[1]);
  var post = posts.filter(function (p) { return p.id === id; })[0];
  if (!post) return;

  var ordered = sortedPosts();
  var idx = -1;
  for (var k = 0; k < ordered.length; k++) {
    if (ordered[k].id === id) { idx = k; break; }
  }
  if (idx === -1) return;

  page = Math.floor(idx / PER_PAGE) + 1;
  renderIndex();
  selectPost(id);
  reader.scrollIntoView({ block: "start", behavior: "auto" });
}

window.addEventListener("hashchange", openFromHash);
