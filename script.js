/* ═══════════════════════════════════════════════════════
   API BASE
  hi nosy person, below is the link to where I originally host my site. It looks the same on here, just on Vercel. :)
═══════════════════════════════════════════════════════ */
   const VERCEL_API_BASE = "https://seistudio.vercel.app/";

   function apiUrl(path) {
    try {
     const host = location.hostname || "";
     const onVercel =
      host.endsWith(".vercel.app") ||
      host === new URL(VERCEL_API_BASE).hostname;
     return onVercel ? path : VERCEL_API_BASE.replace(/\/$/, "") + path;
    } catch (_) {
     return VERCEL_API_BASE.replace(/\/$/, "") + path;
    }
   }

   /* ═══════════════════════════════════════════════════════
   FIREBASE CONFIG
═══════════════════════════════════════════════════════ */
   const firebaseConfig = {
    apiKey: "AIzaSyD0WwCtdV5JH5V2BSzlNr_ybTwCtCrgxV4",
    authDomain: "seistudiomessageboard.firebaseapp.com",
    databaseURL: "https://seistudiomessageboard-default-rtdb.firebaseio.com",
    projectId: "seistudiomessageboard",
    storageBucket: "seistudiomessageboard.firebasestorage.app",
    messagingSenderId: "683797738985",
    appId: "1:683797738985:web:3e79b66988d1498fddc778",
   };

   let db = null,
    msgRef = null;

   /* Bulletin board limits:
   */
   const MAX_MSGS = 300;
   const DISPLAY_MSGS = 150;
   const renderedIds = new Set();

   /* ═══════════════════════════════════════════════════════
   DICTIONARY OF OBSCURE SORROWS
 TODO: add more when you can
═══════════════════════════════════════════════════════ */
   const DOS_WORDS = [
    {
     word: "sonder",
     pos: "n.",
     def: "the realization that each passerby has a life as vivid and complex as your own — an epic story that continues invisibly around you.",
    },
    {
     word: "opia",
     pos: "n.",
     def: "the ambiguous intensity of looking someone in the eye, which can feel simultaneously invasive and vulnerable.",
    },
    {
     word: "monachopsis",
     pos: "n.",
     def: "the subtle but persistent feeling of being out of place, as maladapted to your surroundings as a seal on a beach.",
    },
    {
     word: "exulansis",
     pos: "n.",
     def: "the tendency to give up trying to talk about an experience because people are unable to relate to it.",
    },
    {
     word: "vellichor",
     pos: "n.",
     def: "the strange wistfulness of used bookstores, which are somehow sad in a way that libraries are not.",
    },
    {
     word: "rubatosis",
     pos: "n.",
     def: "the unsettling awareness of your own heartbeat.",
    },
    {
     word: "kenopsia",
     pos: "n.",
     def: "the eerie, forlorn atmosphere of a place that's usually bustling with people but is now abandoned and quiet.",
    },
    {
     word: "mauerbauertraurigkeit",
     pos: "n.",
     def: "the inexplicable urge to push people away, even close friends who you genuinely like.",
    },
    {
     word: "jouska",
     pos: "n.",
     def: "a hypothetical conversation that you compulsively play out in your head.",
    },
    {
     word: "chrysalism",
     pos: "n.",
     def: "the amniotic tranquility of being indoors during a thunderstorm.",
    },
    {
     word: "vemödalen",
     pos: "n.",
     def: "the frustration of photographing something amazing when thousands of identical photos already exist.",
    },
    {
     word: "anecdoche",
     pos: "n.",
     def: "a conversation in which everyone is talking but nobody is listening.",
    },
    {
     word: "ellipsism",
     pos: "n.",
     def: "a sadness that you'll never be able to know how history will turn out.",
    },
    {
     word: "kuebiko",
     pos: "n.",
     def: "a state of exhaustion inspired by acts of senseless violence.",
    },
    {
     word: "lachesism",
     pos: "n.",
     def: "the desire to be struck by disaster — to survive a plane crash, to lose everything in a fire.",
    },
    {
     word: "altschmerz",
     pos: "n.",
     def: "weariness with the same old issues that you've always had — the same boring flaws and anxieties you've been gnawing on for years.",
    },
    {
     word: "liberosis",
     pos: "n.",
     def: "the desire to care less about things — to loosen your grip on your life, to stop white-knuckling your routines and fears.",
    },
    {
     word: "onism",
     pos: "n.",
     def: "the frustration of being stuck in just one body, that inhabits only one place at a time.",
    },
    {
     word: "nodus tollens",
     pos: "n.",
     def: "the realization that the plot of your life doesn't make sense to you anymore.",
    },
    {
     word: "rückkehrunruhe",
     pos: "n.",
     def: "the feeling of returning home after an immersive trip only to find it fading rapidly from your awareness.",
    },
    {
     word: "énouement",
     pos: "n.",
     def: "the bittersweetness of having arrived in the future, seeing how things turned out, but not being able to tell your past self.",
    },
    {
     word: "zenosyne",
     pos: "n.",
     def: "the sense that time keeps accelerating, that each year passes more quickly than the last.",
    },
    {
     word: "avenoir",
     pos: "n.",
     def: "the desire that memory could flow backward — that you could feel all the experiences of your life in reverse.",
    },
    {
     word: "adronitis",
     pos: "n.",
     def: "frustration with how long it takes to get to know someone.",
    },
    {
     word: "occhiolism",
     pos: "n.",
     def: "the awareness of the smallness of your perspective, and the humbling irony that this very awareness makes you feel large.",
    },
   ];

  
   let _lastQuoteIdx = -1;

   function newQuote() {
    let idx;
    do {
     idx = Math.floor(Math.random() * DOS_WORDS.length);
    } while (idx === _lastQuoteIdx && DOS_WORDS.length > 1);
    _lastQuoteIdx = idx;
    const w = DOS_WORDS[idx];
    const terminal = document.getElementById("quoteTerminal");
    terminal.innerHTML = "";

    const lines = [
     { text: "> scanning dictionary...", cls: "qt-line" },
     { text: "> found: " + w.word, cls: "qt-line" },
     { text: "", cls: "" },
     { text: w.word, cls: "qt-word" },
     { text: w.pos, cls: "qt-pos" },
     { text: w.def, cls: "qt-def" },
     { text: "> src: thedictionaryofobscuresorrows.com", cls: "qt-source" },
    ];

    let i = 0;
    function next() {
     if (i >= lines.length) return;
     const d = document.createElement("div");
     d.className = lines[i].cls || "";
     d.textContent = lines[i].text;
     terminal.appendChild(d);
     i++;
     setTimeout(next, i <= 2 ? 120 : 35);
    }
    next();
   }

   /* ═══════════════════════════════════════════════════════
   FALLING PETALS + respects prefers-reduced-motion.
═══════════════════════════════════════════════════════ */
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
     const size = Math.random() * 14 + 12;
     const fallDuration = Math.random() * 6 + 7;
     const swayDuration = Math.random() * 3 + 2;
     const startX = Math.random() * 100;
     const color = palette[Math.floor(Math.random() * palette.length)];
     const opacity = (Math.random() * 0.4 + 0.5).toFixed(2);
     outer.style.left = startX + "vw";
     outer.style.fontSize = size + "px";
     outer.style.color = color;
     outer.style.setProperty("--petal-opacity", opacity);
     outer.style.animationDuration = fallDuration + "s";
     inner.style.animationDuration = swayDuration + "s";
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
     const btn = document.getElementById("petalToggleBtn");
     if (petalInterval) {
      stopPetals();
      localStorage.setItem("sei_petals_off", "1");
      setButtonState(false);
     } else {
      startPetals();
      localStorage.removeItem("sei_petals_off");
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
     if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setButtonState(false);
      return;
     }
     if (localStorage.getItem("sei_petals_off")) {
     
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

   /* ═══════════════════════════════════════════════════════
   COLOPHON PAGE — SITE HISTORY CAROUSEL
   Placeholder screenshots — swap these URLs for real earlier-version
   captures whenever they're ready.
═══════════════════════════════════════════════════════ */
   const ORIGIN_SHOTS = [
    {
     url: "https://placehold.co/800x500/1a1a1a/e0e0e0?text=v1+%E2%80%94+2023",
     caption: "V1 — THE ORIGINAL STATIC PAGE",
    },
    {
     url: "https://placehold.co/800x500/1a1a1a/e0e0e0?text=v2+%E2%80%94+2024",
     caption: "V2 — FIRST REAL REDESIGN",
    },
    {
     url: "https://placehold.co/800x500/1a1a1a/e0e0e0?text=v3+%E2%80%94+2025",
     caption: "V3 — PRE-VERCEL ERA",
    },
   ];
   let originCarouselIndex = 0;
   function renderOriginCarousel() {
    const img = document.getElementById("originCarouselImg");
    if (!img || !ORIGIN_SHOTS.length) return;
    const shot = ORIGIN_SHOTS[originCarouselIndex];
    img.src = shot.url;
    img.alt = shot.caption;
    const cap = document.getElementById("originCarouselCaption");
    if (cap) cap.textContent = shot.caption;
    const dots = document.getElementById("originCarouselDots");
    if (dots)
     dots.innerHTML = ORIGIN_SHOTS.map(
      (_, i) =>
       `<span class="origin-carousel-dot${i === originCarouselIndex ? " is-active" : ""}"></span>`,
     ).join("");
   }
   function originCarouselNav(dir) {
    if (!ORIGIN_SHOTS.length) return;
    originCarouselIndex =
     (originCarouselIndex + dir + ORIGIN_SHOTS.length) % ORIGIN_SHOTS.length;
    renderOriginCarousel();
   }
   document.addEventListener("DOMContentLoaded", renderOriginCarousel);

        /* ═══════════════════════════════════════════════════════
   CODE SNIPPETS
   
   holy moly this took forever.
   add new tutorial by giving it a key in SNIPPETS_DATA below,
   then add a matching .snippets-toc-item in the HTML...there was probably an easier way to do this
═══════════════════════════════════════════════════════ */
 function escapeHtml(str) {
  if (str == null) return '';
  
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

   function codeBlock(lang, code) {
    return `<pre class="snippet-code" data-lang="${lang}"><code>${escapeHtml(code)}</code></pre>`;
   }

   /* -- popup modal demo: open/close + outside-click + Escape -- */
   window.openDemoModal = function () {
    const overlay = document.getElementById("demoModalOverlay");
    if (overlay) overlay.classList.add("is-open");
   };
   window.closeDemoModal = function () {
    const overlay = document.getElementById("demoModalOverlay");
    if (overlay) overlay.classList.remove("is-open");
   };
   document.addEventListener("click", function (e) {
    const overlay = document.getElementById("demoModalOverlay");
    if (overlay && e.target === overlay) overlay.classList.remove("is-open");
   });
   document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    const overlay = document.getElementById("demoModalOverlay");
    if (overlay) overlay.classList.remove("is-open");
   });

   /* -- falling elements demo: spawn loop, confined to its own bounded box -- */
   let fallingDemoInterval = null;
   function stopFallingDemo() {
    if (fallingDemoInterval) {
     clearInterval(fallingDemoInterval);
     fallingDemoInterval = null;
    }
   }
   const FALLING_DEMO_LIGHT_COLORS = ["#D0DEA9", "#E8B0B8", "#BE1A32", "#BFCA96"];
   const FALLING_DEMO_DARK_COLORS = ["#FA4055", "#FF8293", "#405FFA", "#8A9DF8"];
   function spawnFallingDemoItem() {
    const field = document.getElementById("demoFallingField");
    if (!field) {
     stopFallingDemo();
     return;
    }
    const isDark = document.body.classList.contains("dark");
    const palette = isDark ? FALLING_DEMO_DARK_COLORS : FALLING_DEMO_LIGHT_COLORS;
    const color = palette[Math.floor(Math.random() * palette.length)];
    const outer = document.createElement("span");
    const inner = document.createElement("span");
    outer.className = "demo-falling-item";
    inner.textContent = "✿";
    const size = Math.random() * 10 + 14;
    const fallDuration = Math.random() * 2 + 3;
    const swayDuration = Math.random() * 1.5 + 1.5;
    const startX = Math.random() * 90;
    const opacity = (Math.random() * 0.3 + 0.6).toFixed(2);
    outer.style.left = startX + "%";
    outer.style.fontSize = size + "px";
    outer.style.color = color;
    outer.style.setProperty("--fall-opacity", opacity);
    outer.style.animationDuration = fallDuration + "s";
    inner.style.animationDuration = swayDuration + "s";
    outer.appendChild(inner);
    field.appendChild(outer);
    outer.addEventListener("animationend", (e) => {
     if (e.target === outer) outer.remove();
    });
   }

    /* -- theme-dependent image demo: local toggle, scoped to the demo only -- */
    window.toggleDemoTheme = function () {
     const wrap = document.getElementById("demoThemeSwap");
     if (wrap) wrap.classList.toggle("is-dark");
    };

    /* -- word of the day demo: refresh button picks a random word -- */
    window.demoRefreshWotd = function () {
     const list = window._demoWotdList;
     if (!list || !list.length) return;
     let idx;
     do {
      idx = Math.floor(Math.random() * list.length);
     } while (idx === window._demoWotdLastIdx && list.length > 1);
     window._demoWotdLastIdx = idx;
     const entry = list[idx];
     const wordEl = document.getElementById("demoWotdWord");
     const pronEl = document.getElementById("demoWotdPronunciation");
     const defEl = document.getElementById("demoWotdDefinition");
     if (wordEl) wordEl.textContent = entry.word;
     if (pronEl) pronEl.textContent = "/ " + entry.pronunciation + " /";
     if (defEl) defEl.textContent = entry.definition;
    };

    /* -- theme system + toggle demo: cycles through 3 themes -- */
    window.toggleDemoThemeSystem = function () {
     const wrap = document.getElementById("demoThemeSystem");
     const label = document.getElementById("demoThemeSystemLabel");
     if (!wrap) return;
     
     // cycle through: default → dark → sepia → default
     const themes = ["default", "dark", "sepia"];
     const current = wrap.getAttribute("data-demo-theme") || "default";
     const idx = themes.indexOf(current);
     const next = themes[(idx + 1) % themes.length];
     
     if (next === "default") {
      wrap.removeAttribute("data-demo-theme");
     } else {
      wrap.setAttribute("data-demo-theme", next);
     }
     
     if (label) label.textContent = next === "default" ? "Dark" : next === "dark" ? "Sepia" : "Light";
    };

    /* -- custom loader demo: shows one random message per click (like the site) -- */
    window.runDemoLoader = function () {
     const msgEl = document.getElementById("demoLoaderMsg");
     if (!msgEl) return;
     
     // pick one random message (like the site does on each page load)
     const messages = [
      "[ FETCHING_EMOTIONS... ]",
      "[ INDEXING_MEMORIES... ]",
      "[ BOOTING_UP... ]",
      "[ RE-FORMATTING_EXISTENCE... ]",
      "[ CLEARING_CACHED_REGRETS... ]",
      "[ DOWNLOADING_WARMTH.EXE... ]",
     ];
     const random = messages[Math.floor(Math.random() * messages.length)];
     msgEl.textContent = random;
    };

