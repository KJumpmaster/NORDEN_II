// --- NORDEN II: TACTICAL CONTROL LOGIC ---
let registry = {};

// 1. DATA LINK
fetch('aircraft_registry.json')
    .then(res => res.json())
    .then(data => {
        registry = data;
        console.log("Systems Online: Data Handshake Successful.");
    });

// 2. AIRCRAFT & WEAPON LOADERS (Same as before)
function updateAircraftMenu() {
    const nation = document.getElementById('nation-select').value;
    const acSel = document.getElementById('aircraft-select');
    acSel.innerHTML = '<option value="">-- SELECT AIRFRAME --</option>';
    if (registry[nation]) {
        registry[nation].forEach((ac, index) => {
            let opt = document.createElement('option');
            opt.value = index;
            opt.innerHTML = ac.aircraft_ID;
            acSel.appendChild(opt);
        });
    }
}

function updateWeaponMenu() {
    const nation = document.getElementById('nation-select').value;
    const acIndex = document.getElementById('aircraft-select').value;
    const bombSel = document.getElementById('bombA-select');
    bombSel.innerHTML = '<option value="">-- SELECT MUNITION --</option>';

    if (nation && acIndex !== "") {
        const selectedPlane = registry[nation][acIndex];
        selectedPlane.loadout.forEach(bomb => {
            let opt = document.createElement('option');
            // We pass the Physics Data as the value
            opt.value = JSON.stringify({cx: bomb.drag_cx, cal: bomb.caliber_m});
            opt.innerHTML = bomb.bomb_name;
            bombSel.appendChild(opt);
        });
    }
}

// 3. THE PHYSICS ENGINE (NORDEN II BALLISTICS)
function runSimulation() {
    // A. Gather Inputs from your UI
    const altitude = parseFloat(document.getElementById('alt-input').value);
    const speedKmh = parseFloat(document.getElementById('speed-input').value);
    const diveAngle = parseFloat(document.getElementById('dive-input').value);
    const bombData = JSON.parse(document.getElementById('bombA-select').value);

    // B. Convert Speed to Meters per Second (m/s)
    const speedMs = speedKmh / 3.6;

    // C. Calculate CdA (Drag Area)
    const radius = bombData.cal / 2;
    const area = Math.PI * Math.pow(radius, 2);
    const cda = (area * bombData.cx).toFixed(6);

    // D. Display the Result
    document.getElementById('cda-display').innerText = cda;

    console.log(`BOMBS AWAY: Alt ${altitude}m, Spd ${speedMs.toFixed(2)}m/s, CdA ${cda}`);
    alert(`CALCULATION COMPLETE\nRelease Velocity: ${speedMs.toFixed(2)} m/s\nDrag Area (CdA): ${cda}`);
}

// 4. MASTER ARM
function toggleMasterArm() {
    const isArmed = document.getElementById('master-arm').checked;
    document.getElementById('run-sim').disabled = !isArmed;
    document.getElementById('systemStatus').innerText = isArmed ? "SYSTEM HOT" : "SYSTEM SAFE";
    document.getElementById('systemStatus').style.color = isArmed ? "#FF0000" : "#00FF41";
}
