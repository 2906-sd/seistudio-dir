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
   ABOUT PAGE — PIC CAROUSEL
═══════════════════════════════════════════════════════ */
   const SELFIES = [

    "https://res.cloudinary.com/seioutloud/image/upload/v1784332041/IMG_4225_zjyhzd.jpg",
    "https://res.cloudinary.com/seioutloud/image/upload/v1784332896/Screen_Shot_2026-07-17_at_7.01.13_PM_hrz4c1.png",
    "https://res.cloudinary.com/seioutloud/image/upload/v1784332482/IMG_4698_nqp30c.png",
   ];
   let selfieIndex = 0;
   function renderSelfieCarousel() {
    const img = document.getElementById("selfieCarouselImg");
    if (!img || !SELFIES.length) return;
    img.src = SELFIES[selfieIndex];
    const dots = document.getElementById("selfieCarouselDots");
    if (dots)
     dots.innerHTML = SELFIES.map(
      (_, i) =>
       `<span class="about-jpg-dot${i === selfieIndex ? " is-active" : ""}"></span>`,
     ).join("");
   }
   function selfieCarouselNav(dir) {
    if (!SELFIES.length) return;
    selfieIndex = (selfieIndex + dir + SELFIES.length) % SELFIES.length;
    renderSelfieCarousel();
   }
   document.addEventListener("DOMContentLoaded", renderSelfieCarousel);

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
   ABOUT PAGE — FAVORITES CAROUSELS (monsters / pokemon)
