const COUNTRIES = [
  { id: "usa", name: "USA", flag: "flag_usa.png" },
  { id: "britain", name: "Britain", flag: "flag_britain.png" },
  { id: "ussr", name: "USSR", flag: "flag_ussr.png" }
];

const AIRCRAFT = [
  { id: "b52", name: "B-52H", country: "usa", maxSpeed: 650, defaultSpeed: 520, laser: false, ccrp: true },
  { id: "a10", name: "A-10A", country: "usa", maxSpeed: 439, defaultSpeed: 350, laser: true, ccrp: true },
  { id: "bucc", name: "Buccaneer S.2", country: "britain", maxSpeed: 667, defaultSpeed: 500, laser: false, ccrp: true },
  { id: "su25", name: "Su-25", country: "ussr", maxSpeed: 590, defaultSpeed: 420, laser: true, ccrp: true }
];

const BOMBS = [
  { id: "mk82", name: "Mk 82", tnt: 118, drag: 1.0, smart: false },
  { id: "mk84", name: "Mk 84", tnt: 428, drag: 1.3, smart: false },
  { id: "fab500", name: "FAB-500", tnt: 213, drag: 1.1, smart: false },
  { id: "gbu12", name: "GBU-12", tnt: 87, drag: 1.15, smart: true },
  { id: "gbu10", name: "GBU-10", tnt: 428, drag: 1.35, smart: true }
];

let fireTimerIds = [];
let armedSolution = null;

function init() {
  const countryEl = document.getElementById("country");
  COUNTRIES.forEach(c => {
    countryEl.innerHTML += `<option value="${c.id}">${c.name}</option>`;
  });

  [1, 2, 3].forEach(i => {
    const bombEl = document.getElementById("bomb" + i);
    const salvoEl = document.getElementById("salvo" + i);

    BOMBS.forEach(b => {
      bombEl.innerHTML += `<option value="${b.id}">${b.name}</option>`;
    });

    [1, 2, 4, 6, 8].forEach(v => {
      salvoEl.innerHTML += `<option value="${v}">SALVO ${v}</option>`;
    });
  });

  loadCountry();
  updateFocus();
  [1, 2, 3].forEach(syncSolution);

  const video = document.getElementById("radarVideo");
  if (video) {
    video.onerror = () => { video.style.display = "none"; };
  }

  resetReleaseOverlay();
}

function loadCountry() {
  const countryId = document.getElementById("country").value;
  const acEl = document.getElementById("ac");
  acEl.innerHTML = "";

  AIRCRAFT
    .filter(ac => ac.country === countryId)
    .forEach(ac => {
      acEl.innerHTML += `<option value="${ac.id}">${ac.name}</option>`;
    });

  loadAircraft();
}

function loadAircraft() {
  const ac = getSelectedAircraft();
  const spd = document.getElementById("spd");
  const adv = document.getElementById("adv");
  if (!ac) return;

  spd.value = ac.defaultSpeed;
  spd.dataset.max = ac.maxSpeed;
  adv.textContent = "AIRFRAME LIMITS NOMINAL";

  document.getElementById("laser").textContent = `LASER: ${ac.laser ? "YES" : "NO"}`;
  document.getElementById("ccrp").textContent = `CCRP: ${ac.ccrp ? "YES" : "NO"}`;
}

function clampSpeed() {
  const spd = document.getElementById("spd");
  const max = parseFloat(spd.dataset.max || "0");
  const ac = getSelectedAircraft();
  if (!max || !ac) return;

  const value = parseFloat(spd.value || "0");
  if (value > max) {
    spd.value = max;
    document.getElementById("adv").textContent = `AIRCRAFT LIMIT: ${ac.name} MAX SPEED IS ${max} MPH — INPUT CLAMPED`;
  } else {
    document.getElementById("adv").textContent = "AIRFRAME LIMITS NOMINAL";
  }
}


function syncSolution(n) {
  const bomb = getBombBySelect(n);
  const salvo = parseInt(document.getElementById("salvo" + n).value, 10);
  const blast = Math.cbrt(bomb.tnt) * 15;
  const pattern = estimatePatternLength(salvo, blast);

  document.getElementById("out" + n).innerHTML =
    `TNT: ${bomb.tnt} | BLAST: ${blast.toFixed(0)}m<br>` +
    `SALVO: ${salvo} | PATTERN: ${pattern.toFixed(0)}m`;

  const ind = document.getElementById("smart-ind-" + n);
  if (bomb.smart) {
    ind.textContent = "SMART";
    ind.classList.add("smart");
  } else {
    ind.textContent = "STD";
    ind.classList.remove("smart");
  }

  updateSmartBadge();

  if (armedSolution === n) {
    previewArmedSolution(n);
  }
}

