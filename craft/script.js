// ---- when it opens -------------------------------------------------

// TEST timer: ten seconds after every load, so the countdown and the handover
// can be watched again and again. For the real thing, swap this line for:
// const UNLOCK_AT = Date.UTC(2026, 11, 2, 18, 30, 0); // 3 December 2026, 12:00 am IST
const UNLOCK_AT = Date.now() + 10000; // TEST: ten seconds after every load

// Add ?open to the address to skip the wait and watch the reveal — but only
// on this machine. On her link it is ignored and the countdown stays put.
const ON_LOCAL =
  typeof location !== "undefined" &&
  /^(localhost|127\.0\.0\.1|\[::1\]|::1|0\.0\.0\.0|\[::ffff:127\.0\.0\.1\])$/i.test(location.hostname);

const html = document.documentElement;
const gateWait = document.querySelector("[data-gate-wait]");
const gateFilm = document.querySelector("[data-gate-film]");
const film = document.querySelector("[data-film]");
const filmSound = document.querySelector("[data-film-sound]");
const audio = document.querySelector("[data-audio]");
const soundBtn = document.querySelector("[data-sound]");
const soundLabel = document.querySelector(".sound__label");

const cd = {
  d: document.querySelector('[data-cd="d"]'),
  h: document.querySelector('[data-cd="h"]'),
  m: document.querySelector('[data-cd="m"]'),
  s: document.querySelector('[data-cd="s"]'),
};

// The song sits under everything, quietly, and steps aside for her voice.
const MUSIC_VOLUME = 0.15;

let audioBroken = false;
let musicWanted = false; // the page is open, so the song should be going
let noteDucked = false;  // paused because one of her voice notes is playing
let userPaused = false;  // she pressed pause on the little sound toggle
let entered = false;
let filmStarted = false;

if (audio) {
  audio.volume = MUSIC_VOLUME;
  audio.addEventListener("error", () => {
    audioBroken = true;
    if (soundBtn) soundBtn.hidden = true;
  });
}

function playAudio() {
  if (!audio || audioBroken || !musicWanted || noteDucked || userPaused) return;
  const attempt = audio.play();
  if (attempt && typeof attempt.catch === "function") {
    // Blocked for now; the next tap anywhere will pick it up.
    attempt.catch(() => setSoundState(false));
  }
}

function setSoundState(playing) {
  if (!soundBtn) return;
  soundBtn.setAttribute("aria-pressed", String(playing));
  soundBtn.setAttribute("aria-label", playing ? "Pause the soundtrack" : "Play the soundtrack");
  soundBtn.classList.toggle("is-playing", playing);
  if (soundLabel) soundLabel.textContent = playing ? "Pause" : "Play";
}

function duckMusic() {
  if (!audio || audioBroken || audio.paused) return;
  noteDucked = true;
  audio.pause();
}

function unduckMusic() {
  if (!noteDucked) return;
  noteDucked = false;
  playAudio();
}

if (audio) {
  audio.addEventListener("play", () => setSoundState(true));
  audio.addEventListener("pause", () => {
    // A pause for her voice note is temporary — the toggle keeps showing Pause.
    if (!noteDucked) setSoundState(false);
  });
  // One pass only. When the track finishes, it stops and the button goes away.
  audio.addEventListener("ended", () => {
    setSoundState(false);
    if (soundBtn) soundBtn.hidden = true;
  });
}

// ---- the curtain ---------------------------------------------------

const pad2 = (n) => String(n).padStart(2, "0");

// Writes the time left into the four cells; true once none is left.
function paintCountdown() {
  const left = UNLOCK_AT - Date.now();
  const total = Math.max(0, Math.floor(left / 1000));
  if (cd.d) cd.d.textContent = pad2(Math.floor(total / 86400));
  if (cd.h) cd.h.textContent = pad2(Math.floor((total % 86400) / 3600));
  if (cd.m) cd.m.textContent = pad2(Math.floor((total % 3600) / 60));
  if (cd.s) cd.s.textContent = pad2(total % 60);
  return left <= 0;
}

function enter() {
  if (entered) return;
  entered = true;
  html.classList.remove("gated");
  html.classList.add("ungated");
  musicWanted = true;
  playAudio();
  window.scrollTo(0, 0);
  const main = document.querySelector("main");
  if (main) {
    main.setAttribute("tabindex", "-1");
    window.setTimeout(() => main.focus({ preventScroll: true }), 400);
  }
}

function unmuteFilm() {
  if (!film) return;
  film.muted = false;
  if (filmSound) filmSound.hidden = true;
}

function startFilm() {
  if (filmStarted) return;
  filmStarted = true;

  if (!film || !gateFilm) {
    enter();
    return;
  }

  if (gateWait) gateWait.hidden = true;
  gateFilm.hidden = false;

  // The film is listed with data-src and nothing else, so not one byte of it
  // is fetched until the clock actually runs out.
  if (!film.getAttribute("src")) {
    film.src = film.getAttribute("data-src") || "";
    film.load();
  }

  // It asks for sound straight away. Plenty of browsers refuse to start a
  // film with audio unprompted, so that refusal falls back to a silent start
  // with one "Tap for sound" pill, never to a stalled screen.
  const attempt = film.play();
  if (attempt && typeof attempt.catch === "function") {
    attempt.catch(() => {
      film.muted = true;
      if (filmSound) filmSound.hidden = false;
      const retry = film.play();
      if (retry && typeof retry.catch === "function") retry.catch(enter);
    });
  } else if (film.paused) {
    enter();
  }
}

