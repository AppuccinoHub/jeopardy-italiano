/* Il Tabellone — gameplay */

const TEAM_PALETTE = [
  { id: "terracotta", color: "#8c2d22", ink: "#faf6ee" },
  { id: "cipresso", color: "#243328", ink: "#faf6ee" },
  { id: "oro", color: "#9a7b32", ink: "#1a1410" },
  { id: "tirreno", color: "#2a4a58", ink: "#faf6ee" },
  { id: "fico", color: "#6b3a4a", ink: "#faf6ee" },
  { id: "oliva", color: "#4f5d3e", ink: "#faf6ee" }
];

const ADJUST_STEP = 100;

const state = {
  phase: "setup", // setup | key | board | clue | answer | dd-intro | dd-wager | final-cat | final-wager | final-clue | final-answer | final-results
  teamCount: 3,
  teams: [],
  used: {},
  dailyDoubles: [],
  current: null,
  tried: {},
  sound: false,
  timerOn: false,
  timerSecs: 30,
  timerLeft: 30,
  timerRunning: false,
  timerId: null,
  finalWagers: {},
  finalTried: {},
  ddTeam: null,
  ddWager: 0
};

let audioCtx = null;

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function $(sel, root) {
  return (root || document).querySelector(sel);
}

function $all(sel, root) {
  return Array.from((root || document).querySelectorAll(sel));
}

function defaultTeams(n) {
  return TEAM_PALETTE.slice(0, n).map((p, i) => ({
    id: i,
    name: "Squadra " + (i + 1),
    score: 0,
    color: p.color
  }));
}

function clueAt(ci, vi) {
  return CATEGORIES[ci].clues[vi];
}

function allTilesUsed() {
  return Object.keys(state.used).length >= CATEGORIES.length * 5;
}

function pickDailyDoubles() {
  const pool = [];
  CATEGORIES.forEach((_, ci) => {
    // Prefer 200–500 so the surprise has weight
    for (let vi = 1; vi < 5; vi++) pool.push(ci + ":" + vi);
  });
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 2);
}

/* ——— Sound (Web Audio, no files; muted by default) ——— */
function ctx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function tone(freq, start, dur, type, gain) {
  const ac = ctx();
  if (!ac || !state.sound) return;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type || "sine";
  o.frequency.setValueAtTime(freq, ac.currentTime + start);
  g.gain.setValueAtTime(0.0001, ac.currentTime + start);
  g.gain.exponentialRampToValueAtTime(gain || 0.07, ac.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + dur);
  o.connect(g);
  g.connect(ac.destination);
  o.start(ac.currentTime + start);
  o.stop(ac.currentTime + start + dur + 0.02);
}

function sfx(kind) {
  if (!state.sound) return;
  if (kind === "click") tone(392, 0, 0.08, "triangle", 0.05);
  else if (kind === "flip") {
    tone(220, 0, 0.12, "triangle", 0.05);
    tone(330, 0.08, 0.14, "triangle", 0.04);
  } else if (kind === "reveal") {
    tone(523.25, 0, 0.18, "sine", 0.06);
    tone(659.25, 0.08, 0.22, "sine", 0.05);
    tone(783.99, 0.16, 0.28, "sine", 0.04);
  } else if (kind === "right") {
    tone(523.25, 0, 0.16, "sine", 0.06);
    tone(659.25, 0.1, 0.2, "sine", 0.06);
    tone(783.99, 0.2, 0.35, "sine", 0.05);
  } else if (kind === "wrong") {
    tone(196, 0, 0.22, "triangle", 0.05);
    tone(155, 0.08, 0.28, "sine", 0.04);
  } else if (kind === "dd") {
    tone(196, 0, 0.2, "sawtooth", 0.03);
    tone(246.94, 0.12, 0.22, "triangle", 0.05);
    tone(311.13, 0.26, 0.24, "triangle", 0.05);
    tone(392, 0.42, 0.45, "sine", 0.07);
    tone(493.88, 0.55, 0.5, "sine", 0.05);
  } else if (kind === "final") {
    tone(261.63, 0, 0.4, "sine", 0.06);
    tone(329.63, 0.08, 0.45, "sine", 0.05);
    tone(392, 0.16, 0.7, "sine", 0.06);
    tone(523.25, 0.32, 0.8, "sine", 0.05);
  } else if (kind === "tick") tone(880, 0, 0.05, "sine", 0.03);
  else if (kind === "timeup") {
    tone(440, 0, 0.2, "triangle", 0.06);
    tone(330, 0.22, 0.35, "triangle", 0.06);
  }
}

