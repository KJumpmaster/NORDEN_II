const AC = [
  { name: "B52", speed: 520, maxSpeed: 650 },
  { name: "A10", speed: 350, maxSpeed: 439 }
];

const BOMBS = [
  { name: "MK82", tnt: 118, drag: 1.0 },
  { name: "MK84", tnt: 428, drag: 1.3 },
  { name: "FAB500", tnt: 213, drag: 1.1 }
];

function init() {
  const ac = document.getElementById("ac");
  AC.forEach(a => ac.innerHTML += `<option>${a.name}</option>`);

  [1, 2, 3].forEach(i => {
    const b = document.getElementById("bomb" + i);
    BOMBS.forEach(x => b.innerHTML += `<option>${x.name}</option>`);
  });

  loadAC();
  [1, 2, 3].forEach(sync);
}

function loadAC() {
  const index = document.getElementById("ac").selectedIndex;
  const ac = AC[index];
  const spd = document.getElementById("spd");

  spd.value = ac.speed;
  spd.max = ac.maxSpeed;
  spd.dataset.max = ac.maxSpeed;
}

function clampSpeed() {
  const spd = document.getElementById("spd");
  const max = parseFloat(spd.dataset.max);

  if (!max) return;

  const val = parseFloat(spd.value);
  if (Number.isFinite(val) && val > max) {
    spd.value = max;
    spd.style.borderColor = "red";
    setTimeout(() => spd.style.borderColor = "#333", 400);
  }
}

function sync(n) {
  updatePreview(n);
}

function updatePreview(n) {
  const bomb = BOMBS[document.getElementById("bomb" + n).selectedIndex];
  const salvo = parseInt(document.getElementById("salvo" + n).value, 10);
  const blast = Math.cbrt(bomb.tnt) * 15;
  const pattern = estimatePatternLength(salvo, blast);

  document.getElementById("out" + n).innerHTML =
    `TNT: ${bomb.tnt} | BLAST: ${blast.toFixed(0)}m<br>` +
    `SALVO: ${salvo} | PATTERN: ${pattern.toFixed(0)}m`;
}

function estimatePatternLength(salvo, blast) {
  if (salvo <= 1) return blast * 0.5;
  return (salvo - 1) * (blast * 0.7);
}

function getFocusedBomb() {
  const focus = document.getElementById("focus").value;
  const bomb = BOMBS[document.getElementById("bomb" + focus).selectedIndex];
  const salvo = parseInt(document.getElementById("salvo" + focus).value, 10);
  return { focus, bomb, salvo };
}

function solve() {
  clampSpeed();

  const alt = parseFloat(document.getElementById("alt").value || 0) * 0.3048;
  const spd = parseFloat(document.getElementById("spd").value || 0) * 0.447;
  const dive = parseFloat(document.getElementById("dive").value || 0) * Math.PI / 180;
  const distTarget = parseFloat(document.getElementById("dist").value || 0) * 1000;

  const { focus, bomb, salvo } = getFocusedBomb();

  let vx = spd * Math.cos(dive);
  let vy = spd * Math.sin(dive);

  let t = 0;
  let x = 0;
  let y = alt;
  const dt = 0.1;

  while (y > 0 && t < 120) {
    const drag = bomb.drag;
    vx *= (1 - 0.01 * drag);
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
  let klass = "bad";

  if (bestAbsError <= blast) {
    result = "HIT";
    klass = "good";
  } else if (bestAbsError <= blast * 1.75) {
    result = "NEAR HIT";
    klass = "warn";
  } else if (avgError > 0) {
    result = "LONG";
    klass = "bad";
  } else {
    result = "SHORT";
    klass = "bad";
  }

  const impactWords = impacts
    .map((v, i) => {
      const tag = v > 0 ? "LONG" : (v < 0 ? "SHORT" : "ON");
      return `#${i + 1} ${tag} ${Math.abs(v).toFixed(0)}m`;
    })
    .join(" | ");

  document.getElementById("result").innerHTML =
    `<span class="${klass}">${result}</span> | FOCUS ${focus} | ` +
    `CENTER ERR: ${centerError.toFixed(0)}m | BEST: ${bestAbsError.toFixed(0)}m | TOF: ${t.toFixed(1)}s`;

  document.getElementById("pattern").innerHTML =
    `SALVO ${salvo} PATTERN ${patternLength.toFixed(0)}m | ` +
    `FORE ${fore.toFixed(0)}m | AFT ${Math.abs(aft).toFixed(0)}m | ${impactWords}`;
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

init();
