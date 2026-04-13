const TOTAL_FRAMES = 20;
let currentFrame = 0;
let playing = false;
let playTimer = null;

const FALLBACK_PAYLOAD = {
  generatedAt: new Date().toISOString(),
  aircraft: "B-52H",
  country: "USA",
  altitudeFeet: 8000,
  speedMph: 520,
  diveDeg: 0,
  targetRangeMeters: 3000,
  focus: 1,
  solutions: [
    { id: 1, label: "A", color: "#00ff41", weapon: "Mk 82", tnt: 118, drag: 1.0, smart: false, salvo: 1, result: "LONG", centerError: 90, bestAbsError: 65, tof: 14.2, patternLength: 37, fore: 3018, aft: 2981, blastRadius: 74 },
    { id: 2, label: "B", color: "#2f7cff", weapon: "Mk 82", tnt: 118, drag: 1.0, smart: false, salvo: 2, result: "NEAR HIT", centerError: 24, bestAbsError: 18, tof: 13.9, patternLength: 52, fore: 3026, aft: 2974, blastRadius: 74 },
    { id: 3, label: "C", color: "#ff9a1f", weapon: "Mk 84", tnt: 428, drag: 1.3, smart: false, salvo: 1, result: "DIRECT HIT", centerError: 4, bestAbsError: 4, tof: 15.1, patternLength: 40, fore: 3004, aft: 2964, blastRadius: 113 }
  ]
};

let payload = FALLBACK_PAYLOAD;
let sideCanvas, topCanvas, sideCtx, topCtx;
let tocImg = null;

function getPayload() {
  try {
    const raw = localStorage.getItem("macPayload");
    if (!raw) return FALLBACK_PAYLOAD;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.solutions) || !parsed.solutions.length) return FALLBACK_PAYLOAD;
    return parsed;
  } catch {
    return FALLBACK_PAYLOAD;
  }
}

function init() {
  payload = getPayload();

  sideCanvas = document.getElementById("sideViewCanvas");
  topCanvas = document.getElementById("topViewCanvas");
  sideCtx = sideCanvas.getContext("2d");
  topCtx = topCanvas.getContext("2d");

  tocImg = document.getElementById("tocMarker");

  bindControls();
  populateSummary();
  populateSolutionCards();
  buildTimelineStrip();
  updateRecommendation();
  resizeCanvases();
  render();
  window.addEventListener("resize", () => {
    resizeCanvases();
    render();
  });
}

function bindControls() {
  document.getElementById("prevBtn").addEventListener("click", () => setFrame(currentFrame - 1));
  document.getElementById("nextBtn").addEventListener("click", () => setFrame(currentFrame + 1));
  document.getElementById("playBtn").addEventListener("click", togglePlay);
  document.getElementById("printBtn").addEventListener("click", () => window.print());
  document.getElementById("frameSlider").addEventListener("input", (e) => {
    setFrame(parseInt(e.target.value, 10));
  });
}

function populateSummary() {
  document.getElementById("summaryAircraft").textContent = payload.aircraft || "UNKNOWN";
  document.getElementById("summaryCountry").textContent = payload.country || "UNKNOWN";
  document.getElementById("summaryAltitude").textContent = `${Math.round(payload.altitudeFeet || 0)} FT`;
  document.getElementById("summarySpeed").textContent = `${Math.round(payload.speedMph || 0)} MPH`;
  document.getElementById("summaryDive").textContent = `${Math.round(payload.diveDeg || 0)}°`;
  document.getElementById("summaryRange").textContent = `${Math.round(payload.targetRangeMeters || 0)} M`;

  const stamp = new Date(payload.generatedAt || Date.now());
  const pretty = stamp.toLocaleString();
  document.getElementById("missionStamp").textContent = `LAST SOLVE: ${pretty}`;
}

function populateSolutionCards() {
  const wrap = document.getElementById("solutionCards");
  wrap.innerHTML = "";

  payload.solutions.forEach((sol, idx) => {
    const cls = idx === 1 ? "b" : idx === 2 ? "c" : "a";
    const card = document.createElement("div");
    card.className = `solution-card ${cls}`;
    card.innerHTML = `
      <div class="solution-card-head">
        <div class="solution-label">${sol.label}</div>
        <div class="solution-result">${sol.result}</div>
      </div>
      <div class="metric"><span class="k">WEAPON</span><span class="v">${sol.weapon}</span></div>
      <div class="metric"><span class="k">SALVO</span><span class="v">${sol.salvo}</span></div>
      <div class="metric"><span class="k">TOF</span><span class="v">${sol.tof.toFixed(1)} s</span></div>
      <div class="metric"><span class="k">TARGET RANGE</span><span class="v">${Math.round(payload.targetRangeMeters)} m</span></div>
      <div class="metric"><span class="k">BLAST RADIUS</span><span class="v">${sol.blastRadius.toFixed(0)} m</span></div>
      <div class="metric"><span class="k">PATTERN LENGTH</span><span class="v">${sol.patternLength.toFixed(0)} m</span></div>
      <div class="metric"><span class="k">FORE</span><span class="v">${sol.fore.toFixed(0)} m</span></div>
      <div class="metric"><span class="k">AFT</span><span class="v">${Math.abs(sol.aft).toFixed(0)} m</span></div>
      <div class="metric"><span class="k">BEST ERROR</span><span class="v">${sol.bestAbsError.toFixed(0)} m</span></div>
    `;
    wrap.appendChild(card);
  });
}

