/* Tospik ile Kodlama — oyun mantığı */
(function () {
  "use strict";

  const LEVELS = window.LEVELS;
  const UNITS = window.UNITS;
  const DIRS = {
    up:    { dx: 0,  dy: -1, deg: -90, glyph: "↑" },
    down:  { dx: 0,  dy: 1,  deg: 90,  glyph: "↓" },
    left:  { dx: -1, dy: 0,  deg: 180, glyph: "←" },
    right: { dx: 1,  dy: 0,  deg: 0,   glyph: "→" }
  };
  const STEP_MS = 520;
  const STORE_KEY = "tospik-progress";
  const GARDEN_KEY = "tospik-garden";
  const MAX_BODY = 3; // bir tekrar bloğuna en fazla kaç ok sığar

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const boardEl = $("board");
  const turtleEl = $("turtle");
  const turtleRot = $("turtleRot");
  const bubble = $("bubble");
  const bubbleText = $("bubbleText");
  const programEl = $("program");
  const paletteEl = $("palette");
  const panelTitle = $("panelTitle");
  const controlsEl = $("controls");
  const runBtn = $("runBtn");
  const undoBtn = $("undoBtn");
  const clearBtn = $("clearBtn");
  const editBtn = $("editBtn");
  const playBtn = $("playBtn");
  const readBtn = $("readBtn");
  const muteBtn = $("muteBtn");
  const overlay = $("overlay");
  const cardTitle = $("cardTitle");
  const cardText = $("cardText");
  const nextBtn = $("nextBtn");
  const replayBtn = $("replayBtn");
  const levelBadges = $("levelBadges");
  const unitLabel = $("unitLabel");
  const prevUnitBtn = $("prevUnitBtn");
  const nextUnitBtn = $("nextUnitBtn");
  const confettiEl = $("confetti");
  const repeatRow = $("repeatRow");
  const repeatBtn = $("repeatBtn");
  const editorTools = $("editorTools");
  const cmdButtons = Array.from(document.querySelectorAll(".cmd"));
  const numButtons = Array.from(document.querySelectorAll(".num"));
  const toolButtons = Array.from(document.querySelectorAll(".tool"));

  // ---------- Durum ----------
  const state = {
    levelIndex: 0,
    level: null,
    program: [],   // öğeler: {type:"step", dir} | {type:"repeat", times, body:[dir], open}
    marks: [],     // son çalıştırmadan kalan çip işaretleri ("done" | "fail")
    turtle: { x: 0, y: 0, dir: "right" },
    running: false,
    muted: false,
    hasKey: false,
    collected: 0,  // sırayla alınan çilek sayısı
    editing: false,  // bölüm editörü açık mı (Kendi Bahçen)
    tool: "tree",
    done: loadJSON(STORE_KEY, [])
  };

  function loadJSON(key, fallback) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
  }
  function saveJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* yok say */ }
  }

  // ---------- Ses (WebAudio, dosya gerekmez) ----------
  let audioCtx = null;
  function ctx() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }
  function tone(freq, dur, type, gain, when) {
    if (state.muted) return;
    const c = ctx(); if (!c) return;
    const t0 = c.currentTime + (when || 0);
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain || 0.15, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(c.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  const sfx = {
    tap:  () => tone(660, 0.08, "triangle", 0.12),
    del:  () => tone(330, 0.1, "triangle", 0.1),
    step: () => { tone(440, 0.07, "square", 0.05); tone(560, 0.07, "square", 0.05, 0.08); },
    bump: () => tone(110, 0.3, "sawtooth", 0.15),
    sad:  () => { tone(392, 0.18, "sine", 0.12); tone(330, 0.3, "sine", 0.12, 0.2); },
    key:  () => { tone(880, 0.1, "triangle", 0.12); tone(1320, 0.18, "triangle", 0.12, 0.1); },
    yum:  () => { tone(523, 0.1, "triangle", 0.12); tone(659, 0.16, "triangle", 0.12, 0.1); },
    win:  () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, "triangle", 0.14, i * 0.13))
  };

  // ---------- Sesli okuma ----------
  function speak(text) {
    if (state.muted || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "tr-TR";
      u.rate = 0.95;
      u.pitch = 1.15;
      const voice = window.speechSynthesis.getVoices().find(v => v.lang && v.lang.toLowerCase().startsWith("tr"));
      if (voice) u.voice = voice;
      window.speechSynthesis.speak(u);
    } catch { /* yok say */ }
  }

  // ---------- Yardımcılar ----------
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const same = (a, b) => a && b && a.x === b.x && a.y === b.y;

  function say(text, opts) {
    bubbleText.textContent = text;
    bubble.classList.remove("shake");
    if (opts && opts.shake) { void bubble.offsetWidth; bubble.classList.add("shake"); }
    if (opts && opts.speak) speak(text);
  }

  function cellAt(x, y) {
    return boardEl.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
  }

  // Bölüm nesnesini tek biçime getir (goal → goals, eksik alanlar)
  function normalize(L) {
    const N = Object.assign({}, L);
    N.goals = (L.goals || [L.goal]).map(g => ({ x: g.x, y: g.y }));
    N.obstacles = (L.obstacles || []).map(o => ({ x: o.x, y: o.y }));
    N.start = Object.assign({}, L.start);
    N.key = L.key ? Object.assign({}, L.key) : null;
    N.door = L.door ? Object.assign({}, L.door) : null;
    return N;
  }

  function isLive() { return state.level.mode === "live"; }
  function isEdit() { return state.level.mode === "edit"; }

  function goalIndexAt(x, y) {
    return state.level.goals.findIndex(g => g.x === x && g.y === y);
  }

  // Hücreye girilebilir mi? Dönüş: null (serbest) ya da engel türü
  function isBlocked(x, y) {
    const L = state.level;
    if (x < 0 || y < 0 || x >= L.cols || y >= L.rows) return "wall";
    if (L.obstacles.some(o => o.x === x && o.y === y)) return "obstacle";
    if (L.door && same(L.door, { x, y }) && !state.hasKey) return "door";
    const gi = goalIndexAt(x, y);
    if (gi !== -1 && gi !== state.collected && gi >= state.collected) return "order";
    return null;
  }

  function blockedMessage(kind) {
    switch (kind) {
      case "wall": return "Hop! Orası çayırın dışı.";
      case "obstacle": return "Hop! Ağaca çarptım. Etrafından dolaş!";
      case "door": return "Kapı kilitli! Önce anahtarı almalıyım.";
      case "order": return `Önce ${state.collected + 1} numaralı çileği almalıyım!`;
      default: return "Hop!";
    }
  }

  // Hücreye girince olanlar: anahtar al, çilek ye. Kazanıldıysa true döner.
  function afterMove(x, y) {
    const L = state.level;
    if (L.key && same(L.key, { x, y }) && !state.hasKey) {
      state.hasKey = true;
      sfx.key();
      turtleEl.classList.add("has-key");
      renderCellStates();
    }
    const gi = goalIndexAt(x, y);
    if (gi === state.collected) {
      state.collected++;
      if (state.collected < L.goals.length) { sfx.yum(); renderCellStates(); }
      else return true;
    }
    return false;
  }

  // ---------- Program öğeleri ----------
  const stepItem = (dir) => ({ type: "step", dir });
  const repeatItem = (times, body, open) => ({ type: "repeat", times, body: body.slice(), open: !!open });

  function presetToProgram(preset) {
    return (preset || []).map(p => typeof p === "string" ? stepItem(p) : repeatItem(p.times, p.body, false));
  }
  function openRepeat() {
    return state.program.find(it => it.type === "repeat" && it.open) || null;
  }
  function lastRepeat() {
    for (let i = state.program.length - 1; i >= 0; i--) if (state.program[i].type === "repeat") return state.program[i];
    return null;
  }
  function closeOpenRepeats() {
    state.program = state.program.filter(it => !(it.type === "repeat" && it.open && it.body.length === 0));
    state.program.forEach(it => { if (it.type === "repeat") it.open = false; });
  }
  // Programı tek tek adımlara aç
  function flatten(program) {
    const out = [];
    program.forEach((it, chip) => {
      if (it.type === "step") out.push({ dir: it.dir, chip, inner: -1, iter: 0, times: 1 });
      else for (let k = 0; k < it.times; k++) it.body.forEach((d, inner) => out.push({ dir: d, chip, inner, iter: k, times: it.times }));
    });
    return out;
  }

  // ---------- Çizim: üst bar ----------
  function renderBadges() {
    const unitId = state.level.unit;
    const unit = UNITS.find(u => u.id === unitId);
    unitLabel.textContent = `Ünite ${unitId} · ${unit ? unit.name : ""}`;
    levelBadges.innerHTML = "";
    LEVELS.forEach((L, i) => {
      if (L.unit !== unitId) return;
      const li = document.createElement("li");
      const done = state.done.includes(L.id);
      li.textContent = done ? "★" : String(L.id);
      if (done) li.classList.add("done");
      if (i === state.levelIndex) li.classList.add("current");
      li.title = L.name;
      li.setAttribute("role", "button");
      li.tabIndex = 0;
      li.addEventListener("click", () => { if (!state.running) { sfx.tap(); loadLevel(i); } });
      levelBadges.appendChild(li);
    });
    const unitIds = UNITS.map(u => u.id);
    const pos = unitIds.indexOf(unitId);
    prevUnitBtn.disabled = pos <= 0;
    nextUnitBtn.disabled = pos >= unitIds.length - 1;
  }
  function gotoUnit(delta) {
    if (state.running) return;
    const unitIds = UNITS.map(u => u.id);
    const target = unitIds[unitIds.indexOf(state.level.unit) + delta];
    const idx = LEVELS.findIndex(L => L.unit === target);
    if (idx !== -1) { sfx.tap(); loadLevel(idx); }
  }

  // ---------- Çizim: tahta ----------
  function renderBoard() {
    const L = state.level;
    boardEl.style.setProperty("--cols", L.cols);
    boardEl.style.setProperty("--rows", L.rows);
    boardEl.classList.toggle("editing", isEdit());
    boardEl.querySelectorAll(".cell").forEach(c => c.remove());
    for (let y = 0; y < L.rows; y++) {
      for (let x = 0; x < L.cols; x++) {
        const c = document.createElement("div");
        c.className = "cell" + ((x + y) % 2 ? " alt" : "");
        c.dataset.x = x; c.dataset.y = y;
        const gi = goalIndexAt(x, y);
        if (gi !== -1) { c.classList.add("goal"); if (L.goals.length > 1) c.dataset.num = gi + 1; }
        if (L.obstacles.some(o => o.x === x && o.y === y)) c.classList.add("obstacle");
        if (L.key && same(L.key, { x, y })) c.classList.add("key");
        if (L.door && same(L.door, { x, y })) c.classList.add("door");
        if (L.start.x === x && L.start.y === y) c.classList.add("start");
        boardEl.insertBefore(c, turtleEl);
      }
    }
    renderCellStates();
  }

  // Koşu sırasında değişen hücre durumları (alınan anahtar, yenen çilek, açılan kapı)
  function renderCellStates() {
    const L = state.level;
    L.goals.forEach((g, i) => { const c = cellAt(g.x, g.y); if (c) c.classList.toggle("eaten", i < state.collected); });
    if (L.key) { const c = cellAt(L.key.x, L.key.y); if (c) c.classList.toggle("taken", state.hasKey); }
    if (L.door) { const c = cellAt(L.door.x, L.door.y); if (c) c.classList.toggle("open", state.hasKey); }
    turtleEl.classList.toggle("has-key", state.hasKey);
  }

  function renderTurtle(instant) {
    const t = state.turtle;
    if (instant) turtleEl.style.transition = "none";
    turtleEl.style.transform = `translate(calc(var(--cell) * ${t.x}), calc(var(--cell) * ${t.y}))`;
    turtleRot.style.transform = `rotate(${DIRS[t.dir].deg}deg)`;
    if (instant) { void turtleEl.offsetWidth; turtleEl.style.transition = ""; }
  }

  function resetTurtle(instant) {
    const s = state.level.start;
    state.turtle = { x: s.x, y: s.y, dir: s.dir };
    state.hasKey = false;
    state.collected = 0;
    turtleEl.classList.remove("walk", "bump", "happy");
    renderCellStates();
    renderTurtle(instant);
  }

  // ---------- Çizim: panel ----------
  function renderProgram() {
    const L = state.level;
    const live = isLive();
    const edit = isEdit();
    programEl.innerHTML = "";

    state.program.forEach((it, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.dataset.index = i;
      if (it.type === "step") {
        b.className = "chip";
        b.textContent = DIRS[it.dir].glyph;
        b.setAttribute("aria-label", `${i + 1}. adım ${DIRS[it.dir].glyph}, sil`);
      } else {
        b.className = "chip repeat" + (it.open ? " open" : "");
        const body = document.createElement("span");
        body.className = "rbody";
        it.body.forEach(d => { const s = document.createElement("span"); s.textContent = DIRS[d].glyph; body.appendChild(s); });
        if (!it.body.length) { const s = document.createElement("span"); s.className = "ph"; s.textContent = "?"; body.appendChild(s); }
        const times = document.createElement("span");
        times.className = "rtimes";
        times.textContent = it.open ? "×?" : `×${it.times}`;
        b.append(body, times);
        b.setAttribute("aria-label", it.open ? "Açık tekrar bloğu, kapat" : `Tekrar bloğu ${it.times} kez, sil`);
      }
      if (state.marks[i]) b.classList.add(state.marks[i]);
      b.addEventListener("click", () => onChipClick(i));
      programEl.appendChild(b);
    });
    for (let i = state.program.length; i < L.maxSteps; i++) {
      const s = document.createElement("div");
      s.className = "slot";
      s.textContent = String(i + 1);
      programEl.appendChild(s);
    }

    // Görünürlük
    const open = openRepeat();
    const full = !live && state.program.length >= L.maxSteps;
    paletteEl.hidden = edit;
    programEl.hidden = edit;
    repeatRow.hidden = edit || !L.repeat;
    editorTools.hidden = !edit;
    controlsEl.classList.toggle("live", live);
    controlsEl.classList.toggle("edit", edit);
    controlsEl.classList.toggle("custom", state.editing && !edit);
    runBtn.hidden = live || edit;
    undoBtn.hidden = live || edit;
    clearBtn.hidden = edit;
    playBtn.hidden = !edit;
    editBtn.hidden = !(state.editing && !edit);

    panelTitle.textContent = edit ? "Bahçeni tasarla"
      : live ? "Oklara bas, Tospik yürüsün"
      : L.repeat ? "Okları ve tekrar bloklarını diz"
      : "Okları sıraya diz";
    clearBtn.textContent = live ? "↻ Baştan" : "🗑";
    clearBtn.setAttribute("aria-label", live ? "Baştan başla" : "Hepsini sil");

    // Etkinlik
    const canAddArrow = !state.running && (live || (open ? open.body.length < MAX_BODY : !full));
    cmdButtons.forEach(b => b.disabled = !canAddArrow);
    repeatBtn.disabled = state.running || (!open && full);
    repeatBtn.classList.toggle("active", !!open);
    const numTarget = open || lastRepeat();
    numButtons.forEach(b => {
      b.disabled = state.running || !numTarget;
      b.classList.toggle("active", !!numTarget && !open && numTarget.times === Number(b.dataset.n));
    });
    const hasRunnable = state.program.some(it => it.type === "step" || it.body.length > 0);
    runBtn.disabled = state.running || !hasRunnable;
    undoBtn.disabled = state.running || state.program.length === 0;
    clearBtn.disabled = state.running || (!live && state.program.length === 0);
    editBtn.disabled = state.running;
    toolButtons.forEach(b => b.classList.toggle("active", b.dataset.tool === state.tool));
  }

  // ---------- Program düzenleme ----------
  function addStep(dir) {
    if (state.running) return;
    if (isLive()) return liveStep(dir);
    const open = openRepeat();
    if (open) {
      if (open.body.length >= MAX_BODY) return;
      open.body.push(dir);
      state.marks = [];
      sfx.tap();
      renderProgram();
      return;
    }
    if (state.program.length >= state.level.maxSteps) return;
    state.program.push(stepItem(dir));
    state.marks = [];
    sfx.tap();
    renderProgram();
  }

  function toggleRepeat() {
    if (state.running || !state.level.repeat) return;
    const open = openRepeat();
    if (open) {
      if (!open.body.length) state.program.splice(state.program.indexOf(open), 1);
      else open.open = false;
      sfx.tap();
      renderProgram();
      return;
    }
    if (state.program.length >= state.level.maxSteps) return;
    state.program.push(repeatItem(2, [], true));
    state.marks = [];
    sfx.tap();
    renderProgram();
  }

  function setTimes(n) {
    if (state.running) return;
    const open = openRepeat();
    const target = open || lastRepeat();
    if (!target) return;
    target.times = n;
    if (open) {
      if (!open.body.length) { say("Önce bloğun içine ok koy!", { shake: true }); return; }
      open.open = false;
    }
    state.marks = [];
    sfx.tap();
    renderProgram();
  }

  function onChipClick(i) {
    if (state.running) return;
    const it = state.program[i];
    if (it.type === "repeat" && it.open) {
      if (!it.body.length) state.program.splice(i, 1); else it.open = false;
    } else {
      state.program.splice(i, 1);
      sfx.del();
    }
    state.marks = [];
    renderProgram();
  }

  function undo() {
    if (state.running || !state.program.length) return;
    const open = openRepeat();
    if (open && open.body.length) { open.body.pop(); sfx.del(); renderProgram(); return; }
    state.program.pop();
    state.marks = [];
    sfx.del();
    renderProgram();
  }

  function clearProgram() {
    if (state.running) return;
    if (isLive()) {
      const atStart = state.turtle.x === state.level.start.x && state.turtle.y === state.level.start.y;
      if (!state.program.length && atStart) return;
      state.program = [];
      state.marks = [];
      sfx.del();
      resetTurtle(false);
      renderProgram();
      return;
    }
    if (!state.program.length) return;
    state.program = [];
    state.marks = [];
    sfx.del();
    renderProgram();
  }

  // Alışma modu: ok basılır basılmaz yürü, şeritte iz bırak
  async function liveStep(dir) {
    state.turtle.dir = dir;
    renderTurtle();
    const nx = state.turtle.x + DIRS[dir].dx;
    const ny = state.turtle.y + DIRS[dir].dy;
    const blocked = isBlocked(nx, ny);
    if (blocked) {
      turtleEl.classList.remove("walk", "bump"); void turtleEl.offsetWidth; turtleEl.classList.add("bump");
      sfx.bump();
      say(blockedMessage(blocked), { shake: true });
      return;
    }
    if (state.program.length >= state.level.maxSteps) { state.program.shift(); state.marks.shift(); }
    state.program.push(stepItem(dir));
    state.marks[state.program.length - 1] = "done";
    renderProgram();
    state.turtle.x = nx; state.turtle.y = ny;
    turtleEl.classList.remove("bump", "walk"); void turtleEl.offsetWidth; turtleEl.classList.add("walk");
    sfx.step();
    renderTurtle();
    if (afterMove(nx, ny)) {
      state.running = true;
      renderProgram();
      await sleep(STEP_MS);
      finish(true);
    }
  }

  // ---------- Çalıştırma ----------
  function chipEl(i) { return programEl.querySelector(`.chip[data-index="${i}"]`); }

  function markChip(i, cls, info) {
    if (cls === "done" || cls === "fail") state.marks[i] = cls;
    programEl.querySelectorAll(".chip").forEach(c => {
      c.classList.remove("active");
      c.querySelectorAll(".rbody .now").forEach(s => s.classList.remove("now"));
    });
    const el = chipEl(i);
    if (!el) return;
    if (cls) el.classList.add(cls);
    const times = el.querySelector(".rtimes");
    if (times && info) {
      times.textContent = cls === "active" ? `×${info.times - info.iter}` : `×${info.times}`;
      if (cls === "active" && info.inner >= 0) {
        const span = el.querySelectorAll(".rbody span")[info.inner];
        if (span) span.classList.add("now");
      }
    }
  }

  async function run() {
    if (state.running) return;
    closeOpenRepeats();
    const steps = flatten(state.program);
    if (!steps.length) { renderProgram(); return; }
    state.running = true;
    state.marks = [];
    renderProgram();
    resetTurtle(true);
    say("Gidiyorum!");
    await sleep(350);

    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      markChip(s.chip, "active", s);
      state.turtle.dir = s.dir;
      renderTurtle();
      await sleep(220);

      const nx = state.turtle.x + DIRS[s.dir].dx;
      const ny = state.turtle.y + DIRS[s.dir].dy;
      const blocked = isBlocked(nx, ny);
      if (blocked) {
        turtleEl.classList.remove("walk"); void turtleEl.offsetWidth; turtleEl.classList.add("bump");
        sfx.bump();
        markChip(s.chip, "fail", s);
        await sleep(650);
        return finish(false, blocked === "wall" ? "Hop! Orası çayırın dışı. Tekrar dene!" : blockedMessage(blocked));
      }

      state.turtle.x = nx; state.turtle.y = ny;
      turtleEl.classList.remove("bump", "walk"); void turtleEl.offsetWidth; turtleEl.classList.add("walk");
      sfx.step();
      renderTurtle();
      await sleep(STEP_MS);
      const won = afterMove(nx, ny);
      const lastOfChip = i === steps.length - 1 || steps[i + 1].chip !== s.chip;
      if (lastOfChip) markChip(s.chip, "done", s);
      if (won) return finish(true);
    }
    const L = state.level;
    const msg = L.goals.length > 1 && state.collected < L.goals.length
      ? `${L.goals.length - state.collected} çilek daha var. Devam et!`
      : "Çileğe ulaşamadım. Biraz daha ok eklemeyi dene!";
    finish(false, msg);
  }

  async function finish(won, msg) {
    if (won) {
      turtleEl.classList.add("happy");
      sfx.win();
      burstConfetti();
      const L = state.level;
      if (!state.editing && !state.done.includes(L.id)) { state.done.push(L.id); saveJSON(STORE_KEY, state.done); }
      renderBadges();
      say(L.win, { speak: true });
      await sleep(900);
      showCard();
    } else {
      sfx.sad();
      say(msg, { shake: true, speak: true });
      await sleep(900);
      resetTurtle(false);
    }
    state.running = false;
    renderProgram();
  }

  function showCard() {
    const last = state.levelIndex >= LEVELS.length - 1;
    if (state.editing) {
      cardTitle.textContent = "Bahçen harika!";
      cardText.textContent = "Kendi tasarladığın bölümü çözdün. Yeni bir bahçe yapmak ister misin?";
      nextBtn.textContent = "✏️ Yeni bahçe";
    } else {
      cardTitle.textContent = last ? "Hepsini bitirdin! 🎉" : "Aferin!";
      cardText.textContent = last
        ? "Bütün bölümleri tamamladın. Yeni bölümler yakında!"
        : `${state.level.name} tamamlandı. Hazırsan sıradaki bölüme geçelim!`;
      nextBtn.textContent = last ? "Baştan oyna" : "Sonraki bölüm →";
    }
    overlay.hidden = false;
  }

  function burstConfetti() {
    const colors = ["#FF7B54", "#FFD93D", "#5BB7FF", "#7CC94E", "#FF5DA2", "#FFFFFF"];
    confettiEl.innerHTML = "";
    for (let i = 0; i < 70; i++) {
      const p = document.createElement("i");
      p.style.left = Math.random() * 100 + "vw";
      p.style.background = colors[i % colors.length];
      p.style.animationDuration = 1.8 + Math.random() * 1.6 + "s";
      p.style.animationDelay = Math.random() * 0.6 + "s";
      p.style.transform = `rotate(${Math.random() * 360}deg)`;
      confettiEl.appendChild(p);
    }
    setTimeout(() => { confettiEl.innerHTML = ""; }, 4200);
  }

  // ---------- Bölüm editörü (Kendi Bahçen) ----------
  function loadGarden(base) {
    const g = loadJSON(GARDEN_KEY, null);
    if (!g || !g.start || !g.goal) return base;
    return Object.assign({}, base, { start: g.start, goal: g.goal, goals: undefined, obstacles: g.obstacles || [] });
  }
  function saveGarden() {
    const L = state.level;
    saveJSON(GARDEN_KEY, { start: L.start, goal: L.goals[0], obstacles: L.obstacles });
  }
  function onCellEdit(x, y) {
    if (!isEdit() || state.running) return;
    const L = state.level;
    const here = { x, y };
    const oi = L.obstacles.findIndex(o => o.x === x && o.y === y);
    switch (state.tool) {
      case "tree":
        if (same(L.start, here) || same(L.goals[0], here)) return;
        if (oi === -1) L.obstacles.push(here); else L.obstacles.splice(oi, 1);
        break;
      case "goal":
        if (same(L.start, here)) return;
        if (oi !== -1) L.obstacles.splice(oi, 1);
        L.goals[0] = here;
        break;
      case "start":
        if (same(L.goals[0], here)) return;
        if (oi !== -1) L.obstacles.splice(oi, 1);
        L.start = { x, y, dir: L.start.dir };
        break;
      case "eraser":
        if (oi !== -1) L.obstacles.splice(oi, 1);
        break;
    }
    sfx.tap();
    saveGarden();
    renderBoard();
    resetTurtle(true);
  }
  function startPlayingGarden() {
    if (state.running) return;
    state.level.mode = "plan";
    state.program = [];
    state.marks = [];
    sfx.tap();
    renderBoard();
    resetTurtle(true);
    renderProgram();
    say("Hadi bakalım! Kendi bölümünü çöz.", { speak: true });
  }
  function backToEditing() {
    if (state.running) return;
    state.level.mode = "edit";
    state.program = [];
    state.marks = [];
    overlay.hidden = true;
    sfx.tap();
    renderBoard();
    resetTurtle(true);
    renderProgram();
    say("Bahçeni değiştir, sonra yine Oyna'ya bas.");
  }

  // ---------- Bölüm yükleme ----------
  function loadLevel(index, opts) {
    state.levelIndex = (index + LEVELS.length) % LEVELS.length;
    const base = LEVELS[state.levelIndex];
    state.editing = base.mode === "edit";
    state.level = normalize(state.editing ? loadGarden(base) : base);
    state.program = presetToProgram(base.preset);
    state.marks = [];
    state.running = false;
    overlay.hidden = true;
    renderBadges();
    renderBoard();
    resetTurtle(true);
    renderProgram();
    say(state.level.intro, { speak: !(opts && opts.silent) });
  }

  // ---------- Olaylar ----------
  cmdButtons.forEach(b => b.addEventListener("click", () => addStep(b.dataset.dir)));
  numButtons.forEach(b => b.addEventListener("click", () => setTimes(Number(b.dataset.n))));
  toolButtons.forEach(b => b.addEventListener("click", () => { state.tool = b.dataset.tool; sfx.tap(); renderProgram(); }));
  repeatBtn.addEventListener("click", toggleRepeat);
  runBtn.addEventListener("click", run);
  undoBtn.addEventListener("click", undo);
  clearBtn.addEventListener("click", clearProgram);
  playBtn.addEventListener("click", startPlayingGarden);
  editBtn.addEventListener("click", backToEditing);
  readBtn.addEventListener("click", () => speak(bubbleText.textContent));
  prevUnitBtn.addEventListener("click", () => gotoUnit(-1));
  nextUnitBtn.addEventListener("click", () => gotoUnit(1));
  boardEl.addEventListener("click", (e) => {
    const c = e.target.closest(".cell");
    if (c) onCellEdit(Number(c.dataset.x), Number(c.dataset.y));
  });
  muteBtn.addEventListener("click", () => {
    state.muted = !state.muted;
    muteBtn.textContent = state.muted ? "🔇" : "🔊";
    if (state.muted && "speechSynthesis" in window) window.speechSynthesis.cancel();
  });
  nextBtn.addEventListener("click", () => {
    sfx.tap();
    if (state.editing) backToEditing(); else loadLevel(state.levelIndex + 1);
  });
  replayBtn.addEventListener("click", () => {
    sfx.tap();
    if (state.editing) { overlay.hidden = true; startPlayingGarden(); } else loadLevel(state.levelIndex);
  });

  // Klavye (masaüstünde test kolaylığı)
  document.addEventListener("keydown", (e) => {
    if (!overlay.hidden || e.repeat) return;
    const map = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
    if (map[e.key]) { e.preventDefault(); addStep(map[e.key]); }
    else if (e.key === "Enter") run();
    else if (e.key === "Backspace") undo();
    else if (e.key === "r" || e.key === "R") toggleRepeat();
    else if ("2345".includes(e.key) && e.key !== "") setTimes(Number(e.key));
  });

  // Sesler ilk dokunuşta açılsın (tarayıcı kuralı)
  document.addEventListener("pointerdown", () => ctx(), { once: true });
  if ("speechSynthesis" in window) window.speechSynthesis.onvoiceschanged = () => {};

  // ---------- PWA ----------
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }

  // ---------- Başlat ----------
  const firstOpen = LEVELS.findIndex(L => !state.done.includes(L.id) && L.mode !== "edit");
  loadLevel(firstOpen === -1 ? LEVELS.length - 1 : firstOpen, { silent: true });
})();