═══════════════════════════════════════════════════════ */
   const PLACEHOLDER_ICON = "https://res.cloudinary.com/seioutloud/image/upload/v1784842594/MH4U-Stygian_Zinogre_Icon_vjtxsw.webp";
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
     if (dots) {
      dots.className = "fave-carousel-counter";
      dots.innerHTML = `${idx + 1} / ${data.length}`;
     }
   }
   function faveCarouselNav(type, dir) {
    const data = FAVE_DATA[type];
    if (!data.length) return;
    faveIndex[type] = (faveIndex[type] + dir + data.length) % data.length;
    renderFaveCarousel(type);
   }
   document.addEventListener("DOMContentLoaded", () => {
    renderFaveCarousel("monster");
    renderFaveCarousel("pokemon");
   });

   /* ═══════════════════════════════════════════════════════
   SEI CORE
═══════════════════════════════════════════════════════ */
   const SEI_CORE_DATA = [
  { img: "https://res.cloudinary.com/seioutloud/image/upload/v1785189483/fbbcafeac22ba9913e7434336ac355fe_psjpvr.jpg", alt: "" },
  { img: "https://res.cloudinary.com/seioutloud/image/upload/v1785187805/7f816b9904173b6e899d01934dfd8caa_rcbfjc.jpg", alt: "" },
  { img: "https://res.cloudinary.com/seioutloud/image/upload/v1785189474/8bd5e5d0272285c8300c9804af36f0ae_ld3kwz.jpg", alt: "" },
  { img: "https://res.cloudinary.com/seioutloud/image/upload/v1785189480/fb39bda3afd8759adcca35df0fab9836_indx9o.jpg", alt: "" },
  { img: "https://res.cloudinary.com/seioutloud/image/upload/v1785187828/2ea209d400b0b76f2a26dd75202e3794_wpsuhi.jpg", alt: "" },
  { img: "https://res.cloudinary.com/seioutloud/image/upload/v1785189480/7660259b4e0cb23af9354a706f640d38_lwev9u.jpg", alt: "" },
  { img: "https://res.cloudinary.com/seioutloud/image/upload/v1785187825/7d545a96dd31f3a72dbd4b1e79bbc6e5_omsj9u.jpg", alt: "" },
  { img: "https://res.cloudinary.com/seioutloud/image/upload/v1785187805/41b545a01ca4eed7eae51ecfa062ca11_yvwrkb.jpg", alt: "" },
  { img: "https://res.cloudinary.com/seioutloud/image/upload/v1785187825/47190ac2d4858e525bfe42beab1b27a8_g4hahp.jpg", alt: "" },
  { img: "https://res.cloudinary.com/seioutloud/image/upload/v1785187820/65b3be2306db4a8dbae9e4191a56f9e2_ev4am9.jpg", alt: "" },
  { img: "https://res.cloudinary.com/seioutloud/image/upload/v1785187812/f9e18849deae29bbe7f164485f7c4cbb_lvjrlh.jpg", alt: "" },
  { img: "https://res.cloudinary.com/seioutloud/image/upload/v1785187820/9830cf3fb62f9714e96c29f9ae229a4d_op2623.jpg", alt: "" },
  { img: "https://res.cloudinary.com/seioutloud/image/upload/v1785187807/31c2cbb21224da75a0602f7e71a5f686_sfgmti.jpg", alt: "" },
  { img: "https://res.cloudinary.com/seioutloud/image/upload/v1785187826/2267e85118b3a0a8ff94d082a25e29e2_nd0uf7.jpg", alt: "" },
  { img: "https://res.cloudinary.com/seioutloud/image/upload/v1785187801/5bf7d43111e921c8e86a9b9e80fb8b63_imegoa.jpg", alt: "" },
  { img: "https://res.cloudinary.com/seioutloud/image/upload/v1785187792/809b3254dac4b7bc5b359bc3c7a15dcd_qwz1cd.jpg", alt: "" },
  { img: "https://res.cloudinary.com/seioutloud/image/upload/v1785187810/7b577ed438eac24e0235727c17d8960c_xxjc48.jpg", alt: "" },
  { img: "https://res.cloudinary.com/seioutloud/image/upload/v1785187805/5e260f6d559c18305fbac02ca8971f16_cmwswl.jpg", alt: "" },
  { img: "https://res.cloudinary.com/seioutloud/image/upload/v1785187802/62a5eba7c9e76c2386fb01902e79367a_guxweb.jpg", alt: "" },
  { img: "https://res.cloudinary.com/seioutloud/image/upload/v1785187792/96f39aeacfe154fcb52f9e705fbfe3d6_zhn92j.jpg", alt: "" },
  { img: "https://res.cloudinary.com/seioutloud/image/upload/v1785187814/08b3b793d7f8488e198e6fa57425d84d_qkhluc.jpg", alt: "" },
  { img: "https://res.cloudinary.com/seioutloud/image/upload/v1785187808/3fb2be16435f86c3a2806e00e625affe_aqpyax.jpg", alt: "" },
  { img: "https://res.cloudinary.com/seioutloud/image/upload/v1785187806/cd2751a3e1dd828ba9c56e3d985b578c_glupir.jpg", alt: "" },
  { img: "https://res.cloudinary.com/seioutloud/image/upload/v1785187819/f0d8ff20e50f320cc8a15ceae402368e_aet586.jpg", alt: "" },
  { img: "https://res.cloudinary.com/seioutloud/image/upload/v1785187791/94bc9a72dce6a9f68bd4c7886102dfb7_eqr47q.jpg", alt: "" },
  { img: "https://res.cloudinary.com/seioutloud/image/upload/v1785187797/28a6ffbd358ca0acd185b0dd330a8566_dtyatn.jpg", alt: "" },
  { img: "https://res.cloudinary.com/seioutloud/image/upload/v1785187818/902b4bf21d5976e120b1b206e376717b_znj2eg.jpg", alt: "" },
  { img: "https://res.cloudinary.com/seioutloud/image/upload/v1785187813/4fd8e1d6a4b4a1253a7b1403b81c4313_kuhwrq.jpg", alt: "" },
  { img: "https://res.cloudinary.com/seioutloud/image/upload/v1785187809/cb8bcd1cc350a0fb9cfbbdba8351a27e_nuuos1.jpg", alt: "" },
  { img: "https://res.cloudinary.com/seioutloud/image/upload/v1785187818/554c2ed0a29fe41a6765d97ba895ee71_acqiae.jpg", alt: "" },
  { img: "https://res.cloudinary.com/seioutloud/image/upload/v1785187815/24db7e8fbc09c4ce6e41b131dac30623_rwcxwg.jpg", alt: "" },
  { img: "https://res.cloudinary.com/seioutloud/image/upload/v1785187798/8fa71fb8ca48c92643de9e764bb692ee_pnz5hf.jpg", alt: "" },
  { img: "https://res.cloudinary.com/seioutloud/image/upload/v1785187817/e4fde1fd058f1d1089424a10d263bddb_mlfzp1.jpg", alt: "" },
  { img: "https://res.cloudinary.com/seioutloud/image/upload/v1785187798/d0706493c7174ef56e109c8181f85021_s8mhej.jpg", alt: "" },
  { img: "https://res.cloudinary.com/seioutloud/image/upload/v1785187814/682840e9f932becd7e9129a4f97368b0_aqyfym.jpg", alt: "" },
  { img: "https://res.cloudinary.com/seioutloud/image/upload/v1785187814/9019eab212bce83987441c5eecb9a365_tnsfor.jpg", alt: "" },
  { img: "https://res.cloudinary.com/seioutloud/image/upload/v1785187791/a157c372e29c851b8232517c78c4b5a6_dgrpeg.jpg", alt: "" }
];

   function renderSeiCoreGallery() {
    const gallery = document.getElementById("seiCoreGallery");
    if (!gallery) return;
    const items = SEI_CORE_DATA.filter((item) => item.img);
    if (!items.length) {
     gallery.innerHTML =
      '<p class="widget-hint" style="grid-column:1/-1;text-align:center;padding:2rem;">// no images yet</p>';
     return;
    }
    gallery.innerHTML = items
     .map((item) => `<img src="${item.img}" alt="${item.alt || ""}" loading="lazy" />`)
     .join("");
   }
   document.addEventListener("DOMContentLoaded", renderSeiCoreGallery);

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

    /* -- bulletin board demo: local-only comment list, no real Firebase calls -- */
    function renderDemoBoard() {
     const list = document.getElementById("demoBoardList");
     if (!list) return;
     list.innerHTML = "";
     window._demoBoardData.forEach((c) => {
      const item = document.createElement("div");
      item.className = "demo-board-comment";

      const header = document.createElement("div");
      header.className = "demo-board-comment-header";
      const nameSpan = document.createElement("span");
      nameSpan.textContent = c.name; // textContent, never innerHTML
      const timeSpan = document.createElement("span");
      timeSpan.textContent = c.time;
      header.append(nameSpan, timeSpan);

      const body = document.createElement("div");
      body.className = "demo-board-comment-body";
      body.textContent = c.text; // textContent, never innerHTML

      item.append(header, body);
      list.appendChild(item);
     });
     list.scrollTop = list.scrollHeight;
    }
    window.demoPostComment = function () {
     const nameInput = document.getElementById("demoBoardName");
     const msgInput = document.getElementById("demoBoardMsg");
     const text = msgInput.value.trim();
     if (!text) return;
     const now = new Date();
     window._demoBoardData.push({
      name: nameInput.value.trim() || "Anonymous",
      time: now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
      text: text,
     });
     nameInput.value = "";
     msgInput.value = "";
     renderDemoBoard();
    };

    const SNIPPETS_DATA = {
     "word-of-the-day": {
      title: "Word of the Day Dictionary",
      demoHtml: `
       <div class="wotd-card">
         <div class="wotd-header">
           <span>WORD OF THE DAY</span>
           <button class="wotd-refresh" onclick="demoRefreshWotd()" title="new word">↻</button>
         </div>
         <div class="wotd-body">
           <p class="wotd-word" id="demoWotdWord"></p>
           <p class="wotd-pronunciation" id="demoWotdPronunciation"></p>
           <p class="wotd-definition" id="demoWotdDefinition"></p>
         </div>
       </div>`,
      initDemo: function () {
       const list = [
        { word: "petrichor", pronunciation: "peh-TRY-kor", definition: "the smell of earth after rain" },
        { word: "apricity", pronunciation: "uh-PRISS-ih-tee", definition: "the warmth of the sun in winter" },
        { word: "sonder", pronunciation: "SON-der", definition: "the realization that every stranger has a life as vivid and complex as your own" },
       ];
       window._demoWotdList = list;
       window._demoWotdLastIdx = -1;
       const msPerDay = 1000 * 60 * 60 * 24;
       const index = Math.floor(Date.now() / msPerDay) % list.length;
       window._demoWotdLastIdx = index;
       const entry = list[index];
       const wordEl = document.getElementById("demoWotdWord");
       const pronEl = document.getElementById("demoWotdPronunciation");
       const defEl = document.getElementById("demoWotdDefinition");
       if (wordEl) wordEl.textContent = entry.word;
       if (pronEl) pronEl.textContent = "/ " + entry.pronunciation + " /";
       if (defEl) defEl.textContent = entry.definition;
      },
      blurb:
       "A little widget that shows a new word, its pronunciation, and definition each day. You don't need <b>API</b> or backend, just a list of your favorite words! The word changes automatically at midnight and stays the same all day for every visitor. The <b>JavaScript</b> uses the current date to pick an index from an <b>array</b>, so it's deterministic (same day = same word for everyone). You could also use the widget to display your favorite quotes, favorite insults, maybe a word in a language that you like! Here's how to set one up and make it your own.",
      sections: [
        {
         label: "Step 1: The HTML",
         note:
          "Drop this wherever you want your widget to show up. The &lt;p&gt; tags with IDs (like id=\"wotdWord\") are placeholders — the JavaScript will fill them in with the actual word, pronunciation, and definition. You don't need to touch this again once it's placed. If you want to use your own labels (as in, replace 'wotd' with something else) just make sure it's consistent throughout the code!",
        lang: "html",
        code:
`<div class="wotd-card">
  <div class="wotd-header">
    <span>WORD OF THE DAY</span>
    <button class="wotd-refresh" onclick="refreshWotd()" title="new word">↻</button>
  </div>
  <div class="wotd-body">
    <p class="wotd-word" id="wotdWord"></p>
    <p class="wotd-pronunciation" id="wotdPronunciation"></p>
    <p class="wotd-definition" id="wotdDefinition"></p>
  </div>
</div>`,
      },
        {
         label: "Step 2: The Word List",
         note:
          "Compile all your favorite words, their pronunciation and definition! These are just examples, so swap these out for your own words. Each entry is an object (a collection of related values) with three properties: word, pronunciation, and definition. Add as many as you'd like, just follow the same pattern.",
        lang: "javascript",
        code:
`const WOTD_LIST = [
  {
    word: "petrichor",
    pronunciation: "peh-TRY-kor",
    definition: "the smell of earth after rain",
  },
  {
    word: "apricity",
    pronunciation: "uh-PRISS-ih-tee",
    definition: "the warmth of the sun in winter",
  },
  {
    word: "sonder",
    pronunciation: "SON-der",
    definition:
      "the realization that every stranger has a life as vivid and complex as your own",
  },
  // add as many of your own as you'd like! Just make sure that when you're adding new words, you have the opening and closing brackets and the comma, easy to miss but any error like that will break your script.


];`,
      },
        {
         label: "Step 3: The JavaScript",
         note:
          "This picks a word based on today's date. The getDayNumber() function calculates how many days have passed since January 1, 1970 (this i just a standard reference point in programming), then the % (modulo) operator gives us the remainder when divided by the list length. This cycles through the list, picking a different word each day. The renderWordOfTheDay() function finds the HTML elements by their IDs and fills them in with the word's details.",
        lang: "javascript",
        code:
`function getDayNumber() {
  // milliseconds in a day: 1000ms × 60s × 60m × 24h
  const msPerDay = 1000 * 60 * 60 * 24;
  // Date.now() gives current time in milliseconds since Jan 1, 1970
  // Math.floor() rounds down to a whole number
  return Math.floor(Date.now() / msPerDay);
}

function renderWordOfTheDay() {
  const list = WOTD_LIST;
  if (!list.length) return; // exit if list is empty

  // % (modulo) cycles through the list: 0, 1, 2, 0, 1, 2...
  const index = getDayNumber() % list.length;
  const entry = list[index];

  // find the HTML elements and fill them in
  document.getElementById("wotdWord").textContent = entry.word;
  document.getElementById("wotdPronunciation").textContent =
    "/ " + entry.pronunciation + " /";
  document.getElementById("wotdDefinition").textContent = entry.definition;
}

// wait for the page to load, then run the function
document.addEventListener("DOMContentLoaded", renderWordOfTheDay);`,
      },
        {
          label: "Step 4: The CSS",
          note:
           "This is just a starting point based on my site's style, you can restyle to fit your own site. Swap out the colors, fonts, and sizes for whatever matches your look. If you've set up CSS variables (like from the Theme System tutorial), you can replace the hardcoded values below with var(--your-variable) so the card updates automatically if your site has different themes.",
         lang: "css",
         code:
`.wotd-card {
   background: #fcf9f9;
   border: 1.5px solid #ccc;
   border-radius: 7px;
   overflow: hidden;
   max-width: 320px;
}

.wotd-header {
   background: #9bb063;
   color: #fff;
   font-family: monospace;
   font-size: 10px;
   font-weight: 700;
   letter-spacing: 0.05em;
   text-transform: uppercase;
   padding: 0.5rem 1rem;
   display: flex;
   align-items: center;
   justify-content: space-between;
}

.wotd-refresh {
   background: none;
   border: 1px solid rgba(255, 255, 255, 0.5);
   color: #fff;
   font-family: monospace;
   font-size: 10px;
   font-weight: 700;
   padding: 1px 6px;
   border-radius: 3px;
   cursor: pointer;
   line-height: 1;
   transition: background 0.15s, border-color 0.15s;
}

.wotd-refresh:hover {
   background: rgba(255, 255, 255, 0.15);
   border-color: rgba(255, 255, 255, 0.8);
}

.wotd-body {
   padding: 1rem 1.25rem;
   font-family: monospace;
}

.wotd-word {
   font-size: 1.1rem;
   font-weight: 700;
   text-transform: capitalize;
   color: #1e2218;
   margin-bottom: 0.15rem;
}

.wotd-pronunciation {
   font-size: 0.7rem;
   color: #888;
   margin-bottom: 0.6rem;
}

.wotd-definition {
   font-size: 0.8rem;
   color: #1e2218;
   margin-bottom: 0;
}`,
      },
      {
       label: "Step 5: Add a Refresh Button (Optional)",
       note:
         "By default, the word only changes once a day. Mine has a refresh button~ if you want visitors (or yourself!) to be able to cycle through the list on demand, add a refresh button that picks a random word instead of using the date. The <b>do...while</b> loop ensures it never picks the same word twice in a row, it just keeps re-rolling until it gets a different one. You can use this as your only display mode, or keep the daily word as the default and let the button override it.",
       lang: "javascript",
       code:
`// track which word is currently showing so it doesn't repeat
let wotdLastIndex = -1;

function refreshWotd() {
   const list = WOTD_LIST;
   if (!list.length) return;

   // pick a random index, but not the same one as last time
   let index;
   do {
      index = Math.floor(Math.random() * list.length);
   } while (index === wotdLastIndex && list.length > 1);
   wotdLastIndex = index;

   const entry = list[index];
   document.getElementById("wotdWord").textContent = entry.word;
   document.getElementById("wotdPronunciation").textContent =
      "/ " + entry.pronunciation + " /";
   document.getElementById("wotdDefinition").textContent = entry.definition;
}`,
      },
     ],
      tip:
       "If you'd like a truly random word instead of a daily one, swap <code>getDayNumber() % list.length</code> for <code>Math.floor(Math.random() * list.length)</code> — just know it'll pick a new one on every page refresh instead of once a day.<br><br><b>Sources &amp; further reading:</b><br>&bull; <a href=\"https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date\" target=\"_blank\" rel=\"noopener\">MDN: Date reference</a><br>&bull; <a href=\"https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array\" target=\"_blank\" rel=\"noopener\">MDN: Array reference</a><br>&bull; <a href=\"https://developer.mozilla.org/en-US/docs/Web/API/Document/DOMContentLoaded_event\" target=\"_blank\" rel=\"noopener\">MDN: DOMContentLoaded event</a><br><br><b>See a similar build:</b><br>&bull; <a href=\"https://codepen.io/alamm/pen/bExmvp\" target=\"_blank\" rel=\"noopener\">Random Quote Generator</a>",
    },

    "popup-modal": {
     title: "Content Advisory Pop-Up",
     demoHtml: `
      <button class="demo-modal-btn" onclick="openDemoModal()">Preview Advisory</button>
      <div class="demo-modal-overlay" id="demoModalOverlay">
        <div class="demo-modal-box">
          <div class="demo-modal-header">
            <span>POP UP MODAL MESSAGE</span>
          </div>
          <div class="demo-modal-body" style="text-align:center; gap:0.8rem;">
            <p style="font-size:1.5rem; color:#c33; margin-bottom:0.2rem;">!!</p>
            <p><strong>[ ! ] NOTICE:</strong> This is a pop up modal, You're supposed to put an important message here.</p>
            <div class="demo-modal-actions" style="justify-content:center;">
              <button class="demo-modal-action demo-modal-action-primary" onclick="closeDemoModal()">Enter System</button>
              <button class="demo-modal-action" onclick="closeDemoModal()">Abort / Take Me Back</button>
            </div>
          </div>
        </div>
      </div>`,
     blurb:
      " You had to click through a pop up modal when you first visited this place! A pop up modal is an overlay that sits on top of the entire page and blocks everything underneath until it's dismissed. It's the same core recipe as any auto-show pop-up: <b>display: flex</b> to show, <b>display: none</b> to hide, an <b>overflow: hidden</b> class on the <b>&lt;body&gt;</b> to lock scrolling behind it, and a simple <b>function</b> to dismiss it. These are great for content advisory or a quick update message. Hit the button above to preview the example, then you can see how to build the same thing from scratch so you can swap in your own message.",
     sections: [
      {
       label: "Step 1: The HTML",
       note:
         "The advisory markup goes right inside your <b>&lt;body&gt;</b> tag. You should put it near the top, ideally above the rest of your site content. Doing this will make it load early and be the first thing a visitor sees on your site. The key detail: the overlay starts with <b>style=\"display: flex\"</b> so it's visible immediately on page load, no <b>JavaScript</b> needed to show it. The <b>class</b> on the <b>&lt;body&gt;</b> (\"modal-lock\") is what prevents scrolling behind it. <b>Enter System</b> dismisses the advisory and lets them into the site; <b>Abort</b> is a plain link that sends anyone who'd rather not proceed somewhere else entirely (mine takes people back to neocities, you can do that or Google!), instead of just closing the box. Change the text to whatever you’d like.",
        lang: "html",
        code:
`<body class="modal-lock">
  <!-- ...rest of your page... -->

  <!-- visible immediately because of style="display: flex" -->
  <div class="popup-modal-overlay" id="popupModalOverlay" style="display: flex">
    <div class="popup-modal">
      <div class="popup-modal-header">
        <span>NOTICE</span>
      </div>
      <div class="popup-modal-body">
        <p>This is an unfiltered, personal space. Some content may touch on heavy topics — please prioritize your own comfort above all else.</p>
        <div class="popup-modal-actions">
          <button class="popup-modal-btn-primary" onclick="dismissModal()">Enter System</button>
          <a class="popup-modal-btn-secondary" href="https://example.com">Abort / Take Me Back</a>
        </div>
      </div>
    </div>
  </div>
</body>`,
      },
      {
       label: "Step 2: The CSS",
       note:
         "The overlay covers the full screen using <b>position: fixed</b> (stays in place even when you scroll) and <b>inset: 0</b> (shorthand for top, right, bottom, left all set to 0). It centers the box with <b>align-items</b> and <b>justify-content</b>. The <b>z-index</b> keeps it above everything else. The <b>.modal-lock</b> class on the body sets <b>overflow: hidden</b> to prevent background scrolling. All the styling below is a starting point — swap colors, fonts, sizes, and layout to match your site.",
        lang: "css",
        code:
`/* lock scroll behind the advisory */
body.modal-lock {
  overflow: hidden;
}

.popup-modal-overlay {
  position: fixed;          /* stays in place, covers the whole screen */
  inset: 0;                 /* shorthand for top/right/bottom/left: 0 */
  background: var(--bg);    /* match your site's background */
  z-index: 10000;           /* above everything else */
  display: none;            /* hidden by default (overridden by inline style) */
  align-items: center;      /* centers content vertically */
  justify-content: center;  /* centers content horizontally */
  padding: 1rem;
}

.popup-modal {
  background: var(--bg2);
  border: 1.5px solid var(--border);
  border-radius: 7px;
  box-shadow: 8px 8px 0px rgba(0, 0, 0, 0.15);
  width: 92vw;              /* 92% of viewport width */
  max-width: 440px;         /* but no wider than 440px */
}

.popup-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--accent);
  color: var(--text-inv);
  font-family: monospace;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.6rem 1rem;
}

.popup-modal-body {
  padding: 1.5rem;
  font-family: monospace;
  font-size: 13px;
  line-height: 1.6;
  text-align: center;
}

.popup-modal-actions {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-top: 1rem;
}

.popup-modal-btn-primary {
  font-family: monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 10px 16px;
  border-radius: 4px;
  cursor: pointer;
  background: var(--accent);
  color: var(--text-inv);
  border: 1.5px solid var(--accent);
}

.popup-modal-btn-secondary {
  font-family: monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 10px 16px;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
  text-align: center;
  background: transparent;
  color: var(--text-muted);
  border: 1.5px solid var(--border);
}`,
      },
      {
       label: "Step 3: The JavaScript",
       note:
         "The dismiss function is straightforward: it hides the overlay by setting <b>display</b> to <b>\"none\"</b> and removes the <b>\"modal-lock\"</b> class from the <b>&lt;body&gt;</b> to re-enable scrolling. That's it! No <b>event listeners</b>, no <b>classList.toggle()</b>, because this advisory only opens on page load (via the inline style) and closes when the visitor clicks <b>Enter System</b>. The <b>Abort</b> link doesn't need any JavaScript at all, it's a plain <b>&lt;a&gt;</b> tag that just navigates away.",
        lang: "javascript",
        code:
`function dismissModal() {
  // hide the overlay
  document.getElementById("popupModalOverlay").style.display = "none";
  // re-enable page scrolling
  document.body.classList.remove("modal-lock");
}`,
      },
      {
       label: "Step 4: Show Only Once (Returning Visitors Skip It)",
       note:
         "If you don't want repeat visitors to see the same advisory every time they visit, use <b>localStorage</b>. This is a way for websites to remember things between visits, kinda like a tiny notebook in the browser. When the visitor dismisses it, it basically saves a note saying “this person has already answered before, let them through.” On page load, check for that flag: if it exists, hide the advisory immediately and remove the lock class so the page works normally.",
        lang: "javascript",
         code:
`// on page load, check if they've already seen it
document.addEventListener("DOMContentLoaded", () => {
  try {
    if (localStorage.getItem("modalSeen")) {
      // they've seen it — hide it right away
      document.getElementById("popupModalOverlay").style.display = "none";
      document.body.classList.remove("modal-lock");
    }
  } catch (_) {
    // if localStorage is blocked (private browsing), just show it
  }
});

function dismissModal() {
  document.getElementById("popupModalOverlay").style.display = "none";
  document.body.classList.remove("modal-lock");
  // remember that this visitor already saw it
  try { localStorage.setItem("modalSeen", "1"); } catch (_) {}
}`,
      },
      {
       label: "Step 5: Show Only on a Specific Page",
       note:
         "If you only want the advisory on one page (e.g., your home page or a page with certain content), just put its <b>HTML</b> on that page's section only — it simply won't exist on other pages. If your site is a single-page app like mine (where everything lives in one <b>HTML</b> file), wrap the auto-show logic in a condition that checks which section is active.",
        lang: "javascript",
         code:
`// only show the advisory when the visitor is on the home page
document.addEventListener("DOMContentLoaded", () => {
  const currentSection = document.querySelector("section.active");
  if (!currentSection || currentSection.id !== "home") {
    // not the home page — hide the advisory and unlock scroll
    var overlay = document.getElementById("popupModalOverlay");
    if (overlay) overlay.style.display = "none";
    document.body.classList.remove("modal-lock");
    return;
  }

  // on the home page — check if they've already seen it
  try {
    if (localStorage.getItem("modalSeen")) {
      document.getElementById("popupModalOverlay").style.display = "none";
      document.body.classList.remove("modal-lock");
    }
  } catch (_) {}
});`,
      },
     ],
      tip:
       "Combine the \"once\" and \"specific page\" patterns so the advisory only auto-shows on your home page and only on a visitor's first visit. Keep the wording short and centered, a wall of text is easy to skim past without reading, which defeats the point of an advisory (unless you’re using the pop up modal to display new updates and you happen to have a lot of updates, then carry on. Use a high <code>z-index</code> (like 10000) so it sits above your nav, sidebars, and any other overlays. And make sure <b>Abort</b> actually goes somewhere !! since some visitors will genuinely want to leave rather than dismiss and scroll past.<br><br><b>Sources &amp; further reading:</b><br>&bull; <a href=\"https://developer.mozilla.org/en-US/docs/Web/CSS/position\" target=\"_blank\" rel=\"noopener\">MDN: position</a><br>&bull; <a href=\"https://developer.mozilla.org/en-US/docs/Web/CSS/z-index\" target=\"_blank\" rel=\"noopener\">MDN: z-index</a><br>&bull; <a href=\"https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage\" target=\"_blank\" rel=\"noopener\">MDN: Window.localStorage</a><br><br><b>See a similar build:</b><br>&bull; <a href=\"https://webdesign.tutsplus.com/how-to-build-flexible-modal-dialogs-with-html-css-and-javascript--cms-33500t\" target=\"_blank\" rel=\"noopener\">Envato Tuts+: Building flexible modal dialogs from scratch</a>",
    },

    "theme-toggle": {
     title: "Theme System + Toggle",
     demoHtml: `
      <div class="demo-theme-system" id="demoThemeSystem">
        <div class="demo-theme-system-card">
          <h4 class="demo-theme-system-heading">Sample Card</h4>
          <p class="demo-theme-system-text">This heading, this text, the border, and the button are all pointing at the same three variables. Click the button to cycle through three different themes!</p>
          <button class="demo-theme-system-btn" tabindex="-1">A Button</button>
        </div>
        <button class="demo-theme-toggle-btn" onclick="toggleDemoThemeSystem()">
          Switch to <span id="demoThemeSystemLabel">Dark</span>
        </button>
      </div>`,
      blurb:
       "This is the starting point behind every theme-based tutorial on this page. It’s hard to keep up with hex color values and sizing, especially if you want to have more than one theme and you want things to be consistent without any accidental repeats. Instead of writing separate colors and other values for every element in light mode and dark mode, you store each one ONCE as a <b>CSS variable</b> (think of it like a nickname for a color/value), then swap those variables when the theme changes. Try the demo above — it cycles through three themes (light, dark, and sepia), and one click updates the heading, text, border, and button all at once. The trick is a <b>class</b> toggle on the <b>&lt;body&gt;</b> that triggers all the <b>var()</b> references to update at once. Let's build one from scratch.",
     sections: [
      {
       label: "Step 1: Create Color Variables",
       note:
          "First, we need to give our colors nicknames. In CSS, we do this with something called 'variables' — they start with two dashes (--) and live inside a special rule called :root (which just means 'at the very top of your stylesheet, available everywhere, use it as a key'). Pick out the colors want to use — background, text, an accent color, borders — and give each one a name. You can also add different fonts for the themes too.",
        lang: "css",
        code:
`:root {
  --bg: #fff1f1;        /* light pink background */
  --text: #1e2218;      /* dark gray text */
  --accent: #9bb063;    /* green accent */
  --border: #be1a32;    /* red border */
}`,
      },
      {
       label: "Step 2: Use Those Variables Everywhere",
       note:
          "Instead of typing the actual color codes (like #fff1f1) every time you style something, you use var(--bg), var(--text), etc. The var() function just means 'use the value of this variable.' This way, if you ever want to change a color, you only change it in one place — :root — and every element that uses it updates automatically!",
        lang: "css",
        code:
`body {
  background: var(--bg);    /* uses --bg from :root */
  color: var(--text);       /* uses --text from :root */
}

.card {
  background: var(--bg);
  color: var(--text);
  border: 1.5px solid var(--border);
}

.button {
  background: var(--accent);
  color: var(--text);
}`,
      },
       {
        label: "Step 3: Define Your Second Theme",
        note:
           "Now for your second theme. You can make this anything you want: a dark mode, a cutesy theme, a cybercore look, a high-contrast option—whatever you like! Just create a new rule (I'll use body.dark as an example, because I'm lazy) and redefine those same variable names with new color values. When the 'dark' class gets added to the &lt;body&gt; tag, all those var() references will automatically switch to your new values. Keep in mind: any variables defined on :root (or body) that you don't explicitly override in body.dark will just keep their original values from theme 1. So if var(--text) was set to #fbfbfb (white) in your base theme, and you forget to redefine var(--text) in body.dark, your dark theme will still use white text! Pay close attention to your variables so your colors don't clash unexpectedly.",
        lang: "css",
        code:
`/* your second theme — doesn't have to be dark! */
body.dark {
  --bg: #000000;        /* black background */
  --text: #fbfbfb;      /* white text */
  --accent: #596cff;    /* blue accent */
  --border: #3a3a3a;    /* dark gray border */
}`,
      },
      {
       label: "Step 4: Add a Toggle Button",
       note:
          "Now you need a way to switch themes. Add a button that calls a JavaScript function when clicked. The onclick=\"toggleTheme()\" part tells the button to run that function.",
        lang: "html",
        code:
`<button id="themeToggle" onclick="toggleTheme()">
  Switch Theme
</button>`,
      },
      {
       label: "Step 5: Write the Toggle Function",
       note:
           "This function does two things: (1) it adds or removes the 'dark' class on the &lt;body&gt; tag (classList.toggle() means 'if the class is there, remove it; if it's not, add it'), which triggers all the CSS variables to switch, and (2) it saves the visitor's choice using localStorage.",
        lang: "javascript",
        code:
`function toggleTheme() {
  // toggle means: add the class if it's not there, remove it if it is
  document.body.classList.toggle("dark");
  
  // check if dark mode is now on
  const isDark = document.body.classList.contains("dark");
  
  // save their choice for next time
  localStorage.setItem("theme", isDark ? "dark" : "light");

  // keep the button label in sync with the current theme
  const btn = document.getElementById("themeToggle");
  if (btn) btn.textContent = isDark ? "Switch to Light" : "Switch to Dark";
}`,
      },
      {
        label: "Step 6: Remember Their Choice on Page Load",
        note:
            "When someone visits your site, you want to load their saved theme right away so they don't see a flash of the wrong colors! This code checks localStorage for a saved preference and applies it before the page finishes rendering. Put it in a &lt;script&gt; tag as close to the top of your &lt;body&gt; as possible (before any visible content!!) so the theme is set before anything paints on screen. It also updates the toggle button's label to match the current state.",
         lang: "javascript",
         code:
`// check if they visited before and picked dark mode
if (localStorage.getItem("theme") === "dark") {
   // add the class right away so CSS picks it up instantly
   document.body.classList.add("dark");
}

// update the toggle button to reflect the current state
// this runs after the page loads, so the button text is correct
document.addEventListener("DOMContentLoaded", function () {
   var btn = document.getElementById("themeToggle");
   if (!btn) return;

   var isDark = document.body.classList.contains("dark");
   btn.textContent = isDark ? "Switch to Light" : "Switch to Dark";
});`,
      },
      {
       label: "Bonus: How to Make 3+ Themes",
       note:
          "Are you a greedy ***** or simply a person that contains multitudes? If you want more than two themes, you have to do something a little different.  Classes can only be on or off, so for 3+ themes you need use something called a 'data attribute' instead. Data attributes are custom attributes you can add to any HTML element (like data-theme=\"sepia\"), and they can hold any text value — not just on/off. In CSS, you target them with body[data-theme=\"sepia\"] instead of body.sepia.",
        lang: "css",
        code:
`/* default theme (no data-theme attribute needed) */
:root {
  --bg: #fff1f1;
  --text: #1e2218;
  --accent: #9bb063;
}

/* dark theme */
body[data-theme="dark"] {
  --bg: #000000;
  --text: #fbfbfb;
  --accent: #596cff;
}

/* sepia theme */
body[data-theme="sepia"] {
  --bg: #f4ecd8;
  --text: #5b4636;
  --accent: #8b6914;
}

/* ocean theme */
body[data-theme="ocean"] {
  --bg: #e8f4f8;
  --text: #1a3a4a;
  --accent: #2e86ab;
}`,
      },
      {
       label: "Bonus: Cycling Through Multiple Themes",
       note:
          "With data attributes, your toggle function just reads the current theme name, finds it in a list, and moves to the next one. The % (modulo) operator is a trick to loop back to the start. When you reach the end of the list, it wraps around to index 0.",
        lang: "javascript",
        code:
`// list your themes in order
const themes = ["light", "dark", "sepia", "ocean"];

function cycleTheme() {
  // get current theme, or 'light' if none set
  const current = document.body.getAttribute("data-theme") || "light";
  
  // find where we are in the list (indexOf returns the position)
  const idx = themes.indexOf(current);
  
  // move to the next one, looping back to 0 if at the end
  // % is the modulo operator — it gives the remainder after division
  // so (3 + 1) % 4 = 0, which loops us back to the start
  const next = themes[(idx + 1) % themes.length];
  
  // apply the new theme
  if (next === "light") {
    document.body.removeAttribute("data-theme");
  } else {
    document.body.setAttribute("data-theme", next);
  }
  
  // save it for next time
  localStorage.setItem("theme", next);
}`,
      },
     ],
      tip:
        "I've said it before, I'll say it again. Keep the 'remember their choice' code (Step 6) as close to the top of your page as possible (ideally right after <code>&lt;body&gt;</code> opens) so the theme is set before anything renders. Otherwise visitors might see a flash of the wrong theme. Wrap your localStorage calls in <code>try/catch</code> as a safety net for browsers that block it (like private browsing mode); the toggle still works fine for that visit, it just won't remember. Use the same variable names across all your themes — if your default theme has <code>--bg</code>, every other theme needs a <code>--bg</code> too, or elements will fall back to the browser default. Test your color combinations with a contrast checker to make sure text stays readable in every theme. And remember: your themes don't have to be light/dark. A warm sepia, a pastel palette, a high-contrast option — anything goes as long as the variables change.<br><br><b>Sources &amp; further reading:</b><br>&bull; <a href=\"https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascading_variables/Using_custom_properties\" target=\"_blank\" rel=\"noopener\">MDN: Using CSS custom properties</a><br>&bull; <a href=\"https://developer.mozilla.org/en-US/docs/Web/API/Element/classList\" target=\"_blank\" rel=\"noopener\">MDN: Element.classList</a><br>&bull; <a href=\"https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage\" target=\"_blank\" rel=\"noopener\">MDN: Window.localStorage</a><br>&bull; <a href=\"https://webaim.org/resources/contrastchecker/\" target=\"_blank\" rel=\"noopener\">WebAIM Contrast Checker</a><br><br><b>See a similar build:</b><br>&bull; <a href=\"https://www.digitalocean.com/community/tutorials/css-theming-custom-properties\" target=\"_blank\" rel=\"noopener\">DigitalOcean: Creating a dark-mode theme with CSS variables</a>",
    },

    "falling-elements": {
     title: "Falling Decorative Elements",
     demoHtml: `<div class="demo-falling-field" id="demoFallingField"></div>`,
     initDemo: function () {
      stopFallingDemo();
      const field = document.getElementById("demoFallingField");
      if (!field) return;
      field.innerHTML = "";
      fallingDemoInterval = setInterval(spawnFallingDemoItem, 260);
     },
      blurb:
       "Little decorative shapes that spawn on a timer and drift down the page. This site uses a flower character, but the same setup works with any character, emoji, or image. A <b>setInterval()</b> loop creates new elements at a fixed rate, each one with randomized size, speed, and position, and an <b>event listener</b> cleans them up when their <b>CSS animation</b> finishes so the <b>DOM</b> never piles up. Here's how it works and how to customize it.",
       sections: [
        {
         label: "Step 1: The HTML",
         note:
          "Just an empty container! Everything inside it gets created and cleaned up by the JavaScript, so this is the only HTML markup you need to add. Think of it as an empty stage where the falling elements will appear.",
        lang: "html",
        code:
`<!-- an empty container -- everything inside gets added by JS -->
<div id="falling-field"></div>`,
      },
        {
         label: "Step 2: The CSS",
         note:
          "The container covers the full screen (<b>position: fixed</b> means it stays in place when you scroll). <b>pointer-events: none</b> lets clicks pass straight through to whatever's underneath, so the falling elements never block the page. z-index: 10 keeps them above other content. The fall and sway movementare two separate animations: an outer element handles the top-to-bottom drop, and an inner element handles the side-to-side sway, so they can run at different speeds independently.",
        lang: "css",
        code:
`#falling-field {
  position: fixed;        /* stays in place, covers the whole screen */
  inset: 0;               /* shorthand for top/right/bottom/left: 0 */
  pointer-events: none;   /* let clicks pass through to the page */
  overflow: hidden;       /* hide anything that goes outside the container */
  z-index: 10;            /* keep it above other content */
}

.falling-item {
  position: absolute;     /* position relative to the container */
  top: 0;
  will-change: transform, opacity;  /* hint to browser for smoother animation */
  animation-name: fall-drop;
  animation-timing-function: steps(14, end);  /* stop-motion effect */
  animation-fill-mode: forwards;  /* stay at final state when done */
}

/* the inner span handles the side-to-side sway, independently of the fall */
.falling-item span {
  display: inline-block;
  animation-name: fall-sway;
  animation-timing-function: steps(6, end);
  animation-iteration-count: infinite;  /* repeat forever */
}

@keyframes fall-drop {
  from { transform: translateY(-10vh); opacity: 0; }  /* start above screen, invisible */
  5%   { opacity: var(--fall-opacity, 0.85); }         /* fade in */
  95%  { opacity: var(--fall-opacity, 0.85); }         /* stay visible */
  to   { transform: translateY(110vh); opacity: 0; }   /* fall below screen, fade out */
}

@keyframes fall-sway {
  0%, 100% { transform: translateX(0) rotate(0deg); }
  25%      { transform: translateX(15px) rotate(90deg); }
  50%      { transform: translateX(-12px) rotate(180deg); }
  75%      { transform: translateX(18px) rotate(270deg); }
}

@media (prefers-reduced-motion: reduce) {
  #falling-field { display: none; }  /* respect user's motion preferences! */
}`,
      },
        {
         label: "Step 3: The JavaScript",
         note:
          "Each spawn creates one element with randomized size, speed, position, and opacity so they don't all look identical, then removes itself once its fall animation finishes — so the DOM (the page's structure) never keeps piling up with old elements. <b>MAX_ITEMS</b> just caps how many can exist on screen at once, and you can adjust the number to whatever you like (I’d keep in mind visibility though.) <b>setInterval()</b> runs the spawn function repeatedly at a fixed interval, it’s like a timer.",
        lang: "javascript",
        code:
`const MAX_ITEMS = 45;           // max falling elements on screen at once
const SPAWN_INTERVAL = 350;     // milliseconds between each new element
let activeCount = 0;            // how many are currently on screen

function spawnItem() {
  if (activeCount >= MAX_ITEMS) return;  // stop if we've hit the limit

  const field = document.getElementById("falling-field");
  const outer = document.createElement("span");  // create outer element
  const inner = document.createElement("span");  // create inner element
  outer.className = "falling-item";
  inner.textContent = "✿";  // swap for any character, or word, or see the sprite tip below

  // randomize everything so they don't all look the same
  const size = Math.random() * 14 + 12;           // font size: 12-26px
  const fallDuration = Math.random() * 6 + 7;     // fall time: 7-13 seconds
  const swayDuration = Math.random() * 3 + 2;     // sway time: 2-5 seconds
  const startX = Math.random() * 100;             // horizontal position: 0-100%
  const opacity = (Math.random() * 0.4 + 0.5).toFixed(2);  // opacity: 0.5-0.9

  outer.style.left = startX + "vw";               // set position
  outer.style.fontSize = size + "px";             // set size
  outer.style.setProperty("--fall-opacity", opacity);  // set opacity variable
  outer.style.animationDuration = fallDuration + "s";    // set fall duration
  inner.style.animationDuration = swayDuration + "s";    // set sway duration

  outer.appendChild(inner);   // put inner inside outer
  field.appendChild(outer);   // add to the page
  activeCount++;              // increment counter

  // when animation finishes, remove the element and decrement counter
  outer.addEventListener("animationend", (e) => {
    if (e.target === outer) {
      outer.remove();
      activeCount--;
    }
  });
}

// spawn a new element every SPAWN_INTERVAL milliseconds
setInterval(spawnItem, SPAWN_INTERVAL);`,
      },
        {
         label: "Step 4: Theme-Dependent Colors",
       note:
         "Instead of one fixed color, pick from a small palette based on whether <b>&lt;body&gt;</b> has the <b>.dark</b> class (one palette for light mode, one for dark) so the falling elements always read clearly against the background instead of washing out or clashing when the theme switches. <b>Note:</b> This step only works if you already have a theme system set up that adds/removes a <b>.dark</b> class on the <b>&lt;body&gt;</b> (see the Theme System + Toggle tutorial). If you don't have that yet, just skip this step and use a single fixed color — the rest of the falling elements code works fine without it.",
        lang: "javascript",
        code:
`const LIGHT_COLORS = ["#D0DEA9", "#E8B0B8", "#BE1A32", "#BFCA96"];
const DARK_COLORS  = ["#FA4055", "#FF8293", "#405FFA", "#8A9DF8"];

function spawnItem() {
  if (activeCount >= MAX_ITEMS) return;

  // check if dark mode is on
  const isDark = document.body.classList.contains("dark");
  // pick the right palette
  const palette = isDark ? DARK_COLORS : LIGHT_COLORS;
  // pick a random color from that palette
  const color = palette[Math.floor(Math.random() * palette.length)];

  const field = document.getElementById("falling-field");
  const outer = document.createElement("span");
  const inner = document.createElement("span");
  outer.className = "falling-item";
  inner.textContent = "✿";
  outer.style.color = color;

  // ...the rest of spawnItem (size, duration, position, opacity)
  // stays exactly the same as before
}`,
      },
        {
          label: "Step 5: Flowy & Natural vs. Jittery & Retro",
        note:
         "There are two separate animations running at the same time on each falling element: the <b>outer element</b> (<b>.falling-item</b>) handles the vertical drop from top to bottom, and the <b>inner element</b> (<b>.falling-item span</b>) handles the horizontal side-to-side sway + rotation. You style each one independently. Pick ONE of the two options below. Don't copy both, since the second one would override the first. The only thing that changes between options is the <b>animation-timing-function</b> value on each selector.",
        lang: "css",
        code:
`/* ═══════════════════════════════════════════════════
   OPTION A: RETRO / STOP-MOTION feel (what this site uses)
   The steps() function makes the animation jump between
   a fixed number of frames instead of flowing smoothly.
   ═══════════════════════════════════════════════════ */

/* outer element: vertical drop — 14 frames per cycle */
.falling-item      { animation-timing-function: steps(14, end); }

/* inner element: horizontal sway — 6 frames per cycle */
.falling-item span { animation-timing-function: steps(6, end); }


/* ═══════════════════════════════════════════════════
   OPTION B: SMOOTH / MORE NATURAL feel
   Replace the steps() above with these instead.
   ═══════════════════════════════════════════════════ */

/* outer element: vertical drop — smooth acceleration */
.falling-item      { animation-timing-function: ease-in; }
/* inner element: horizontal sway — smooth easing both ways */
.falling-item span { animation-timing-function: ease-in-out; }


/* ═══════════════════════════════════════════════════
   OPTIONAL: gentler sway keyframes (works with either option)
   Replace the default fall-sway @keyframes with this
   for a less mechanical, more organic drift pattern
   ═══════════════════════════════════════════════════ */
@keyframes fall-sway {
  0%   { transform: translateX(0)    rotate(0deg); }
  20%  { transform: translateX(6px)  rotate(15deg); }
  40%  { transform: translateX(-4px) rotate(-10deg); }
  60%  { transform: translateX(8px)  rotate(20deg); }
  80%  { transform: translateX(-6px) rotate(-8deg); }
  100% { transform: translateX(0)    rotate(0deg); }
}`,
      },
        {
          label: "Step 6 (OPTIONAL): Using a Sprite Image Instead of Text",
          note:
           "Do you want an image instead a text character? Swap the <b>textContent</b> line for an <b>&lt;img&gt;</b> element. Size it with a <b>CSS class</b> rather than inline <b>font-size</b>, since it's no longer type. A good size range is <b>14–24px</b> wide. That's small enough to feel like confetti, large enough to still read as your image! Use <b>height: auto</b> to preserve the image's aspect ratio, and <b>display: block</b> to remove any extra whitespace that inline images can add. ideally you want an image that has a transparent background (<b>PNG</b> or <b>WebP</b>), it'll look clean regardless of your site's look.",
         lang: "javascript",
         code:
`// instead of: inner.textContent = "✿";

const img = document.createElement("img");
img.src = "/images/petal.png";
img.alt = "";
img.className = "falling-item-img";
inner.appendChild(img);`,
      },
        {
          label: "Step 6 (continued): Matching CSS",
          note:
           "Size the image with a class instead of the inline font-size used for the text character version.",
         lang: "css",
         code:
`.falling-item-img {
   width: 18px;       /* 14–24px works well for most sprites */
   height: auto;      /* preserve aspect ratio */
   display: block;    /* remove inline image whitespace */
}`,
      },
        {
         label: "Step 7: Adding a Toggle Button",
         note:
          "Give visitors a way to turn the falling elements on and off! <b>Important:</b> this replaces the plain <code>setInterval(spawnItem, SPAWN_INTERVAL);</code> line from the end of Step 3 — delete that line, since the code below calls <code>startFalling()</code> instead. If you leave the old line in place, you'll end up with two separate spawn loops running at once, and the toggle button will only stop one of them (elements will keep appearing even after clicking \"Disable Effects\"). The button starts the spawn loop if it's stopped, or clears the interval and removes all current elements if it's running. localStorage saves the visitor's preference so it carries over between visits. The init function checks both the saved preference and the prefers-reduced-motion setting on first load.",
         lang: "javascript",
         code:
`// delete the "setInterval(spawnItem, SPAWN_INTERVAL);" line from
// the end of Step 3 — it's replaced by startFalling() below

let spawnInterval = null;

// wrap the spawn loop so it can be started and stopped
function startFalling() {
   if (spawnInterval) return;  // already running
   spawnInterval = setInterval(spawnItem, SPAWN_INTERVAL);
}

function stopFalling() {
   if (spawnInterval) {
      clearInterval(spawnInterval);
      spawnInterval = null;
   }
   // remove all current elements from the page
   var field = document.getElementById("falling-field");
   if (field) field.innerHTML = "";
   activeCount = 0;
}

 function toggleFalling() {
    var btn = document.getElementById("fallingToggle");
    if (spawnInterval) {
       stopFalling();
       localStorage.setItem("fallingOff", "1");
       if (btn) {
          btn.textContent = "Enable Effects";
          btn.classList.remove("is-active");
       }
    } else {
       startFalling();
       localStorage.removeItem("fallingOff");
       if (btn) {
          btn.textContent = "Disable Effects";
          btn.classList.add("is-active");
       }
    }
 }

 // run on page load — check saved preference and motion settings
 function initFalling() {
    var btn = document.getElementById("fallingToggle");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
       if (btn) btn.textContent = "Enable Effects";
       return;  // don't auto-start for motion-sensitive users
    }
    if (localStorage.getItem("fallingOff")) {
       if (btn) btn.textContent = "Enable Effects";
    } else {
       startFalling();
       if (btn) btn.classList.add("is-active");
    }
 }

document.addEventListener("DOMContentLoaded", initFalling);`,
      },
      {
       label: "Toggle Button HTML",
       note:
        "Put this button anywhere on your page like in a nav bar, a settings panel, or a footer. It just needs the right id and onclick so the JavaScript can find it and wire it up.",
       lang: "html",
       code:
`<button id="fallingToggle" onclick="toggleFalling()">Disable Effects</button>`,
      },
      {
       label: "Toggle Button CSS",
       note:
         "Style the toggle button to match your site's look. The <b>.is-active</b> class gets added by the <b>JavaScript</b> when the effect is running, so you can use it to visually indicate the on/off state — for example, a highlighted border when active, or a muted look when off. The <b>transition</b> properties make the color changes smooth instead of instant.",
       lang: "css",
       code:
`#fallingToggle {
  background: var(--bg2);
  border: 1px solid var(--border-lt);
  border-radius: 4px;
  color: var(--text);
  font-family: monospace;
  font-size: 10px;
  padding: 0.4rem 0.55rem;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}

#fallingToggle:hover {
  background: var(--bg4);
  color: var(--accent);
}

/* when the effect is running, highlight the button */
#fallingToggle.is-active {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--bg4);
}`,
      },
     ],
      tip:
       "If you want the little icon itself to animate, you need to use a sprite sheet (one image with several frames laid side by side) and animate <code>background-position</code> with a <code>steps()</code> timing function sized to your frame count. It's the same trick classic 2D game sprites use.<br><br><strong>Note on characters &amp; fonts:</strong> Not every font can render every Unicode character! If your chosen symbol (like ✿ or .ᐟ) shows up as a blank box or question mark, it means your primary font lacks that glyph. To fix this, wrap your symbol in a <code>&lt;span&gt;</code> with dedicated symbol fonts:<br><br><code>&lt;span style=&quot;font-family: 'Segoe UI Symbol', 'Apple Symbols', 'Noto Sans Symbols', sans-serif;&quot;&gt;✿&lt;/span&gt;</code><br><br><strong>Recommended fonts for symbols &amp; special characters:</strong><br>• <strong>Segoe UI Symbol:</strong> Best for Windows users (covers general symbols, geometric shapes, and dingbats).<br>• <strong>Apple Symbols:</strong> The standard fallback built into macOS and iOS.<br>• <strong>Noto Sans Symbols:</strong> Google's comprehensive font for Android/Linux (also available free on Google Fonts for web use).<br>• <strong>Segoe UI Emoji / Apple Color Emoji:</strong> Great if you want characters rendered as full-color emojis.<br><br>Always test your characters in browser dev tools—if a symbol breaks, inspect it under the &quot;Computed&quot; styles tab to see which font the browser is falling back to.<br><br><b>Sources &amp; further reading:</b><br>&bull; <a href=\"https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval\" target=\"_blank\" rel=\"noopener\">MDN: Window.setInterval()</a><br>&bull; <a href=\"https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timing-function\" target=\"_blank\" rel=\"noopener\">MDN: animation-timing-function</a><br>&bull; <a href=\"https://developer.mozilla.org/en-US/docs/Web/CSS/@keyframes\" target=\"_blank\" rel=\"noopener\">MDN: @keyframes</a><br><br><b>See a similar build:</b><br>&bull; <a href=\"https://webdesign.tutsplus.com/how-to-create-animated-snow-on-a-website-with-css-and-javascript--cms-93562t\" target=\"_blank\" rel=\"noopener\">Envato Tuts+: Animated snow with CSS and JavaScript</a>",
     },

    "theme-image": {
     title: "Theme-Dependent Image",
     demoHtml: `
      <div class="demo-theme-swap" id="demoThemeSwap">
        <img
          class="demo-theme-img demo-theme-img-light"
          src="https://res.cloudinary.com/seioutloud/image/upload/v1784841117/color-changed-image_odb3wd.png"
          alt="Light mode version of the hero illustration"
          loading="eager"
        />
        <img
          class="demo-theme-img demo-theme-img-dark"
          src="https://res.cloudinary.com/seioutloud/image/upload/v1784758287/dithered-image-Photoroom_m5mgql.png"
          alt=""
          aria-hidden="true"
          loading="eager"
        />
        <button class="demo-theme-toggle-btn" onclick="toggleDemoTheme()">Toggle Theme</button>
      </div>`,
      blurb:
       "An image that automatically swaps depending on whether your site is in light or dark mode or whatever mode you're in! There’s ni reload needed, like the hero images of this site's home page. The trick is all <b>CSS</b>: both images sit in the <b>DOM</b> at once, and a single <b>class</b> on the <b>&lt;body&gt;</b> controls which one is visible via <b>display: none</b> and <b>display: block</b>. Here's how to set it up.",
      sections: [
       {
        label: "Step 1: The HTML",
        note:
         "Both images load right away, only one shows at a time. The dark version gets alt=\"\" and aria-hidden=\"true\" since it's decorative duplicate content: screen readers should only ever announce the description once, on the version that's actually visible by default. alt=\"\" means 'this image has no text description' and aria-hidden=\"true\" tells screen readers to ignore it.",
        lang: "html",
        code:
`<div class="theme-image-wrap">
  <img
    class="theme-image theme-image-light"
    src="light-version.png"
    alt="Description of the image"
    loading="eager"
  />
  <img
    class="theme-image theme-image-dark"
    src="dark-version.png"
    alt=""
    aria-hidden="true"
    loading="eager"
  />
</div>`,
      },
       {
        label: "Step 2: The CSS",
        note:
          "The light image shows by default and the dark one stays hidden (<b>display: none</b> means 'don't show this'). Whatever function you already use to add or remove a \"dark\" class on &lt;body&gt; (for a full site-wide theme toggle) is all this needs to key off of, so nothing extra required. When body.dark is active, the light-mode image gets hidden and the dark-mode image appears.",
        lang: "css",
        code:
`.theme-image {
  display: block;     /* makes the image behave like a block element */
  width: 100%;
  height: auto;
}

/* show the light version by default, hide the dark one */
.theme-image-dark { display: none; }

/* when the page has a "dark" class on <body>, swap which one shows */
body.dark .theme-image-light { display: none; }   /* hide light */
body.dark .theme-image-dark  { display: block; }  /* show dark */`,
      },
       {
        label: "Step 3: The JavaScript",
        note:
         "This is the entire script! The image swap itself is pure CSS reacting to the class above — so any toggle button, keyboard shortcut, or saved preference that adds/removes .dark on the body will swap the image automatically, with nothing extra to wire up.",
        lang: "javascript",
        code:
`function toggleTheme() {
  document.body.classList.toggle("dark");
}`,
      },
       {
        label: "Optional: Use prefers-color-scheme Instead",
        note:
         "If your site doesn't have its own light/dark switch and instead just wants to follow the visitor's OS-level setting, swap the body.dark selectors for a prefers-color-scheme media query — no JavaScript needed at all. @media (prefers-color-scheme: dark) checks if the user's system is set to dark mode.",
        lang: "css",
        code:
`.theme-image-dark { display: none; }

@media (prefers-color-scheme: dark) {
  .theme-image-light { display: none; }
  .theme-image-dark  { display: block; }
}`,
      },
     ],
      tip:
       "Preload both images (like the <code>loading=\"eager\"</code> above) so there's no flash or pop-in the first time the theme switches, this way the  the browser already has both versions cached and ready to show.<br><br><b>Sources &amp; further reading:</b><br>&bull; <a href=\"https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme\" target=\"_blank\" rel=\"noopener\">MDN: prefers-color-scheme</a><br>&bull; <a href=\"https://developer.mozilla.org/en-US/docs/Web/CSS/display\" target=\"_blank\" rel=\"noopener\">MDN: display</a><br>&bull; <a href=\"https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/loading\" target=\"_blank\" rel=\"noopener\">MDN: HTMLImageElement.loading</a><br><br><b>See a similar build:</b><br>&bull; <a href=\"https://chipcullen.com/how-to-have-dark-mode-image-that-works-with-user-choice-yo/\" target=\"_blank\" rel=\"noopener\">Chip Cullen: Dark & light mode images that respect user choice</a>",
    },

    "custom-loader": {
     title: "Custom Loading Messages",
     demoHtml: `
      <div class="demo-loader-wrap" id="demoLoaderWrap">
        <div class="demo-loader-box">
          <div class="demo-loader-spinner">✿</div>
          <div class="demo-loader-msg" id="demoLoaderMsg">[ LOADING... ]</div>
        </div>
        <button class="demo-theme-toggle-btn" onclick="runDemoLoader()">
          Run Loader
        </button>
      </div>`,
     initDemo: function () {},
     blurb:
      "A loading screen that shows a short, randomized message while the page (or a section) loads, like the one this site uses when you navigate between pages. Instead of a generic spinner (or nothing at all hehe), you get a rotating set of fun, personalized messages that match your site's personality. Each time the loader appears, the <b>JavaScript</b> picks one random message from an <b>array</b> — just one, not cycling through them. It's a small detail, but I think it’s a fun way to make your site more personalized.",
     sections: [
      {
       label: "Step 1: The HTML",
       note:
        "The loader needs a full-screen overlay that sits on top of everything while it's visible. Inside it, put whatever you want to show during the load like a spinning icon, a message, both. The overlay starts hidden (display: none) and only appears when you add the \"show\" class.",
       lang: "html",
       code:
`<div id="loaderOverlay" class="loader-overlay">
  <div class="loader-spinner">✿</div>
  <div class="loader-message" id="loaderMessage">[ LOADING... ]</div>
</div>`,
      },
      {
       label: "Step 2: The CSS",
       note:
        "The overlay covers the full screen (<b>position: fixed</b> means it stays in place even when you scroll) and centers its contents. It starts with <b>display: none</b> so it's invisible by default, the \"show\" class switches it to flex. The spinner uses a simple rotation animation (@keyframes defines the animation, animation: spin applies it). Style these however you want to match your site's aesthetic.",
       lang: "css",
        code:
`.loader-overlay {
   position: fixed;        /* stays in place, covers the whole screen */
   inset: 0;               /* shorthand for top/right/bottom/left: 0 */
   background: #fff;       /* match your site's background color */
   backdrop-filter: blur(2px);
   z-index: 9999;          /* keep it above everything else */
   display: none;          /* hidden by default */
   flex-direction: column;
   align-items: center;    /* center horizontally */
   justify-content: center; /* center vertically */
   gap: 1.5rem;
}

.loader-overlay.show {
   display: flex;          /* show when this class is added */
}

.loader-spinner {
   font-size: 4rem;
   animation: spin 2s linear infinite;  /* rotate forever */
   color: #9bb063;         /* match your accent color */
}

@keyframes spin {
   from { transform: rotate(0deg); }
   to   { transform: rotate(360deg); }
}

.loader-message {
   font-family: monospace;
   font-size: 0.85rem;
   font-weight: bold;
   color: #9bb063;         /* match your accent color */
   text-transform: uppercase;
   letter-spacing: 0.08em;
   text-align: center;
}`,
      },
      {
       label: "Step 3: Write Your Messages",
       note:
        "This is the fun part!! Make an array (a list) of short messages that will randomly appear each time the loader runs. These can be anything: loading puns, system-terminal-style text, inside jokes, mood-setting phrases. The more personality, the better. This site's messages are things like \"[ CLEARING_CACHED_REGRETS... ]\" and \"[ DOWNLOADING_WARMTH.EXE... ]\" — add a little oomf to the user experience.",
       lang: "javascript",
       code:
`const LOADER_MESSAGES = [
  "Preparing your experience...",
  "Gathering the details...",
  "Fetching latest updates...",
  "Polishing pixels...",
  "Almost ready...",
  "Connecting the pieces...",
  // add as many as you want — it picks one at random each time
];`,
      },
      {
       label: "Step 4: The Show / Hide Functions",
       note:
        "<b>showLoader()</b> picks a random message from your list, puts it in the message element, and adds the \"show\" class to make the overlay visible. <b>hideLoader()</b> removes that class. Call <b>showLoader()</b> right before a page transition starts, and <b>hideLoader()</b> once the new content is ready.",
       lang: "javascript",
       code:
`function showLoader() {
  const msg = document.getElementById("loaderMessage");
  // pick a random message from the list
  // Math.random() gives a number between 0 and 1 (like 0.73)
  // multiply by list length to get a number between 0 and list length
  // Math.floor() rounds down to a whole number (like 3)
  // so if list has 9 items, we get a random index from 0 to 8
  msg.textContent =
    LOADER_MESSAGES[Math.floor(Math.random() * LOADER_MESSAGES.length)];
  document.getElementById("loaderOverlay").classList.add("show");
}

function hideLoader() {
  document.getElementById("loaderOverlay").classList.remove("show");
}`,
      },
      {
       label: "Step 5: Wire It Into Page Transitions",
       note:
        "If your site uses JavaScript to switch between sections (like this one does), wrap the transition in <b>showLoader()</b> and <b>hideLoader()</b> with a short delay between them. <b>setTimeout()</b> runs a function after a specified number of milliseconds. The delay is what gives the loader time to actually display so without it, the transition would be instant and the loader would never be visible.",
       lang: "javascript",
       code:
`function showPage(id) {
  showLoader();
  setTimeout(() => {
    // switch to the new page/section here
    switchToSection(id);
    hideLoader();
  }, 800); // wait 800ms (0.8 seconds) before hiding
  // adjust the delay to taste — 600-1200ms feels right
}`,
      },
      {
        label: "Understanding the Random Message Logic",
        note:
         "The key line is <b>Math.floor(Math.random() * LOADER_MESSAGES.length)</b>. Here's how it works step by step:<br><br>&bull; <b>Math.random()</b> generates a random decimal between 0 and 1 (like 0.7342).<br>&bull; Multiplying by <b>LOADER_MESSAGES.length</b> scales it to your array length (0.7342 &times; 9 = 6.6078).<br>&bull; <b>Math.floor()</b> rounds that down to a whole index (6).<br><br>Each time <b>showLoader()</b> runs, it makes a fresh random pick instead of cycling through in order.",
        lang: "javascript",
        code:
`// breaking it down:
const listLength = LOADER_MESSAGES.length;  // say, 9
const randomDecimal = Math.random();         // 0.7342 (random)
const scaled = randomDecimal * listLength;   // 6.6078
const index = Math.floor(scaled);            // 6

// all in one line:
const index = Math.floor(Math.random() * LOADER_MESSAGES.length);

// use it:
const message = LOADER_MESSAGES[index];
msg.textContent = message;`,
      },
      {
        label: "Variation: Using an Image Instead of a Text Spinner",
        note:
         "Let’s say you want a little spinning image instead of a text character. Swap the <b>&lt;div&gt;</b> spinner for an <b>&lt;img&gt;</b> tag. The same <b>@keyframes spin</b> animation applies — just target the image element instead. Use <b>width</b> and <b>height</b> in the <b>CSS</b> to control the size (don't rely on the image's natural dimensions, since they may be too large or too small). Set <b>object-fit: contain</b> to preserve the image's aspect ratio, and <b>display: block</b> to remove any extra whitespace that inline images can add.",
        lang: "html",
        code:
`<div id="loaderOverlay" class="loader-overlay">
  <!-- image spinner instead of a text character -->
  <img class="loader-spinner-img" src="/images/loader.png" alt="" />
  <div class="loader-message" id="loaderMessage">[ LOADING... ]</div>
</div>`,
      },
      {
        label: "Variation (CONTINUED): Image Spinner CSS",
        note:
         "The <b>animation</b> property reuses the same <b>spin</b> keyframes from the text spinner — the only difference is we're targeting an <b>&lt;img&gt;</b> element instead of a <b>&lt;div&gt;</b>. Keep the spinner reasonably small (48–80px works well) so it doesn't overwhelm the message text. Add <b>pointer-events: none</b> so the image doesn't accidentally intercept clicks.",
        lang: "css",
        code:
`.loader-spinner-img {
   width: 64px;              /* control the size explicitly */
   height: 64px;
   object-fit: contain;      /* preserve aspect ratio */
   display: block;           /* remove inline image whitespace */
   animation: spin 2s linear infinite;  /* same spin animation */
   pointer-events: none;     /* don't intercept clicks */
}

/* if you want the image to swap based on light/dark theme,
   use the same pattern from the Theme-Dependent Image tutorial */

body.dark .loader-spinner-img {
   content: url("/images/loader-dark.png");  /* swap image in dark mode */
}

@keyframes spin {
   from { transform: rotate(0deg); }
   to   { transform: rotate(360deg); }
}`,
      },
     ],
     tip:
      "Just a couple of ideas on how to customize further. You can use a different CSS animation for the spinner, or swap the random pick for a sequential one that cycles through messages in order if you'd rather visitors see them all before repeats. If you have different themes for your site, I also recommend adjusting the background color of the loader overlay to match your theme.<br><br><b>Sources &amp; further reading:</b><br>&bull; <a href=\"https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random\" target=\"_blank\" rel=\"noopener\">MDN: Math.random()</a><br>&bull; <a href=\"https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout\" target=\"_blank\" rel=\"noopener\">MDN: Window.setTimeout()</a><br>&bull; <a href=\"https://developer.mozilla.org/en-US/docs/Web/CSS/@keyframes\" target=\"_blank\" rel=\"noopener\">MDN: @keyframes</a><br>&bull; <a href=\"https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter\" target=\"_blank\" rel=\"noopener\">MDN: backdrop-filter</a>",
    },

    "bulletin-board": {
     title: "Realtime Bulletin Board (Firebase)",
     demoHtml: `
      <div class="demo-board-wrap">
        <div class="demo-board-list" id="demoBoardList"></div>
        <div class="demo-board-controls">
          <input type="text" id="demoBoardName" class="demo-board-input" placeholder="Name (optional)" maxlength="30" />
          <div class="demo-board-row">
            <textarea id="demoBoardMsg" class="demo-board-input demo-board-textarea" placeholder="Say something..." maxlength="200" rows="1"></textarea>
            <button class="demo-theme-toggle-btn" onclick="demoPostComment()">Post</button>
          </div>
        </div>
      </div>`,
     initDemo: function () {
      window._demoBoardData = [
       { name: "SEI", time: "9:41 AM", text: "I am inside your comment section." },
       { name: "Anon. Sleepy Pigeon", time: "2:14 PM", text: "coo... just passing through" },
      ];
      renderDemoBoard();
     },
     blurb:
      "A little comment box that syncs in <b>real time</b> using <b>Firebase Realtime Database</b>, a free cloud database from Google that stores your data and instantly pushes any changes out to every visitor watching the page. It's the same <b>backend</b> (the behind-the-scenes part of a site that stores and manages data, as opposed to the <b>frontend</b>, the part visitors actually see and click on) powering the bulletin board on this site. Someone types a message, hits post, and it shows up for everyone else on the page, badabing badaboom. Here's how to make the simple stacked-list version first since it's the most beginner-friendly and easiest to restyle into your own site, then cover turning it into a free-roam corkboard of draggable sticky notes like mine, plus a few tips for keeping it from getting spammed. Try entering a comment in the comment box in the example. :)",
     sections: [
      {
       label: "Step 1: Create a Firebase Project + Realtime Database",
       note:
        "<b>Firebase</b> is a free backend service by Google, we're using it because it needs zero server code on your end, which is perfect for static sites hosted on places like <b>Neocities</b> or <b>GitHub Pages</b>. Go to the <a href=\"https://console.firebase.google.com/\" target=\"_blank\" rel=\"noopener\">Firebase Console</a> and create a new project (you can skip Google Analytics, you don't need it here). Inside your project, click <b>Build → Realtime Database</b> (not <b>Firestore</b>, a separate database product Firebase also offers, more on the difference in the closing tip) and create one, starting in <b>test mode</b> so it's easier to set up, we'll lock it down properly in the next step since test mode leaves it wide open. Then go to <b>Project Settings → General</b>, scroll to \"Your apps,\" and register a new <b>Web app</b>. Firebase will hand you a <b>config object</b>, a small bundle of IDs and URLs that tells your site which Firebase project to talk to, keep it somewhere safe, you'll need it again soon.",
       lang: "javascript",
       code:
`// found in Project Settings → General → Your apps
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

// this isn't a secret password, it's safe to have this visible in your
// site's public JavaScript. Security Rules (next step) are what actually
// control who can read and write your data, not this config.`,
      },
      {
       label: "Step 2: Lock Down Your Database Rules",
       note:
        "Easy step to skip, but please don't! Test mode leaves your database completely open, anyone can read, write, or wipe it entirely, and those rules also expire after 30 days and lock everything shut. <b>Security Rules</b> are Firebase's own gatekeeper, they run on Firebase's servers rather than in a visitor's browser, so unlike a JavaScript check, they can't be edited or skipped by anyone poking around your site's code. In the Firebase Console, go to <b>Realtime Database → Rules</b> and replace them with something like this. It limits writes to a \"comments\" node, and the <b>.validate</b> line rejects anything that isn't shaped like a real comment, like a missing message, or one that's way too long.",
       lang: "json",
       code:
`{
  "rules": {
    "comments": {
      ".read": true,
      ".write": true,
      "$commentId": {
        ".validate": "newData.hasChildren(['text', 'timestamp']) && newData.child('text').isString() && newData.child('text').val().length > 0 && newData.child('text').val().length <= 500"
      }
    },
    "$other": {
      ".read": false,
      ".write": false
    }
  }
}`,
      },
      {
       label: "Step 3: Add the Firebase SDK to Your Site",
       note:
        "An <b>SDK</b> (short for Software Development Kit) is just the bundle of pre-written code a company gives you so you can talk to their service without building that connection yourself. We're using the <b>compat</b> version of Firebase's SDK because it works with a plain &lt;script&gt; tag and creates a global <b>firebase</b> object your code can call, no bundler or build step needed, which matters if you're on a static host. Add both of these BEFORE your own script file, order matters here since your script depends on that global existing first.",
       lang: "html",
       code:
`<!-- check firebase.google.com/docs for the current version number -->
<script src="https://www.gstatic.com/firebasejs/12.16.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/12.16.0/firebase-database-compat.js"></script>

<!-- your own script goes AFTER the two above -->
<script src="script.js"></script>`,
      },
      {
       label: "Step 4: The HTML",
       note:
        "A name field (optional, people can stay anonymous if that's better), a message box, a post button, and an empty list where comments will render in. This structure doesn't lock you into any particular visual style aside from the simple comment box look, restyle it however fits your site, since the JavaScript only looks for the <b>id</b> attributes below, not any specific classes or layout.",
       lang: "html",
       code:
`<div class="comment-box">
  <div class="comment-list" id="commentList"></div>

  <div class="comment-form">
    <input
      type="text"
      id="commentName"
      class="comment-input"
      placeholder="Name (optional)"
      maxlength="30"
    />
    <div class="comment-form-row">
      <textarea
        id="commentText"
        class="comment-input comment-textarea"
        placeholder="Say something..."
        maxlength="500"
        rows="2"
      ></textarea>
      <button class="comment-submit" onclick="postComment()">Post</button>
    </div>
  </div>
</div>`,
      },
      {
       label: "Step 5: Connect to the Database",
       note:
        "Paste in the config object you copied in Step 1, replacing the placeholder values. Then <b>initialize</b> Firebase (start up the connection using your config) and grab a <b>reference</b>, basically a pointer to one specific spot in your database, kind of like a file path, to a \"comments\" node. That's just a name for where all the messages will live, call it whatever you'd like, just stay consistent with whatever name you used in your Security Rules.",
       lang: "javascript",
       code:
`firebase.initializeApp(firebaseConfig); // firebaseConfig is the object from Step 1
const db = firebase.database();
const commentsRef = db.ref("comments");`,
      },
      {
       label: "Step 6: Posting a Comment",
       note:
        "<b>push()</b> adds a new entry under commentsRef with a unique, auto-generated ID, so two comments never collide. <b>firebase.database.ServerValue.TIMESTAMP</b> is a special placeholder value that tells Firebase to fill in the current time using its own server clock once the write lands, instead of trusting the visitor's device clock, which could be wrong, or deliberately faked. Always <b>trim()</b> the text (strips extra whitespace from the start and end) and bail out early if it's empty, so no one can post a blank comment.",
       lang: "javascript",
       code:
`function postComment() {
  const textInput = document.getElementById("commentText");
  const nameInput = document.getElementById("commentName");
  const text = textInput.value.trim();
  if (!text) return; // don't post empty comments

  const name = nameInput.value.trim() || "Anonymous";

  commentsRef.push({
    name: name,
    text: text,
    timestamp: firebase.database.ServerValue.TIMESTAMP,
  });

  textInput.value = "";
  nameInput.value = "";
}`,
      },
      {
       label: "Step 7: Displaying Comments in Real Time",
       note:
        "<b>child_added</b> is a type of <b>listener</b>, a function that runs automatically whenever something happens instead of you having to check for it yourself. It fires once for every existing comment when the page first loads, then again automatically whenever a new one gets pushed, no manual refreshing or polling needed. <b>limitToLast(50)</b> keeps you from downloading your entire comment history on every visit, only the 50 most recent load in. <b>Important:</b> use <b>textContent</b> for anything a visitor typed, never <b>innerHTML</b>. innerHTML tells the browser to parse a string as actual HTML, so if you used it here, someone could type a comment containing a hidden script and have it run on every visitor's screen, an attack called <b>XSS</b> (cross-site scripting). textContent always treats the string as plain, inert text, so it's the safe choice.",
       lang: "javascript",
       code:
`commentsRef.orderByChild("timestamp").limitToLast(50).on("child_added", (snapshot) => {
  renderComment(snapshot.val());
});

function renderComment(comment) {
  const list = document.getElementById("commentList");

  const item = document.createElement("div");
  item.className = "comment-item";

  const header = document.createElement("div");
  header.className = "comment-item-header";
  const time = new Date(comment.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  header.textContent = comment.name + " · " + time; // textContent, never innerHTML

  const body = document.createElement("div");
  body.className = "comment-item-body";
  body.textContent = comment.text; // textContent, never innerHTML

  item.append(header, body);
  list.appendChild(item);
  list.scrollTop = list.scrollHeight; // auto-scroll to the newest comment
}`,
      },
      {
       label: "Step 8: Style It Like a Simple Comment Box",
       note:
        "A clean, stacked list is the easiest style to fit into an existing site, no absolute positioning or drag logic required. <b>var(--variable-name, fallback)</b> is CSS's syntax for reading a <b>custom property</b> (a reusable value you define once and reference everywhere, similar to a variable in JavaScript), with a backup value after the comma in case that property isn't defined. That means this CSS automatically picks up your site's own color scheme if you already have CSS variables set up (see the Theme System tutorial), and just falls back to the value after the comma if you don't.",
       lang: "css",
       code:
`.comment-box {
  display: flex;
  flex-direction: column;
  max-width: 420px;
  border: 1.5px solid var(--border, #ccc);
  border-radius: var(--radius-sm, 6px);
  overflow: hidden;
}

.comment-list {
  max-height: 260px;
  overflow-y: auto;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  background: var(--bg2, #fafafa);
}

.comment-item {
  background: var(--bg, #fff);
  border: 1px solid var(--border-lt, #ddd);
  border-radius: var(--radius-sm, 6px);
  padding: 0.5rem 0.7rem;
}

.comment-item-header {
  font-weight: 700;
  font-size: 0.75rem;
  color: var(--accent, #7c8f6f);
  margin-bottom: 0.15rem;
}

.comment-item-body {
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--text, #222);
  word-wrap: break-word;
}

.comment-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  border-top: 1.5px solid var(--border, #ccc);
}

.comment-form-row { display: flex; gap: 0.5rem; align-items: flex-end; }

.comment-input {
  flex: 1;
  min-width: 0;
  font: inherit;
  padding: 0.5rem 0.6rem;
  border: 1px solid var(--border-lt, #ddd);
  border-radius: var(--radius-sm, 6px);
  background: var(--bg, #fff);
  color: var(--text, #222);
}

.comment-textarea { resize: vertical; min-height: 38px; }

.comment-submit {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: var(--radius-sm, 6px);
  background: var(--accent, #7c8f6f);
  color: #fff;
  cursor: pointer;
  white-space: nowrap;
}`,
      },
      {
       label: "Step 9: A Quick Spam Cooldown",
       note:
        "A simple, client-side cooldown using <b>localStorage</b> (a small storage space in the visitor's own browser that remembers values between visits) stops the same visitor from posting over and over in a short span. This replaces the postComment() function from Step 6, adding one check at the very top. It's not real security, since anyone can clear their browser storage or open a private window to reset it, only actual Security Rules enforcement (next step) can't be gotten around that way, but it does stop casual spam and accidental double-posts with almost no effort.",
       lang: "javascript",
       code:
`const COOLDOWN_MS = 30000; // 30 seconds between posts

function canPost() {
  const last = localStorage.getItem("lastPostTime");
  return !last || Date.now() - parseInt(last) >= COOLDOWN_MS;
}

function postComment() {
  if (!canPost()) {
    alert("Please wait a bit before posting again!");
    return;
  }

  const textInput = document.getElementById("commentText");
  const nameInput = document.getElementById("commentName");
  const text = textInput.value.trim();
  if (!text) return;

  commentsRef.push({
    name: nameInput.value.trim() || "Anonymous",
    text: text,
    timestamp: firebase.database.ServerValue.TIMESTAMP,
  });

  localStorage.setItem("lastPostTime", String(Date.now()));
  textInput.value = "";
  nameInput.value = "";
}`,
      },
      {
       label: "Step 10: Limit Each Visitor to One Comment, For Real",
       note:
        "The cooldown above only slows people down, it doesn't actually stop anyone determined, since it's just a value sitting in their own browser. To truly enforce \"one comment per visitor,\" Firebase itself has to check on its own server, which means giving each visitor an identity it can verify. <b>Firebase Authentication</b> can sign visitors in <b>anonymously</b>, no login form, no email or password, it just quietly assigns their browser a permanent, unique ID called a <b>UID</b> the first time they load your page, and that ID persists across future visits. First, add the auth SDK alongside your other two script tags from Step 3, then turn on anonymous sign-in for your project: in the Firebase Console, go to <b>Build → Authentication → Get Started</b>, open the <b>Sign-in method</b> tab, and enable <b>Anonymous</b>.",
       lang: "html",
       code:
`<script src="https://www.gstatic.com/firebasejs/12.16.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/12.16.0/firebase-database-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/12.16.0/firebase-auth-compat.js"></script>

<script src="script.js"></script>`,
      },
      {
       label: "Step 10 (continued): Updated Security Rules",
       note:
        "This replaces your Step 2 rules. Instead of a random push() ID, each comment is now keyed by the visitor's own UID, meaning a visitor can only ever have one comment total: <b>data.exists()</b> checks whether something is already saved at that exact spot, and <b>!data.exists()</b> means the write is only allowed if nothing's there yet. <b>auth.uid === $uid</b> also makes sure a signed-in visitor can only ever write to their own slot, never anyone else's.",
       lang: "json",
       code:
`{
  "rules": {
    "comments": {
      ".read": true,
      "$uid": {
        ".write": "auth != null && auth.uid === $uid && !data.exists()",
        ".validate": "newData.hasChildren(['text', 'timestamp']) && newData.child('text').isString() && newData.child('text').val().length > 0 && newData.child('text').val().length <= 500"
      }
    },
    "$other": {
      ".read": false,
      ".write": false
    }
  }
}`,
      },
      {
       label: "Step 10 (continued): Sign In + Update postComment()",
       note:
        "onAuthStateChanged is a listener that fires once when the page loads, telling you whether this browser already has a saved anonymous session (a returning visitor) or needs a new one. signInAnonymously() creates that new session, which then fires onAuthStateChanged again with the new user, this is the pattern Firebase's own docs recommend so you never accidentally create a second account for the same visitor. Since the comment is now saved with <b>.set()</b> at a path named after the visitor's UID instead of a random push() ID, trying to post again lands on that exact same path and gets rejected by the Step 10 rules above, so .catch() is there to tell the visitor why.",
       lang: "javascript",
       code:
`let currentUid = null;

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    currentUid = user.uid; // returning visitor, already has a session
  } else {
    firebase.auth().signInAnonymously(); // new visitor, fires this listener again once done
  }
});

function postComment() {
  if (!currentUid) return; // still signing in, try again in a moment

  const textInput = document.getElementById("commentText");
  const text = textInput.value.trim();
  if (!text) return;

  db.ref("comments/" + currentUid).set({
    name: document.getElementById("commentName").value.trim() || "Anonymous",
    text: text,
    timestamp: firebase.database.ServerValue.TIMESTAMP,
  }).catch(() => {
    alert("Looks like you've already posted, only one comment per visitor!");
  });

  textInput.value = "";
}`,
      },
      {
       label: "Step 11: A Basic Word Filter (Optional)",
       note:
        "A quick first line of defense: check the text against a list of blocked words before it ever reaches the database. <b>toLowerCase()</b> makes the check case-insensitive, and <b>some()</b> returns true the moment any word in your list is found. Be upfront with yourself about its limits though, this only catches exact matches, so spacing it out, swapping letters for symbols, or misspellings will slip right through. It's a helpful filter, not a moderation system, you'll still want to check your board occasionally and delete anything that gets through, either from the Firebase Console directly or an admin panel of your own.",
       lang: "javascript",
       code:
`const BLOCKED_WORDS = ["badword1", "badword2"]; // fill in your own list

function containsBlockedWord(text) {
  const lower = text.toLowerCase();
  return BLOCKED_WORDS.some((word) => lower.includes(word));
}

// add this check to the top of whichever postComment() you're using
function postComment() {
  const textInput = document.getElementById("commentText");
  const text = textInput.value.trim();
  if (!text) return;

  if (containsBlockedWord(text)) {
    alert("Please keep it friendly! Your message wasn't posted.");
    return;
  }

  // ...continue with the rest of postComment() from whichever step you're on
}`,
      },
      {
       label: "Variation: Turning the List into a Free-Roam Corkboard",
       note:
        "Want scattered, draggable sticky notes like the board on this site instead of a stacked list? Two changes get you there: give each comment a random position when it's posted, then draw it at that position instead of appending it to the bottom of a list. First, swap the id=\"commentList\" container from Step 4 for a taller, scrollable id=\"commentCanvas\" one, matching the CSS a couple sections down. Then in postComment(), save an <b>xPct</b> and <b>yPct</b>, a horizontal and vertical position written as a percentage rather than a fixed pixel amount, so it scales cleanly with the container instead of breaking on different screen sizes. The snippet below only shows what's changing, merge it into whichever postComment() you already have (plain, with the Step 9 cooldown, or the Step 10 one-per-visitor version), rather than replacing it outright and losing that protection.",
       lang: "javascript",
       code:
`// the plain version from Step 6, with two fields added, merge these into
// whichever postComment() you're actually using (Step 9's cooldown or
// Step 10's one-per-visitor version) instead of replacing it outright
function postComment() {
  const textInput = document.getElementById("commentText");
  const text = textInput.value.trim();
  if (!text) return;

  commentsRef.push({
    name: document.getElementById("commentName").value.trim() || "Anonymous",
    text: text,
    timestamp: firebase.database.ServerValue.TIMESTAMP,
    xPct: Math.random() * 75, // leave margin so notes don't hang off the edge
    yPct: Math.random() * 70,
  });

  textInput.value = "";
}

// then render by position instead of appending to a list:
function renderComment(comment) {
  const canvas = document.getElementById("commentCanvas");
  const item = document.createElement("div");
  item.className = "comment-note";
  item.style.left = (comment.xPct / 100) * canvas.offsetWidth + "px";
  item.style.top = (comment.yPct / 100) * canvas.offsetHeight + "px";

  const header = document.createElement("div");
  header.className = "comment-note-header";
  const time = new Date(comment.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  header.textContent = comment.name + " · " + time;

  const body = document.createElement("div");
  body.className = "comment-note-body";
  body.textContent = comment.text;

  item.append(header, body);
  canvas.appendChild(item);
  makeDraggable(item, header, canvas); // see below
}`,
      },
      {
       label: "Variation (continued): Making Notes Draggable",
       note:
        "This lets visitors drag notes around on their own screen for fun, it's purely visual and never writes anything back to the database, so everyone still starts from the same layout on their next page load. It's attached to the note's header rather than the whole note, so the header becomes a <b>drag handle</b>, and the position gets <b>clamped</b> (kept within a min/max range using Math.max/Math.min together) so a note can't be dragged outside its container.",
       lang: "javascript",
       code:
`function makeDraggable(el, handle, parent) {
  let startX = 0, startY = 0;

  handle.onmousedown = function (e) {
    e.preventDefault();
    startX = e.clientX;
    startY = e.clientY;
    document.onmousemove = drag;
    document.onmouseup = stopDrag;
  };

  function drag(e) {
    const dx = startX - e.clientX;
    const dy = startY - e.clientY;
    startX = e.clientX;
    startY = e.clientY;

    let top = el.offsetTop - dy;
    let left = el.offsetLeft - dx;

    // clamp so the note can't be dragged outside the canvas
    top = Math.max(0, Math.min(top, parent.offsetHeight - el.offsetHeight));
    left = Math.max(0, Math.min(left, parent.offsetWidth - el.offsetWidth));

    el.style.top = top + "px";
    el.style.left = left + "px";
  }

  function stopDrag() {
    document.onmousemove = null;
    document.onmouseup = null;
  }
}`,
      },
      {
       label: "Variation (continued): Canvas + Note CSS",
       note:
        "The canvas needs <b>position: relative</b> so the notes, set to <b>position: absolute</b>, place themselves relative to it rather than the whole page, plus a fixed height with <b>overflow: auto</b> so there's a scrollable area to scatter notes across. <b>cursor: move</b> on the header hints to visitors that it's draggable.",
       lang: "css",
       code:
`.comment-canvas {
  position: relative;
  width: 100%;
  height: 400px;
  overflow: auto;
  border: 1.5px solid var(--border, #ccc);
  border-radius: var(--radius-sm, 6px);
}

.comment-note {
  position: absolute;
  width: 180px;
  background: var(--bg, #fff);
  border: 1.5px solid var(--border, #ccc);
  border-radius: var(--radius-sm, 6px);
  box-shadow: 3px 3px 0 rgba(0,0,0,0.1);
}

.comment-note-header {
  background: var(--accent, #7c8f6f);
  color: #fff;
  padding: 5px 8px;
  font-size: 0.7rem;
  font-weight: 700;
  cursor: move; /* hints that it's draggable */
  user-select: none;
}

.comment-note-body {
  padding: 8px;
  font-size: 0.75rem;
  color: var(--text, #222);
  word-wrap: break-word;
}`,
      },
     ],
     tip:
      "A few more things worth knowing before you launch this:<br><br>&bull; <b>Prune old comments.</b> A Realtime Database that grows forever gets slower to load and costs more on Firebase's free tier. Consider deleting anything older than a set number of days, or capping the total count and dropping the oldest ones once you go over.<br>&bull; <b>Test your rules before you trust them.</b> The Rules tab in the Firebase Console has a built-in simulator, use it to try a few reads and writes and confirm they're actually allowed or denied the way you expect, before real visitors find the gaps for you.<br>&bull; <b>Realtime Database vs. Firestore.</b> Firebase actually offers two databases. We used Realtime Database here since it's simpler and cheaper for small, frequently-updated data like a comment feed, Firestore suits more structured, larger-scale apps better.<br><br><b>Sources &amp; further reading:</b><br>&bull; <a href=\"https://firebase.google.com/docs/database/web/start\" target=\"_blank\" rel=\"noopener\">Firebase Realtime Database docs</a><br>&bull; <a href=\"https://firebase.google.com/docs/database/security\" target=\"_blank\" rel=\"noopener\">Firebase Security Rules docs</a><br>&bull; <a href=\"https://firebase.google.com/docs/database/security/user-security\" target=\"_blank\" rel=\"noopener\">Firebase: user-based Security Rules</a><br>&bull; <a href=\"https://firebase.google.com/docs/auth/web/anonymous-auth\" target=\"_blank\" rel=\"noopener\">Firebase Anonymous Authentication docs</a><br>&bull; <a href=\"https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent\" target=\"_blank\" rel=\"noopener\">MDN: textContent vs. innerHTML (XSS)</a><br><br><b>See a similar build:</b><br>&bull; <a href=\"https://dev.to/digital-abetka/blog-comment-system-on-firebase-xss-protection-and-0-cost-4fb8\" target=\"_blank\" rel=\"noopener\">Building a self-hosted comment system on Firebase Realtime Database</a>",
    },

   };

   function loadSnippet(key) {
    const data = SNIPPETS_DATA[key];
    const body = document.getElementById("snippetContent");
    const headerTitle = document.getElementById("snippetHeaderTitle");
    if (!data || !body) return;

    document.querySelectorAll(".snippets-toc-item").forEach((item) => {
     item.classList.toggle("active", item.getAttribute("data-snippet") === key);
    });

    headerTitle.textContent = data.title.toUpperCase();

    const sectionsHtml = data.sections
     .map(
      (s) => `
      <div class="snippet-section">
        <h4 class="snippet-section-label">${s.label}</h4>
        <p class="snippet-section-note">${s.note}</p>
        ${codeBlock(s.lang, s.code)}
      </div>`,
     )
     .join("");

    const demoHtml = data.demoHtml
     ? `<div class="snippet-demo">
         <span class="snippet-demo-label">PREVIEW</span>
         ${data.demoHtml}
        </div>`
     : "";

    body.innerHTML = `
      ${demoHtml}
      <p class="snippet-blurb">${data.blurb}</p>
      ${sectionsHtml}
      ${data.tip ? `<div class="snippet-tip"><span>TIP</span><p>${data.tip}</p></div>` : ""}
    `;

    if (typeof data.initDemo === "function") data.initDemo();
   }

   document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("snippetContent")) loadSnippet("word-of-the-day");
   });

   /* ═══════════════════════════════════════════════════════
   DATA STORES
   Global arrays populated by Firebase on load.
═══════════════════════════════════════════════════════ */
   let artData = [];
   let logsData = [];
   let shrinesData = [];
   let lettersData = [];
   const LETTER_BALL_IMAGES = [
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
   let badgesData = [];
   let bagData = [];
   let statusData = [];
   let todosData = [];

   /* ═══════════════════════════════════════════════════════
   HOME — UPDATES BOX
   aggregates 3 most recent items across all content
   types and renders them as clickable update links.
═══════════════════════════════════════════════════════ */
   function renderHomeUpdates() {
    const el = document.getElementById("homeUpdates");
    if (!el) return;

    const items = [];
    (logsData || []).forEach((l) =>
     items.push({
      type: "LOG",
      title: l.title,
      meta: l.meta || "",
      section: "log",
      id: l.id,
      ts: parseMetaDate(l.meta) || l.timestamp || 0,
     }),
    );
    (shrinesData || []).forEach((s) =>
     items.push({
      type: "SHRINE",
      title: s.title,
      meta: s.tagline || "",
      section: "shrine",
      id: s.id,
      ts: s.timestamp || 0,
     }),
    );
    (lettersData || []).forEach((l) =>
     items.push({
      type: "LETTER",
      title: l.subject,
      meta: l.to ? "to: " + l.to : "",
      section: "letter",
      id: l.id,
      ts: l.timestamp || 0,
     }),
    );
    (artData || []).forEach((a) =>
     items.push({
      type: "ART",
      title: a.title,
      meta: a.category || a.meta || "",
      section: "art",
      id: a.id,
      ts: a.timestamp || 0,
     }),
    );
    items.sort((a, b) => (b.ts || 0) - (a.ts || 0));
    const top = items.slice(0, 3);

    if (!top.length) {
     el.innerHTML = '<p class="home-updates-empty">// no updates yet</p>';
     return;
    }

    el.innerHTML = top
     .map((item) => {
      let dateStr = "";
      if (item.ts) {
       const d = new Date(item.ts);
       dateStr = ` // ${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}.${String(d.getFullYear()).slice(-2)}`;
      }
      return `<div class="home-update-item" onclick="openUpdateItem('${item.section}','${item.id}')">
      <span class="home-update-type">${item.type}${dateStr}</span>
      <span class="home-update-title">${escHtml(item.title || "(untitled)")}</span>
      <span class="home-update-meta">${escHtml(item.meta || "")}</span>
    </div>`;
     })
     .join("");
   }

   /* routes an update-box click to the correct reader / section. */
   function openUpdateItem(section, id) {
    if (section === "log") {
     const idx = logsData.findIndex((l) => l.id === id);
     if (idx !== -1) readLog(idx);
     else showPage("writing");
    } else if (section === "shrine") {
     const idx = shrinesData.findIndex((s) => s.id === id);
     if (idx !== -1) readShrine(idx);
     else showPage("shrines");
    } else if (section === "letter") {
     const idx = lettersData.findIndex((l) => l.id === id);
     if (idx !== -1) readLetter(idx);
     else showPage("letters");
    } else if (section === "art") {
     const idx = artData.findIndex((a) => a.id === id);
     showPage("art", () => {
      if (idx !== -1) openLightbox(idx);
     });
    } else if (section === "info") {
     showPage("colophon");
    } else if (section === "personal") {
     showPage("personal");
    } else if (section === "home") {
     showPage("home");
    }
   }

   /* shared HTML-escape utility used throughout. */
   function escHtml(str) {
    if (!str) return "";
    return String(str)
     .replace(/&/g, "&")
     .replace(/</g, "<")
     .replace(/>/g, ">")
     .replace(/"/g, '"');
   }

   /* ═══════════════════════════════════════════════════════
   STATUS.EXE CARD - reads from Firebase and renders the most recent entry.
═══════════════════════════════════════════════════════ */

   /* most recent status entry to the home card. */
   function renderStatus() {
    if (!statusData.length) return;
    const latest = statusData.reduce((a, b) =>
     (a.timestamp || 0) > (b.timestamp || 0) ? a : b,
    );
    const set = (id, val) => {
     const el = document.getElementById(id);
     if (el) el.textContent = val || "—";
    };
    set("statusMood", latest.mood || "");
    set("statusListening", latest.listening || "");
    set("statusWorking", latest.working || "");
   }

   /* admin pushes a new status entry to Firebase. */
   function adminUpdateStatus() {
    if (!isAdminSession()) return;
    const mood = document.getElementById("statusMoodInput").value.trim();
    const listening = document
     .getElementById("statusListeningInput")
     .value.trim();
    const working = document.getElementById("statusWorkingInput").value.trim();
    if (!mood && !listening && !working) return;

    const entry = { mood, listening, working, timestamp: Date.now() };
    adminWrite("push", "content/status", entry)
     .then((r) => {
      entry.id = r.id;
      statusData.push(entry);
      renderStatus();
      updateLastUpdatedDisplay();
      const s = document.getElementById("statusSuccess");
      if (s) {
       s.style.display = "block";
       setTimeout(() => (s.style.display = "none"), 3000);
      }
     })
     .catch((e) => {
      console.error("Status update failed:", e);
      alert("// COULD NOT SAVE: " + e.message);
     });

    ["statusMoodInput", "statusListeningInput", "statusWorkingInput"].forEach(
     (id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
     },
    );
   }

   /* ═══════════════════════════════════════════════════════
   TO-DO LIST — admin-editable, checkboxes only work in admin mode
═══════════════════════════════════════════════════════ */
   function renderHomeTodo() {
    const list = document.getElementById("homeTodoList");
    if (!list) return;
    const admin = isAdminSession();

    if (!todosData.length) {
     list.innerHTML =
      '<li class="home-updates-empty widget-hint">// nothing on the list right now.</li>';
    } else {
     const sorted = [...todosData].sort(
      (a, b) => (a.timestamp || 0) - (b.timestamp || 0),
     );
     list.innerHTML = sorted
      .map((item) => {
       const delBtn = admin
        ? `<button class="home-todo-delete" onclick="adminDeleteTodo('${item.id}')" title="Remove item">×</button>`
        : "";
       return `
      <li class="home-todo-item${item.done ? " is-done" : ""}" data-todo-id="${item.id}">
        <input type="checkbox" class="home-todo-checkbox" ${item.done ? "checked" : ""} ${admin ? "" : "disabled"} onchange="adminToggleTodo('${item.id}', this.checked)" aria-label="Mark done" />
        <span class="home-todo-text">${escHtml(item.text || "")}</span>
        ${delBtn}
      </li>`;
      })
      .join("");
    }

    renderAdminTodoList();
   }

   /* admin panel's own live copy — keep interactive if already logged in */
   function renderAdminTodoList() {
    const el = document.getElementById("adminTodoList");
    if (!el) return;
    if (!todosData.length) {
     el.innerHTML =
      '<p class="widget-hint" style="font-size:10px;">// no items yet.</p>';
     return;
    }
    const sorted = [...todosData].sort(
     (a, b) => (a.timestamp || 0) - (b.timestamp || 0),
    );
    el.innerHTML = sorted
     .map(
      (item) => `
    <div class="admin-todo-row">
      <input type="checkbox" ${item.done ? "checked" : ""} onchange="adminToggleTodo('${item.id}', this.checked)" />
      <span class="${item.done ? "is-done" : ""}">${escHtml(item.text || "")}</span>
      <button class="admin-delete-btn" style="display:inline-block;position:static" onclick="adminDeleteTodo('${item.id}')">DELETE</button>
    </div>
  `,
     )
     .join("");
   }

   function adminAddTodo() {
    if (!isAdminSession()) return;
    const input = document.getElementById("todoText");
    const text = input.value.trim();
    if (!text) return;
    const entry = { text, done: false, timestamp: Date.now() };
    adminWrite("push", "content/todos", entry)
     .then((r) => {
      entry.id = r.id;
      todosData.push(entry);
      renderHomeTodo();
      const s = document.getElementById("todoSuccess");
      if (s) {
       s.style.display = "block";
       setTimeout(() => (s.style.display = "none"), 3000);
      }
     })
     .catch((e) => {
      console.error("Todo push failed:", e);
      alert("// COULD NOT SAVE: " + e.message);
     });
    input.value = "";
   }

   function adminToggleTodo(id, done) {
    if (!isAdminSession()) return;
    const idx = todosData.findIndex((t) => t.id === id);
    if (idx < 0) return;
    todosData[idx].done = done;
    adminWrite("update", "content/todos", { id, data: { done } })
     .then(() => renderHomeTodo())
     .catch((e) => {
      console.error("Todo update failed:", e);
      todosData[idx].done = !done;
      renderHomeTodo();
      alert("// COULD NOT SAVE: " + e.message);
     });
   }

   function adminDeleteTodo(id) {
    if (!isAdminSession()) return;
    if (!confirm("Remove this to-do item?")) return;
    const idx = todosData.findIndex((t) => t.id === id);
    if (idx < 0) return;
    if (id && !String(id).startsWith("local_")) {
     adminWrite("remove", "content/todos", { id })
      .then(() => {
       todosData.splice(idx, 1);
       renderHomeTodo();
      })
      .catch((e) => {
       console.error("Todo delete failed:", e);
       alert("// DELETE FAILED");
      });
    } else {
     todosData.splice(idx, 1);
     renderHomeTodo();
    }
   }

   /* ═══════════════════════════════════════════════════════
   ART — CATEGORY FILTER
═══════════════════════════════════════════════════════ */
   let activeCategory = "all";

   function filterCategory(category) {
    activeCategory = category;
    document.querySelectorAll("#categoryNav .category-tab").forEach((tab) => {
     tab.classList.toggle(
      "active",
      tab.getAttribute("data-category") === category,
     );
    });
    renderArtGrid();
   }

   function initCategoryTabs() {
    document.querySelectorAll("#categoryNav .category-tab").forEach((tab) => {
     tab.addEventListener("click", function () {
      filterCategory(this.getAttribute("data-category"));
     });
    });
   }

   /* ═══════════════════════════════════════════════════════
   PERSONAL — SUBPAGE TABS
═══════════════════════════════════════════════════════ */
   function switchPersonalSubpage(subpage) {
    document.querySelectorAll("#personalTabNav .category-tab").forEach((tab) => {
     tab.classList.toggle(
      "active",
      tab.getAttribute("data-subpage") === subpage,
     );
    });
    document.querySelectorAll(".personal-subpage").forEach((panel) => {
     panel.classList.toggle("active", panel.id === "personal-" + subpage);
    });
    syncDeskSubnavActive(subpage);
    updateNekoVisibility(subpage === "about");
   }

   function goToPersonalSubpage(subpage) {
    switchPersonalSubpage(subpage);
    const h = subpage === "about" ? "#personal" : "#personal/" + subpage;
    if (window.location.hash !== h) {
     window.history.pushState({ page: "personal", subpage }, "", h);
    }
   }

    function initPersonalTabs() {
     document.querySelectorAll("#personalTabNav .category-tab").forEach((tab) => {
      tab.addEventListener("click", function () {
       goToPersonalSubpage(this.getAttribute("data-subpage"));
      });
     });
    }

    function switchGoodiesSubpage(subpage) {
     document.querySelectorAll("#goodiesTabNav .category-tab").forEach((tab) => {
      tab.classList.toggle("active", tab.getAttribute("data-subpage") === subpage);
     });
     document.querySelectorAll(".goodies-subpage").forEach((panel) => {
      panel.classList.toggle("active", panel.id === "goodies-" + subpage);
     });
    }

    function goToGoodiesSubpage(subpage) {
     switchGoodiesSubpage(subpage);
     const h = "#goodies/" + subpage;
     if (window.location.hash !== h) {
      window.history.pushState({ page: "goodies", subpage }, "", h);
     }
    }

    function handleGoodiesSummaryClick(evt) {
     showPage("goodies");
    }

    function goToGoodiesFromNav(evt, subpage) {
     evt.stopPropagation();
     const alreadyOnGoodies = document.getElementById("goodies").classList.contains("active");
     if (alreadyOnGoodies) {
      goToGoodiesSubpage(subpage);
      return;
     }
     showLoader();
     setTimeout(() => {
      _activateSection("goodies");
      goToGoodiesSubpage(subpage);
      hideLoader();
     }, 400);
    }

    function initGoodiesTabs() {
     document.querySelectorAll("#goodiesTabNav .category-tab").forEach((tab) => {
      tab.addEventListener("click", function () {
       goToGoodiesSubpage(this.getAttribute("data-subpage"));
      });
     });
    }

    /* Touch devices can't hover to reveal the code-snippets TOC dropdown,
    so tapping the tab also toggles a .open class the CSS checks alongside
    :hover. Tapping elsewhere on the page closes it again. */
    function initSnippetsTocToggle() {
     const group = document.getElementById("codeSnippetsTabGroup");
     if (!group) return;
     const tab = group.querySelector(".category-tab.has-toc");
     tab.addEventListener("click", (evt) => {
      evt.stopPropagation();
      group.classList.toggle("open");
     });
     document.addEventListener("click", (evt) => {
      if (!group.contains(evt.target)) group.classList.remove("open");
     });
     group.querySelectorAll(".snippets-toc-item").forEach((item) => {
      item.addEventListener("click", () => group.classList.remove("open"));
     });
    }
    document.addEventListener("DOMContentLoaded", initSnippetsTocToggle);

   /* ═══════════════════════════════════════════════════════
   FAQ — ACCORDION Q&A
═══════════════════════════════════════════════════════ */
   function toggleFaqItem(questionEl) {
    const item = questionEl.closest(".faq-item");
    if (item) item.classList.toggle("open");
   }

   /* ═══════════════════════════════════════════════════════
   SIDEBAR NAV — EXPANDABLE SUBNAV (e.g. Personal → About/Fangirling/FAQ)
═══════════════════════════════════════════════════════ */
   function handleDeskSummaryClick(evt) {
    showPage("personal");
   }

   function goToPersonalFromNav(evt, subpage) {
    evt.stopPropagation();
    const alreadyOnPersonal = document.getElementById("personal").classList.contains("active");
    if (alreadyOnPersonal) {
     goToPersonalSubpage(subpage);
     return;
    }
    showLoader();
    setTimeout(() => {
     _activateSection("personal");
     goToPersonalSubpage(subpage);
     hideLoader();
    }, 400);
   }

   function syncDeskSubnavActive(subpage) {
    document.querySelectorAll(".desk-subnav-item").forEach((item) => {
     item.classList.toggle("active", item.getAttribute("data-subpage") === subpage);
    });
   }

   /* The top-nav strip clips overflow (so icons can scroll horizontally),
   which would clip an absolutely-positioned dropdown too. The subnav there
   uses position:fixed to escape that clip, so its coordinates are computed
   live on hover rather than via CSS. */
   function positionTopNavSubnav(group) {
    if (window.innerWidth <= 850) return;
    const bar = document.getElementById("desktopIconsBar");
    if (!bar || bar.classList.contains("home-sidebar-nav")) return;
    const subnav = group.querySelector(".desk-subnav");
    const icon = group.querySelector(".desk-icon");
    if (!subnav || !icon) return;
    const rect = icon.getBoundingClientRect();
    subnav.style.top = rect.bottom + 2 + "px";
    subnav.style.left = rect.left + rect.width / 2 + "px";
    subnav.style.transform = "translateX(-50%)";
   }

    (function initDeskSubnavPositioning() {
     const groups = [
      document.getElementById("desk-group-personal"),
      document.getElementById("desk-group-goodies")
     ].filter(Boolean);
     const bar = document.getElementById("desktopIconsBar");
     if (!groups.length) return;
     groups.forEach((group) => {
      group.addEventListener("mouseenter", () => positionTopNavSubnav(group));
     });
     window.addEventListener("resize", () => {
      groups.forEach((group) => {
       if (group.matches(":hover")) positionTopNavSubnav(group);
      });
     });
     if (bar) {
      bar.addEventListener("scroll", () => {
       groups.forEach((group) => {
        if (group.matches(":hover")) positionTopNavSubnav(group);
       });
      });
     }
    })();

   /* ═══════════════════════════════════════════════════════
   TAG HELPERS - shared utilities for parsing and rendering content tags
═══════════════════════════════════════════════════════ */
   function parseTags(raw) {
    if (!raw) return [];
    return raw
     .split(/[\s,]+/)
     .map((t) => t.replace(/^#+/, "").trim().toLowerCase())
     .filter(Boolean);
   }

   function renderTagsHTML(tags) {
    if (!tags || !tags.length) return "";
    return `<div class="log-tags">${tags.map((t) => `<span class="log-tag">#${t}</span>`).join("")}</div>`;
   }

   /* ═══════════════════════════════════════════════════════
   LOADER
═══════════════════════════════════════════════════════ */
   const LOADER_MESSAGES = [
    "[ FETCHING_EMOTIONS... ]",
    "[ INDEXING_MEMORY_BANK... ]",
    "[ ACCESSING_CORE_DUMP... ]",
    "[ BOOTING_UP_SEI_SYSTEM... ]",
    "[ RE-FORMATTING_EXISTENCE... ]",
    "[ CLEARING_CACHED_REGRETS... ]",
    "[ LEAVING_MARGINS_FOR_ERROR... ]",
    "[ DE-FRAGMENTING_MIDNIGHT_DRAFTS... ]",
    "[ SYNCHRONIZING_HEART_ERR_404... ]",
    "[ RECALLING_UNSENT_TEXTS... ]",
    "[ COMPILING_SILENT_THOUGHTS... ]",
    "[ DOWNLOADING_WARMTH.EXE... ]",
    "[ LOADING_SAGE_SPACE... ]",
   ];

   function showLoader() {
    const msg = document.getElementById("loaderMessage");
    msg.textContent =
     LOADER_MESSAGES[Math.floor(Math.random() * LOADER_MESSAGES.length)];
    document.getElementById("loaderOverlay").classList.add("show");
   }
   function hideLoader() {
    document.getElementById("loaderOverlay").classList.remove("show");
   }

   /* content advisory — shown on every page load, blocks the site until dismissed */
   function dismissAdvisory() {
    document.getElementById("advisoryModal").style.display = "none";
    document.body.classList.remove("advisory-lock");
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
   function initWheelZoom() {
    const wrap = document.getElementById("lbImageWrap");
    wrap.addEventListener(
     "wheel",
     (e) => {
      e.preventDefault();
      zoomImage(e.deltaY < 0 ? 1 : -1);
     },
     { passive: false },
    );
   }

   /* ═══════════════════════════════════════════════════════
   SPAM PROTECTION - cooldown enforced via localStorage to prevent rapid posting but hopefully people wont do that lol
═══════════════════════════════════════════════════════ */
   const SPAM_COOLDOWN_MS = 60000;
   const LAST_POST_KEY = "sei_last_post_time";

   function canPost() {
    try {
     const l = localStorage.getItem(LAST_POST_KEY);
     return !l || Date.now() - parseInt(l) >= SPAM_COOLDOWN_MS;
    } catch (_) {
     return true;
    }
   }
   function updateLastPostTime() {
    try {
     localStorage.setItem(LAST_POST_KEY, String(Date.now()));
    } catch (_) {}
   }
   function getTimeUntilCanPost() {
    try {
     const l = localStorage.getItem(LAST_POST_KEY);
     if (!l) return 0;
     return Math.max(
      0,
      Math.ceil((SPAM_COOLDOWN_MS - (Date.now() - parseInt(l))) / 1000),
     );
    } catch (_) {
     return 0;
    }
   }

   /* ═══════════════════════════════════════════════════════
   ADMIN AUTH
   Token stored in sessionStorage with an 8-hour TTL.
═══════════════════════════════════════════════════════ */
   const ADMIN_TOKEN_KEY = "sei_admin_token";
   const ADMIN_TOKEN_TTL = 8 * 60 * 60 * 1000;

   function isAdminSession() {
    try {
     const r = sessionStorage.getItem(ADMIN_TOKEN_KEY);
     if (!r) return false;
     const { token, ts } = JSON.parse(r);
     return token && Date.now() - ts < ADMIN_TOKEN_TTL;
    } catch (_) {
     return false;
    }
   }

   /* Toggles admin-mode stuff */
   function setAdminMode(active) {
    document.body.classList.toggle("admin-mode", active);
    if (logsData.length) renderLogList();
    if (shrinesData.length) renderShrineGrid();
    if (lettersData.length) renderLetterList();
    if (typeof renderBag === "function") renderBag();
    renderBadgesStrips();
    if (typeof renderHomeTodo === "function") renderHomeTodo();
    const eb = document.getElementById("logReaderEditBtn");
    if (eb) eb.style.display = active ? "inline-block" : "none";
    const sb = document.getElementById("shrineReaderEditBtn");
    if (sb) sb.style.display = active ? "inline-block" : "none";
    const lb = document.getElementById("letterReaderEditBtn");
    if (lb) lb.style.display = active ? "inline-block" : "none";
    const bb = document.getElementById("badgesAdminBtn");
    if (bb) bb.style.display = active ? "inline-block" : "none";
    const tb = document.getElementById("todoAdminBtn");
    if (tb) tb.style.display = active ? "inline-block" : "none";
    document
     .querySelectorAll(
      ".aw-bag .admin-edit-btn, .aw-games .admin-edit-btn, .aw-hobbies .admin-edit-btn, .aw-music .admin-edit-btn",
     )
     .forEach((b) => (b.style.display = active ? "inline-block" : "none"));
   }

   /* ═══════════════════════════════════════════════════════
   IMAGE URL NORMALIZER
   incase i need to convert GitHub blob/raw URLs and relative paths to
   clean, cache-friendly URLs for display, might delete later
═══════════════════════════════════════════════════════ */
   const SITE_REPO = { owner: "2906-sd", repo: "seistudio-dir" };

   function normalizeImages(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    return Object.keys(val)
     .sort((a, b) => Number(a) - Number(b))
     .map((k) => val[k]);
   }

   function normalizeImageUrl(url) {
    if (!url || typeof url !== "string") return url;
    const u = url.trim();
    function encodePath(p) {
     return p
      .split("/")
      .map((seg) => encodeURIComponent(decodeURIComponent(seg)))
      .join("/");
    }
    let m = u.match(
     /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/(?:blob|raw)\/[^/]+\/(.+)$/i,
    );
    if (!m)
     m = u.match(
      /^https?:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/[^/]+\/(.+)$/i,
     );
    if (m) {
     const owner = m[1],
      repo = m[2];
     const rawPath = m[3]
      .replace(/^refs\/heads\/[^/]+\//, "")
      .replace(/[?#].*$/, "");
     const path = encodePath(rawPath);
     if (
      owner.toLowerCase() === SITE_REPO.owner.toLowerCase() &&
      repo.toLowerCase() === SITE_REPO.repo.toLowerCase()
     )
      return "/" + path;
     return `https://raw.githubusercontent.com/${owner}/${repo}/${path}`;
    }
    if (!u.startsWith("http")) return encodePath(u);
    return u;
   }

   /* ═══════════════════════════════════════════════════════
   FIREBASE INIT - DO NOT TOUCHHHH
═══════════════════════════════════════════════════════ */
   async function initFirebase() {
    try {
     detectVisitorCountry(); // fire-and-forget; doesn't block init
     if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
     db = firebase.database();
     msgRef = db.ref("board/messages");
     // Subscribe to the most recent DISPLAY_MSGS messages only
     msgRef
      .orderByChild("timestamp")
      .limitToLast(DISPLAY_MSGS)
      .on("child_added", (snap) => renderMessage(snap.key, snap.val()));
     onFirebaseReady();
    } catch (e) {
     console.error("Firebase init failed:", e);
    }
   }

   /* Runs after Firebase is connected; loads all content and starts live listeners */
   function onFirebaseReady() {
    initVisitorCounter();

    // TTL sweep: remove board messages older than 7 days, maybe expand idk
    // Only inspects the oldest 40 messages to avoid full-board reads
    const MSG_TTL_MS = 7 * 24 * 60 * 60 * 1000;
    msgRef
     .orderByChild("timestamp")
     .limitToFirst(40)
     .endAt(Date.now() - MSG_TTL_MS)
     .once("value", (snap) => {
      const updates = {};
      snap.forEach((c) => {
       updates[c.key] = null;
      });
      if (Object.keys(updates).length) msgRef.update(updates).catch(() => {});
     })
     .catch(() => {});

    // Seed permanent system messages on the bulletin board
    const permanentSystemMessages = [
     { text: "Welcome to the board! Be nice, you only get 500 characters :)", id: "sys_msg_1" },
     {
      text: "Sei worked really hard on this btw (her dad had to help).",
      id: "sys_msg_2",
     },
     { text: "click + drag me!", id: "sys_msg_3" },
    ];
    const sysNow = new Date();
    const sysTime = sysNow.toLocaleTimeString("en-US", {
     hour: "numeric",
     minute: "2-digit",
     hour12: true,
    });
    const sysDate = `${String(sysNow.getMonth() + 1).padStart(2, "0")}.${String(sysNow.getDate()).padStart(2, "0")}.${String(sysNow.getFullYear()).slice(-2)}`;
    permanentSystemMessages.forEach((msg) => {
     renderMessage(
      msg.id,
      {
       text: msg.text,
       name: genAnonName(),
       time: sysTime,
       date: sysDate,
       xPct: 2 + Math.random() * 70,
       yPct: 4 + Math.random() * 62,
       timestamp: Date.now(),
      },
      true,
     );
    });

    // Load art
    db
     .ref("content/art")
     .orderByChild("timestamp")
     .once("value", (snap) => {
      artData = [];
      snap.forEach((child) => {
       const d = child.val();
       d.images = normalizeImages(d.images);
       d.id = child.key;
       d.category = d.category || "other";
       artData.push(d);
      });
      renderArtGrid();
      renderHomeUpdates();
     })
     .catch((e) => console.error("Art load failed:", e));

    // Load logs
    db
     .ref("content/logs")
     .orderByChild("timestamp")
     .once("value", (snap) => {
      logsData = [];
      snap.forEach((child) => {
       const d = child.val();
       d.tags = Array.isArray(d.tags) ? d.tags : [];
       d.stickers = Array.isArray(d.stickers) ? d.stickers : [];
       logsData.push({ id: child.key, ...d });
      });
      renderLogList();
      renderHomeUpdates();
      if (_pendingLogKey) {
       const idx = logsData.findIndex((l) => l.id === _pendingLogKey);
       _pendingLogKey = null;
       if (idx !== -1) readLog(idx);
      }
     })
     .catch((e) => console.error("Logs load failed:", e));

    // Load shrines
    db
     .ref("content/shrines")
     .orderByChild("timestamp")
     .once("value", (snap) => {
      shrinesData = [];
      snap.forEach((child) => {
       const d = child.val();
       d.images = normalizeImages(d.images || []);
       shrinesData.push({ id: child.key, ...d });
      });
      renderShrineGrid();
      renderHomeUpdates();
      if (_pendingShrineKey) {
       const idx = shrinesData.findIndex((s) => s.id === _pendingShrineKey);
       _pendingShrineKey = null;
       if (idx !== -1) readShrine(idx);
      }
     })
     .catch((e) => console.error("Shrines load failed:", e));

    // Load letters
    db
     .ref("content/letters")
     .orderByChild("timestamp")
     .once("value", (snap) => {
      lettersData = [];
      snap.forEach((child) => {
       const d = child.val();
       d.tags = Array.isArray(d.tags) ? d.tags : [];
       lettersData.push({ id: child.key, ...d });
      });
      renderLetterList();
      renderHomeUpdates();
      if (_pendingLetterKey) {
       const idx = lettersData.findIndex((l) => l.id === _pendingLetterKey);
       _pendingLetterKey = null;
       if (idx !== -1) readLetter(idx);
      }
     })
     .catch((e) => console.error("Letters load failed:", e));

    // Load badges
    db
     .ref("content/badges")
     .orderByChild("timestamp")
     .once("value", (snap) => {
      badgesData = [];
      snap.forEach((child) => {
       const d = child.val();
       badgesData.push({ id: child.key, ...d });
      });
      renderBadgesStrips();
     })
     .catch((e) => console.error("Badges load failed:", e));

    // Load bag items
    db
     .ref("content/bag")
     .orderByChild("timestamp")
     .once("value", (snap) => {
      bagData = [];
      snap.forEach((child) => {
       const d = child.val();
       bagData.push({ id: child.key, ...d });
      });
      renderBag();
      renderHomeUpdates();
     })
     .catch((e) => console.error("Bag load failed:", e));

    // Load status entries
    db
     .ref("content/status")
     .orderByChild("timestamp")
     .once("value", (snap) => {
      statusData = [];
      snap.forEach((child) => {
       const d = child.val();
       statusData.push({ id: child.key, ...d });
      });
      renderStatus();
      updateLastUpdatedDisplay();
     })
     .catch((e) => console.error("Status load failed:", e));

    // Load to-do list
    db
     .ref("content/todos")
     .orderByChild("timestamp")
     .once("value", (snap) => {
      todosData = [];
      snap.forEach((child) => {
       const d = child.val();
       todosData.push({ id: child.key, ...d });
      });
      renderHomeTodo();
     })
     .catch((e) => console.error("Todos load failed:", e));
   }

   /* ═══════════════════════════════════════════════════════
   ANON NAME GENERATOR
  random ***** names, these are so goofy.
═══════════════════════════════════════════════════════ */
   const ANON_ADJ = [
    "Crunchy",
    "Unhinged",
    "Deepfried",
    "Silly",
    "Crusty",
    "Moldy",
    "Spicy",
    "Juicy",
    "Blessed",
    "Cursed",
    "Gremlin",
    "Glowy",
    "Sparkly",
    "Glossy",
    "Feral",
    "Certified",
    "Emotional",
    "Threatening",
    "Delusional",
    "Dramatic",
    "Haunted",
    "Sleepdeprived",
    "Goofy",
    "Liquid",
    "Neon",
    "Stinky",
    "Chunky",
    "Fragile",
    "Premium",
    "Bootleg",
    "Radiactive",
   ];

   const ANON_NOUN = [
    "Cat",
    "Dog",
    "Neopet",
    "Gremlin",
    "Possum",
    "Raccoon",
    "Creature",
    "Critter",
    "Tamagotchi",
    "Furby",
    "Alien",
    "Blob",
    "Uhhh",
    "Bear",
    "NPC",
    "Brochacho",
    "NPC",
    "Nugget",
    "Braincell",
    "Vibe",
    "Microplastic",
    "Glitter",
    "Slime",
    "Goblin",
    "Dumpling",
    "Noodle",
    "King",
    "Roomba",
    "Diva",
    "Pigeon",
    "Beanie babie",
    "Penguin",
   ];

   function genAnonName() {
    return `Anon. ${ANON_ADJ[Math.floor(Math.random() * ANON_ADJ.length)]} ${ANON_NOUN[Math.floor(Math.random() * ANON_NOUN.length)]}`;
   }
   function nameFromKey(key) {
    let h1 = 0,
     h2 = 5381;
    for (let i = 0; i < key.length; i++) {
     const c = key.charCodeAt(i);
     h1 = (Math.imul(h1, 31) + c) >>> 0;
     h2 = (Math.imul(h2, 33) ^ c) >>> 0;
    }
    return `Anon. ${ANON_ADJ[h1 % ANON_ADJ.length]} ${ANON_NOUN[h2 % ANON_NOUN.length]}`;
   }

   /* ═══════════════════════════════════════════════════════
   DARK MODE
═══════════════════════════════════════════════════════ */
   function toggleDark() {
    const dark = document.body.classList.toggle("dark");
    const btn = document.getElementById("darkToggle");
    btn.textContent = dark ? "◑ MODE" : "◐ MODE";
    btn.classList.toggle("is-active", dark);
    try {
     localStorage.setItem("darkMode", dark ? "1" : "0");
    } catch (_) {}
   }

   try {
    if (localStorage.getItem("darkMode") === "1") {
     document.body.classList.add("dark");
     const btn = document.getElementById("darkToggle");
     btn.textContent = "◑ MODE";
     btn.classList.add("is-active");
    }
   } catch (_) {}

   /* ═══════════════════════════════════════════════════════
   NAVIGATION
═══════════════════════════════════════════════════════ */

   /* Activates a section, updates the nav icon state, and
   moves the icon bar between nav and home hero as needed. */
   function _activateSection(id) {
    document
     .querySelectorAll("section")
     .forEach((s) => s.classList.remove("active"));
    const sec = document.getElementById(id);
    if (sec) sec.classList.add("active");
    document
     .querySelectorAll(".desk-icon")
     .forEach((n) => n.classList.remove("active"));
    const navMap = {
     "log-reader": "writing",
     "shrine-reader": "shrines",
     "letter-reader": "letters",
    };
    const pageId = navMap[id] || id;
    const deskLink = document.getElementById("desk-link-" + pageId);
    if (deskLink) deskLink.classList.add("active");
    closeMenu();
    relocateNavLinks(id === "home");
    updateNekoVisibility(id === "personal");
    window.scrollTo(0, 0);
   }

   /* Moves the icon bar into the home sidebar nav slot when on Home,
   or back into the top nav on all other pages. */
   function relocateNavLinks(toHome) {
    const bar = document.getElementById("desktopIconsBar");
    const navCenter = document.getElementById("navCenter");
    const navSlot = document.getElementById("homeNavSlot");
    if (!bar || !navCenter) return;
    document.body.classList.toggle("is-home-page", toHome);
    if (toHome && navSlot) {
     if (bar.parentElement !== navSlot) navSlot.appendChild(bar);
     bar.classList.add("in-nav", "home-sidebar-nav");
     navCenter.style.display = "none";
     initHomeNavPagination();
    } else if (!toHome) {
     const wasInHomeSidebar = bar.parentElement !== navCenter;
     if (wasInHomeSidebar) {
      const nextBtn = navCenter.querySelector(".nav-carousel-next");
      navCenter.insertBefore(bar, nextBtn || null);
     }
     navCenter.style.display = "";
     bar.classList.remove("home-sidebar-nav");
     bar.classList.add("in-nav");
     if (wasInHomeSidebar) bar.scrollLeft = 0;
     setTimeout(updateNavCarouselButtons, 0);
     teardownHomeNavPagination();
    }
   }

   /* ═══════════════════════════════════════════════════════
   HOME SIDEBAR NAV — PAGINATION (10 links per page)
═══════════════════════════════════════════════════════ */
   const HOME_NAV_LINKS_PER_PAGE = 10;
   let homeNavCurrentPage = 0;

   function getHomeNavItems() {
    const bar = document.getElementById("desktopIconsBar");
    if (!bar) return [];
    return Array.from(bar.children).filter(
     (el) => el.classList.contains("desk-icon") || el.classList.contains("desk-icon-group"),
    );
   }

   function initHomeNavPagination() {
    homeNavCurrentPage = 0;
    renderHomeNavPage();
   }

   function teardownHomeNavPagination() {
    getHomeNavItems().forEach((item) => (item.style.display = ""));
    const pagination = document.getElementById("homeNavPagination");
    if (pagination) pagination.style.display = "none";
   }

   function renderHomeNavPage() {
    const items = getHomeNavItems();
    const pagination = document.getElementById("homeNavPagination");
    const totalPages = Math.ceil(items.length / HOME_NAV_LINKS_PER_PAGE);
    if (!items.length || totalPages <= 1) {
     items.forEach((item) => (item.style.display = ""));
     if (pagination) pagination.style.display = "none";
     return;
    }
    const start = homeNavCurrentPage * HOME_NAV_LINKS_PER_PAGE;
    const end = start + HOME_NAV_LINKS_PER_PAGE;
    items.forEach((item, i) => {
     item.style.display = i >= start && i < end ? "" : "none";
    });
    if (pagination) {
     pagination.style.display = "flex";
     const status = document.getElementById("homeNavPageStatus");
     if (status) status.textContent = `PAGE ${homeNavCurrentPage + 1} / ${totalPages}`;
     const prevBtn = document.getElementById("homeNavPrevBtn");
     const nextBtn = document.getElementById("homeNavNextBtn");
     if (prevBtn) prevBtn.disabled = homeNavCurrentPage <= 0;
     if (nextBtn) nextBtn.disabled = homeNavCurrentPage >= totalPages - 1;
    }
   }

   function homeNavGoToPage(dir) {
    const items = getHomeNavItems();
    const totalPages = Math.ceil(items.length / HOME_NAV_LINKS_PER_PAGE);
    homeNavCurrentPage = Math.min(Math.max(homeNavCurrentPage + dir, 0), totalPages - 1);
    renderHomeNavPage();
   }

   /* Shows a page with a brief loader animation and updates the URL hash. */
   function showPage(id, callback) {
    if (id === "board") id = "home";
    showLoader();
    setTimeout(() => {
     _activateSection(id);
      if (id === "personal") switchPersonalSubpage("about");
      if (id === "goodies") switchGoodiesSubpage("code-snippets");
     const hashVal = id === "home" ? "" : id;
     const newHash = hashVal ? "#" + hashVal : "#";
     if (
      window.location.hash !== newHash &&
      !(id === "home" && window.location.hash === "")
     ) {
      window.history.pushState(
       { page: id },
       "",
       hashVal ? "#" + hashVal : location.pathname + location.search,
      );
     }
     hideLoader();
     if (typeof callback === "function") callback();
    }, 1200);
   }

   function toggleMenu() {
    const bar = document.getElementById("desktopIconsBar");
    const trigger = document.getElementById("menuTrigger");
    if (!bar) return;
    const isOpen = bar.classList.toggle("show");
    if (trigger) {
     trigger.classList.toggle("is-open", isOpen);
     trigger.setAttribute("aria-expanded", String(isOpen));
    }
   }

   function closeMenu() {
    const bar = document.getElementById("desktopIconsBar");
    const trigger = document.getElementById("menuTrigger");
    if (!bar || !bar.classList.contains("show")) return;
    bar.classList.remove("show");
    if (trigger) {
     trigger.classList.remove("is-open");
     trigger.setAttribute("aria-expanded", "false");
    }
   }

   document.addEventListener("click", (evt) => {
    const bar = document.getElementById("desktopIconsBar");
    const trigger = document.getElementById("menuTrigger");
    if (!bar || !bar.classList.contains("show")) return;
    if (bar.contains(evt.target) && evt.target.closest(".desk-icon")) {
     closeMenu();
     return;
    }
    if (!bar.contains(evt.target) && evt.target !== trigger && !trigger?.contains(evt.target)) {
     closeMenu();
    }
   });

   /* Scrolls the top-nav icon strip left/right by one 5-icon page — used by the carousel arrows. */
   function navCarouselScroll(dir) {
    const bar = document.getElementById("desktopIconsBar");
    if (!bar) return;
    bar.scrollBy({ left: dir * bar.clientWidth, behavior: "smooth" });
   }

   /* Keeps the carousel arrows disabled at the start/end of the strip. */
   function updateNavCarouselButtons() {
    const bar = document.getElementById("desktopIconsBar");
    const prev = document.querySelector(".nav-carousel-prev");
    const next = document.querySelector(".nav-carousel-next");
    if (!bar || !prev || !next) return;
    const maxScroll = bar.scrollWidth - bar.clientWidth;
    prev.disabled = bar.scrollLeft <= 2;
    next.disabled = bar.scrollLeft >= maxScroll - 2;
   }

   /* ═══════════════════════════════════════════════════════
   WEBNEKO!!!
═══════════════════════════════════════════════════════ */
   function updateNekoVisibility(show) {
    const nl = document.getElementById("nl");
    if (nl) nl.style.display = show ? "" : "none";
   }

   /* ═══════════════════════════════════════════════════════
   RENDER — ART GRID
═══════════════════════════════════════════════════════ */
   function renderArtGrid() {
    const feed = document.getElementById("artFeed");
    feed.innerHTML = "";
    const categoryMap = { illustration: "graphic" };
    const mapped = artData.map((p) => ({
     ...p,
     _category: categoryMap[p.category] || p.category,
    }));
    const filtered =
     activeCategory === "all"
      ? mapped
      : mapped.filter((p) => p._category === activeCategory);
    if (!filtered.length) {
     feed.innerHTML =
      '<p style="font-family:var(--font-mono);font-size:12px;color:var(--text-muted);text-align:center;padding:3rem;">// No pieces in this category yet.</p>';
     return;
    }
    filtered.forEach((piece) => {
     const idx = artData.indexOf(artData.find((a) => a.id === piece.id));
     const el = document.createElement("div");
     el.className = "art-post";
     el.onclick = () => openLightbox(idx);
     el.innerHTML = `<img src="${normalizeImageUrl(piece.images[0])}" alt="${piece.title}" /><div class="post-label"><span>${piece.title}</span><span>${piece.meta}</span></div><button class="admin-delete-btn" onclick="event.stopPropagation();adminDeleteArt(${idx})">DELETE</button>`;
     feed.appendChild(el);
    });
   }

   /* ═══════════════════════════════════════════════════════
   RENDER — LOG LIST + TAG SIDEBAR
═══════════════════════════════════════════════════════ */
   let activeTagFilter = null;

   function renderLogList() {
    try {
     renderTagSidebar();
    } catch (e) {
     console.error("Tag sidebar failed:", e);
    }
    const list = document.getElementById("logList");
    list.innerHTML = "";
    let displayLogs = [...logsData];
    if (activeTagFilter) {
     displayLogs = displayLogs.filter((log) =>
      (log.tags || []).some((t) => String(t).trim() === activeTagFilter),
     );
    }
    const sortOrder =
     document.getElementById("logSortOrder")?.value || "latest";
    displayLogs.sort(
     (a, b) =>
      (parseMetaDate(a.meta) || a.timestamp || 0) -
      (parseMetaDate(b.meta) || b.timestamp || 0),
    );
    if (sortOrder === "latest") displayLogs.reverse();
    if (!displayLogs.length) {
     list.innerHTML = `<p class="post-label" style="opacity:0.6;">// no logs found for this tag.</p>`;
     return;
    }
    displayLogs.forEach((log) => {
     const originalIndex = logsData.findIndex((item) => item.id === log.id);
     const el = document.createElement("div");
     el.className = "blog-list-item";
     el.onclick = () => readLog(originalIndex);
     el.innerHTML = `
   <div class="log-titlebar">
   <span class="log-titlebar-flower">✿</span>
  <div class="log-titlebar-label">${log.meta}</div>
      </div>
      <div class="log-card-body">
        <h2 class="log-card-title">${log.title}</h2>
        ${renderTagsHTML(log.tags)}
      </div>
      <div class="admin-log-actions">
        <button class="admin-edit-btn" onclick="event.stopPropagation();openEditLog(${originalIndex})">EDIT</button>
        <button class="admin-delete-btn" onclick="event.stopPropagation();adminDeleteLog(${originalIndex})">DELETE</button>
      </div>`;
     list.appendChild(el);
    });
   }

   function renderTagSidebar() {
    const sidebar = document.getElementById("logTagSidebar");
    if (!sidebar) return;
    const counts = {};
    logsData.forEach((log) => {
     (log.tags || []).forEach((raw) => {
      const tag = String(raw).trim();
      if (!tag) return;
      counts[tag] = (counts[tag] || 0) + 1;
     });
    });
    const sortedTags = Object.keys(counts).sort((a, b) => a.localeCompare(b));
    let html = `<p class="tag-sidebar-title">// filter by tag</p>`;
    html += `<div class="tag-sidebar-item ${activeTagFilter === null ? "active" : ""}" onclick="filterByTag(null)"><span>ALL LOGS</span><span class="tag-sidebar-count">${logsData.length}</span></div>`;
    sortedTags.forEach((tag) => {
     const isActive = activeTagFilter === tag;
     const safeTag = tag.replace(/'/g, "\\'");
     html += `<div class="tag-sidebar-item ${isActive ? "active" : ""}" onclick="filterByTag('${safeTag}')"><span>#${tag.replace(/^#/, "")}</span><span class="tag-sidebar-count">${counts[tag]}</span></div>`;
    });
    sidebar.innerHTML = html;
   }

   function filterByTag(tag) {
    activeTagFilter = activeTagFilter === tag ? null : tag;
    renderLogList();
   }

   /* ─────────────────────────────────────────────────────
   LOG ATTACHMENTS
───────────────────────────────────────────────────── */
   function buildAttachmentsGrid(urls, logTitle) {
    if (!urls || !urls.length) return "";
    const safeTitle = escHtml(logTitle || "LOG");
    const items = urls
     .map((u) => {
      const fullUrl = normalizeImageUrl(u);
      return (
       `<div class="log-attachment-item" data-log-img="${escHtml(fullUrl)}" data-log-title="${safeTitle}">` +
       `<img class="log-attachment-img" src="${fullUrl}" alt="Attachment" loading="lazy" draggable="false" /></div>`
      );
     })
     .join("");
    return `
    <div class="log-attachments">
      <div class="log-attachments-label">ATTACHMENTS //</div>
      <div class="log-attachments-grid">${items}</div>
    </div>`;
   }

   /* Opens a log entry in the reader section. */
   function readLog(i) {
    const log = logsData[i];
    if (!log) return;
    window._currentLogIndex = i;
    const editBtn = document.getElementById("logReaderEditBtn");
    if (editBtn)
     editBtn.style.display = isAdminSession() ? "inline-block" : "none";

    let photoUrls = [],
     cleanBody = log.body || "";
    if (log.stickers && Array.isArray(log.stickers)) {
     photoUrls = log.stickers.filter(Boolean);
    } else if (log.stickers && typeof log.stickers === "object") {
     photoUrls = Object.values(log.stickers).filter(Boolean);
    } else {
     // Legacy: bare URLs embedded in body text — extract and strip.
     const lines = cleanBody.split("\n"),
      cb = [],
      re = /^(https?:\/\/[^\s]+)$/i;
     lines.forEach((l) => {
      const t = l.trim();
      re.test(t) ? photoUrls.push(t) : cb.push(l);
     });
     cleanBody = cb.join("\n");
    }

    const attachmentsHtml = buildAttachmentsGrid(photoUrls, log.title || "LOG");
    document.getElementById("log-content").innerHTML =
     `<p class="post-label" style="margin-bottom:1rem;font-size:1.05rem;">${log.meta || ""}</p>` +
     `<h1 style="margin-bottom:2rem;font-family:var(--font-tech);text-transform:uppercase;font-size:clamp(1.4rem,3vw,1.9rem);line-height:1.15;">${log.title || "UNTITLED"}</h1>` +
     `<div class="log-body-text">${cleanBody}</div>` +
     attachmentsHtml +
     renderTagsHTML(log.tags);

    document
     .querySelectorAll(".log-attachment-item[data-log-img]")
     .forEach((item) => {
      item.addEventListener("click", (ev) => {
       ev.preventDefault();
       ev.stopPropagation();
       openSimpleViewer(
        encodeURIComponent(item.getAttribute("data-log-img") || ""),
        "",
       );
      });
     });

    const logHash = "#log/" + log.id;
    if (window.location.hash !== logHash)
     window.history.pushState(
      { page: "log-reader", logId: log.id },
      "",
      logHash,
     );
    _activateSection("log-reader");
   }

   /* ═══════════════════════════════════════════════════════
   RENDER — SHRINE GRID + READER
═══════════════════════════════════════════════════════ */
   function renderShrineGrid() {
    const grid = document.getElementById("shrineGrid");
    if (!grid) return;
    grid.innerHTML = "";
    if (!shrinesData.length) {
     grid.innerHTML =
      '<p style="font-family:var(--font-mono);font-size:12px;color:var(--text-muted);text-align:center;padding:3rem;">// No shrines yet.</p>';
     return;
    }
    let display = [...shrinesData];
    const sortOrder =
     document.getElementById("shrineSortOrder")?.value || "latest";
    display.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    if (sortOrder === "latest") display.reverse();
    display.forEach((shrine) => {
     const idx = shrinesData.findIndex((s) => s.id === shrine.id);
     const el = document.createElement("div");
     el.className = "shrine-card";
     el.onclick = () => readShrine(idx);
     const imgHtml = shrine.coverImage
      ? `<img class="shrine-card-img" src="${normalizeImageUrl(shrine.coverImage)}" alt="${shrine.title}" />`
      : `<div class="shrine-card-img-placeholder">✿</div>`;
     el.innerHTML = `
      <div class="shrine-card-titlebar">✿ shrine</div>
      ${imgHtml}
      <div class="shrine-card-label">
        <div class="shrine-card-title">${shrine.title}</div>
        <div class="shrine-card-desc">${shrine.tagline || ""}</div>
        <div class="admin-log-actions">
          <button class="admin-edit-btn" onclick="event.stopPropagation();openEditShrine(${idx})">EDIT</button>
          <button class="admin-delete-btn" onclick="event.stopPropagation();adminDeleteShrine(${idx})">DELETE</button>
        </div>
      </div>`;
     grid.appendChild(el);
    });
   }

   function readShrine(i) {
    const shrine = shrinesData[i];
    if (!shrine) return;
    window._currentShrineIndex = i;
    const editBtn = document.getElementById("shrineReaderEditBtn");
    if (editBtn)
     editBtn.style.display = isAdminSession() ? "inline-block" : "none";

    const container = document.getElementById("shrine-content");
    const imgHtml = shrine.coverImage
     ? `<img class="shrine-hero-img" src="${normalizeImageUrl(shrine.coverImage)}" alt="${shrine.title}" />`
     : "";
    const imgs = normalizeImages(shrine.images || []);
    const captions = normalizeImages(shrine.captions || []);
    let galleryHtml = "";
    if (imgs.length) {
     galleryHtml = `<div class="shrine-gallery">${imgs
      .map((u, i) => {
       const cap = captions[i] || "";
       const fullUrl = normalizeImageUrl(u);
       return (
        `<div class="shrine-gallery-item"${cap ? ` data-caption="${escHtml(cap)}"` : ""} data-shrine-img="${escHtml(fullUrl)}" data-shrine-title="${escHtml(shrine.title || "SHRINE")}">` +
        `<img class="shrine-gallery-img" src="${fullUrl}" alt="${escHtml(cap)}" loading="lazy" draggable="false" /></div>`
       );
      })
      .join("")}</div>`;
    }
    const bodyHtml = shrine.body
     ? `<div class="shrine-body-text">${shrine.body}</div>`
     : "";

    container.innerHTML = `<div class="shrine-content" style="padding-bottom:1.25rem;"><p class="post-label" style="margin-bottom:0.5rem;font-size:0.75rem;color:var(--text-muted);letter-spacing:0.06em;">SHRINE</p><h1 style="font-family:var(--font-tech);text-transform:uppercase;font-size:clamp(1.6rem,3vw,2.2rem);">${shrine.title}</h1>${shrine.tagline ? `<p class="shrine-tagline">${escHtml(shrine.tagline)}</p>` : ""}</div>${imgHtml}<div class="shrine-content">${bodyHtml}${galleryHtml}</div>`;

    container
     .querySelectorAll(".shrine-gallery-item[data-shrine-img]")
     .forEach((item) => {
      item.addEventListener("click", (ev) => {
       ev.preventDefault();
       ev.stopPropagation();
       openImageLightbox(
        encodeURIComponent(item.getAttribute("data-shrine-img") || ""),
        item.getAttribute("data-shrine-title") || "SHRINE",
        item.getAttribute("data-caption") || "",
       );
      });
     });

    const h = "#shrine/" + shrine.id;
    if (window.location.hash !== h)
     window.history.pushState(
      { page: "shrine-reader", shrineId: shrine.id },
      "",
      h,
     );
    _activateSection("shrine-reader");
   }

   function editCurrentShrine() {
    const idx = window._currentShrineIndex;
    if (idx === undefined || idx < 0) return;
    openEditShrine(idx);
   }

   /* ═══════════════════════════════════════════════════════
   RENDER — LETTER LIST + READER
═══════════════════════════════════════════════════════ */
   function readLetter(i) {
    const letter = lettersData[i];
    if (!letter) return;
    window._currentLetterIndex = i;
    const editBtn = document.getElementById("letterReaderEditBtn");
    if (editBtn)
     editBtn.style.display = isAdminSession() ? "inline-block" : "none";
    const content = document.getElementById("letter-content");
    content.innerHTML = `<div class="letter-paper-to">TO: ${escHtml(letter.to || "???")}</div><div class="letter-paper-re">${escHtml(letter.subject || "(untitled)")}</div><div class="letter-body-text">${letter.body || ""}</div>${renderTagsHTML(letter.tags)}<div class="letter-unsent-stamp"><span class="letter-unsent-badge">UNSENT</span>// this letter was never delivered.</div>`;
    const h = "#letter/" + letter.id;
    if (window.location.hash !== h)
     window.history.pushState(
      { page: "letter-reader", letterId: letter.id },
      "",
      h,
     );
    _activateSection("letter-reader");
   }

   function editCurrentLetter() {
    const idx = window._currentLetterIndex;
    if (idx === undefined || idx < 0) return;
    openEditLetter(idx);
   }

   function renderLetterList() {
    const list = document.getElementById("letterList");
    if (!list) return;
    list.innerHTML = "";
    if (!lettersData.length) {
     list.innerHTML =
      '<p style="font-family:var(--font-mono);font-size:12px;color:var(--text-muted);text-align:center;padding:3rem;grid-column:1/-1;">// No letters yet.</p>';
     return;
    }
    let display = [...lettersData];
    const sortOrder =
     document.getElementById("letterSortOrder")?.value || "latest";
    display.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    if (sortOrder === "latest") display.reverse();

    display.forEach((letter, displayIdx) => {
     const originalIndex = lettersData.findIndex((l) => l.id === letter.id);
     const ballSrc = LETTER_BALL_IMAGES[displayIdx % LETTER_BALL_IMAGES.length];
     const el = document.createElement("div");
     el.className = "letter-envelope";
     el.onclick = () => readLetter(originalIndex);
     el.innerHTML =
      `<img class="env-ball" src="${ballSrc}" alt="" draggable="false" />` +
      `<div class="admin-log-actions"><button class="admin-edit-btn" onclick="event.stopPropagation();openEditLetter(${originalIndex})">EDIT</button><button class="admin-delete-btn" onclick="event.stopPropagation();adminDeleteLetter(${originalIndex})">DELETE</button></div>`;
     list.appendChild(el);
    });
   }

   /* ═══════════════════════════════════════════════════════
   LIGHTBOX
═══════════════════════════════════════════════════════ */
   let lbPiece = null,
    lbIdx = 0,
    lbArtIndex = -1;

   /* Full art lightbox with info panel and delete button. */
   function openLightbox(i) {
    lbPiece = Object.assign({}, artData[i], { simple: false });
    lbIdx = 0;
    lbArtIndex = i;
    resetZoom();
    renderLightbox();
    const delBtn = document.getElementById("lb-delete-btn");
    if (delBtn) delBtn.style.display = isAdminSession() ? "block" : "none";
    document.getElementById("lightbox").classList.add("show");
   }

   /* Simple single-image viewer for logs — just an
   enlarged image with an optional caption, no toolbar, no zoom,
   no nav, no animation. */
   function openSimpleViewer(encodedUrl, caption) {
    const url = decodeURIComponent(encodedUrl);
    document.getElementById("simple-viewer-img").src = normalizeImageUrl(url);
    const capEl = document.getElementById("simple-viewer-caption");
    capEl.textContent = caption || "";
    capEl.style.display = caption ? "block" : "none";
    document.getElementById("simpleViewer").classList.add("show");
   }
   function closeSimpleViewer() {
    document.getElementById("simpleViewer").classList.remove("show");
   }

   /* Shrine lightbox — image + caption, styled to match the site. */
   function openImageLightbox(encodedUrl, title, caption) {
    const url = decodeURIComponent(encodedUrl);
    lbPiece = {
     title: title || "IMAGE",
     caption: caption || "",
     images: [url],
     simple: true,
    };
    lbIdx = 0;
    lbArtIndex = -1;
    resetZoom();
    renderLightbox();
    document.getElementById("lightbox").classList.add("show");
   }

   function renderLightbox() {
    if (!lbPiece) return;
    const multi = lbPiece.images.length > 1;
    const lb = document.getElementById("lightbox");
    const isSimple = !!lbPiece.simple;
    lb.classList.toggle("lb-simple", isSimple);
    document.getElementById("lb-image").src = normalizeImageUrl(
     lbPiece.images[lbIdx],
    );
    const titleSide = document.getElementById("lb-title-side");
    if (isSimple) {
     document.getElementById("lb-title").textContent = lbPiece.title || "";
     if (titleSide) titleSide.textContent = "";
    } else {
     document.getElementById("lb-title").textContent = "FILE";
     if (titleSide) titleSide.textContent = lbPiece.title || "";
    }

    const capTop = document.getElementById("lb-caption-top");
    if (capTop) {
     if (isSimple && lbPiece.caption) {
      capTop.textContent = lbPiece.caption;
      capTop.style.display = "block";
     } else {
      capTop.textContent = "";
      capTop.style.display = "none";
     }
    }

    const descEl = document.getElementById("lb-desc");
    const metaEl = document.getElementById("lb-meta");
    const delBtn = document.getElementById("lb-delete-btn");
    if (isSimple) {
     if (descEl) descEl.textContent = "";
     if (metaEl) metaEl.textContent = "";
     if (delBtn) delBtn.style.display = "none";
    } else {
     if (descEl) descEl.innerHTML = lbPiece.desc || "";
     if (metaEl) metaEl.textContent = lbPiece.meta ? lbPiece.meta : "";
     if (delBtn) delBtn.style.display = isAdminSession() ? "block" : "none";
    }

    const prev = document.getElementById("lb-prev"),
     next = document.getElementById("lb-next"),
     ctr = document.getElementById("lb-counter");
    prev.style.display =
     next.style.display =
     ctr.style.display =
      multi ? "block" : "none";
    if (multi) ctr.textContent = `${lbIdx + 1} / ${lbPiece.images.length}`;
    prev.disabled = lbIdx === 0;
    next.disabled = lbIdx === lbPiece.images.length - 1;
   }

   function lbNav(dir) {
    if (!lbPiece) return;
    lbIdx = Math.max(0, Math.min(lbPiece.images.length - 1, lbIdx + dir));
    resetZoom();
    renderLightbox();
   }

   function closeLightbox() {
    const lb = document.getElementById("lightbox");
    lb.classList.remove("show");
    lb.classList.remove("lb-simple");
    lbPiece = null;
    lbIdx = 0;
    lbArtIndex = -1;
    resetZoom();
   }

   /* ═══════════════════════════════════════════════════════
   LIVE CLOCK (STATUS CARD)
═══════════════════════════════════════════════════════ */
   function updateLiveStatus() {
    const now = new Date();
    const date = `${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}.${String(now.getFullYear()).slice(-2)}`;
    const time = now.toLocaleTimeString("en-US", {
     hour: "numeric",
     minute: "2-digit",
     second: "2-digit",
     hour12: true,
    });
    const ht = document.getElementById("homeTime");
    if (ht) ht.textContent = `${date}  ${time}`;
   }

   /* ═══════════════════════════════════════════════════════
   DRAG UTILITY
   Makes any element draggable within a parent container. TODO: refactor this or remove altogether.
═══════════════════════════════════════════════════════ */
   let zTop = 100;

   function makeDraggable(el, handle, parent) {
    let ox = 0,
     oy = 0,
     sx = 0,
     sy = 0;
    handle.onmousedown = handle.ontouchstart = start;
    function start(e) {
     e.preventDefault();
     el.style.zIndex = ++zTop;
     const { cx, cy } = pt(e);
     sx = cx;
     sy = cy;
     document.onmousemove = document.ontouchmove = move;
     document.onmouseup = document.ontouchend = stop;
    }
    function move(e) {
     const { cx, cy } = pt(e);
     ox = sx - cx;
     oy = sy - cy;
     sx = cx;
     sy = cy;
     let t = el.offsetTop - oy,
      l = el.offsetLeft - ox;
     if (parent) {
      t = Math.max(0, Math.min(t, parent.offsetHeight - el.offsetHeight));
      l = Math.max(0, Math.min(l, parent.offsetWidth - el.offsetWidth));
     }
     el.style.top = t + "px";
     el.style.left = l + "px";
    }
    function stop() {
     document.onmousemove = document.onmouseup = null;
     document.ontouchmove = document.ontouchend = null;
    }
    function pt(e) {
     const s =
      e.type === "touchend" || e.type === "touchcancel"
       ? e.changedTouches[0]
       : e.touches
         ? e.touches[0]
         : e;
     return { cx: s.clientX, cy: s.clientY };
    }
   }

   /* ═══════════════════════════════════════════════════════
   VISITOR COUNTRY DETECTION
   calls a Vercel serverless function. Fails silently on
   Neocities / local environments!
═══════════════════════════════════════════════════════ */
   let visitorCountry = null;

   async function detectVisitorCountry() {
    try {
     const r = await fetch("/api/get-country");
     if (!r.ok) return;
     const d = await r.json();
     visitorCountry = d.country || null;
    } catch (e) {
     /* silent on mirrors / local dev */
    }
   }

   /* Convert ISO country code to flag emoji */
   function countryToFlag(code) {
    if (!code || typeof code !== "string") return "";
    return code
     .toUpperCase()
     .replace(/./g, (ch) =>
      String.fromCodePoint(0x1f1e6 + ch.charCodeAt(0) - 65),
     );
   }

   /* ═══════════════════════════════════════════════════════
   BULLETIN BOARD
═══════════════════════════════════════════════════════ */
   const FALLBACK_W = 800,
    FALLBACK_H = 400;

   function renderMessage(id, msg, isSystem) {
    const MSG_TTL_MS = 7 * 24 * 60 * 60 * 1000;
    if (renderedIds.has(id)) return;
    if (!isSystem && msg.timestamp && Date.now() - msg.timestamp > MSG_TTL_MS)
     return;
    renderedIds.add(id);

    const canvasInner = document.getElementById("boardCanvasInner");
    const bw = canvasInner.offsetWidth || FALLBACK_W,
     bh = canvasInner.offsetHeight || FALLBACK_H;
    const popup = document.createElement("div");
    popup.className =
     "comment-popup" + (isSystem ? " comment-popup--system" : "");
    popup.style.left = Math.max(10, (msg.xPct / 100) * bw) + "px";
    popup.style.top = Math.max(10, (msg.yPct / 100) * bh) + "px";
    const hdr = document.createElement("div");
    hdr.className = "comment-header";
    const displayDate =
     msg.date ||
     (msg.timestamp
      ? (() => {
         const d = new Date(msg.timestamp);
         return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}.${String(d.getFullYear()).slice(-2)}`;
        })()
      : "");
    const countryTag = msg.country
     ? `<span class="comment-country">${countryToFlag(msg.country)}</span>`
     : "";
    hdr.innerHTML = `<span>${escHtml(msg.name || nameFromKey(id))}${countryTag}</span><span>${displayDate ? escHtml(displayDate) + " · " : ""}${escHtml(msg.time)}</span>`;
    const bdy = document.createElement("div");
    bdy.className = "comment-body";
    bdy.textContent = msg.text;
    popup.append(hdr, bdy);
    canvasInner.appendChild(popup);
    makeDraggable(popup, hdr, canvasInner);
   }

   function submitComment() {
    const input = document.getElementById("commentInput");
    const nameInput = document.getElementById("commentName");
    const text = input.value.trim();
    if (!text) return;
    if (!msgRef) {
     console.warn("Board unavailable.");
     return;
    }
    if (!canPost()) {
     const w = document.getElementById("spamWarning");
     w.textContent = `// Please wait ${getTimeUntilCanPost()}s before posting again...`;
     w.style.display = "block";
     setTimeout(() => {
      w.style.display = "none";
     }, 3000);
     return;
    }
    const customName =
     nameInput && nameInput.value ? nameInput.value.trim().slice(0, 40) : "";
    const finalName = customName || genAnonName();
    const xPct = Math.max(2, Math.random() * 72),
     yPct = Math.max(2, Math.random() * 68),
     now = new Date();
    const payload = {
     text,
     name: finalName,
     time: now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
     }),
     date: `${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}.${String(now.getFullYear()).slice(-2)}`,
     xPct,
     yPct,
     timestamp: firebase.database.ServerValue.TIMESTAMP,
     country: visitorCountry || null,
    };
    msgRef
     .push(payload)
     .then(() => {
      updateLastPostTime();
      // take out oldest messages if board exceeds MAX_MSGS
      msgRef
       .orderByChild("timestamp")
       .limitToLast(MAX_MSGS + 50)
       .once("value", (snap) => {
        const count = snap.numChildren();
        if (count <= MAX_MSGS) return;
        const toDrop = count - MAX_MSGS;
        const updates = {};
        let i = 0;
        snap.forEach((c) => {
         if (i++ < toDrop) updates[c.key] = null;
        });
        if (Object.keys(updates).length) msgRef.update(updates).catch(() => {});
       })
       .catch(() => {});
     })
     .catch((e) => console.error("Post failed:", e));
    input.value = "";
    if (nameInput) nameInput.value = "";
    const c = document.getElementById("charCounter");
    c.textContent = "0 / 500";
    c.classList.remove("warn");
   }

   /* ═══════════════════════════════════════════════════════
   VISITOR COUNTER
═══════════════════════════════════════════════════════ */
   function initVisitorCounter() {
    const counterRef = db.ref("stats/visitorCount");
    const VISITOR_KEY = "sei_visitor_counted";
    if (!localStorage.getItem(VISITOR_KEY)) {
     counterRef
      .transaction((curr) => (curr || 0) + 1)
      .then(() => {
       localStorage.setItem(VISITOR_KEY, "1");
      })
      .catch((e) => console.warn("Visitor count write failed:", e));
    }
    counterRef.on("value", (snap) => {
     const el = document.getElementById("visitorCountValue");
     if (el) el.textContent = (snap.val() || 0).toLocaleString();
    });
   }

   /* ═══════════════════════════════════════════════════════
   ADMIN — AUTH + MODAL MANAGEMENT
═══════════════════════════════════════════════════════ */
   function openModal(id) {
    document.getElementById(id).style.display = "flex";
   }
   function closeModal(id) {
    document.getElementById(id).style.display = "none";
   }

   function showAdminLogin() {
    if (isAdminSession()) {
     setAdminMode(true);
     openModal("adminPanelModal");
     return;
    }
    openModal("adminLoginModal");
    setTimeout(() => document.getElementById("adminPassInput").focus(), 50);
   }
   function closeAdminLogin() {
    closeModal("adminLoginModal");
    document.getElementById("adminPassInput").value = "";
    document.getElementById("adminPassError").style.display = "none";
   }

   async function verifyAdminPass() {
    const pw = document.getElementById("adminPassInput").value;
    const err = document.getElementById("adminPassError");
    err.style.display = "none";
    if (!pw) return;
    try {
     const res = await fetch(apiUrl("/api/admin-auth"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
     });
     const data = await res.json();
     if (data.ok) {
      sessionStorage.setItem(
       ADMIN_TOKEN_KEY,
       JSON.stringify({ token: data.token, ts: data.ts }),
      );
      closeAdminLogin();
      setAdminMode(true);
      openModal("adminPanelModal");
     } else {
      err.textContent = "// ACCESS DENIED.";
      err.style.display = "block";
     }
    } catch (e) {
     err.textContent = "// CONNECTION ERROR.";
     err.style.display = "block";
     console.error("Auth failed:", e);
    }
   }

   function closeAdminPanel() {
    try {
     sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    } catch (_) {}
    setAdminMode(false);
    closeModal("adminPanelModal");
    const pill = document.getElementById("adminReopenPill");
    if (pill) pill.style.display = "none";
   }

   function hideAdminPanel() {
    closeModal("adminPanelModal");
    setAdminMode(true);
    let pill = document.getElementById("adminReopenPill");
    if (!pill) {
     pill = document.createElement("button");
     pill.id = "adminReopenPill";
     pill.className = "admin-reopen-pill";
     pill.textContent = "ADMIN ▸";
     pill.title = "Re-open admin panel";
     pill.onclick = () => {
      openModal("adminPanelModal");
     };
     document.body.appendChild(pill);
    }
    pill.style.display = "inline-flex";
   }

   /* ─────────────────────────────────────────────────────
   adminWrite — single chokepoint for all CMS mutations, sends requests to /api/admin-write on Vercel, which
   uses the Firebase Admin SDK to bypass public rules. DO NOT TOUCH UNLESS YOU NEED TO
───────────────────────────────────────────────────── */
   async function adminWrite(op, path, payload) {
    let session = null;
    try {
     session = JSON.parse(sessionStorage.getItem(ADMIN_TOKEN_KEY) || "null");
    } catch (_) {}
    if (!session || !session.token) {
     throw new Error("Not logged in");
    }
    const body = { token: session.token, ts: session.ts, op, path };
    if (op === "push") body.data = payload;
    if (op === "update") {
     body.id = payload.id;
     body.data = payload.data;
    }
    if (op === "remove") body.id = payload.id;
    const res = await fetch(apiUrl("/api/admin-write"), {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify(body),
    });
    const out = await res
     .json()
     .catch(() => ({ ok: false, reason: "Bad response" }));
    if (!out.ok) throw new Error(out.reason || "Write failed");
    return out;
   }

   /* ═══════════════════════════════════════════════════════
   ADMIN — TAB SWITCHING
═══════════════════════════════════════════════════════ */
   function switchAdminTab(tab) {
    const forms = [
     "art",
     "logs",
     "shrines",
     "letters",
     "badges",
     "bag",
     "status",
     "todo",
    ];
    forms.forEach((t) => {
     const form = document.getElementById(
      "admin" + t.charAt(0).toUpperCase() + t.slice(1) + "Form",
     );
     if (form) form.style.display = t === tab ? "flex" : "none";
     const btn = document.getElementById("tab-" + t);
     if (btn) btn.classList.toggle("active", t === tab);
    });
    if (tab === "shrines") {
     if (typeof initShrinePairRowsIfEmpty === "function")
      initShrinePairRowsIfEmpty();
    }
    if (tab === "todo") {
     if (typeof renderAdminTodoList === "function") renderAdminTodoList();
    }
   }

   /* ═══════════════════════════════════════════════════════
   ADMIN — ADD CONTENT
═══════════════════════════════════════════════════════ */

   /* Add Art */
   function adminAddArt() {
    if (!isAdminSession()) return;
    const title = document.getElementById("artTitle").value.trim(),
     category = document.getElementById("artCategory").value,
     imgRaw = document.getElementById("artImages").value.trim(),
     desc = document.getElementById("artDesc").value.trim(),
     meta = document.getElementById("artMeta").value.trim();
    if (!title || !imgRaw) return;
    const images = imgRaw
     .split("\n")
     .map((u) => u.trim())
     .filter(Boolean);
    if (!images.length) return;
    const piece = {
     title,
     category,
     images,
     desc,
     meta,
     timestamp: Date.now(),
    };
    adminWrite("push", "content/art", piece)
     .then((r) => {
      piece.id = r.id;
      artData.push(piece);
      renderArtGrid();
      renderHomeUpdates();
      const s = document.getElementById("artSuccess");
      s.style.display = "block";
      setTimeout(() => {
       s.style.display = "none";
      }, 3000);
     })
     .catch((e) => {
      console.error("Art push failed:", e);
      alert("// COULD NOT SAVE: " + e.message);
     });
    ["artTitle", "artImages", "artDesc", "artMeta"].forEach(
     (id) => (document.getElementById(id).value = ""),
    );
    document.getElementById("artCategory").value = "painting";
   }

   /* Add Log */
   function parseMetaDate(meta) {
    if (!meta) return null;
    const m = String(meta).match(/(\d{1,2})\.(\d{1,2})\.(\d{2})/);
    if (!m) return null;
    return new Date(
     2000 + parseInt(m[3], 10),
     parseInt(m[1], 10) - 1,
     parseInt(m[2], 10),
     12,
     0,
     0,
    ).getTime();
   }
   function adminAddLog() {
    if (!isAdminSession()) return;
    const title = document.getElementById("logTitle").value.trim(),
     body = document.getElementById("logBody").value.trim();
    if (!title || !body) return;
    const tags = parseTags(document.getElementById("logTags").value);
    const stickers = document
     .getElementById("logStickers")
     .value.split("\n")
     .map((s) => s.trim())
     .filter(Boolean);
    const logNumber = String(logsData.length + 1).padStart(2, "0");
    const now = new Date();
    const autoMeta = `LOG_${logNumber} // ${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}.${String(now.getFullYear()).slice(-2)}`;
    const meta = document.getElementById("logMeta").value.trim() || autoMeta;
    const timestamp = parseMetaDate(meta) || Date.now();
    const log = { title, meta, body, tags, stickers, timestamp };
    adminWrite("push", "content/logs", log)
     .then((r) => {
      log.id = r.id;
      logsData.push(log);
      renderLogList();
      renderHomeUpdates();
      const s = document.getElementById("logSuccess");
      s.style.display = "block";
      setTimeout(() => {
       s.style.display = "none";
      }, 3000);
     })
     .catch((e) => {
      console.error("Log push failed:", e);
      alert("// COULD NOT SAVE: " + e.message);
     });
    ["logTitle", "logBody", "logTags", "logStickers", "logMeta"].forEach(
     (id) => (document.getElementById(id).value = ""),
    );
   }

   /* ── Shrine paired-image+caption row helpers ── */
   function addShrinePairRow(containerId, url, caption) {
    const c = document.getElementById(containerId);
    if (!c) return;
    const row = document.createElement("div");
    row.className = "shrine-pair-row";
    row.innerHTML =
     `<input type="text" class="admin-input shrine-pair-url" placeholder="https://image-url.png" value="${escHtml(url || "")}" />` +
     `<input type="text" class="admin-input shrine-pair-caption" placeholder="caption (optional)" value="${escHtml(caption || "")}" />` +
     `<button type="button" class="shrine-pair-del" onclick="this.parentNode.remove()" title="Remove row">×</button>`;
    c.appendChild(row);
   }
   function initShrinePairRowsIfEmpty() {
    const c = document.getElementById("shrinePairRows");
    if (!c) return;
    if (c.children.length === 0) {
     addShrinePairRow("shrinePairRows");
     addShrinePairRow("shrinePairRows");
    }
   }
   function readShrinePairRows(containerId) {
    const c = document.getElementById(containerId);
    if (!c) return { images: [], captions: [] };
    const images = [],
     captions = [];
    c.querySelectorAll(".shrine-pair-row").forEach((row) => {
     const u = row.querySelector(".shrine-pair-url").value.trim();
     const cap = row.querySelector(".shrine-pair-caption").value.trim();
     if (u) {
      images.push(u);
      captions.push(cap);
     }
    });
    return { images, captions };
   }
   function fillShrinePairRows(containerId, images, captions) {
    const c = document.getElementById(containerId);
    if (!c) return;
    c.innerHTML = "";
    const imgs = images || [],
     caps = captions || [];
    const n = Math.max(imgs.length, 1);
    for (let i = 0; i < n; i++) {
     addShrinePairRow(containerId, imgs[i] || "", caps[i] || "");
    }
   }

   /* Add Shrine */
   function adminAddShrine() {
    if (!isAdminSession()) return;
    const title = document.getElementById("shrineTitle").value.trim();
    if (!title) return;
    const tagline = document.getElementById("shrineTagline").value.trim();
    const coverImage = document.getElementById("shrineCover").value.trim();
    const body = document.getElementById("shrineBody").value.trim();
    const { images, captions } = readShrinePairRows("shrinePairRows");
    const shrine = {
     title,
     tagline,
     coverImage,
     body,
     images,
     captions,
     timestamp: Date.now(),
    };
    adminWrite("push", "content/shrines", shrine)
     .then((r) => {
      shrine.id = r.id;
      shrinesData.push(shrine);
      renderShrineGrid();
      renderHomeUpdates();
      const s = document.getElementById("shrineSuccess");
      s.style.display = "block";
      setTimeout(() => {
       s.style.display = "none";
      }, 3000);
     })
     .catch((e) => {
      console.error("Shrine push failed:", e);
      alert("// COULD NOT SAVE: " + e.message);
     });
    ["shrineTitle", "shrineTagline", "shrineCover", "shrineBody"].forEach(
     (id) => (document.getElementById(id).value = ""),
    );
    fillShrinePairRows("shrinePairRows", [], []);
    initShrinePairRowsIfEmpty();
   }

   /* Add Letter */
   function adminAddLetter() {
    if (!isAdminSession()) return;
    const to = document.getElementById("letterTo").value.trim(),
     subject = document.getElementById("letterSubject").value.trim(),
     body = document.getElementById("letterBody").value.trim();
    if (!subject || !body) return;
    const letter = { to, subject, body, timestamp: Date.now() };
    adminWrite("push", "content/letters", letter)
     .then((r) => {
      letter.id = r.id;
      lettersData.push(letter);
      renderLetterList();
      renderHomeUpdates();
      const s = document.getElementById("letterSuccess");
      s.style.display = "block";
      setTimeout(() => {
       s.style.display = "none";
      }, 3000);
     })
     .catch((e) => {
      console.error("Letter push failed:", e);
      alert("// COULD NOT SAVE: " + e.message);
     });
    ["letterTo", "letterSubject", "letterBody"].forEach(
     (id) => (document.getElementById(id).value = ""),
    );
   }

   /* ═══════════════════════════════════════════════════════
   ADMIN — DELETE CONTENT
═══════════════════════════════════════════════════════ */
   function adminDeleteArt(idx) {
    if (!isAdminSession()) return;
    const piece = artData[idx];
    if (!confirm(`Delete "${piece.title}"?`)) return;
    if (piece.id) {
     adminWrite("remove", "content/art", { id: piece.id })
      .then(() => {
       artData.splice(idx, 1);
       renderArtGrid();
       renderHomeUpdates();
      })
      .catch((e) => {
       console.error("Delete art failed:", e);
       alert("// DELETE FAILED");
      });
    } else {
     artData.splice(idx, 1);
     renderArtGrid();
     renderHomeUpdates();
    }
   }
   function adminDeleteLog(idx) {
    if (!isAdminSession()) return;
    const log = logsData[idx];
    if (!confirm(`Delete "${log.title}"?`)) return;
    if (log.id) {
     adminWrite("remove", "content/logs", { id: log.id })
      .then(() => {
       logsData.splice(idx, 1);
       renderLogList();
       renderHomeUpdates();
      })
      .catch((e) => {
       console.error("Delete log failed:", e);
       alert("// DELETE FAILED");
      });
    } else {
     logsData.splice(idx, 1);
     renderLogList();
     renderHomeUpdates();
    }
   }
   function adminDeleteCurrentArt() {
    if (!isAdminSession() || lbArtIndex < 0) return;
    const idxToDelete = lbArtIndex;
    closeLightbox();
    adminDeleteArt(idxToDelete);
   }
   function adminDeleteShrine(idx) {
    if (!isAdminSession()) return;
    const s = shrinesData[idx];
    if (!confirm(`Delete shrine "${s.title}"?`)) return;
    if (s.id) {
     adminWrite("remove", "content/shrines", { id: s.id })
      .then(() => {
       shrinesData.splice(idx, 1);
       renderShrineGrid();
       renderHomeUpdates();
      })
      .catch((e) => {
       console.error("Delete shrine failed:", e);
       alert("// DELETE FAILED");
      });
    } else {
     shrinesData.splice(idx, 1);
     renderShrineGrid();
     renderHomeUpdates();
    }
   }
   function adminDeleteShrineFromEdit() {
    if (!isAdminSession()) return;
    const idx = _editShrineOriginalIndex;
    if (idx < 0) return;
    closeEditShrine();
    adminDeleteShrine(idx);
   }
   function adminDeleteLetter(idx) {
    if (!isAdminSession()) return;
    const l = lettersData[idx];
    if (!confirm(`Delete letter "${l.subject}"?`)) return;
    if (l.id) {
     adminWrite("remove", "content/letters", { id: l.id })
      .then(() => {
       lettersData.splice(idx, 1);
       renderLetterList();
       renderHomeUpdates();
      })
      .catch((e) => {
       console.error("Delete letter failed:", e);
       alert("// DELETE FAILED");
      });
    } else {
     lettersData.splice(idx, 1);
     renderLetterList();
     renderHomeUpdates();
    }
   }
   function adminDeleteLetterFromEdit() {
    if (!isAdminSession()) return;
    const idx = _editLetterOriginalIndex;
    if (idx < 0) return;
    closeEditLetter();
    adminDeleteLetter(idx);
   }

   /* ═══════════════════════════════════════════════════════
   BADGES (internet stamps)
═══════════════════════════════════════════════════════ */
   function renderBadgesStrips() {
    const all = (badgesData || []).filter((b) => b && b.image);
    const targets = [
     {
      id: "badgesStripHome",
      match: (b) =>
       (b.location || "both") === "home" || (b.location || "both") === "both",
     },
     {
      id: "badgesStripAbout",
      match: (b) =>
       (b.location || "both") === "about" || (b.location || "both") === "both",
     },
     {
      id: "badgesStripNeighbors",
      match: (b) => (b.location || "both") === "neighbors",
     },
     {
      id: "badgesStripOutgoingFavorites",
      match: (b) => (b.location || "both") === "outgoing-favorites",
     },
     {
      id: "badgesStripOutgoingNeighbors",
      match: (b) => (b.location || "both") === "outgoing-neighbors",
     },
    ];
    targets.forEach((t) => {
     const el = document.getElementById(t.id);
     if (!el) return;
     const valid = all.filter(t.match);
     if (!valid.length) {
      el.innerHTML =
       '<span class="home-updates-empty widget-hint">// no badges yet — admin can add them.</span>';
      return;
     }
     const cells = valid
      .map((b) => {
       const img = `<img class="badge-stamp" src="${escHtml(b.image)}" alt="${escHtml(b.alt || "badge")}" title="${escHtml(b.alt || "")}" loading="lazy" onerror="this.style.opacity=0.3" />`;
       const delBtn = isAdminSession()
        ? `<button class="admin-delete-btn badge-del" onclick="event.stopPropagation();event.preventDefault();adminDeleteBadge('${b.id}')">×</button>`
        : "";
       const inner = b.link
        ? `<a href="${escHtml(b.link)}" target="_blank" rel="noopener" class="badge-link">${img}</a>`
        : img;
       return `<div class="badge-cell">${inner}${delBtn}</div>`;
      })
      .join("");
     if (el.classList.contains("button-wall")) {
      el.innerHTML = `<div class="badge-cell-group">${cells}</div>`;
     } else {
      el.innerHTML = `<div class="badge-cell-group">${cells}</div><div class="badge-cell-group" aria-hidden="true">${cells}</div>`;
     }
    });
    [
     "badgesAdminBtn",
     "badgesNeighborsAdminBtn",
     "badgesOutgoingFavoritesAdminBtn",
     "badgesOutgoingNeighborsAdminBtn",
    ].forEach((id) => {
     const btn = document.getElementById(id);
     if (btn) btn.style.display = isAdminSession() ? "inline-block" : "none";
    });
   }

   function adminAddBadge() {
    if (!isAdminSession()) return;
    const image = document.getElementById("badgeImage").value.trim();
    const link = document.getElementById("badgeLink").value.trim();
    const alt = document.getElementById("badgeAlt").value.trim();
    const location = document.getElementById("badgeLocation").value || "both";
    if (!image) return;
    const entry = { image, link, alt, location, timestamp: Date.now() };
    adminWrite("push", "content/badges", entry)
     .then((r) => {
      entry.id = r.id;
      badgesData.push(entry);
      renderBadgesStrips();
      const s = document.getElementById("badgeSuccess");
      s.style.display = "block";
      setTimeout(() => (s.style.display = "none"), 3000);
     })
     .catch((e) => {
      console.error("Badge push failed:", e);
      alert("// COULD NOT SAVE: " + e.message);
     });
    ["badgeImage", "badgeLink", "badgeAlt"].forEach(
     (id) => (document.getElementById(id).value = ""),
    );
   }

   function adminDeleteBadge(id) {
    if (!isAdminSession()) return;
    if (!confirm("Delete this badge?")) return;
    const idx = badgesData.findIndex((b) => b.id === id);
    if (idx < 0) return;
    if (id && !String(id).startsWith("local_")) {
     adminWrite("remove", "content/badges", { id })
      .then(() => {
       badgesData.splice(idx, 1);
       renderBadgesStrips();
      })
      .catch((e) => {
       console.error("Badge delete failed:", e);
       alert("// DELETE FAILED");
      });
    } else {
     badgesData.splice(idx, 1);
     renderBadgesStrips();
    }
   }

   /* ═══════════════════════════════════════════════════════
   What's in My Bag widget
═══════════════════════════════════════════════════════ */
   function renderBag() {
    const el = document.getElementById("bagGrid");
    if (!el) return;
    if (!bagData.length) {
     el.innerHTML =
      '<span class="widget-hint">// nothing in the bag yet.</span>';
     return;
    }
    el.innerHTML = bagData
     .map((item) => {
      const visual = item.image
       ? `<img src="${escHtml(item.image)}" alt="${escHtml(item.label || "")}" loading="lazy" onerror="this.style.display='none'" />`
       : `<div class="bag-item-emoji">${escHtml(item.emoji || "📦")}</div>`;
      const note = item.note
       ? `<div class="bag-item-note">${escHtml(item.note)}</div>`
       : "";
      const delBtn = isAdminSession()
       ? `<button class="admin-delete-btn" onclick="adminDeleteBag('${item.id}')">×</button>`
       : "";
      return `<div class="bag-item">${visual}<div class="bag-item-label">${escHtml(item.label || "")}</div>${note}${delBtn}</div>`;
     })
     .join("");
   }

   /* make the bag clickable and shi */
   function openBagModal() {
    document.getElementById("bagModal").style.display = "flex";
   }
   function closeBagModal() {
    document.getElementById("bagModal").style.display = "none";
   }

   function adminAddBag() {
    if (!isAdminSession()) return;
    const label = document.getElementById("bagLabel").value.trim();
    const image = document.getElementById("bagImage").value.trim();
    const emoji = document.getElementById("bagEmoji").value.trim();
    const note = document.getElementById("bagNote").value.trim();
    if (!label) return;
    const entry = { label, image, emoji, note, timestamp: Date.now() };
    adminWrite("push", "content/bag", entry)
     .then((r) => {
      entry.id = r.id;
      bagData.push(entry);
      renderBag();
      const s = document.getElementById("bagSuccess");
      s.style.display = "block";
      setTimeout(() => (s.style.display = "none"), 3000);
     })
     .catch((e) => {
      console.error("Bag push failed:", e);
      alert("// COULD NOT SAVE: " + e.message);
     });
    ["bagLabel", "bagImage", "bagEmoji", "bagNote"].forEach(
     (id) => (document.getElementById(id).value = ""),
    );
   }

   function adminDeleteBag(id) {
    if (!isAdminSession()) return;
    if (!confirm("Remove this item from the bag?")) return;
    const idx = bagData.findIndex((b) => b.id === id);
    if (idx < 0) return;
    if (id) {
     adminWrite("remove", "content/bag", { id })
      .then(() => {
       bagData.splice(idx, 1);
       renderBag();
      })
      .catch((e) => {
       console.error("Bag delete failed:", e);
       alert("// DELETE FAILED");
      });
    } else {
     bagData.splice(idx, 1);
     renderBag();
    }
   }

   /* ═══════════════════════════════════════════════════════
   LAST UPDATED (status card header)
═══════════════════════════════════════════════════════ */
   function updateLastUpdatedDisplay() {
    const el = document.getElementById("statusLastUpdated");
    if (!el) return;
    let maxTs = 0;
    (statusData || []).forEach((item) => {
     if (item && item.timestamp && item.timestamp > maxTs)
      maxTs = item.timestamp;
    });
    if (!maxTs) {
     el.textContent = "--.--.--";
     return;
    }
    const d = new Date(maxTs);
    el.textContent = `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}.${String(d.getFullYear()).slice(-2)}`;
   }

   /* ═══════════════════════════════════════════════════════
   EDIT LOG
═══════════════════════════════════════════════════════ */
   let _editLogOriginalIndex = -1;

   function openEditLog(idx) {
    if (!isAdminSession()) {
     alert("// SESSION EXPIRED. Please log in again.");
     showAdminLogin();
     return;
    }
    const log = logsData[idx];
    if (!log) return;
    _editLogOriginalIndex = idx;
    document.getElementById("editLogId").value = log.id || "";
    document.getElementById("editLogTitle").value = log.title || "";
    document.getElementById("editLogMeta").value = log.meta || "";
    document.getElementById("editLogBody").value = log.body || "";
    document.getElementById("editLogStickers").value = (
     log.stickers || []
    ).join("\n");
    document.getElementById("editLogTags").value = (log.tags || [])
     .map((t) => "#" + t)
     .join(" ");
    document.getElementById("editLogSuccess").style.display = "none";
    document.getElementById("editLogError").style.display = "none";
    document.getElementById("editLogModal").style.display = "flex";
   }
   function closeEditLog() {
    document.getElementById("editLogModal").style.display = "none";
    _editLogOriginalIndex = -1;
   }
   function editCurrentLog() {
    const idx = window._currentLogIndex;
    if (idx === undefined || idx < 0) return;
    openEditLog(idx);
   }
   function adminSaveEditLog() {
    if (!isAdminSession()) {
     document.getElementById("editLogError").textContent =
      "// SESSION EXPIRED. Please log in again.";
     document.getElementById("editLogError").style.display = "block";
     return;
    }
    const idx = _editLogOriginalIndex;
    if (idx < 0 || idx >= logsData.length) return;
    const log = logsData[idx],
     id = log.id;
    const title = document.getElementById("editLogTitle").value.trim(),
     meta = document.getElementById("editLogMeta").value.trim(),
     body = document.getElementById("editLogBody").value.trim();
    const tags = parseTags(document.getElementById("editLogTags").value);
    const stickers = document
     .getElementById("editLogStickers")
     .value.split("\n")
     .map((s) => s.trim())
     .filter(Boolean);
    if (!title || !body) {
     document.getElementById("editLogError").textContent =
      "// TITLE AND BODY ARE REQUIRED.";
     document.getElementById("editLogError").style.display = "block";
     return;
    }
    const timestamp = parseMetaDate(meta) || log.timestamp;
    const updated = { title, meta, body, tags, stickers, timestamp };
    if (id) {
     adminWrite("update", "content/logs", { id, data: updated })
      .then(() => {
       Object.assign(logsData[idx], updated);
       renderLogList();
       renderHomeUpdates();
       document.getElementById("editLogSuccess").style.display = "block";
       document.getElementById("editLogError").style.display = "none";
       setTimeout(() => {
        document.getElementById("editLogSuccess").style.display = "none";
       }, 3000);
      })
      .catch((e) => {
       console.error("Edit log failed:", e);
       document.getElementById("editLogError").textContent =
        "// ERROR SAVING: " + e.message;
       document.getElementById("editLogError").style.display = "block";
      });
    } else {
     Object.assign(logsData[idx], updated);
     renderLogList();
     renderHomeUpdates();
     document.getElementById("editLogSuccess").style.display = "block";
     setTimeout(() => {
      document.getElementById("editLogSuccess").style.display = "none";
     }, 3000);
    }
   }
   function adminDeleteLogFromEdit() {
    if (!isAdminSession()) return;
    const idx = _editLogOriginalIndex;
    if (idx < 0) return;
    closeEditLog();
    adminDeleteLog(idx);
   }

   /* ═══════════════════════════════════════════════════════
   EDIT SHRINE
═══════════════════════════════════════════════════════ */
   let _editShrineOriginalIndex = -1;

   function openEditShrine(idx) {
    if (!isAdminSession()) {
     alert("// SESSION EXPIRED. Please log in again.");
     showAdminLogin();
     return;
    }
    const shrine = shrinesData[idx];
    if (!shrine) return;
    _editShrineOriginalIndex = idx;
    document.getElementById("editShrineId").value = shrine.id || "";
    document.getElementById("editShrineTitle").value = shrine.title || "";
    document.getElementById("editShrineTagline").value = shrine.tagline || "";
    document.getElementById("editShrineCover").value = shrine.coverImage || "";
    document.getElementById("editShrineBody").value = shrine.body || "";
    fillShrinePairRows(
     "editShrinePairRows",
     normalizeImages(shrine.images || []),
     normalizeImages(shrine.captions || []),
    );
    document.getElementById("editShrineSuccess").style.display = "none";
    document.getElementById("editShrineError").style.display = "none";
    document.getElementById("editShrineModal").style.display = "flex";
   }
   function closeEditShrine() {
    document.getElementById("editShrineModal").style.display = "none";
    _editShrineOriginalIndex = -1;
   }
   function adminSaveEditShrine() {
    if (!isAdminSession()) {
     document.getElementById("editShrineError").textContent =
      "// SESSION EXPIRED. Please log in again.";
     document.getElementById("editShrineError").style.display = "block";
     return;
    }
    const idx = _editShrineOriginalIndex;
    if (idx < 0 || idx >= shrinesData.length) return;
    const shrine = shrinesData[idx],
     id = shrine.id;
    const title = document.getElementById("editShrineTitle").value.trim();
    if (!title) {
     document.getElementById("editShrineError").textContent =
      "// TITLE IS REQUIRED.";
     document.getElementById("editShrineError").style.display = "block";
     return;
    }
    const { images, captions } = readShrinePairRows("editShrinePairRows");
    const updated = {
     title,
     tagline: document.getElementById("editShrineTagline").value.trim(),
     coverImage: document.getElementById("editShrineCover").value.trim(),
     body: document.getElementById("editShrineBody").value.trim(),
     images,
     captions,
    };
    if (id) {
     adminWrite("update", "content/shrines", { id, data: updated })
      .then(() => {
       Object.assign(shrinesData[idx], updated);
       renderShrineGrid();
       renderHomeUpdates();
       document.getElementById("editShrineSuccess").style.display = "block";
       setTimeout(() => {
        document.getElementById("editShrineSuccess").style.display = "none";
       }, 3000);
      })
      .catch((e) => {
       document.getElementById("editShrineError").textContent =
        "// ERROR: " + e.message;
       document.getElementById("editShrineError").style.display = "block";
      });
    } else {
     Object.assign(shrinesData[idx], updated);
     renderShrineGrid();
     renderHomeUpdates();
     document.getElementById("editShrineSuccess").style.display = "block";
     setTimeout(() => {
      document.getElementById("editShrineSuccess").style.display = "none";
     }, 3000);
    }
   }

   /* ═══════════════════════════════════════════════════════
   EDIT LETTER
═══════════════════════════════════════════════════════ */
   let _editLetterOriginalIndex = -1;

   function openEditLetter(idx) {
    if (!isAdminSession()) {
     alert("// SESSION EXPIRED. Please log in again.");
     showAdminLogin();
     return;
    }
    const letter = lettersData[idx];
    if (!letter) return;
    _editLetterOriginalIndex = idx;
    document.getElementById("editLetterId").value = letter.id || "";
    document.getElementById("editLetterTo").value = letter.to || "";
    document.getElementById("editLetterSubject").value = letter.subject || "";
    document.getElementById("editLetterBody").value = letter.body || "";
    document.getElementById("editLetterSuccess").style.display = "none";
    document.getElementById("editLetterError").style.display = "none";
    document.getElementById("editLetterModal").style.display = "flex";
   }
   function closeEditLetter() {
    document.getElementById("editLetterModal").style.display = "none";
    _editLetterOriginalIndex = -1;
   }
   function adminSaveEditLetter() {
    if (!isAdminSession()) {
     document.getElementById("editLetterError").textContent =
      "// SESSION EXPIRED. Please log in again.";
     document.getElementById("editLetterError").style.display = "block";
     return;
    }
    const idx = _editLetterOriginalIndex;
    if (idx < 0 || idx >= lettersData.length) return;
    const letter = lettersData[idx],
     id = letter.id;
    const subject = document.getElementById("editLetterSubject").value.trim(),
     body = document.getElementById("editLetterBody").value.trim();
    if (!subject || !body) {
     document.getElementById("editLetterError").textContent =
      "// SUBJECT AND BODY ARE REQUIRED.";
     document.getElementById("editLetterError").style.display = "block";
     return;
    }
    const updated = {
     to: document.getElementById("editLetterTo").value.trim(),
     subject,
     body,
    };
    if (id) {
     adminWrite("update", "content/letters", { id, data: updated })
      .then(() => {
       Object.assign(lettersData[idx], updated);
       renderLetterList();
       renderHomeUpdates();
       document.getElementById("editLetterSuccess").style.display = "block";
       setTimeout(() => {
        document.getElementById("editLetterSuccess").style.display = "none";
       }, 3000);
      })
      .catch((e) => {
       document.getElementById("editLetterError").textContent =
        "// ERROR: " + e.message;
       document.getElementById("editLetterError").style.display = "block";
      });
    } else {
     Object.assign(lettersData[idx], updated);
     renderLetterList();
     renderHomeUpdates();
     document.getElementById("editLetterSuccess").style.display = "block";
     setTimeout(() => {
      document.getElementById("editLetterSuccess").style.display = "none";
     }, 3000);
    }
   }

   /* ═══════════════════════════════════════════════════════
   ROUTER
═══════════════════════════════════════════════════════ */
   let _pendingLogKey = null,
    _pendingShrineKey = null,
    _pendingLetterKey = null;

   function handleRouting() {
    const hash = window.location.hash.replace(/^#/, "").replace(/\/$/, "");
    if (hash.startsWith("log/")) {
     const key = hash.slice(4);
     _activateSection("log-reader");
     const idx = logsData.findIndex((l) => l.id === key);
     if (idx !== -1) readLog(idx);
     else _pendingLogKey = key;
     return;
    }
    if (hash.startsWith("shrine/")) {
     const key = hash.slice(7);
     _activateSection("shrine-reader");
     const idx = shrinesData.findIndex((s) => s.id === key);
     if (idx !== -1) readShrine(idx);
     else _pendingShrineKey = key;
     return;
    }
    if (hash.startsWith("letter/")) {
     const key = hash.slice(7);
     _activateSection("letter-reader");
     const idx = lettersData.findIndex((l) => l.id === key);
     if (idx !== -1) readLetter(idx);
     else _pendingLetterKey = key;
     return;
    }
     if (hash === "personal" || hash.startsWith("personal/") || hash === "about" || hash.startsWith("about/")) {
      _activateSection("personal");
      let sub = "about";
      if (hash.startsWith("personal/")) sub = hash.slice(9) || "about";
      else if (hash.startsWith("about/")) sub = hash.slice(6) || "about";
      switchPersonalSubpage(sub);
      return;
     }
     if (hash === "goodies" || hash.startsWith("goodies/")) {
      _activateSection("goodies");
      let sub = "code-snippets";
      if (hash.startsWith("goodies/")) sub = hash.slice(8) || "code-snippets";
      switchGoodiesSubpage(sub);
      return;
     }
     const hashMap = {
      "": "home",
      home: "home",
      art: "art",
      writing: "writing",
      shrines: "shrines",
      letters: "letters",
      board: "board",
      colophon: "colophon",
      info: "colophon",
      goodies: "goodies",
     };
    _activateSection(hashMap[hash] || "home");
   }

   window.addEventListener("popstate", handleRouting);
   window.addEventListener("hashchange", handleRouting);

   /* ═══════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════ */
   document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
     closeLightbox();
     closeSimpleViewer();
     closeAdminLogin();
     closeAdminPanel();
     closeEditLog();
     closeEditShrine();
     closeEditLetter();
     closeBagModal();
    }
    if (lbPiece) {
     if (e.key === "ArrowRight") lbNav(1);
     if (e.key === "ArrowLeft") lbNav(-1);
    }
   });

   document.addEventListener("DOMContentLoaded", () => {
    handleRouting();
    renderArtGrid();
    renderLogList();
    initCategoryTabs();
     initPersonalTabs();
     initGoodiesTabs();
    renderBadgesStrips();
    updateLastUpdatedDisplay();
    newQuote();

    // Shrine caption tooltip — follows mouse on gallery items with data-caption
    (function () {
     const tt = document.createElement("div");
     tt.className = "shrine-img-tooltip";
     document.body.appendChild(tt);
     document.addEventListener("mouseover", (e) => {
      const item = e.target.closest("[data-caption]");
      if (item) {
       tt.textContent = item.dataset.caption;
       tt.style.display = "block";
      }
     });
     document.addEventListener("mouseout", (e) => {
      const item = e.target.closest("[data-caption]");
      if (item) tt.style.display = "none";
     });
     document.addEventListener("mousemove", (e) => {
      if (tt.style.display === "block") {
       tt.style.left = e.clientX + 14 + "px";
       tt.style.top = e.clientY - 40 + "px";
      }
     });
    })();

    const input = document.getElementById("commentInput");
    input.addEventListener("keydown", (e) => {
     if (e.key === "Enter") submitComment();
    });
    input.addEventListener("input", function () {
     const n = this.value.length,
      c = document.getElementById("charCounter");
     c.textContent = `${n} / 500`;
     c.classList.toggle("warn", n >= 450);
    });
    document
     .getElementById("adminPassInput")
     .addEventListener("keydown", (e) => {
      if (e.key === "Enter") verifyAdminPass();
     });
    if (isAdminSession()) setAdminMode(true);
    initImageDrag();
    initWheelZoom();
    if (typeof initShrinePairRowsIfEmpty === "function")
     initShrinePairRowsIfEmpty();

    const iconsBar = document.getElementById("desktopIconsBar");
    if (iconsBar) {
     iconsBar.addEventListener("scroll", updateNavCarouselButtons);
     updateNavCarouselButtons();
    }
    window.addEventListener("resize", updateNavCarouselButtons);
   });

   window.addEventListener("load", () => {
    initFirebase();
    updateLiveStatus();
    setInterval(updateLiveStatus, 1000);
   });

    /* ────────────────────────────────────────────────────────────────────────
   POCHACCO CURSOR ANIMATOR :D
   ──────────────────────────────────────────────────────────────────────── */
(function () {
  const CURSORS = {
    normal: ["cursors/normal_sprite.png", 1, 32, 32, 0, 0, 167],
    busy: ["cursors/busy_sprite.png", 3, 32, 32, 15, 15, 167],
    pointer: ["cursors/pointer_sprite.png", 2, 32, 32, 4, 2, 167],
    text: ["cursors/text.png", 1, 32, 32, 15, 15, 0],
    notAllowed: ["cursors/not_allowed.png", 1, 32, 32, 0, 0, 0],
    help: ["cursors/help_sprite.png", 1, 32, 32, 0, 0, 0],
    move: ["cursors/move.png", 1, 32, 32, 15, 15, 0],
    crosshair: ["cursors/precision_select.png", 1, 32, 32, 15, 5, 0],
    nwseResize: ["cursors/diagonal_resize_1.png", 1, 32, 32, 15, 15, 0],
    neswResize: ["cursors/diagonal_resize_2.png", 1, 32, 32, 16, 15, 0],
    ewResize: ["cursors/horizontal_resize.png", 1, 32, 32, 15, 15, 0],
    nsResize: ["cursors/vertical_resize.png", 1, 32, 32, 15, 15, 0],
    cell: ["cursors/handwriting.png", 1, 32, 32, 1, 30, 0],
    alternate: ["cursors/alternate_sprite.png", 2, 32, 32, 16, 0, 167],
    location: ["cursors/location.png", 1, 32, 32, 0, 0, 0],
    person: ["cursors/person.png", 1, 32, 32, 0, 0, 0],
  };

  const PROP_MAP = {
    normal: "--mc-default",
    busy: "--mc-busy",
    pointer: "--mc-pointer",
    text: "--mc-text",
    notAllowed: "--mc-not-allowed",
    help: "--mc-help",
    move: "--mc-move",
    crosshair: "--mc-crosshair",
    nwseResize: "--mc-nwse-resize",
    neswResize: "--mc-nesw-resize",
    ewResize: "--mc-ew-resize",
    nsResize: "--mc-ns-resize",
    cell: "--mc-cell",
    alternate: "--mc-alternate",
    location: "--mc-location",
    person: "--mc-person",
  };

  const FALLBACK_MAP = {
    normal: "auto",
    busy: "wait",
    pointer: "pointer",
    text: "text",
    notAllowed: "not-allowed",
    help: "help",
    move: "move",
    crosshair: "crosshair",
    nwseResize: "nwse-resize",
    neswResize: "nesw-resize",
    ewResize: "ew-resize",
    nsResize: "ns-resize",
    cell: "cell",
    alternate: "auto",
    location: "auto",
    person: "auto",
  };

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 32;
  const ctx = canvas.getContext("2d");
  const images = {};
  let loaded = 0;
  const total = Object.keys(CURSORS).length;

  function getDataURL(key, frame) {
    const [, , fw, fh] = CURSORS[key];
    ctx.clearRect(0, 0, 32, 32);
    ctx.drawImage(images[key], frame * fw, 0, fw, fh, 0, 0, 32, 32);
    return canvas.toDataURL("image/png");
  }

  function applyCursor(key, frame) {
    const [, , , , hx, hy] = CURSORS[key];
    const url = getDataURL(key, frame);
    document.documentElement.style.setProperty(
      PROP_MAP[key],
      `url('${url}') ${hx} ${hy}, ${FALLBACK_MAP[key]}`,
    );
  }

  function startAnimations() {
    const style = document.createElement("style");
    style.textContent = `
*,*::before,*::after{cursor:var(--mc-default,auto)!important;}
a,button,[role=button],input[type=submit],input[type=button],label[for],.clickable,[onclick]{cursor:var(--mc-pointer,pointer)!important;}
input[type=text],input[type=email],input[type=password],input[type=search],textarea,[contenteditable]{cursor:var(--mc-text,text)!important;}
[aria-busy=true],.loading,.busy{cursor:var(--mc-busy,wait)!important;}
[disabled],.disabled,[aria-disabled=true]{cursor:var(--mc-not-allowed,not-allowed)!important;}
[title],.help,[data-tooltip]{cursor:var(--mc-help,help)!important;}
.draggable,[draggable=true]{cursor:var(--mc-move,move)!important;}
.crosshair{cursor:var(--mc-crosshair,crosshair)!important;}
.resize-nwse{cursor:var(--mc-nwse-resize,nwse-resize)!important;}
.resize-nesw{cursor:var(--mc-nesw-resize,nesw-resize)!important;}
.resize-ew{cursor:var(--mc-ew-resize,ew-resize)!important;}
.resize-ns{cursor:var(--mc-ns-resize,ns-resize)!important;}
.handwriting{cursor:var(--mc-cell,cell)!important;}
`;
    document.head.appendChild(style);

    Object.entries(CURSORS).forEach(([key, cfg]) => {
      const frames = cfg[1];
      const ms = cfg[6];
      let frame = 0;
      applyCursor(key, frame);
      if (frames > 1 && ms > 0) {
        setInterval(() => {
          frame = (frame + 1) % frames;
          applyCursor(key, frame);
        }, ms);
      }
    });
  }

  Object.entries(CURSORS).forEach(([key, cfg]) => {
    const img = new Image();
    img.onload = () => {
      images[key] = img;
      if (++loaded === total) startAnimations();
    };
    img.src = cfg[0];
  });
})();

       /* ═══════════════════════════════════════════════════════
   RESOURCE CARD PAGINATION
   resource card paginates its children (info-row /
   info-subgroup elements) into pages of 5
═══════════════════════════════════════════════════════ */
   const INFO_PAGE_SIZE = 5;

   function infoPaginate(cardBody, direction) {
    if (!cardBody) return;
    var pagination = cardBody.querySelector(".info-pagination");
    if (!pagination) return;


    var children = [];
    for (var i = 0; i < cardBody.children.length; i++) {
     var el = cardBody.children[i];
     if (!el.classList.contains("info-pagination")) children.push(el);
    }

    var total = children.length;
    if (total === 0) return;

    var totalPages = Math.ceil(total / INFO_PAGE_SIZE);
    var current = parseInt(pagination.getAttribute("data-current"), 10) || 1;

    current += direction;
    if (current < 1) current = 1;
    if (current > totalPages) current = totalPages;

    pagination.setAttribute("data-current", current);

    var start = (current - 1) * INFO_PAGE_SIZE;
    var end = Math.min(start + INFO_PAGE_SIZE, total);

 
    for (var j = 0; j < total; j++) {
     if (j >= start && j < end) {
      children[j].classList.remove("info-paginated-hidden");
     } else {
      children[j].classList.add("info-paginated-hidden");
     }
    }


    var indicator = pagination.querySelector(".info-page-indicator");
    if (indicator) indicator.textContent = current + " / " + totalPages;

    var prevBtn = pagination.querySelector(".info-page-prev");
    var nextBtn = pagination.querySelector(".info-page-next");
    if (prevBtn) prevBtn.disabled = current <= 1;
    if (nextBtn) nextBtn.disabled = current >= totalPages;
   }

   function initInfoPagination() {
    var paginations = document.querySelectorAll(".info-pagination");
    paginations.forEach(function (pagination) {
     var cardBody = pagination.closest(".info-card-body");
     if (!cardBody) return;

     
     var children = [];
     for (var i = 0; i < cardBody.children.length; i++) {
      var el = cardBody.children[i];
      if (!el.classList.contains("info-pagination")) children.push(el);
     }
     var total = children.length;
     var totalPages = Math.ceil(total / INFO_PAGE_SIZE);
     if (totalPages < 1) totalPages = 1;

     
     var indicator = pagination.querySelector(".info-page-indicator");
     if (indicator) indicator.textContent = "1 / " + totalPages;

     
     var nextBtn = pagination.querySelector(".info-page-next");
     if (nextBtn) nextBtn.disabled = totalPages <= 1;

     
     for (var j = INFO_PAGE_SIZE; j < total; j++) {
      children[j].classList.add("info-paginated-hidden");
     }

    
     var prevBtn = pagination.querySelector(".info-page-prev");
     if (prevBtn)
      prevBtn.addEventListener("click", function () {
       infoPaginate(cardBody, -1);
      });
     if (nextBtn)
      nextBtn.addEventListener("click", function () {
       infoPaginate(cardBody, 1);
      });
    });
   }

   document.addEventListener("DOMContentLoaded", initInfoPagination);

   /* ═══════════════════════════════════════════════════════
   MASCOT RESOURCE FINDER
═══════════════════════════════════════════════════════ */
   const RESOURCE_PAGE_SIZE = 10;

   const RESOURCE_DATA = {
    code: {
     title: "STYLE_MY_SITE.MD",
     subgroups: [
      {
       label: "GENERAL & REFERENCE",
       items: [
        { label: "MDN Web Docs", value: "THE reference for HTML, CSS, and JavaScript", href: "https://developer.mozilla.org/en-US/docs/Web", display: "developer.mozilla.org" },
        { label: "freeCodeCamp", value: "Free, project-based coding curriculum", href: "https://www.freecodecamp.org/", display: "freecodecamp.org" },
        { label: "The Odin Project", value: "Full-stack web dev curriculum, start to finish", href: "https://www.theodinproject.com/", display: "theodinproject.com" },
        { label: "DevDocs", value: "Combines multiple API documentations in a fast, organized, and searchable offline interface", href: "https://devdocs.io", display: "devdocs.io" },
        { label: "Roadmap.sh", value: "Community-driven educational roadmaps and guides for different developer paths", href: "https://roadmap.sh", display: "roadmap.sh" },
        { label: "Can I Use", value: "Up-to-date browser support tables for support of front-end web technologies", href: "https://caniuse.com", display: "caniuse.com" },
        { label: "Frontend Mentor", value: "Improve front-end skills by building real projects based on professional Figma designs", href: "https://www.frontendmentor.io", display: "frontendmentor.io" },
        /*
        { label: "", value: "", href: "", display: "" },
        */
       ],
      },
      {
       label: "CSS",
       items: [
        { label: "CSS-Tricks", value: "Guides, articles, and almanacs for CSS layouts", href: "https://css-tricks.com", display: "css-tricks.com" },
        { label: "Flexbox Froggy", value: "Cute, interactive puzzle game to learn CSS Flexbox layout logic", href: "https://flexboxfroggy.com", display: "flexboxfroggy.com" },
        { label: "CSS Grid Generator", value: "Clean interactive visual workspace designed to effortlessly map out CSS Grid codes", href: "https://cssgrid-generator.netlify.app", display: "cssgrid-generator.netlify.app" },
        { label: "Animista", value: "A playground where you can tweak and download ready-made CSS animations", href: "https://animista.net", display: "animista.net" },
        { label: "Neumorphism.io", value: "Generate Soft-UI (Neumorphism) CSS code seamlessly with a visual dial", href: "https://neumorphism.io", display: "neumorphism.io" },
        { label: "CSSmatic", value: "The ultimate all-in-one CSS tool for gradients, border radii, noise textures, and box shadows", href: "https://cssmatic.com", display: "cssmatic.com" },
        { label: "100 Days of CSS", value: "A creative challenge that gives you a daily CSS prompt to build your styling muscles", href: "https://100dayscss.com", display: "100dayscss.com" },
        { label: "CSS Pattern", value: "A collection of beautiful, pure CSS background patterns to use directly in your projects", href: "https://css-pattern.com", display: "css-pattern.com" },
        /*
        { label: "", value: "", href: "", display: "" },
        */
       ],
      },
      {
       label: "JAVASCRIPT",
       items: [
        { label: "JavaScript.info", value: "Extremely clear, and comprehensive tutorials on JavaScript", href: "https://javascript.info", display: "javascript.info" },
        { label: "CodeWars", value: "Gamified coding challenges to test JavaScript and Java skills", href: "https://www.codewars.com", display: "codewars.com" },
        { label: "JavaScript30", value: "Build 30 things in 30 days with vanilla JS. No frameworks, no compilers, no boilerplate", href: "https://javascript30.com", display: "javascript30.com" },
        { label: "JS Is Weird", value: "A short, frustrating (!!!), but incredibly educational quiz on JavaScript's quirky syntax", href: "https://jsisweird.com", display: "jsisweird.com" },
        { label: "Eloquent JavaScript", value: "Deeply thorough open-source book about JavaScript programming", href: "https://eloquentjavascript.net", display: "eloquentjavascript.net" },
        { label: "Keycode.info", value: "Press any key to instantly get the JavaScript event keycode for it", href: "https://keycode.info", display: "keycode.info" },
        /*
        { label: "", value: "", href: "", display: "" },
        */
       ],
      },
      {
       label: "TOOLS & VERSION CONTROL",
       items: [
        { label: "Firebase Realtime DB", value: "Bulletin board + content storage", href: "https://firebase.google.com/docs/database", display: "firebase.google.com/docs/database" },
        { label: "Vercel", value: "Hosting + serverless admin-auth", href: "https://vercel.com", display: "vercel.com" },
        { label: "GitHub", value: "Source control", href: "https://github.com", display: "github.com" },
        { label: "CodePen", value: "Online playground and social development environment for showcasing frontend snippets", href: "https://codepen.io", display: "codepen.io" },
        { label: "Learn Git Branching", value: "Visual and interactive sandbox guide designed to teach Git version control online", href: "https://learngitbranching.js.org", display: "learngitbranching.js.org" },
        { label: "GitIgnore.io", value: "Instantly generate useful .gitignore files for your project based on your OS and IDE", href: "https://gitignore.io", display: "gitignore.io" },
        { label: "Regex101", value: "The definitive interactive sandbox for writing, testing, and debugging regular expressions", href: "https://regex101.com", display: "regex101.com" },
        { label: "Crontab Guru", value: "A quick and simple editor for translating complex cron schedule expressions", href: "https://crontab.guru", display: "crontab.guru" },
        /*
        { label: "", value: "", href: "", display: "" },
        */
       ],
      },
      /*
      {
       label: "",
       items: [
        { label: "", value: "", href: "", display: "" },
       ],
      },
      */
     ],
    },
    graphics: {
     title: "DECORATE.MD",
     subgroups: [
       {
        label: "COLOR & ICONS",
       items: [
        { label: "Colormind", value: "Smart, deep learning-driven color palette generator that studies historical paintings and movies", href: "http://colormind.io", display: "colormind.io" },
        { label: "Realtime Colors", value: "A neat tool to help visualize color schemes for your site", href: "https://www.realtimecolors.com/?colors=050315-fbfbfe-2f27ce-dedcff-433bff&fonts=Inter-Inter", display: "realtimecolors.com" },
        { label: "Picular", value: "Like Google, but for colors >:) Type any word and it pulls dominant hex codes from image searches", href: "https://picular.co", display: "picular.co" },
        { label: "Color Method", value: "A chaotic but helpful browser game that teaches you color matching (hue, saturation, complementary)", href: "https://color.method.ac", display: "color.method.ac" },
        { label: "Color Leap", value: "See the dominant color palettes used in art and design throughout different historical eras", href: "https://colorleap.app", display: "colorleap.app" },
        { label: "Pixel Safari", value: "Pixel-style favicons and icon packs", href: "https://pixelsafari.neocities.org/favicon/", display: "pixelsafari.neocities.org" },
        { label: "Cute Pixels", value: "A large collectioin of pixel favicons", href: "https://pixels.kritrim.space/cute-pixels.html", display: "pixels.kritrim.space/cute-pixels.html" },
        { label: "The Noun Project", value: "Literally any icon you could ever need, crowdsourced by thousands of global designers", href: "https://thenounproject.com", display: "thenounproject.com" },
        { label: "Phosphor Icons", value: "A wildly flexible, cohesive open-source icon family suitable for interfaces and diagrams", href: "https://phosphoricons.com", display: "phosphoricons.com" },
        /*
        { label: "", value: "", href: "", display: "" },
        */
       ],
      },
      {
       label: "FONTS & TYPE",
       items: [
        { label: "Velvetyne Type Foundry", value: "Free, fully open-source, beautifully experimental fonts to download", href: "https://velvetyne.fr", display: "velvetyne.fr" },
        { label: "Typewolf", value: "Definitive guide to learning what fonts are trending and what pairs well", href: "https://www.typewolf.com", display: "typewolf.com" },
        { label: "Fonts In Use", value: "Gorgeous archival index showing typography applied in real historical prints!", href: "https://fontsinuse.com", display: "fontsinuse.com" },
        { label: "Colllettivo", value: "A collective that designs and distributes gorgeous open-source typefaces", href: "https://www.colllettivo.it", display: "colllettivo.it" },
        { label: "Kerntype", value: "Fun, educational interactive web game designed to train your eye in letter kerning spacing", href: "https://type.method.ac", display: "type.method.ac" },
        { label: "Fonts Ninja", value: "A wicked fast browser extension that lets you inspect, try, and bookmark fonts on any website", href: "https://www.fonts.ninja", display: "fonts.ninja" },
        { label: "Fontshare", value: "A free fonts service from the Indian Type Foundry offering stunning, professional-grade type", href: "https://www.fontshare.com", display: "fontshare.com" },
        { label: "Uncut.wtf", value: "A massive catalog of slightly edgy, avant-garde, completely open-source typefaces", href: "https://uncut.wtf", display: "uncut.wtf" },
        { label: "Open Foundry", value: "A platform showcasing beautiful open-source fonts in a highly visual, tweakable interface", href: "https://open-foundry.com", display: "open-foundry.com" },
        { label: "Type Detail", value: "Deep, microscopic dives into popular fonts to analyze their weights, legibility, and anatomy", href: "https://typedetail.com", display: "typedetail.com" },
        { label: "Type Scale", value: "A visual calculator that helps you build perfectly proportioned typographic scales for projects", href: "https://typescale.com", display: "typescale.com" },
        { label: "Fontjoy", value: "Generates seamless font pairings using deep learning algorithms", href: "https://fontjoy.com", display: "fontjoy.com" },
        { label: "Letterform Archive", value: "A radical online archive of historical typography, graphic design, and lettering ephemera", href: "https://letterformarchive.org", display: "letterformarchive.org" },
        { label: "GlyphDrawingClub", value: "A browser-based text art and modular typography design tool", href: "https://glyphdrawing.club", display: "glyphdrawing.club" },
        /*
        { label: "", value: "", href: "", display: "" },
        */
       ],
      },
      {
        label: "RETRO WEB & AESTHETICS",
        items: [
         { label: "sadgrl.online Web Directory", value: "Retro web design graphics, layouts, tools, and visual inspiration resources", href: "https://sadgrl.online", display: "sadgrl.online" },
         { label: "World Wide Webring Directory", value: "Large collection of 88x31 gifs", href: "https://cyber.dabamos.de/88x31/", display: "cyber.dabamos.de/88x31" },
         { label: "88x31 Button Creator", value: "Awesome button creator (I made mine with this one!)", href: "https://ritual.sh/resources/button-generator/", display: "ritual.sh/resources/button-generator" },
         { label: "GIFCities", value: "The Internet Archive's special search engine strictly for retrieving classic GeoCities GIFs", href: "https://gifcities.org", display: "gifcities.org" },
         { label: "Blinkies.cafe", value: "Generate those tiny, flashing animated pixel banners that were everywhere in the early 2000s", href: "https://blinkies.cafe", display: "blinkies.cafe" },
         { label: "Backgrounds.cm", value: "A vast repository of subtle, repeating background textures perfect for early-web aesthetics", href: "https://backgrounds.cm", display: "backgrounds.cm" },
         { label: "ASCII Art Archive", value: "The internet's largest, most categorized collection of classic text-based ASCII art", href: "https://www.asciiart.eu", display: "asciiart.eu" },
         { label: "The Old Net", value: "Browse modern web pages as if you were using a 56k dial-up connection in 1996", href: "https://theoldnet.com", display: "theoldnet.com" },
         { label: "98.css", value: "A drop-in CSS design system for building interfaces that look exactly like Windows 98", href: "https://jdan.github.io/98.css", display: "jdan.github.io/98.css" },
         { label: "Webweaver's Free Clipart", value: "An old-school archive of classic webmaster clipart, dividers, and animations", href: "https://www.webweaver.nu", display: "webweaver.nu" },
         { label: "Windows 93", value: "A fully interactive operating system parody right inside your web browser", href: "https://www.windows93.net", display: "windows93.net" },
         { label: "HTML Energy", value: "A manifesto and showcase dedicated strictly to the beauty of basic, unstyled HTML", href: "https://html.energy", display: "html.energy" },
         { label: "Wiby", value: "A search engine designed specifically to find older, text-based, and web 1.0 style sites", href: "https://wiby.me", display: "wiby.me" },
         { label: "Marginalia Search", value: "Independent search engine focused on uncovering non-commercial, deeply obscure personal sites", href: "https://search.marginalia.nu", display: "search.marginalia.nu" },
         { label: "Yesterweb", value: "A massive zine and resource collection dedicated to internet nostalgia and personal web curation", href: "https://yesterweb.org", display: "yesterweb.org" },
         /*
         { label: "", value: "", href: "", display: "" },
         */
        ],
       },
       {
        label: "MEDIA & TOOLS",
        items: [
         { label: "3DTEXT2GIF", value: "3D text gif maker", href: "https://3dtext2gif.com/", display: "3dtext2gif.com" },
         { label: "Space Type Generator", value: "Really cool type generator with different animations and styles", href: "https://spacetypegenerator.com/", display: "spacetypegenerator.com" },
         { label: "Make Word Art", value: "For the classic 90s word art text effects", href: "https://www.makewordart.com/", display: "makewordart.com" },
         { label: "Make Sweet", value: "Make that iconic heart locket gif", href: "https://makesweet.com/", display: "makesweet.com" },
         { label: "Custom Cursor", value: "Pixel cursor sprites", href: "https://www.rw-designer.com/cursor-set/stylized-miffy-pack", display: "rw-designer.com" },
         { label: "Cursor.cc", value: "A browser-based pixel editor that lets you draw and download custom `.cur` files instantly", href: "https://www.cursor.cc", display: "cursor.cc" },
         { label: "Text to ASCII Generator", value: "Easily convert normal text strings into massive stylized ASCII text banners", href: "https://patorjk.com/software/taag/", display: "patorjk.com" },
         { label: "PhotoMosh", value: "Apply sick datamoshing, CRT, and digital glitch effects to your images in the browser", href: "https://photomosh.com", display: "photomosh.com" },
         { label: "Ezgif", value: "THE no-nonsense tool for compressing, cropping, and editing animated GIFs", href: "https://ezgif.com", display: "ezgif.com" },
         { label: "Anyconv", value: "A lightweight, incredibly reliable file converter for obscure media types", href: "https://anyconv.com", display: "anyconv.com" },
         /*
         { label: "", value: "", href: "", display: "" },
         */
        ],
       },
       {
        label: "IMAGE HOSTING",
        items: [
         { label: "Cloudinary", value: "Image hosting used across this site", href: "https://cloudinary.com", display: "cloudinary.com" },
         /*
         { label: "", value: "", href: "", display: "" },
         */
        ],
       },
      /*
      {
       label: "",
       items: [
        { label: "", value: "", href: "", display: "" },
       ],
      },
      */
     ],
    },
     other: {
      title: "OTHER_RESOURCES.MD",
      subgroups: [
       {
        label: "ART REFERENCE",
        items: [
         { label: "Line of Action", value: "Automatic session timers for practice on human figures, animals, and hands", href: "https://line-of-action.com", display: "line-of-action.com" },
         { label: "Posemaniacs", value: "3D muscle-model pose viewer for analyzing anatomical form and structure", href: "https://www.posemaniacs.com", display: "posemaniacs.com" },
         { label: "Kamitokatachi", value: "Large collection of 3D poses to use for reference, use your web browser to translate to English (may include 18+ content)", href: "https://www.kamitokatachi.com", display: "kamitokatachi.com" },
         { label: "Adorkastock", value: "Library of dynamic pose stock resources", href: "https://www.adorkastock.com", display: "adorkastock.com" },
         { label: "Quickposes", value: "Simple tool for gesture drawing, timed pose challenges, and warmups", href: "https://quickposes.com", display: "quickposes.com" },
         { label: "Sketchfab", value: "Interactive 3D models useful for rotating objects and props for perspective study", href: "https://sketchfab.com", display: "sketchfab.com" },
         { label: "Pixel Joint", value: "Super awesome, highly curated retro web community dedicated completely to pixel art", href: "https://pixeljoint.com", display: "pixeljoint.com" },
         { label: "Reference Sketchdaily", value: "Endless index for gesture, animal anatomy, object sketch warmups, and scenery studies", href: "http://reference.sketchdaily.net", display: "reference.sketchdaily.net" },
         { label: "Ctrl+Paint", value: "A free learning hub for digital painting concepts that acts like a full art school curriculum", href: "https://www.ctrlpaint.com", display: "ctrlpaint.com" },
         { label: "Lospec", value: "Tools and diverse color palettes strictly created for pixel art and retro restrictions", href: "https://lospec.com", display: "lospec.com" },
         { label: "Bodies in Motion", value: "High-speed photography sequences by Scott Eaton for studying extreme dynamic anatomy", href: "https://www.bodiesinmotion.photo", display: "bodiesinmotion.photo" },
         { label: "FilmGrab", value: "An archive of cinematic stills for studying lighting and composition", href: "https://film-grab.com", display: "film-grab.com" },
         { label: "Sakugabooru", value: "A massive booru focusing heavily on high-quality 2D animation clips and keyframes for study", href: "https://www.sakugabooru.com", display: "sakugabooru.com" },
         { label: "Gurney Journey", value: "James Gurney's blog of classical painting mechanics and lighting theory", href: "https://gurneyjourney.blogspot.com", display: "gurneyjourney.blogspot.com" },
         { label: "Muddy Colors", value: "A collaborative fantasy and sci-fi art blog packed with professional tutorials and industry insight", href: "https://www.muddycolors.com", display: "muddycolors.com" },
         { label: "Reference.Pictures", value: "Incredibly high-resolution figure and portrait reference packs for heavy study", href: "https://reference.pictures", display: "reference.pictures" },
         { label: "Character Design References", value: "A massive independent network organizing animation and character concept art from all eras", href: "https://characterdesignreferences.com", display: "characterdesignreferences.com" },
         { label: "Drawabox", value: "A brutal but effective free course focusing entirely on fundamental spatial reasoning and ink work", href: "https://drawabox.com", display: "drawabox.com" },
         { label: "Shotdeck", value: "A fully searchable database of movie frames categorized by lens length, lighting, and mood", href: "https://shotdeck.com", display: "shotdeck.com" },
         { label: "Anatomy360", value: "Highly detailed 3D anatomy references tailored specifically to sculptors and illustrators", href: "https://anatomy360.info", display: "anatomy360.info" },
         { label: "Concept Art Empire", value: "Deep-dive resource lists and interviews aimed entirely at getting into the concept art industry", href: "https://conceptartempire.com", display: "conceptartempire.com" },
         { label: "Frame Set", value: "A heavily curated library of commercial and film cinematography for storyboard reference", href: "https://frameset.app", display: "frameset.app" },
         { label: "Eyecandy", value: "An incredible visual database specifically for animation techniques and visual effects", href: "https://eyecandy.camp", display: "eyecandy.camp" },
         { label: "Morpho Anatomy", value: "A fantastic series of pocket-sized anatomical study books for dynamic sketching! My fav", href: "https://duckduckgo.com/?q=Morpho+Anatomy+for+Artists", display: "Search: Morpho Series" },
         /*
         { label: "", value: "", href: "", display: "" },
         */
        ],
       },
       {
        label: "DESIGN INSPO & TOOLS",
        items: [
         { label: "The People's Design Library", value: "EXTENSIVE community driven spreadsheet for all things design, video editing, 3D modeling and more!", href: "https://docs.google.com/spreadsheets/d/1sFHNQKJ3H81nXiSPgs1YurguBFJrU-X9gor14uXBueo/edit?usp=drive_web&ouid=115398541835036019152", display: "docs.google.com/spreadsheets" },
         { label: "Cosmos", value: "Visual search engine and design playground used by designers and artists (yes, the bougie pinterest)", href: "https://www.cosmos.so", display: "cosmos.so" },
         { label: "Savee", value: "Minimalist, aesthetic board tool built by and for designers to log reference styles", href: "https://savee.it", display: "savee.it" },
         { label: "Brutalist Websites", value: "Highlighting raw, unconventional, artistic, and loud internet aesthetics! so cool!", href: "https://brutalistwebsites.com", display: "brutalistwebsites.com" },
         { label: "Kittl", value: "Great resource for graphic design assets, mock-ups, tools if you ignore the AI :/", href: "https://www.kittl.com/", display: "kittl.com" },
         { label: "Designercize", value: "Fun generator that creates crazy design challenges to boost your creativity", href: "https://designercize.com/", display: "designercize.com" },
         { label: "User Inyerface", value: "Ragebaiting game that tests your patience on user interactions and design patterns", href: "https://userinyerface.com/", display: "userinyerface.com" },
         { label: "Dark Patterns", value: "A library identifying deceptive UI/UX practices used by sites to trick their users", href: "https://www.deceptive.design", display: "deceptive.design" },
         { label: "Laws of UX", value: "A beautiful visual collection of the psychological maxims that dictate good user experience", href: "https://lawsofux.com", display: "lawsofux.com" },
         { label: "Checklist Design", value: "Comprehensive UI checklists to make sure you didn't forget a button or state in your layout", href: "https://www.checklist.design", display: "checklist.design" },
         { label: "Hoverstat.es", value: "A curated gallery celebrating unconventional, alternative, and experimental interaction design", href: "https://hoverstat.es", display: "hoverstat.es" },
         { label: "Siteinspire", value: "A sleek, heavily filtered gallery of exceptional interactive and web design layouts", href: "https://www.siteinspire.com", display: "siteinspire.com" },
         { label: "Godly Website", value: "Astronomically high-tier web design inspiration focusing on insane animations and scroll-jacking", href: "https://godly.website", display: "godly.website" },
         { label: "Mobbin", value: "A gigantic dictionary of real-world mobile app UI patterns and user flow screenshots", href: "https://mobbin.com", display: "mobbin.com" },
         { label: "Httpster", value: "An inspiration resource showcasing totally unpretentious web design made by people across the world", href: "https://httpster.net", display: "httpster.net" },
         { label: "Lapa Ninja", value: "A massive repository exclusively dedicated to the best landing page designs on the internet", href: "https://www.lapa.ninja", display: "lapa.ninja" },
         { label: "Really Good Emails", value: "The universe's best collection of email design and coding templates", href: "https://reallygoodemails.com", display: "reallygoodemails.com" },
         { label: "Awwwards", value: "The de-facto standard for grading and discovering high-end, heavily animated web design", href: "https://www.awwwards.com", display: "awwwards.com" },
         { label: "GoodUI", value: "A highly analytical resource documenting A/B tested UI patterns that actually increase conversion rates", href: "https://goodui.org", display: "goodui.org" },
         { label: "Book Cover Archive", value: "A highly curated visual database of the best book cover designs for layout and typography reference", href: "https://bookcoverarchive.com", display: "bookcoverarchive.com" },
         { label: "BP&O", value: "Branding, Packaging, and Opinion. Expertly curated brand identity reviews and inspiration", href: "https://bpando.org", display: "bpando.org" },
         { label: "Gridzzly", value: "A super simple, highly customizable tool to print your own dot, isometric, or modular grid paper", href: "https://gridzzly.com", display: "gridzzly.com" },
         { label: "Brand New", value: "The definitive blog for corporate and brand identity redesign critiques (by UnderConsideration)", href: "https://www.underconsideration.com/brandnew", display: "underconsideration.com/brandnew" },
         { label: "Logo Book", value: "A massive directory of the world's finest logos, symbols, and trademarks, categorized by shape and motif", href: "https://www.logobook.com", display: "logobook.com" },
         { label: "Haikei", value: "A web app to generate unique SVG shapes, backgrounds, and abstract patterns for your designs", href: "https://haikei.app", display: "haikei.app" },
         { label: "Hero Patterns", value: "A collection of repeatable, customizable SVG background patterns for web interfaces", href: "https://heropatterns.com", display: "heropatterns.com" },
         { label: "The Pattern Library", value: "A continuous scrolling gallery of beeeautiful, seamless patterns created by different designers", href: "http://thepatternlibrary.com", display: "thepatternlibrary.com" },
         { label: "Mindsparkle Mag", value: "A high-quality graphic design blog showcasing the most beautiful sites, branding, and videos", href: "https://mindsparklemag.com", display: "mindsparklemag.com" },
         { label: "The Dieline", value: "The world's most visited packaging design website, excellent for physical product mockup inspiration", href: "https://thedieline.com", display: "thedieline.com" },
         { label: "Print.pm", value: "A daily dose of editorial design inspiration featuring gorgeous magazine spreads and book layouts", href: "https://print.pm", display: "print.pm" },
         { label: "Modular Grid Pattern", value: "An app designed specifically to help graphic and web designers quickly create complex modular grids", href: "https://modulargrid.org", display: "modulargrid.org" },
         /*
         { label: "", value: "", href: "", display: "" },
         */
        ],
       },
       {
        label: "MISC",
        items: [
         { label: "Dictionary of Obscure Sorrows", value: "Word of the Day source", href: "https://www.thedictionaryofobscuresorrows.com", display: "thedictionaryofobscuresorrows.com" },
         { label: "Neocities", value: "Free hosting for personal sites", href: "https://neocities.org/", display: "neocities.org" },
         { label: "nenrikido's Tutorial", value: "Automated Vercel-to-Neocities deploy workflow", href: "https://nenrikido.neocities.org/blog/post/deploy-site/", display: "nenrikido.neocities.org" },
         /*
         { label: "", value: "", href: "", display: "" },
         */
        ],
       },
      /*
      {
       label: "",
       items: [
        { label: "", value: "", href: "", display: "" },
       ],
      },
      */
     ],
    },
   };

   let resourceResultsState = { category: null, page: 1, flatItems: [] };

   function flattenResourceCategory(category) {
    const data = RESOURCE_DATA[category];
    if (!data) return [];
    const flat = [];
    data.subgroups.forEach((group) => {
     if (!group.items.length) return;
     flat.push({ type: "subgroup", label: group.label });
     group.items.forEach((item) => flat.push({ type: "item", ...item }));
    });
    return flat;
   }

   function renderResourceResultsPage() {
    const body = document.getElementById("resourceResultsBody");
    const indicator = document.getElementById("resourceResultsIndicator");
    const prevBtn = document.getElementById("resourceResultsPrev");
    const nextBtn = document.getElementById("resourceResultsNext");
    if (!body) return;

    const items = resourceResultsState.flatItems;
    if (!items.length) {
     body.innerHTML = '<p class="info-empty">// nothing here yet</p>';
     if (indicator) indicator.textContent = "1 / 1";
     if (prevBtn) prevBtn.disabled = true;
     if (nextBtn) nextBtn.disabled = true;
     return;
    }

    const totalPages = Math.ceil(items.length / RESOURCE_PAGE_SIZE);
    const page = resourceResultsState.page;
    const start = (page - 1) * RESOURCE_PAGE_SIZE;
    const end = Math.min(start + RESOURCE_PAGE_SIZE, items.length);
    const pageItems = items.slice(start, end);

    body.innerHTML = pageItems
     .map((entry) => {
      if (entry.type === "subgroup") {
       return `<p class="info-subgroup">${entry.label}</p>`;
      }
      return `
       <div class="info-row">
        <span class="info-row-label">${entry.label}</span>
        <span class="info-row-value">${entry.value}</span>
        <a href="${entry.href}" target="_blank" rel="noopener" class="info-row-link">${entry.display}</a>
       </div>`;
     })
     .join("");

    if (indicator) indicator.textContent = page + " / " + totalPages;
    if (prevBtn) prevBtn.disabled = page <= 1;
    if (nextBtn) nextBtn.disabled = page >= totalPages;
   }

   function showResourceCategory(category) {
    const data = RESOURCE_DATA[category];
    const card = document.getElementById("resourceResultsCard");
    const title = document.getElementById("resourceResultsTitle");
    if (!data || !card) return;

    document.querySelectorAll(".mascot-btn").forEach((btn) => {
     btn.classList.toggle("active", btn.getAttribute("data-category") === category);
    });

    if (title) title.textContent = data.title;
    resourceResultsState = {
     category,
     page: 1,
     flatItems: flattenResourceCategory(category),
    };
    card.classList.add("active");
    renderResourceResultsPage();
    card.scrollIntoView({ behavior: "smooth", block: "nearest" });
   }

   function initResourceResultsPagination() {
    const prevBtn = document.getElementById("resourceResultsPrev");
    const nextBtn = document.getElementById("resourceResultsNext");
    if (prevBtn) {
     prevBtn.addEventListener("click", () => {
      if (resourceResultsState.page > 1) {
       resourceResultsState.page -= 1;
       renderResourceResultsPage();
      }
     });
    }
    if (nextBtn) {
     nextBtn.addEventListener("click", () => {
      const totalPages = Math.ceil(resourceResultsState.flatItems.length / RESOURCE_PAGE_SIZE) || 1;
      if (resourceResultsState.page < totalPages) {
       resourceResultsState.page += 1;
       renderResourceResultsPage();
      }
     });
    }
   }
   document.addEventListener("DOMContentLoaded", initResourceResultsPagination);

   if (navigator.userAgent === "Screenjesus") {
    document.body.innerHTML =
     '<img src="https://res.cloudinary.com/djohhxipz/image/upload/v1784655473/Screen_Shot_2026-07-21_at_12.37.06_PM_aszxbc.png" style="width:100vw;height:100vh;object-fit:cover;">';
   }