function updateSmartBadge() {
  const focus = document.getElementById("focus").value;
  const bomb = getBombBySelect(focus);
  const smart = document.getElementById("smart");

  if (bomb.smart) {
    smart.textContent = "SMART MUNITIONS: YES";
    smart.classList.remove("smart-off");
    smart.classList.add("smart-on");
  } else {
    smart.textContent = "SMART MUNITIONS: NO";
    smart.classList.remove("smart-on");
    smart.classList.add("smart-off");
  }
}

function updateFocus() {
  const value = document.getElementById("focus").value;
  const labels = { "1": "A", "2": "B", "3": "C" };
  document.getElementById("focusStatus").textContent = `ACTIVE SOLUTION: ${labels[value]}`;
  updateSmartBadge();
}

function calculateSolution(n) {
  clampSpeed();

  const alt = parseFloat(document.getElementById("alt").value || "0") * 0.3048;
  const spd = parseFloat(document.getElementById("spd").value || "0") * 0.447;
  const dive = parseFloat(document.getElementById("dive").value || "0") * Math.PI / 180;
  const distTarget = parseFloat(document.getElementById("dist").value || "0");

  const bomb = getBombBySelect(n);
  const salvo = parseInt(document.getElementById("salvo" + n).value, 10);

  let vx = spd * Math.cos(dive);
  let vy = spd * Math.sin(dive);
  let t = 0;
  let x = 0;
  let y = alt;
  const dt = 0.1;

  while (y > 0 && t < 120) {
    vx *= (1 - 0.01 * bomb.drag);
    vy -= 9.81 * dt;
    x += vx * dt;
    y += vy * dt;
    t += dt;
  }

  const centerError = x - distTarget;
  const blast = Math.cbrt(bomb.tnt) * 15;
  const spacing = Math.max(12, blast * 0.7);
  const impacts = buildSalvoOffsets(salvo, spacing).map(offset => centerError + offset);

  const bestAbsError = Math.min(...impacts.map(v => Math.abs(v)));
  const avgError = impacts.reduce((sum, v) => sum + v, 0) / impacts.length;
  const fore = Math.max(...impacts);
  const aft = Math.min(...impacts);
  const patternLength = fore - aft;

  let result = "MISS";
  if (bestAbsError <= blast) result = "DIRECT HIT";
  else if (bestAbsError <= blast * 1.75) result = "NEAR HIT";
  else if (avgError > 0) result = "LONG";
  else result = "SHORT";

  return {
    result,
    centerError,
    bestAbsError,
    tof: t,
    salvo,
    patternLength,
    fore,
    aft
  };
}

function solve() {
  const labels = { 1: "A", 2: "B", 3: "C" };
  const focus = parseInt(document.getElementById("focus").value, 10);
  let focused = null;

  [1, 2, 3].forEach(n => {
    const data = calculateSolution(n);
    const label = labels[n];

    document.getElementById(`out${label}_result`).textContent =
      `LONG / SHORT / HIT: ${data.result}`;
    document.getElementById(`out${label}_pattern`).textContent =
      `PATTERN LENGTH: ${data.patternLength.toFixed(0)}m`;
    document.getElementById(`out${label}_fore`).textContent =
      `FORE: ${data.fore.toFixed(0)}m`;
    document.getElementById(`out${label}_aft`).textContent =
      `AFT: ${Math.abs(data.aft).toFixed(0)}m`;

    if (n === focus) focused = data;
  });

  if (focused) {
    document.getElementById("res").textContent =
      `${focused.result} | CENTER ERR: ${focused.centerError.toFixed(0)}m | BEST: ${focused.bestAbsError.toFixed(0)}m | TOF: ${focused.tof.toFixed(1)}s`;

    document.getElementById("pattern").textContent =
      `SALVO ${focused.salvo} | PATTERN ${focused.patternLength.toFixed(0)}m | FORE ${focused.fore.toFixed(0)}m | AFT ${Math.abs(focused.aft).toFixed(0)}m`;
  }
}

function armLoad() {
  const solutionNumber = parseInt(document.getElementById("focus").value, 10);
  armedSolution = solutionNumber;
  previewArmedSolution(solutionNumber);
}

function previewArmedSolution(solutionNumber) {
  clearFireTimers();
  resetReleaseOverlay();

  const bomb = getBombBySelect(solutionNumber);
  const salvo = parseInt(document.getElementById("salvo" + solutionNumber).value, 10);
  const points = getReleasePointOrder(salvo);

  points.forEach(pointNum => {
    const el = getReleasePointEl(pointNum);
    if (el) el.classList.add("armed");
  });

  const labels = { 1: "A", 2: "B", 3: "C" };
  document.getElementById("releaseStatus").textContent =
    `ARMED ${labels[solutionNumber]} | ${bomb.name.toUpperCase()} | ${salvo} STATIONS`;
}

