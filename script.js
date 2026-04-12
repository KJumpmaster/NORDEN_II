const AIRCRAFT = [
  { id: "b52", name: "B-52H", country: "usa", speed: 520, maxSpeed: 650, laserCapable: false, ccrpCapable: true },
  { id: "a10", name: "A-10A", country: "usa", speed: 350, maxSpeed: 439, laserCapable: true, ccrpCapable: true },
  { id: "su25", name: "Su-25", country: "ussr", speed: 420, maxSpeed: 590, laserCapable: true, ccrpCapable: true },
  { id: "buccaneer", name: "Buccaneer S.2", country: "britain", speed: 500, maxSpeed: 667, laserCapable: false, ccrpCapable: true }
];

const COUNTRIES = [
  { id: "usa", name: "USA" },
  { id: "britain", name: "Britain" },
  { id: "ussr", name: "USSR" }
];

const BOMBS = [
  { id: "mk82", name: "Mk 82", tnt: 118, drag: 1.0, smart: false },
  { id: "mk84", name: "Mk 84", tnt: 428, drag: 1.3, smart: false },
  { id: "fab500", name: "FAB-500", tnt: 213, drag: 1.1, smart: false },
  { id: "gbu12", name: "GBU-12", tnt: 87, drag: 1.15, smart: true },
  { id: "gbu10", name: "GBU-10", tnt: 428, drag: 1.35, smart: true }
];

function init() {
  const countrySel = document.getElementById("country");
  COUNTRIES.forEach(c => countrySel.innerHTML += `<option value="${c.id}">${c.name}</option>`);

  [1,2,3].forEach(i => {
    const bombSel = document.getElementById("bomb" + i);
    BOMBS.forEach(b => bombSel.innerHTML += `<option value="${b.id}">${b.name}</option>`);
  });

  loadCountry();
  updateFocus();
  [1,2,3].forEach(syncSolution);
}

function loadCountry() {
  const country = document.getElementById("country").value;
  const acSel = document.getElementById("ac");
  acSel.innerHTML = "";

  AIRCRAFT
    .filter(ac => ac.country === country)
    .forEach(ac => acSel.innerHTML += `<option value="${ac.id}">${ac.name}</option>`);

  loadAircraft();
  updateFlag();
}

function loadAircraft() {
  const ac = getSelectedAircraft();
  const spd = document.getElementById("spd");
  const adv = document.getElementById("speed-advisory");
  if (!ac) return;

  spd.value = ac.speed;
  spd.dataset.max = ac.maxSpeed;
  adv.textContent = "AIRFRAME LIMITS NOMINAL";
  updateCapabilities();
}

function clampSpeed() {
  const spd = document.getElementById("spd");
  const max = parseFloat(spd.dataset.max);
  const ac = getSelectedAircraft();
  const adv = document.getElementById("speed-advisory");
  if (!max || !ac) return;

  const val = parseFloat(spd.value);
  if (Number.isFinite(val) && val > max) {
    spd.value = max;
    adv.textContent = `AIRCRAFT LIMIT: ${ac.name} MAX SPEED IS ${max} MPH — INPUT CLAMPED`;
    spd.style.borderColor = "red";
    setTimeout(() => spd.style.borderColor = "#333", 450);
  } else {
    adv.textContent = "AIRFRAME LIMITS NOMINAL";
  }
}

function updateFlag() {
  const country = document.getElementById("country").value;
  const img = document.getElementById("country-flag");
  const fallback = document.getElementById("flag-fallback");
  const src = `flag_${country}.png`;

  img.onload = () => {
    img.style.display = "block";
    fallback.style.display = "none";
  };
  img.onerror = () => {
    img.style.display = "none";
    fallback.style.display = "flex";
    fallback.textContent = country.toUpperCase() + " FLAG";
  };
  img.src = src;
}

function updateCapabilities() {
  const ac = getSelectedAircraft();
  if (!ac) return;
  document.getElementById("badge-laser").textContent = `LASER: ${ac.laserCapable ? "YES" : "NO"}`;
  document.getElementById("badge-ccrp").textContent = `CCRP: ${ac.ccrpCapable ? "YES" : "NO"}`;
  updateSmartStatus();
}

