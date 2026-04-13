const TOTAL_FRAMES = 20;
let currentFrame = 0;
let zoomLevel = 'NORMAL';
let playing = false;
let playTimer = null;
let activeFilter = "all";

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

function visibleSolutions() {
  if (activeFilter === "all") return payload.solutions;
  return payload.solutions.filter(sol => sol.label === activeFilter);
}

function init() {
  payload = getPayload();
  activeFilter = ["A", "B", "C"].includes(["A","B","C"][Math.max(0, (payload.focus || 1) - 1)]) ? ["A","B","C"][Math.max(0, (payload.focus || 1) - 1)] : "all";

  sideCanvas = document.getElementById("sideViewCanvas");
  topCanvas = document.getElementById("topViewCanvas");
  sideCtx = sideCanvas.getContext("2d");
  topCtx = topCanvas.getContext("2d");

  bindControls();
  populateSummary();
  populateSolutionCards();
  buildTimelineStrip();
  updateRecommendation();
  updateBriefBlock();
  syncFilterButtons();
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
  
// Zoom controls
const zoomModes = ['FAR','NORMAL','CLOSE'];
let zoomIndex = 1;

document.addEventListener('keydown', (e)=>{
  if(e.key === 'z'){
    zoomIndex = (zoomIndex+1)%3;
    zoomLevel = zoomModes[zoomIndex];
    render();
  }
});

document.getElementById("frameSlider").addEventListener("input", (e) => {

    setFrame(parseInt(e.target.value, 10));
  });

  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      activeFilter = btn.dataset.filter;
      syncFilterButtons();
      populateSolutionCards();
      updateRecommendation();
      updateBriefBlock();
      render();
    });
  });
}