... (file continues unchanged) ...

   /* content advisory – shown on every page load, blocks the site until dismissed */


document.addEventListener("DOMContentLoaded", () => {
  try {
    if (localStorage.getItem("modalSeen")) {
      const modal = document.getElementById("advisoryModal");
      if (modal) modal.style.display = "none";
      // remove any lock class name we might have used in various CSS/HTML
      document.body.classList.remove("advisory-lock", "modal-lock");
    }
  } catch (_) {
    // ignore localStorage errors
  }
});


function dismissAdvisory() {
  try {
    const modal = document.getElementById("advisoryModal");
    if (modal) modal.style.display = "none";
    // remove both lock class variants to ensure scroll is re-enabled
    document.body.classList.remove("advisory-lock", "modal-lock");
    // remember that this visitor already saw it
    try { localStorage.setItem("modalSeen", "1"); } catch (_) {}
  } catch (e) {
    // last-resort: ensure body unlocked and log a warning
    document.body.classList.remove("advisory-lock", "modal-lock");
    console.warn("dismissAdvisory encountered an error:", e);
  }
}


   /* ═══════════════════════════════════════════════════════
   LIGHTBOX — ZOOM + DRAG
═══════════════════════════════════════════════════════ */
   let zoomLevel = 1,
    isDragging = false,
    dragStartX = 0,
    dragStartY = 0,
    imageX = 0,
    imageY = 0;

   function zoomImage(dir) {
    zoomLevel = Math.max(1, Math.min(3, zoomLevel + dir * 0.25));
    const img = document.getElementById("lb-image");
    if (zoomLevel <= 1) {
     img.style.transform = "scale(1) translate(0,0)";
     img.classList.remove("zoomed");
     imageX = imageY = 0;
    } else {
     img.style.transform = `scale(${zoomLevel}) translate(${imageX}px,${imageY}px)`;
     img.classList.add("zoomed");
    }
   }
   function resetZoom() {
    zoomLevel = 1;
    imageX = imageY = 0;
    const img = document.getElementById("lb-image");
    img.style.transform = "scale(1) translate(0,0)";
    img.classList.remove("zoomed");
   }
   function initImageDrag() {
    const img = document.getElementById("lb-image");
    const start = (e) => {
     if (zoomLevel <= 1) return;
     isDragging = true;
     const t = e.touches ? e.touches[0] : e;
     dragStartX = t.clientX;
     dragStartY = t.clientY;
     e.preventDefault();
    };
    const drag = (e) => {
     if (!isDragging || zoomLevel <= 1) return;
     const t = e.touches ? e.touches[0] : e;
     imageX += (t.clientX - dragStartX) / zoomLevel;
     imageY += (t.clientY - dragStartY) / zoomLevel;
     dragStartX = t.clientX;
     dragStartY = t.clientY;
     img.style.transform = `scale(${zoomLevel}) translate(${imageX}px,${imageY}px)`;
     e.preventDefault();
    };
    const stop = () => {
     isDragging = false;
    };
    img.addEventListener("mousedown", start);
    img.addEventListener("touchstart", start, { passive: false });
    document.addEventListener("mousemove", drag);
    document.addEventListener("touchmove", drag, { passive: false });
    document.addEventListener("mouseup", stop);
    document.addEventListener("touchend", stop);
   }

... (file continues unchanged) ...