function syncSolution(n) {
  const bomb = BOMBS.find(b => b.id === document.getElementById("bomb" + n).value) || BOMBS[0];
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
  updateSmartStatus();
}

function updateSmartStatus() {
  const focus = document.getElementById("focus").value;
  const bomb = BOMBS.find(b => b.id === document.getElementById("bomb" + focus).value) || BOMBS[0];
  const badge = document.getElementById("badge-smart");

  if (bomb.smart) {
    badge.textContent = "SMART MUNITIONS: LOADED";
    badge.classList.remove("smart-off");
    badge.classList.add("smart-on");
  } else {
    badge.textContent = "SMART MUNITIONS: NO";
    badge.classList.remove("smart-on");
    badge.classList.add("smart-off");
  }
}

function updateFocus() {
  const focus = document.getElementById("focus").value;
  document.getElementById("focus-status").textContent = `ACTIVE SOLUTION: ${["A","B","C"][focus - 1]}`;
  updateSmartStatus();
}

function estimatePatternLength(salvo, blast) {
  if (salvo <= 1) return blast * 0.5;
  return (salvo - 1) * (blast * 0.7);
}

function buildSalvoOffsets(salvo, spacing) {
  if (salvo <= 1) return [0];
  const offsets = [];
  const center = (salvo - 1) / 2;
  for (let i = 0; i < salvo; i++) offsets.push((i - center) * spacing);
  return offsets;
}

function solve() {
  clampSpeed();

  const alt = parseFloat(document.getElementById("alt").value || 0) * 0.3048;
  const spd = parseFloat(document.getElementById("spd").value || 0) * 0.447;
  const dive = parseFloat(document.getElementById("dive").value || 0) * Math.PI / 180;
  const distTarget = parseFloat(document.getElementById("dist").value || 0) * 1000;

  const focus = document.getElementById("focus").value;
  const bomb = BOMBS.find(b => b.id === document.getElementById("bomb" + focus).value) || BOMBS[0];
  const salvo = parseInt(document.getElementById("salvo" + focus).value, 10);

  let vx = spd * Math.cos(dive);
  let vy = spd * Math.sin(dive);
  let t = 0, x = 0, y = alt;
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
  const offsets = buildSalvoOffsets(salvo, spacing);
  const impacts = offsets.map(offset => centerError + offset);

  const bestAbsError = Math.min(...impacts.map(v => Math.abs(v)));
  const avgError = impacts.reduce((sum, v) => sum + v, 0) / impacts.length;
  const fore = Math.max(...impacts);
  const aft = Math.min(...impacts);
  const patternLength = fore - aft;

  let result = "MISS";
  if (bestAbsError <= blast) result = "HIT";
  else if (bestAbsError <= blast * 1.75) result = "NEAR HIT";
  else if (avgError > 0) result = "LONG";
  else result = "SHORT";

  document.getElementById("result").textContent =
    `${result} | CENTER ERR: ${centerError.toFixed(0)}m | BEST: ${bestAbsError.toFixed(0)}m | TOF: ${t.toFixed(1)}s`;

  document.getElementById("pattern").textContent =
    `SALVO ${salvo} | PATTERN ${patternLength.toFixed(0)}m | FORE ${fore.toFixed(0)}m | AFT ${Math.abs(aft).toFixed(0)}m`;
}

function applySalvo() {
  const focus = document.getElementById("focus").value;
  const salvo = parseInt(document.getElementById("salvo" + focus).value, 10);

  document.querySelectorAll(".pylon").forEach(p => p.classList.remove("active"));
  const order = ["p4","p5","p3","p6","p2","p7","p1","p8"];

  for (let i = 0; i < Math.min(salvo, order.length); i++) {
    document.getElementById(order[i]).classList.add("active");
  }
}

function getSelectedAircraft() {
  const id = document.getElementById("ac").value;
  return AIRCRAFT.find(ac => ac.id === id);
}

init();