/* ——— Timer ——— */
function stopTimer() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
  state.timerRunning = false;
}

function startTimer() {
  if (!state.timerOn) return;
  stopTimer();
  state.timerLeft = state.timerSecs;
  state.timerRunning = true;
  updateTimerUI();
  state.timerId = setInterval(() => {
    if (!state.timerRunning) return;
    state.timerLeft -= 1;
    if (state.timerLeft <= 5 && state.timerLeft > 0) sfx("tick");
    if (state.timerLeft <= 0) {
      state.timerLeft = 0;
      stopTimer();
      sfx("timeup");
    }
    updateTimerUI();
  }, 1000);
}

function togglePauseTimer() {
  if (!state.timerOn) return;
  if (state.timerLeft <= 0) return;
  state.timerRunning = !state.timerRunning;
  updateTimerUI();
}

function updateTimerUI() {
  $all("[data-timer]").forEach((el) => {
    const t = Math.max(0, state.timerLeft);
    el.textContent = t + "s";
    el.classList.toggle("warn", t <= 5);
    el.hidden = !state.timerOn;
  });
  $all("[data-timer-pause]").forEach((el) => {
    el.hidden = !state.timerOn;
    el.textContent = state.timerRunning ? "Pausa" : "Riprendi";
  });
}

/* ——— Render ——— */
function render() {
  document.body.classList.toggle("setup-mode", state.phase === "setup");
  document.body.classList.toggle("key-mode", state.phase === "key");
  renderHeader();
  renderMain();
  renderScoreboard();
  renderOverlay();
  updateTimerUI();
}

function renderHeader() {
  const tools = $(".tools");
  const showGameTools = state.phase !== "setup" && state.phase !== "key";
  tools.innerHTML = `
    ${showGameTools ? `<button type="button" class="text-btn" data-act="final">Sfida finale</button>` : ""}
    ${state.phase === "key" ? `<button type="button" class="text-btn" data-act="print-key">Stampa</button>` : ""}
    ${state.phase === "key" ? `<button type="button" class="text-btn" data-act="back-setup">Indietro</button>` : ""}
    ${showGameTools ? `<button type="button" class="icon-btn" data-act="toggle-sound" aria-pressed="${state.sound}" title="Suoni" aria-label="Suoni">${state.sound ? "🔊" : "🔇"}</button>` : ""}
    ${showGameTools ? `<button type="button" class="icon-btn" data-act="fullscreen" title="Schermo intero" aria-label="Schermo intero">⛶</button>` : ""}
    ${showGameTools ? `<button type="button" class="text-btn danger-btn" data-act="reset">Nuova partita</button>` : ""}
  `;
}

function renderMain() {
  const stage = $("main.stage");
  if (state.phase === "setup") {
    stage.innerHTML = setupHTML();
    return;
  }
  if (state.phase === "key") {
    stage.innerHTML = keyHTML();
    return;
  }
  stage.innerHTML = boardHTML();
}