function syncFilterButtons() {
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.filter === activeFilter);
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
  const sols = visibleSolutions();

  sols.forEach((sol, idx) => {
    const cls = sol.label === "B" ? "b" : sol.label === "C" ? "c" : "a";
    const standOffEstimate = Math.max(0, payload.targetRangeMeters + Math.max(0, sol.centerError));
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
      <div class="metric"><span class="k">EFFECT ON TARGET</span><span class="v">${(sol.tnt * sol.salvo).toFixed(0)} TNT EQ</span></div>
      <div class="metric"><span class="k">RELEASE / STANDOFF</span><span class="v">${standOffEstimate.toFixed(0)} m</span></div>
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

function scoreSolution(sol) {
  let score = 0;
  if (sol.result === "DIRECT HIT") score += 1000;
  else if (sol.result === "NEAR HIT") score += 750;
  else if (sol.result === "MARGINAL HIT") score += 300;
  else if (sol.result === "LONG" || sol.result === "SHORT") score += 150;
  else score += 0;

  score += (sol.tnt * sol.salvo) * 0.65;
  score += Math.max(0, payload.targetRangeMeters + Math.max(0, sol.centerError)) * 0.04;
  score -= sol.bestAbsError * 1.35;
  return score;
}

function updateRecommendation() {
  const sols = visibleSolutions();
  const valid = sols.filter((sol) => sol.result === "DIRECT HIT" || sol.result === "NEAR HIT");

  if (!valid.length) {
    const msg = "NO RECOMMENDED FIRING SOLUTION";
    const recEl = document.getElementById("recommendation");
    if (recEl) recEl.textContent = msg;

    const briefRec = document.getElementById("briefRecommended");
    if (briefRec) briefRec.textContent = "NONE";

    const briefTnt = document.getElementById("briefTnt");
    if (briefTnt) briefTnt.textContent = "0 TNT EQ";

    const briefStandoff = document.getElementById("briefStandoff");
    if (briefStandoff) briefStandoff.textContent = "N/A";
    return;
  }

  const ranked = [...valid].sort((a, b) => scoreSolution(b) - scoreSolution(a));
  const best = ranked[0];
  const tntOnTarget = (best.tnt * best.salvo).toFixed(0);
  const standOffEstimate = Math.max(0, payload.targetRangeMeters + Math.max(0, best.centerError)).toFixed(0);

  const recEl = document.getElementById("recommendation");
  if (recEl) {
    recEl.textContent =
      `RECOMMENDED SOLUTION: ${best.label} | ${best.weapon} | ${best.result} | EFFECT ON TARGET ${tntOnTarget} TNT EQ | EST. STANDOFF ${standOffEstimate}m`;
  }

  const briefRec = document.getElementById("briefRecommended");
  if (briefRec) briefRec.textContent = `${best.label} / ${best.result}`;

  const briefTnt = document.getElementById("briefTnt");
  if (briefTnt) briefTnt.textContent = `${tntOnTarget} TNT EQ`;

  const briefStandoff = document.getElementById("briefStandoff");
  if (briefStandoff) briefStandoff.textContent = `${standOffEstimate} M`;
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
      currentFrame = currentFrame >= TOTAL_FRAMES - 1 ? 0 : currentFrame + 1;
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
  const releaseY = 58 + (sol.id - 1) * 10;
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

  const groundY = h - 55;
  const targetX = w - 85;
  const releaseX = 55;
  const releaseY = 62;

  // ground
  sideCtx.strokeStyle = "rgba(0,255,65,0.35)";
  sideCtx.beginPath();
  sideCtx.moveTo(30, groundY);
  sideCtx.lineTo(w-30, groundY);
  sideCtx.stroke();

  // target line
  sideCtx.strokeStyle = "#ffd54a";
  sideCtx.beginPath();
  sideCtx.moveTo(targetX, 20);
  sideCtx.lineTo(targetX, groundY+8);
  sideCtx.stroke();

  visibleSolutions().forEach((sol)=>{
    const impactX = targetX + sol.centerError; // long/short offset
    const ctrlX = (releaseX + impactX)/2;
    const ctrlY = 20;

    // arc to actual impact
    sideCtx.strokeStyle = sol.color;
    sideCtx.beginPath();
    sideCtx.moveTo(releaseX, releaseY);
    sideCtx.quadraticCurveTo(ctrlX, ctrlY, impactX, groundY);
    sideCtx.stroke();

    // impact dot
    sideCtx.fillStyle = sol.color;
    sideCtx.beginPath();
    sideCtx.arc(impactX, groundY, 4.5, 0, Math.PI*2);
    sideCtx.fill();

    // error indicator
    sideCtx.strokeStyle = "#ff5555";
    sideCtx.beginPath();
    sideCtx.moveTo(targetX, groundY+14);
    sideCtx.lineTo(impactX, groundY+14);
    sideCtx.stroke();

    sideCtx.fillStyle = "#ff5555";
    const tag = sol.centerError > 0 ? "LONG" : "SHORT";
    sideCtx.fillText(tag + " " + Math.abs(sol.centerError).toFixed(0) + "m", (targetX+impactX)/2 - 20, groundY+28);
  });
}



function renderTopView() {
  const w = topCanvas.clientWidth;
  const h = topCanvas.clientHeight;

  topCtx.clearRect(0, 0, w, h);
  topCtx.fillStyle = "rgba(0,0,0,0.2)";
  topCtx.fillRect(0, 0, w, h);

  drawGrid(topCtx, w, h, 52, 0.13);

  const cx = w/2;
  const cy = h/2;

  let scale = 0.25;
  if (zoomLevel === 'FAR') scale = 0.15;
  if (zoomLevel === 'NORMAL') scale = 0.35;
  if (zoomLevel === 'CLOSE') scale = 0.6;

  // draw jet at top (release point)
  const jetY = 40;
  topCtx.fillStyle = "#00ff41";
  topCtx.beginPath();
  topCtx.moveTo(cx-8, jetY+8);
  topCtx.lineTo(cx+8, jetY+8);
  topCtx.lineTo(cx, jetY-8);
  topCtx.closePath();
  topCtx.fill();

  // target X
  topCtx.strokeStyle = "#ffd54a";
  topCtx.beginPath();
  topCtx.moveTo(cx-10, cy-10);
  topCtx.lineTo(cx+10, cy+10);
  topCtx.moveTo(cx+10, cy-10);
  topCtx.lineTo(cx-10, cy+10);
  topCtx.stroke();

  visibleSolutions().forEach((sol)=>{
    let error = sol.centerError;

    // GBU guidance tightening
    if(sol.smart){
      error *= 0.5;
    }

    const baseY = cy + (error * scale);
    const count = sol.salvo || 1;
    const spacing = (sol.patternLength || 40) * scale / Math.max(count-1,1);

    for(let i=0;i<count;i++){
      const offset = (i - (count-1)/2) * spacing;
      const impactX = cx;
      const impactY = baseY + offset;

      topCtx.fillStyle = sol.color;
      topCtx.beginPath();
      topCtx.arc(impactX, impactY, 3, 0, Math.PI*2);
      topCtx.fill();

      if (zoomLevel === 'CLOSE'){
        topCtx.globalAlpha = 0.25;
        topCtx.beginPath();
        topCtx.arc(impactX, impactY, sol.blastRadius * scale * 0.4, 0, Math.PI*2);
        topCtx.stroke();
        topCtx.globalAlpha = 1;
      }
    }
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


function updateBriefBlock() {
  const sols = visibleSolutions();
  const valid = sols.filter((sol) => sol.result === "DIRECT HIT" || sol.result === "NEAR HIT");

  document.getElementById("briefFilter").textContent = activeFilter === "all" ? "ALL" : activeFilter;
  document.getElementById("briefPrimary").textContent = ["A","B","C"][Math.max(0, (payload.focus || 1) - 1)] || "A";

  if (!valid.length) {
    document.getElementById("briefRecommended").textContent = "NONE";
    document.getElementById("briefTnt").textContent = "0 TNT EQ";
    document.getElementById("briefStandoff").textContent = "N/A";
    return;
  }

  const ranked = [...valid].sort((a, b) => scoreSolution(b) - scoreSolution(a));
  const best = ranked[0];
  const tntOnTarget = (best.tnt * best.salvo).toFixed(0);
  const standOffEstimate = Math.max(0, payload.targetRangeMeters + Math.max(0, best.centerError)).toFixed(0);

  document.getElementById("briefRecommended").textContent = `${best.label} / ${best.result}`;
  document.getElementById("briefTnt").textContent = `${tntOnTarget} TNT EQ`;
  document.getElementById("briefStandoff").textContent = `${standOffEstimate} M`;
}