function fireSolution() {
  const solutionNumber = parseInt(document.getElementById("focus").value, 10);
  if (armedSolution !== solutionNumber) {
    document.getElementById("releaseStatus").textContent = "ARM LOAD REQUIRED BEFORE FIRE";
    return;
  }

  clearFireTimers();
  const bomb = getBombBySelect(solutionNumber);
  const salvo = parseInt(document.getElementById("salvo" + solutionNumber).value, 10);
  const points = getReleasePointOrder(salvo);
  const labels = { 1: "A", 2: "B", 3: "C" };

  document.getElementById("releaseStatus").textContent =
    `FIRING ${labels[solutionNumber]} | ${bomb.name.toUpperCase()} | ${salvo} AWAY`;

  points.forEach((pointNum, index) => {
    const fireStart = 180 * index;
    const fireEnd = fireStart + 230;
    const el = getReleasePointEl(pointNum);
    if (!el) return;

    fireTimerIds.push(setTimeout(() => {
      el.classList.remove("armed");
      el.classList.add("firing");
    }, fireStart));

    fireTimerIds.push(setTimeout(() => {
      el.classList.remove("firing");
      el.classList.add("spent");
    }, fireEnd));
  });

  fireTimerIds.push(setTimeout(() => {
    document.getElementById("releaseStatus").textContent =
      `RELEASE COMPLETE | ${bomb.name.toUpperCase()} | ${salvo} STATIONS SPENT`;
    armedSolution = null;
  }, 180 * points.length + 260));
}

function getReleasePointOrder(salvo) {
  const chains = {
    1: [4],
    2: [4, 5],
    4: [2, 3, 6, 7],
    6: [1, 2, 3, 6, 7, 8],
    8: [1, 2, 3, 4, 5, 6, 7, 8]
  };
  return chains[salvo] || [4];
}

function getReleasePointEl(pointNum) {
  return document.querySelector(`.release-point[data-point="${pointNum}"]`);
}

function clearFireTimers() {
  fireTimerIds.forEach(id => clearTimeout(id));
  fireTimerIds = [];
}

function resetReleaseOverlay() {
  document.querySelectorAll(".release-point").forEach(el => {
    el.classList.remove("armed", "firing", "spent");
  });
}

function estimatePatternLength(salvo, blast) {
  if (salvo <= 1) return blast * 0.5;
  return (salvo - 1) * (blast * 0.7);
}

function buildSalvoOffsets(salvo, spacing) {
  if (salvo <= 1) return [0];
  const offsets = [];
  const center = (salvo - 1) / 2;
  for (let i = 0; i < salvo; i++) {
    offsets.push((i - center) * spacing);
  }
  return offsets;
}

function getSelectedAircraft() {
  const id = document.getElementById("ac").value;
  return AIRCRAFT.find(ac => ac.id === id);
}

function getBombBySelect(n) {
  const id = document.getElementById("bomb" + n).value;
  return BOMBS.find(b => b.id === id) || BOMBS[0];
}

init();


function openMAC() {
  window.open("mac.html", "_blank");
}


function buildMACPayload() {
  const aircraft = getSelectedAircraft();
  const payload = {
    generatedAt: new Date().toISOString(),
    aircraft: aircraft ? aircraft.name : "UNKNOWN",
    country: document.getElementById("country")?.selectedOptions?.[0]?.textContent || "UNKNOWN",
    altitudeFeet: parseFloat(document.getElementById("alt").value || "0"),
    speedMph: parseFloat(document.getElementById("spd").value || "0"),
    diveDeg: parseFloat(document.getElementById("dive").value || "0"),
    targetRangeMeters: parseFloat(document.getElementById("dist").value || "0"),
    focus: parseInt(document.getElementById("focus").value || "1", 10),
    solutions: []
  };

  [1, 2, 3].forEach(n => {
    const bomb = getBombBySelect(n);
    const data = calculateSolution(n);
    payload.solutions.push({
      id: n,
      label: ["A", "B", "C"][n - 1],
      color: ["#00ff41", "#2f7cff", "#ff9a1f"][n - 1],
      weapon: bomb?.name || "UNKNOWN",
      tnt: bomb?.tnt || 0,
      drag: bomb?.drag || 0,
      smart: !!bomb?.smart,
      salvo: data.salvo,
      result: data.result,
      centerError: data.centerError,
      bestAbsError: data.bestAbsError,
      tof: data.tof,
      patternLength: data.patternLength,
      fore: data.fore,
      aft: data.aft,
      blastRadius: Math.cbrt((bomb?.tnt || 0)) * 15
    });
  });

  return payload;
}

function openMAC() {
  const payload = buildMACPayload();
  try {
    localStorage.setItem("macPayload", JSON.stringify(payload));
  } catch (err) {
    console.warn("Failed to store M.A.C. payload", err);
  }
  window.open("mac.html", "_blank");
}
