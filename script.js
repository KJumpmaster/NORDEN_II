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

function init() {
  const countryEl = document.getElementById("country");
  COUNTRIES.forEach(c => {
    countryEl.innerHTML += `<option value="${c.id}">${c.name}</option>`;
  });

  [1,2,3].forEach(i => {
    const bombEl = document.getElementById("bomb" + i);
    const salvoEl = document.getElementById("salvo" + i);

    BOMBS.forEach(b => {
      bombEl.innerHTML += `<option value="${b.id}">${b.name}</option>`;
    });

    [1,2,4,6,8].forEach(v => {
      salvoEl.innerHTML += `<option value="${v}">SALVO ${v}</option>`;
    });
  });

  loadCountry();
  updateFocus();
  [1,2,3].forEach(syncSolution);

  const video = document.getElementById("radarVideo");
  video.onerror = () => { video.style.display = "none"; };
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
  updateFlag();
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

function updateFlag() {
  const countryId = document.getElementById("country").value;
  const country = COUNTRIES.find(c => c.id === countryId);
  const flag = document.getElementById("flag");

  if (!country) return;

  flag.onerror = () => { flag.style.display = "none"; };
  flag.onload = () => { flag.style.display = "block"; };
  flag.src = country.flag;
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

function solve() {
  clampSpeed();

  const alt = parseFloat(document.getElementById("alt").value || "0") * 0.3048;
  const spd = parseFloat(document.getElementById("spd").value || "0") * 0.447;
  const dive = parseFloat(document.getElementById("dive").value || "0") * Math.PI / 180;
  const distTarget = parseFloat(document.getElementById("dist").value || "0");

  const focus = document.getElementById("focus").value;
  const bomb = getBombBySelect(focus);
  const salvo = parseInt(document.getElementById("salvo" + focus).value, 10);

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
  if (bestAbsError <= blast) result = "HIT";
  else if (bestAbsError <= blast * 1.75) result = "NEAR HIT";
  else if (avgError > 0) result = "LONG";
  else result = "SHORT";

  document.getElementById("res").textContent =
    `${result} | CENTER ERR: ${centerError.toFixed(0)}m | BEST: ${bestAbsError.toFixed(0)}m | TOF: ${t.toFixed(1)}s`;

  document.getElementById("pattern").textContent =
    `SALVO ${salvo} | PATTERN ${patternLength.toFixed(0)}m | FORE ${fore.toFixed(0)}m | AFT ${Math.abs(aft).toFixed(0)}m`;
}

function applySalvo() {
  document.getElementById("focusStatus").textContent = document.getElementById("focusStatus").textContent;
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