function buildTimelineStrip() {
  const strip = document.getElementById("timelineStrip");
  strip.innerHTML = "";
  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const cell = document.createElement("div");
    cell.className = "frame-cell";
    cell.dataset.frame = i;
    strip.appendChild(cell);
  }
}

function updateTimelineStrip() {
  document.querySelectorAll(".frame-cell").forEach((cell, idx) => {
    cell.classList.toggle("active", idx <= currentFrame);
  });
}

function updateRecommendation() {
  const ranked = [...payload.solutions].sort((a, b) => {
    const rank = (sol) => {
      if (sol.result === "DIRECT HIT") return 0;
      if (sol.result === "NEAR HIT") return 1;
      if (sol.result === "LONG" || sol.result === "SHORT") return 2;
      return 3;
    };
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    return a.bestAbsError - b.bestAbsError;
  });

  const best = ranked[0];
  document.getElementById("recommendation").textContent =
    `RECOMMENDED SOLUTION: ${best.label} | ${best.weapon} | ${best.result} | BEST ERROR ${best.bestAbsError.toFixed(0)}m`;
}

function resizeCanvases() {
  [sideCanvas, topCanvas].forEach((canvas) => {
    canvas.width = Math.floor(canvas.clientWidth * devicePixelRatio);
    canvas.height = Math.floor(canvas.clientHeight * devicePixelRatio);
  });
  sideCtx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  topCtx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}

function setFrame(next) {
  currentFrame = Math.max(0, Math.min(TOTAL_FRAMES - 1, next));
  document.getElementById("frameSlider").value = currentFrame;
  render();
}

function togglePlay() {
  playing = !playing;
  document.getElementById("playBtn").textContent = playing ? "PAUSE" : "PLAY";

  if (playing) {
    playTimer = setInterval(() => {
      if (currentFrame >= TOTAL_FRAMES - 1) {
        currentFrame = 0;
      } else {
        currentFrame += 1;
      }
      document.getElementById("frameSlider").value = currentFrame;
      render();
    }, 260);
  } else if (playTimer) {
    clearInterval(playTimer);
    playTimer = null;
  }
}

function render() {
  renderSideView();
  renderTopView();
  document.getElementById("frameLabel").textContent = `FRAME ${String(currentFrame + 1).padStart(2, "0")} / ${TOTAL_FRAMES}`;
  updateTimelineStrip();
}

function drawGrid(ctx, width, height, step, alpha = 0.12) {
  ctx.save();
  ctx.strokeStyle = `rgba(0,255,65,${alpha})`;
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function getTrajectoryPoints(sol, width, height) {
  const marginX = 55;
  const releaseX = marginX;
  const targetX = width - marginX;
  const groundY = height - 55;
  const releaseY = 55 + (sol.id - 1) * 10;
  const progress = currentFrame / (TOTAL_FRAMES - 1);

  const points = [];
  const steps = 80;
  const curvature = Math.max(38, (payload.altitudeFeet / 12000) * 120 + sol.drag * 18);

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = releaseX + (targetX - releaseX) * t;
    const yLinear = releaseY + (groundY - releaseY) * t;
    const arc = Math.sin(Math.PI * t) * curvature;
    const y = yLinear - arc;
    points.push({ x, y });
  }

  const markerIndex = Math.max(0, Math.min(points.length - 1, Math.round(progress * steps)));
  return { points, marker: points[markerIndex], targetX, groundY };
}

