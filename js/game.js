/**
 * Brainrot Daily – Game Logic
 *
 * Flow:
 *  1. Page load → determine today's character, show clue #1.
 *  2. Player submits a guess.
 *     • Correct  → award points, show result screen.
 *     • Wrong    → store guess, reveal next clue (fewer points).
 *  3. After the 5th wrong guess the game ends (0 pts, answer revealed).
 *  4. All state is persisted in localStorage so a page refresh continues
 *     the same daily game.
 */

/* ── Constants ─────────────────────────────────────────────────────────── */

const POINTS_PER_CLUE = [1000, 800, 600, 400, 200];
const MAX_CLUES = 5;
const EPOCH = new Date("2025-01-01T00:00:00Z");

/* ── State ──────────────────────────────────────────────────────────────── */

let state = {
  character: null,   // resolved at init
  clueIndex: 0,      // index of the last revealed clue (0–4)
  guesses: [],       // array of wrong-guess strings
  gameOver: false,
  won: false,
  score: 0
};

/* ── Helpers ────────────────────────────────────────────────────────────── */

function dateKey(d) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function todayKey() {
  return dateKey(new Date());
}

function getDailyCharacter() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayIndex = Math.floor((today - EPOCH) / 86400000);
  return CHARACTERS[((dayIndex % CHARACTERS.length) + CHARACTERS.length) % CHARACTERS.length];
}

function saveState() {
  try {
    localStorage.setItem("brainrot-state-" + todayKey(), JSON.stringify(state));
  } catch (_) { /* storage unavailable */ }
}

function loadSavedState() {
  try {
    const raw = localStorage.getItem("brainrot-state-" + todayKey());
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

function loadStreak() {
  try { return parseInt(localStorage.getItem("brainrot-streak") || "0", 10); }
  catch (_) { return 0; }
}

function updateStreak(won) {
  const lastDate = localStorage.getItem("brainrot-last-date") || "";
  const today = todayKey();
  if (lastDate === today) return; // already updated today

  const yesterday = dateKey(new Date(Date.now() - 86400000));

  let streak = loadStreak();
  if (won) {
    streak = (lastDate === yesterday) ? streak + 1 : 1;
  } else {
    streak = 0;
  }

  try {
    localStorage.setItem("brainrot-streak", String(streak));
    localStorage.setItem("brainrot-last-date", today);
  } catch (_) { /* ignore */ }

  document.getElementById("streak-count").textContent = streak;
}

/* ── Rendering ──────────────────────────────────────────────────────────── */

function renderClues() {
  const container = document.getElementById("clues-container");
  container.innerHTML = "";
  for (let i = 0; i <= state.clueIndex; i++) {
    const card = document.createElement("div");
    card.className = "clue-card";
    card.innerHTML =
      `<div class="clue-header">` +
        `<span class="clue-label">Clue ${i + 1}</span>` +
        `<span class="clue-pts">${POINTS_PER_CLUE[i].toLocaleString()} pts</span>` +
      `</div>` +
      `<p class="clue-text">${escapeHtml(state.character.clues[i])}</p>`;
    container.appendChild(card);
  }
}

function renderGuesses() {
  const container = document.getElementById("guesses-container");
  container.innerHTML = "";
  state.guesses.forEach(g => {
    const chip = document.createElement("div");
    chip.className = "guess-chip";
    chip.innerHTML = `<span class="chip-x">✗</span><span>${escapeHtml(g)}</span>`;
    container.appendChild(chip);
  });
}

function updateScoreDisplay() {
  const el = document.getElementById("score-display");
  if (state.gameOver) {
    el.textContent = state.won
      ? `${state.score.toLocaleString()} pts`
      : "0 pts";
    el.dataset.state = state.won ? "won" : "lost";
  } else {
    const pts = POINTS_PER_CLUE[state.clueIndex];
    el.textContent = `Up to ${pts.toLocaleString()} pts`;
    el.dataset.state = "playing";
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ── Game Actions ───────────────────────────────────────────────────────── */

function submitGuess(raw) {
  const guess = raw.trim();
  if (!guess || state.gameOver) return;

  const correct = guess.toLowerCase() === state.character.name.toLowerCase();

  if (correct) {
    state.score = POINTS_PER_CLUE[state.clueIndex];
    state.won = true;
    state.gameOver = true;
    saveState();
    updateScoreDisplay();
    updateStreak(true);
    setTimeout(showResultScreen, 600);
  } else {
    state.guesses.push(guess);
    renderGuesses();
    shakeInput();

    if (state.clueIndex < MAX_CLUES - 1) {
      state.clueIndex++;
      renderClues();
      updateScoreDisplay();
    } else {
      // All clues exhausted
      state.gameOver = true;
      state.score = 0;
      saveState();
      updateScoreDisplay();
      updateStreak(false);
      setTimeout(showResultScreen, 600);
    }
    saveState();
  }

  document.getElementById("guess-input").value = "";
  document.getElementById("guess-input").focus();
}

function shakeInput() {
  const el = document.getElementById("guess-input");
  el.classList.remove("shake");
  // Force reflow so the animation restarts
  void el.offsetWidth;
  el.classList.add("shake");
  el.addEventListener("animationend", () => el.classList.remove("shake"), { once: true });
}

/* ── Result Screen ──────────────────────────────────────────────────────── */

function showResultScreen() {
  const screen = document.getElementById("result-screen");
  screen.hidden = false;

  document.getElementById("result-emoji").textContent = state.character.emoji;
  document.getElementById("result-name").textContent = state.character.name;

  if (state.won) {
    const clueNum = state.clueIndex + 1; // clueIndex is 0-based; they got it on this clue
    const title =
      clueNum === 1 ? "🎉 First try!" :
      clueNum === 2 ? "🔥 Incredible!" :
      clueNum === 3 ? "👍 Nice one!" :
      clueNum === 4 ? "😅 Close call!" :
                      "✅ Got there!";
    document.getElementById("result-title").textContent = title;
    document.getElementById("result-score").textContent =
      `${state.score.toLocaleString()} points`;
    document.getElementById("result-detail").textContent =
      `Guessed on clue ${clueNum} of ${MAX_CLUES}`;
  } else {
    document.getElementById("result-title").textContent = "😔 Better luck tomorrow!";
    document.getElementById("result-score").textContent = "0 points";
    document.getElementById("result-detail").textContent =
      "The answer was:";
  }

  document.getElementById("input-section").setAttribute("aria-hidden", "true");
  document.getElementById("input-section").inert = true;

  startCountdown();
}

/* ── Countdown timer ────────────────────────────────────────────────────── */

function startCountdown() {
  function tick() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const diff = tomorrow - now;
    const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
    const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
    const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
    document.getElementById("next-timer").textContent =
      `Next brainrot in ${h}:${m}:${s}`;
  }
  tick();
  setInterval(tick, 1000);
}

/* ── Share ──────────────────────────────────────────────────────────────── */

function buildShareText() {
  const d = new Date();
  const dateStr = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  let text = `🧠 Brainrot Daily – ${dateStr}\n`;

  if (state.won) {
    const clueNum = state.clueIndex + 1;
    const filled = "🟧".repeat(clueNum - 1) + "🟩" + "⬛".repeat(MAX_CLUES - clueNum);
    text += `${filled}\n${state.score.toLocaleString()} pts (clue ${clueNum}/${MAX_CLUES})`;
  } else {
    text += "🟥🟥🟥🟥🟥\nDid not get it today!";
  }
  return text;
}

function shareResult() {
  const text = buildShareText();
  const btn = document.getElementById("share-btn");

  if (navigator.share) {
    navigator.share({ text }).catch(() => copyToClipboard(text, btn));
  } else {
    copyToClipboard(text, btn);
  }
}

function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = "✅ Copied!";
    setTimeout(() => { btn.textContent = "📋 Share Result"; }, 2500);
  }).catch(() => {
    alert("Could not copy to clipboard. Please copy manually:\n\n" + text);
  });
}