function setupHTML() {
  if (!state.teams.length) state.teams = defaultTeams(state.teamCount);
  const teamInputs = state.teams
    .map(
      (t, i) => `
      <label>
        <span class="swatch" style="--team:${t.color}"></span>
        <input type="text" maxlength="24" data-team-name="${i}" value="${esc(t.name)}" aria-label="Nome squadra ${i + 1}">
      </label>`
    )
    .join("");
  const timers = [0, 15, 30, 45, 60]
    .map((s) => {
      const pressed = (!state.timerOn && s === 0) || (state.timerOn && state.timerSecs === s);
      const label = s === 0 ? "No" : s + "s";
      return `<button type="button" class="chip" data-act="timer-len" data-secs="${s}" aria-pressed="${pressed}">${label}</button>`;
    })
    .join("");
  return `
    <div class="setup-wrap">
      <div class="setup-card">
        <div class="setup-kicker">IV Honors &nbsp;·&nbsp; AP Italiano</div>
        <h2>Il Tabellone</h2>
        <p class="setup-lead">Jeopardy d’italiano — mid to advanced</p>
        <div class="setup-grid">
          <div>
            <span class="field-label">Squadre</span>
            <div class="stepper">
              <button type="button" data-act="teams-dec" aria-label="Meno squadre">−</button>
              <span class="count">${state.teamCount}</span>
              <button type="button" data-act="teams-inc" aria-label="Più squadre">+</button>
            </div>
            <div class="team-fields" style="margin-top:0.8rem">${teamInputs}</div>
          </div>
          <div>
            <span class="field-label">Timer per domanda</span>
            <div class="options">${timers}</div>
            <span class="field-label" style="margin-top:1rem">Suoni</span>
            <div class="options">
              <button type="button" class="chip" data-act="setup-sound" data-on="false" aria-pressed="${!state.sound}">Spenti</button>
              <button type="button" class="chip" data-act="setup-sound" data-on="true" aria-pressed="${state.sound}">Accesi</button>
            </div>
            <div class="help">
              <p>Clicca una casella per la domanda, poi <strong>Mostra risposta</strong>. Assegna il punto alla squadra giusta, togli il punto a chi sbaglia, oppure chiudi con «Nessuno».</p>
              <p>Due caselle nascondono una <em>Puntata doppia</em>. In fondo: la Sfida finale. I suoni partono spenti.</p>
            </div>
          </div>
        </div>
        <div class="setup-actions">
          <button type="button" class="btn-ghost" data-act="show-key">Chiave del docente</button>
          <button type="button" class="btn-primary" data-act="start">Inizia la partita</button>
        </div>
      </div>
    </div>`;
}

function keyHTML() {
  const cats = CATEGORIES.map((cat) => {
    const items = cat.clues
      .map(
        (c) => `
        <div class="key-item">
          <div class="kv">${c.value}</div>
          <p class="kq">${formatClue(c.clue)}</p>
          <p class="ka">${esc(c.answer)}</p>
          ${c.note ? `<p class="kn">${esc(c.note)}</p>` : ""}
        </div>`
      )
      .join("");
    return `<section class="key-cat"><h3>${esc(cat.name)}</h3>${items}</section>`;
  }).join("");
  const fin = `
    <section class="key-cat">
      <h3>Sfida finale — ${esc(FINAL.category)}</h3>
      <div class="key-item">
        <p class="kq">${esc(FINAL.clue)}</p>
        <p class="ka">${esc(FINAL.answer)}</p>
        ${FINAL.note ? `<p class="kn">${esc(FINAL.note)}</p>` : ""}
      </div>
    </section>`;
  return `
    <div class="key-view">
      <h2>Chiave del docente</h2>
      <p class="key-lead">Domande e risposte · Italiano IV Honors &amp; AP</p>
      <div class="key-grid">${cats}${fin}</div>
    </div>`;
}

function boardHTML() {
  const cols = CATEGORIES.map((cat, ci) => {
    const tiles = cat.clues
      .map((c, vi) => {
        const key = ci + ":" + vi;
        const used = !!state.used[key];
        return `
          <button type="button" class="tile${used ? " used" : ""}"
            data-act="open-tile" data-ci="${ci}" data-vi="${vi}"
            ${used ? "disabled" : ""}
            aria-label="${esc(cat.name)} ${c.value}">
            <span class="val">${c.value}</span>
          </button>`;
      })
      .join("");
    return `
      <div class="column">
        <div class="category"><span>${esc(cat.name)}</span></div>
        ${tiles}
      </div>`;
  }).join("");
  return `<div class="board" aria-label="Tabellone">${cols}</div>`;
}

function renderScoreboard() {
  const board = $("#scoreboard");
  if (!state.teams.length) {
    board.innerHTML = "";
    return;
  }
  board.innerHTML = state.teams
    .map(
      (t, i) => `
      <article class="team-card" style="--team:${t.color}">
        <div class="name-row">
          <input class="team-name" type="text" maxlength="24" data-team-name="${i}" value="${esc(t.name)}" aria-label="Nome squadra ${i + 1}">
        </div>
        <div class="score${t.score < 0 ? " neg" : ""}">${t.score}</div>
        <div class="adj">
          <button type="button" data-act="adjust" data-i="${i}" data-d="-1" aria-label="Togli punti">−</button>
          <button type="button" data-act="adjust" data-i="${i}" data-d="1" aria-label="Aggiungi punti">+</button>
        </div>
      </article>`
    )
    .join("");
}