function renderSideView() {
  const w = sideCanvas.clientWidth;
  const h = sideCanvas.clientHeight;

  sideCtx.clearRect(0, 0, w, h);
  sideCtx.fillStyle = "#000";
  sideCtx.fillRect(0, 0, w, h);

  drawGrid(sideCtx, w, h, 48, 0.08);

  // ground line
  sideCtx.strokeStyle = "rgba(0,255,65,0.35)";
  sideCtx.lineWidth = 1;
  sideCtx.beginPath();
  sideCtx.moveTo(30, h - 55);
  sideCtx.lineTo(w - 30, h - 55);
  sideCtx.stroke();

  // aircraft release icon
  sideCtx.fillStyle = "#00ff41";
  sideCtx.font = "14px monospace";
  sideCtx.fillText("RELEASE", 32, 28);

  payload.solutions.forEach((sol) => {
    const { points, marker, targetX, groundY } = getTrajectoryPoints(sol, w, h);

    sideCtx.strokeStyle = sol.color;
    sideCtx.lineWidth = 2;
    sideCtx.shadowColor = sol.color;
    sideCtx.shadowBlur = 10;
    sideCtx.beginPath();
    points.forEach((p, idx) => {
      if (idx === 0) sideCtx.moveTo(p.x, p.y);
      else sideCtx.lineTo(p.x, p.y);
    });
    sideCtx.stroke();
    sideCtx.shadowBlur = 0;

    // marker
    sideCtx.fillStyle = sol.color;
    sideCtx.beginPath();
    sideCtx.arc(marker.x, marker.y, 5, 0, Math.PI * 2);
    sideCtx.fill();

    // impact / blast ring when close to final frames
    if (currentFrame >= TOTAL_FRAMES - 4) {
      sideCtx.strokeStyle = sol.color;
      sideCtx.globalAlpha = 0.45;
      sideCtx.beginPath();
      sideCtx.arc(targetX, groundY, Math.min(22, sol.blastRadius * 0.18), 0, Math.PI * 2);
      sideCtx.stroke();
      sideCtx.globalAlpha = 1;
    }
  });

  // target line / marker
  const targetX = w - 55;
  const targetY = h - 55;
  sideCtx.strokeStyle = "#ffd54a";
  sideCtx.lineWidth = 1.5;
  sideCtx.beginPath();
  sideCtx.moveTo(targetX - 12, targetY);
  sideCtx.lineTo(targetX + 12, targetY);
  sideCtx.moveTo(targetX, targetY - 12);
  sideCtx.lineTo(targetX, targetY + 12);
  sideCtx.stroke();
  sideCtx.fillStyle = "#ffd54a";
  sideCtx.fillText("TOC", targetX - 10, targetY - 18);
}

function renderTopView() {
  const w = topCanvas.clientWidth;
  const h = topCanvas.clientHeight;

  topCtx.clearRect(0, 0, w, h);
  topCtx.fillStyle = "rgba(0,0,0,0.18)";
  topCtx.fillRect(0, 0, w, h);

  drawGrid(topCtx, w, h, 52, 0.13);

  const cx = w / 2;
  const cy = h / 2;
  const progress = currentFrame / (TOTAL_FRAMES - 1);

  payload.solutions.forEach((sol) => {
    const spreadX = 90 + (sol.id - 2) * 30;
    const startY = 60;
    const endY = cy;
    const markerY = startY + (endY - startY) * progress;
    const markerX = cx + (sol.id - 2) * 42;

    // ingress line
    topCtx.strokeStyle = sol.color;
    topCtx.lineWidth = 2;
    topCtx.shadowColor = sol.color;
    topCtx.shadowBlur = 8;
    topCtx.beginPath();
    topCtx.moveTo(markerX, 25);
    topCtx.lineTo(markerX, markerY);
    topCtx.stroke();
    topCtx.shadowBlur = 0;

    // munition position
    topCtx.fillStyle = sol.color;
    topCtx.beginPath();
    topCtx.arc(markerX, markerY, 4.5, 0, Math.PI * 2);
    topCtx.fill();

    // pattern line on ground
    const forePx = Math.max(24, sol.patternLength * 0.12);
    topCtx.globalAlpha = 0.85;
    topCtx.strokeStyle = sol.color;
    topCtx.beginPath();
    topCtx.moveTo(cx - forePx / 2 + (sol.id - 2) * 14, cy + (sol.id - 2) * 18);
    topCtx.lineTo(cx + forePx / 2 + (sol.id - 2) * 14, cy + (sol.id - 2) * 18);
    topCtx.stroke();
    topCtx.globalAlpha = 1;

    // blast radius
    const blastPx = Math.max(26, sol.blastRadius * 0.34);
    topCtx.globalAlpha = 0.38;
    topCtx.fillStyle = hexToRgba(sol.color, 0.12);
    topCtx.strokeStyle = sol.color;
    topCtx.beginPath();
    topCtx.arc(cx + (sol.id - 2) * 14, cy + (sol.id - 2) * 18, blastPx, 0, Math.PI * 2);
    topCtx.fill();
    topCtx.stroke();
    topCtx.globalAlpha = 1;

    // label
    topCtx.fillStyle = sol.color;
    topCtx.font = "13px monospace";
    topCtx.fillText(sol.label, cx + (sol.id - 2) * 14 - 5, cy - blastPx - 10);
  });
}

function hexToRgba(hex, alpha) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

init();