if (film) {
  film.addEventListener("ended", () => enter());
  film.addEventListener("playing", () => {
    if (filmSound) filmSound.hidden = !film.muted;
  });
  // No file at assets/her.mp4 yet? Go straight to the page.
  film.addEventListener("error", () => {
    if (filmStarted) enter();
  });
}

if (filmSound) filmSound.addEventListener("click", unmuteFilm);

paintCountdown();

if ((ON_LOCAL && /[?&]open(=|&|$)/.test(location.search)) || UNLOCK_AT - Date.now() <= 0) {
  startFilm();
} else {
  const tick = window.setInterval(() => {
    if (!paintCountdown()) return;
    window.clearInterval(tick);
    startFilm();
  }, 1000);
}

// No browser starts audio without a touch. If the first try was refused,
// the next tap or keypress anywhere quietly starts the song.
function nudgeAudio(e) {
  if (!musicWanted || userPaused || noteDucked) return;
  if (soundBtn && e.target && soundBtn.contains(e.target)) return;
  if (audio && !audioBroken && audio.paused) playAudio();
}
document.addEventListener("pointerdown", nudgeAudio);
document.addEventListener("keydown", nudgeAudio);

if (soundBtn) {
  soundBtn.addEventListener("click", () => {
    if (!audio || audioBroken) return;
    if (audio.paused) {
      userPaused = false;
      playAudio();
    } else {
      userPaused = true;
      audio.pause();
    }
  });
}

// ---- voice notes --------------------------------------------------

const vnButtons = document.querySelectorAll("[data-vn]");

if (vnButtons.length) {
  const player = new Audio();
  player.preload = "none";

  let current = null;

  const itemFor = (btn) => btn.closest("[data-vn-item]");
  const fillFor = (item) => item.querySelector(".vn__fill");
  const timeFor = (item) => item.querySelector("[data-vn-time]");

  const clock = (seconds) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return "—";
    const s = Math.round(seconds);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };

  // Read each file's real length up front, and mark the slots that are still empty.
  vnButtons.forEach((btn) => {
    const item = itemFor(btn);
    const probe = new Audio();
    probe.preload = "metadata";
    probe.addEventListener("loadedmetadata", () => {
      item.classList.remove("is-missing");
      if (!item.classList.contains("is-playing")) timeFor(item).textContent = clock(probe.duration);
    });
    probe.addEventListener("error", () => {
      item.classList.add("is-missing");
      timeFor(item).textContent = "—";
    });
    probe.src = btn.dataset.vn;
  });

  function stopNote(resume = true) {
    if (!current) return;
    const item = itemFor(current.btn);
    player.pause();
    item.classList.remove("is-playing");
    current.btn.setAttribute("aria-label", current.label);
    fillFor(item).style.width = "0%";
    timeFor(item).textContent = current.duration;
    current = null;
    if (resume) unduckMusic();
  }

  player.addEventListener("timeupdate", () => {
    if (!current) return;
    const item = itemFor(current.btn);
    const pct = player.duration ? (player.currentTime / player.duration) * 100 : 0;
    fillFor(item).style.width = `${Math.min(100, pct)}%`;
    timeFor(item).textContent = clock(player.currentTime);
  });

  player.addEventListener("loadedmetadata", () => {
    if (current) current.duration = clock(player.duration);
  });

  player.addEventListener("ended", () => stopNote());
  player.addEventListener("error", () => stopNote());

  vnButtons.forEach((btn) => {
    const item = itemFor(btn);

    btn.addEventListener("click", () => {
      if (item.classList.contains("is-missing")) return;
      if (current && current.btn === btn) {
        stopNote();
        return;
      }

      // Swapping notes: stop the old one, but don't let the song creep back
      // in for the half second before the new one starts.
      stopNote(false);

      const label = btn.getAttribute("aria-label");
      current = { btn, label, duration: timeFor(item).textContent };

      player.src = btn.dataset.vn;
      item.classList.add("is-playing");
      btn.setAttribute("aria-label", label.replace(/^Play/, "Pause"));

      duckMusic();

      const attempt = player.play();
      if (attempt && typeof attempt.catch === "function") attempt.catch(() => stopNote());
    });
  });
}

// ---- reveal rows as they come into view ---------------------------

const revealables = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
  );

  revealables.forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i % 6, 5) * 70}ms`;
    observer.observe(el);
  });
} else {
  revealables.forEach((el) => el.classList.add("is-in"));
}

// ---- open the card ------------------------------------------------

const card = document.querySelector("[data-card]");
const cover = document.querySelector("[data-card-cover]");
const note = document.getElementById("card-note");

if (card && cover && note) {
  cover.addEventListener("click", () => {
    card.classList.add("is-open");
    cover.setAttribute("aria-expanded", "true");
    cover.setAttribute("aria-hidden", "true");
    cover.tabIndex = -1;
    window.setTimeout(() => note.focus({ preventScroll: true }), 420);
  });
}