function renderOverlay() {
  const ov = $("#overlay");
  const phases = [
    "clue",
    "answer",
    "dd-intro",
    "dd-wager",
    "final-cat",
    "final-wager",
    "final-clue",
    "final-answer",
    "final-results"
  ];
  if (!phases.includes(state.phase)) {
    ov.classList.remove("open");
    ov.innerHTML = "";
    ov.setAttribute("aria-hidden", "true");
    return;
  }
  ov.classList.add("open");
  ov.setAttribute("aria-hidden", "false");
  if (state.phase === "dd-intro") ov.innerHTML = ddIntroHTML();
  else if (state.phase === "dd-wager") ov.innerHTML = ddWagerHTML();
  else if (state.phase === "clue") ov.innerHTML = clueHTML();
  else if (state.phase === "answer") ov.innerHTML = answerHTML();
  else if (state.phase === "final-cat") ov.innerHTML = finalCatHTML();
  else if (state.phase === "final-wager") ov.innerHTML = finalWagerHTML();
  else if (state.phase === "final-clue") ov.innerHTML = finalClueHTML();
  else if (state.phase === "final-answer") ov.innerHTML = finalAnswerHTML();
  else if (state.phase === "final-results") ov.innerHTML = finalResultsHTML();
}

function overlayChrome(meta, body, bottom, extraTools) {
  return `
    <div class="ov-top">
      <div class="ov-meta">${meta}</div>
      <div class="ov-tools">
        <span class="timer" data-timer hidden>30s</span>
        <button type="button" class="text-btn" data-timer-pause data-act="timer-pause" hidden>Pausa</button>
        ${extraTools || ""}
      </div>
    </div>
    <div class="ov-body">${body}</div>
    <div class="ov-bottom">${bottom || ""}</div>`;
}

function formatClue(text) {
  return esc(text)
    .replace(/_{3,}/g, '<span class="blank" aria-hidden="true"></span>')
    .replace(/\n/g, "<br>");
}

function currentMeta() {
  const cur = state.current;
  if (!cur) return "";
  const cat = CATEGORIES[cur.ci].name;
  let val = cur.value;
  if (cur.isDD) {
    const wagerSet = state.phase === "clue" || state.phase === "answer";
    val = wagerSet ? "Puntata doppia · " + state.ddWager : "Puntata doppia";
  }
  return `<span class="ov-cat">${esc(cat)}</span><span class="ov-value">${val}</span>`;
}

function ddIntroHTML() {
  return overlayChrome(
    currentMeta(),
    `<p class="splash-kicker">Attenzione</p>
     <h2 class="splash-title">Puntata doppia</h2>
     <p class="wager-help">Quale squadra ha scelto questa casella?</p>
     <div class="team-award" style="margin-top:1rem">
       ${state.teams
         .map(
           (t, i) => `
         <button type="button" class="btn-primary" data-act="dd-pick-team" data-i="${i}"
           style="background:${t.color};box-shadow:none;margin:0.15rem">${esc(t.name)}</button>`
         )
         .join("")}
     </div>`,
    ""
  );
}

function ddWagerHTML() {
  const team = state.teams[state.ddTeam];
  const max = wagerMax(team);
  return overlayChrome(
    currentMeta(),
    `<p class="splash-kicker">${esc(team.name)}</p>
     <h2 class="splash-title">Quanto punti?</h2>
     <div class="wager-box">
       <div class="wager-row">
         <button type="button" data-act="dd-wager-adj" data-d="-50" aria-label="Diminuisci">−</button>
         <input type="number" min="0" max="${max}" step="50" value="${state.ddWager}" data-dd-wager aria-label="Puntata">
         <button type="button" data-act="dd-wager-adj" data-d="50" aria-label="Aumenta">+</button>
       </div>
       <p class="wager-help">Puntata da 0 a ${max} (punteggio attuale: ${team.score}; valore della casella: ${state.current.value})</p>
       <button type="button" class="btn-primary" data-act="dd-confirm-wager">Conferma e mostra la domanda</button>
     </div>`,
    ""
  );
}

function wagerMax(team) {
  return Math.max(team.score, state.current ? state.current.value : 500, 0);
}