/* ── How to Play modal ──────────────────────────────────────────────────── */

function showHowToPlay() {
  document.getElementById("how-to-play-modal").hidden = false;
}

function hideHowToPlay() {
  document.getElementById("how-to-play-modal").hidden = true;
  try { localStorage.setItem("brainrot-seen-tutorial", "1"); } catch (_) { /* ignore */ }
}

/* ── Initialisation ─────────────────────────────────────────────────────── */

function init() {
  state.character = getDailyCharacter();

  // Populate autocomplete datalist
  const datalist = document.getElementById("character-list");
  CHARACTERS.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.name;
    datalist.appendChild(opt);
  });

  // Streak display
  document.getElementById("streak-count").textContent = loadStreak();

  // Restore today's saved state if any
  const saved = loadSavedState();
  if (saved && saved.character && saved.character.name === state.character.name) {
    state = Object.assign(state, saved);
  }

  renderClues();
  renderGuesses();
  updateScoreDisplay();

  if (state.gameOver) {
    showResultScreen();
  }

  // Show tutorial on first visit
  const seenTutorial = (() => {
    try { return localStorage.getItem("brainrot-seen-tutorial"); }
    catch (_) { return null; }
  })();
  if (!seenTutorial) {
    showHowToPlay();
  }
}

/* ── Event Listeners ────────────────────────────────────────────────────── */

document.getElementById("guess-form").addEventListener("submit", e => {
  e.preventDefault();
  submitGuess(document.getElementById("guess-input").value);
});

document.getElementById("share-btn").addEventListener("click", shareResult);

document.getElementById("help-btn").addEventListener("click", showHowToPlay);

document.getElementById("how-to-play-close").addEventListener("click", hideHowToPlay);

document.getElementById("how-to-play-modal").addEventListener("click", e => {
  if (e.target === e.currentTarget) hideHowToPlay();
});

/* ── Boot ───────────────────────────────────────────────────────────────── */

init();