function clueHTML() {
  const cur = state.current;
  const text = cur.isFinal ? FINAL.clue : clueAt(cur.ci, cur.vi).clue;
  return overlayChrome(
    cur.isFinal
      ? `<span class="ov-cat">Sfida finale — ${esc(FINAL.category)}</span>`
      : currentMeta(),
    `<p class="clue-text">${formatClue(text)}</p>`,
    `<div class="actions"><button type="button" class="btn-primary" data-act="reveal">Mostra risposta</button></div>`
  );
}

function answerHTML() {
  const cur = state.current;
  const data = cur.isFinal ? FINAL : clueAt(cur.ci, cur.vi);
  const isDD = cur.isDD;
  const teams = state.teams
    .map((t, i) => {
      if (isDD && i !== state.ddTeam) return "";
      const tried = state.tried[i];
      return `
        <div class="award-card${tried === "wrong" ? " tried-wrong" : ""}${tried === "right" ? " tried-right" : ""}" style="--team:${t.color}">
          <div class="aw-name"><span class="dot"></span>${esc(t.name)}</div>
          <div class="aw-btns">
            <button type="button" class="btn-right" data-act="judge" data-i="${i}" data-ok="1" ${tried ? "disabled" : ""}>Giusto +</button>
            <button type="button" class="btn-wrong" data-act="judge" data-i="${i}" data-ok="0" ${tried ? "disabled" : ""}>Sbagliato −</button>
          </div>
        </div>`;
    })
    .join("");
  return overlayChrome(
    cur.isFinal
      ? `<span class="ov-cat">Sfida finale — ${esc(FINAL.category)}</span>`
      : currentMeta(),
    `<p class="answer-kicker">Risposta</p>
     <p class="answer-text">${esc(data.answer)}</p>
     ${data.note ? `<p class="note">${esc(data.note)}</p>` : ""}`,
    `<div class="team-award">${teams}</div>
     <div class="actions" style="margin-top:0.8rem">
       <button type="button" class="btn-ghost" data-act="nobody" style="color:#faf6ee;border-color:rgba(255,253,248,.3)">Nessuno / Chiudi</button>
     </div>`
  );
}

function finalCatHTML() {
  return overlayChrome(
    `<span class="ov-cat">Sfida finale</span>`,
    `<p class="splash-kicker">La categoria è</p>
     <h2 class="splash-title">${esc(FINAL.category)}</h2>
     <div class="actions" style="margin-top:1.2rem">
       <button type="button" class="btn-primary" data-act="final-to-wager">Le squadre fanno la puntata</button>
     </div>`,
    ""
  );
}

function finalWagerHTML() {
  const fields = state.teams
    .map((t, i) => {
      const max = Math.max(0, t.score);
      const val = state.finalWagers[i] ?? 0;
      return `
        <div class="fw" style="--team:${t.color}">
          <label for="fw-${i}">${esc(t.name)} <small style="opacity:.7">(max ${max})</small></label>
          <input id="fw-${i}" type="number" min="0" max="${max}" step="50" value="${val}" data-final-wager="${i}">
        </div>`;
    })
    .join("");
  return overlayChrome(
    `<span class="ov-cat">Sfida finale — ${esc(FINAL.category)}</span>`,
    `<p class="splash-kicker">Puntate</p>
     <p class="wager-help">Ogni squadra punta da 0 fino al proprio punteggio. Chi è in negativo o a zero punta 0.</p>
     <div class="final-wagers">${fields}</div>
     <div class="actions" style="margin-top:1.2rem">
       <button type="button" class="btn-primary" data-act="final-show-clue">Mostra la domanda</button>
     </div>`,
    ""
  );
}

function finalClueHTML() {
  return overlayChrome(
    `<span class="ov-cat">Sfida finale — ${esc(FINAL.category)}</span>`,
    `<p class="clue-text">${formatClue(FINAL.clue)}</p>`,
    `<div class="actions"><button type="button" class="btn-primary" data-act="reveal">Mostra risposta</button></div>`
  );
}

function finalAnswerHTML() {
  const teams = state.teams
    .map((t, i) => {
      const tried = state.finalTried[i];
      const w = state.finalWagers[i] ?? 0;
      return `
        <div class="award-card${tried === "wrong" ? " tried-wrong" : ""}${tried === "right" ? " tried-right" : ""}" style="--team:${t.color}">
          <div class="aw-name"><span class="dot"></span>${esc(t.name)} · ${w}</div>
          <div class="aw-btns">
            <button type="button" class="btn-right" data-act="final-judge" data-i="${i}" data-ok="1" ${tried ? "disabled" : ""}>Giusto +</button>
            <button type="button" class="btn-wrong" data-act="final-judge" data-i="${i}" data-ok="0" ${tried ? "disabled" : ""}>Sbagliato −</button>
          </div>
        </div>`;
    })
    .join("");
  const allTried = state.teams.every((_, i) => state.finalTried[i]);
  return overlayChrome(
    `<span class="ov-cat">Sfida finale — ${esc(FINAL.category)}</span>`,
    `<p class="answer-kicker">Risposta</p>
     <p class="answer-text">${esc(FINAL.answer)}</p>
     ${FINAL.note ? `<p class="note">${esc(FINAL.note)}</p>` : ""}`,
    `<div class="team-award">${teams}</div>
     <div class="actions" style="margin-top:0.8rem">
       <button type="button" class="btn-primary" data-act="final-done" ${allTried ? "" : ""}>Vedi la classifica</button>
     </div>`
  );
}

function finalResultsHTML() {
  const ranked = state.teams.map((t, i) => ({ ...t, i })).sort((a, b) => b.score - a.score);
  const top = ranked[0] ? ranked[0].score : 0;
  const winners = ranked.filter((t) => t.score === top && top !== undefined);
  const title =
    winners.length > 1 && top != null
      ? "Pareggio!"
      : winners[0]
        ? "Vince " + winners[0].name
        : "Fine della partita";
  const list = ranked
    .map(
      (t) =>
        `<li><span>${esc(t.name)}</span><span>${t.score}</span></li>`
    )
    .join("");
  return overlayChrome(
    `<span class="ov-cat">Sfida finale</span>`,
    `<p class="splash-kicker">Classifica</p>
     <h2 class="splash-title">${esc(title)}</h2>
     <ul class="winner-list">${list}</ul>
     <div class="actions" style="margin-top:1.4rem">
       <button type="button" class="btn-ghost" data-act="close-final" style="color:#faf6ee;border-color:rgba(255,253,248,.3)">Torna al tabellone</button>
       <button type="button" class="btn-primary" data-act="reset">Nuova partita</button>
     </div>`,
    ""
  );
}

/* ——— Actions ——— */
function syncNamesFromDOM() {
  $all("[data-team-name]").forEach((inp) => {
    const i = Number(inp.getAttribute("data-team-name"));
    if (state.teams[i]) state.teams[i].name = inp.value.trim() || "Squadra " + (i + 1);
  });
}

function setTeamCount(n) {
  syncNamesFromDOM();
  n = Math.min(6, Math.max(2, n));
  state.teamCount = n;
  const prev = state.teams;
  const next = defaultTeams(n);
  for (let i = 0; i < Math.min(prev.length, next.length); i++) {
    next[i].name = prev[i].name;
    next[i].score = prev[i].score;
  }
  state.teams = next;
  render();
}

function startGame() {
  syncNamesFromDOM();
  state.used = {};
  state.tried = {};
  state.dailyDoubles = pickDailyDoubles();
  state.current = null;
  state.phase = "board";
  state.teams.forEach((t) => (t.score = 0));
  state.finalWagers = {};
  state.finalTried = {};
  stopTimer();
  render();
}

function openTile(ci, vi, tileEl) {
  const key = ci + ":" + vi;
  if (state.used[key]) return;
  const clue = clueAt(ci, vi);
  state.current = { ci, vi, value: clue.value, key, isDD: state.dailyDoubles.includes(key), isFinal: false };
  state.tried = {};
  sfx("flip");
  const go = () => {
    if (state.current.isDD) {
      sfx("dd");
      state.phase = "dd-intro";
    } else {
      state.phase = "clue";
      startTimer();
    }
    render();
  };
  if (tileEl && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    tileEl.classList.add("flip-out");
    setTimeout(go, 420);
  } else {
    go();
  }
}

function revealAnswer() {
  stopTimer();
  sfx("reveal");
  if (state.phase === "final-clue") state.phase = "final-answer";
  else state.phase = "answer";
  render();
}

function pointValue() {
  if (state.current && state.current.isDD) return state.ddWager;
  if (state.current && state.current.isFinal) return 0;
  return state.current ? state.current.value : 0;
}

function judge(i, ok) {
  if (state.tried[i]) return;
  const pts = pointValue();
  if (ok) {
    state.teams[i].score += pts;
    state.tried[i] = "right";
    sfx("right");
    if (state.current) state.used[state.current.key] = true;
    render();
    setTimeout(() => closeClue(), 650);
  } else {
    state.teams[i].score -= pts;
    state.tried[i] = "wrong";
    sfx("wrong");
    if (state.current && state.current.isDD) {
      state.used[state.current.key] = true;
      render();
      setTimeout(() => closeClue(), 650);
    } else {
      render();
    }
  }
}

function nobody() {
  if (state.current) state.used[state.current.key] = true;
  closeClue();
}

function closeClue() {
  stopTimer();
  state.phase = "board";
  state.current = null;
  state.tried = {};
  state.ddTeam = null;
  state.ddWager = 0;
  render();
  if (allTilesUsed()) {
    setTimeout(() => {
      if (state.phase === "board") startFinal();
    }, 400);
  }
}

function startFinal() {
  stopTimer();
  state.phase = "final-cat";
  state.current = { isFinal: true, isDD: false, value: 0, key: "final" };
  sfx("final");
  render();
}

function confirmFinalWagers() {
  $all("[data-final-wager]").forEach((inp) => {
    const i = Number(inp.getAttribute("data-final-wager"));
    const max = Math.max(0, state.teams[i].score);
    let v = parseInt(inp.value, 10);
    if (Number.isNaN(v)) v = 0;
    state.finalWagers[i] = Math.min(max, Math.max(0, v));
  });
  state.phase = "final-clue";
  startTimer();
  render();
}

function finalJudge(i, ok) {
  if (state.finalTried[i]) return;
  const w = state.finalWagers[i] ?? 0;
  if (ok) {
    state.teams[i].score += w;
    state.finalTried[i] = "right";
    sfx("right");
  } else {
    state.teams[i].score -= w;
    state.finalTried[i] = "wrong";
    sfx("wrong");
  }
  render();
}

function showModal(title, body, confirmLabel, onConfirm) {
  const modal = $("#modal");
  modal.innerHTML = `
    <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-title">
      <h3 id="dlg-title">${esc(title)}</h3>
      <p>${esc(body)}</p>
      <div class="dialog-actions">
        <button type="button" class="btn-ghost" data-act="modal-cancel">Annulla</button>
        <button type="button" class="btn-primary" data-act="modal-ok">${esc(confirmLabel)}</button>
      </div>
    </div>`;
  modal.classList.add("open");
  modal._onConfirm = onConfirm;
}

function hideModal() {
  const modal = $("#modal");
  modal.classList.remove("open");
  modal.innerHTML = "";
  modal._onConfirm = null;
}

function resetGame() {
  hideModal();
  stopTimer();
  const names = state.teams.map((t) => t.name);
  const count = state.teamCount;
  const sound = state.sound;
  const timerOn = state.timerOn;
  const timerSecs = state.timerSecs;
  state.phase = "setup";
  state.teamCount = count;
  state.teams = defaultTeams(count);
  state.teams.forEach((t, i) => {
    t.name = names[i] || t.name;
    t.score = 0;
  });
  state.used = {};
  state.tried = {};
  state.dailyDoubles = [];
  state.current = null;
  state.sound = sound;
  state.timerOn = timerOn;
  state.timerSecs = timerSecs;
  state.finalWagers = {};
  state.finalTried = {};
  render();
}

function readDDWagerInput() {
  const inp = $("[data-dd-wager]");
  if (!inp || state.ddTeam == null) return;
  const max = wagerMax(state.teams[state.ddTeam]);
  let v = parseInt(inp.value, 10);
  if (Number.isNaN(v)) v = 0;
  state.ddWager = Math.min(max, Math.max(0, v));
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

/* ——— Events ——— */
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const act = btn.getAttribute("data-act");

  if (act === "teams-dec") setTeamCount(state.teamCount - 1);
  else if (act === "teams-inc") setTeamCount(state.teamCount + 1);
  else if (act === "timer-len") {
    const s = Number(btn.getAttribute("data-secs"));
    state.timerOn = s > 0;
    state.timerSecs = s > 0 ? s : 30;
    render();
  } else if (act === "setup-sound") {
    state.sound = btn.getAttribute("data-on") === "true";
    if (state.sound) ctx();
    render();
  } else if (act === "toggle-sound") {
    state.sound = !state.sound;
    if (state.sound) ctx();
    render();
  } else if (act === "show-key") {
    syncNamesFromDOM();
    state.phase = "key";
    render();
  } else if (act === "back-setup") {
    state.phase = "setup";
    render();
  } else if (act === "print-key") window.print();
  else if (act === "start") startGame();
  else if (act === "open-tile") {
    openTile(Number(btn.getAttribute("data-ci")), Number(btn.getAttribute("data-vi")), btn);
  } else if (act === "reveal") revealAnswer();
  else if (act === "judge") judge(Number(btn.getAttribute("data-i")), btn.getAttribute("data-ok") === "1");
  else if (act === "nobody") nobody();
  else if (act === "adjust") {
    const i = Number(btn.getAttribute("data-i"));
    const d = Number(btn.getAttribute("data-d"));
    state.teams[i].score += d * ADJUST_STEP;
    render();
  } else if (act === "dd-pick-team") {
    state.ddTeam = Number(btn.getAttribute("data-i"));
    state.ddWager = Math.min(state.current.value, wagerMax(state.teams[state.ddTeam]));
    state.phase = "dd-wager";
    render();
  } else if (act === "dd-wager-adj") {
    readDDWagerInput();
    const max = wagerMax(state.teams[state.ddTeam]);
    state.ddWager = Math.min(max, Math.max(0, state.ddWager + Number(btn.getAttribute("data-d"))));
    render();
  } else if (act === "dd-confirm-wager") {
    readDDWagerInput();
    state.phase = "clue";
    startTimer();
    render();
  } else if (act === "final") startFinal();
  else if (act === "final-to-wager") {
    state.teams.forEach((t, i) => {
      state.finalWagers[i] = 0;
    });
    state.phase = "final-wager";
    render();
  } else if (act === "final-show-clue") confirmFinalWagers();
  else if (act === "final-judge") finalJudge(Number(btn.getAttribute("data-i")), btn.getAttribute("data-ok") === "1");
  else if (act === "final-done") {
    state.phase = "final-results";
    render();
  } else if (act === "close-final") {
    state.phase = "board";
    state.current = null;
    render();
  } else if (act === "reset") {
    showModal(
      "Nuova partita?",
      "Si azzerano i punteggi e si mescolano di nuovo le puntate doppie. I nomi delle squadre restano.",
      "Ricomincia",
      resetGame
    );
  } else if (act === "modal-cancel") hideModal();
  else if (act === "modal-ok") {
    const fn = $("#modal")._onConfirm;
    hideModal();
    if (fn) fn();
  } else if (act === "timer-pause") togglePauseTimer();
  else if (act === "fullscreen") toggleFullscreen();
});

document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.matches("[data-team-name]")) {
    const i = Number(t.getAttribute("data-team-name"));
    if (state.teams[i]) state.teams[i].name = t.value.trim() || "Squadra " + (i + 1);
  }
  if (t.matches("[data-dd-wager]")) readDDWagerInput();
  if (t.matches("[data-final-wager]")) {
    const i = Number(t.getAttribute("data-final-wager"));
    const max = Math.max(0, state.teams[i].score);
    let v = parseInt(t.value, 10);
    if (Number.isNaN(v)) v = 0;
    state.finalWagers[i] = Math.min(max, Math.max(0, v));
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if ($("#modal").classList.contains("open")) {
      hideModal();
      e.preventDefault();
      return;
    }
    if (state.phase === "answer") {
      nobody();
      e.preventDefault();
    }
  }
  if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
  if ((e.key === "r" || e.key === "R" || e.key === " ") && (state.phase === "clue" || state.phase === "final-clue")) {
    e.preventDefault();
    revealAnswer();
  }
  if (state.phase === "answer" && /^[1-6]$/.test(e.key)) {
    const i = Number(e.key) - 1;
    if (state.teams[i] && !state.tried[i]) {
      if (state.current && state.current.isDD && i !== state.ddTeam) return;
      judge(i, true);
    }
  }
  if (e.key === "f" || e.key === "F") {
    if (e.target && e.target.tagName === "INPUT") return;
  }
});

window.addEventListener("beforeunload", (e) => {
  if (state.phase === "setup" || state.phase === "key") return;
  e.preventDefault();
  e.returnValue = "";
});

document.addEventListener("DOMContentLoaded", () => {
  state.teams = defaultTeams(state.teamCount);
  render();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
});
