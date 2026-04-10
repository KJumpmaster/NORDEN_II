// --- NORDEN II: MISSION DATA LINK ---
let registry = {};

// 1. BOOT SEQUENCE: Connect to GitHub Registry
fetch('aircraft_registry.json')
    .then(response => {
        if (!response.ok) throw new Error("Registry not found");
        return response.json();
    })
    .then(data => {
        registry = data;
        console.log("Systems Online: Data Handshake Successful.");
    })
    .catch(err => console.error("AVIONICS FAILURE:", err));

// 2. AIRCRAFT LOADER
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

// 3. WEAPON LOADER
function updateWeaponMenu() {
    const nation = document.getElementById('nation-select').value;
    const acIndex = document.getElementById('aircraft-select').value;
    const bombSel = document.getElementById('bombA-select');
    bombSel.innerHTML = '<option value="">-- SELECT MUNITION --</option>';

    if (nation && acIndex !== "") {
        const selectedPlane = registry[nation][acIndex];
        selectedPlane.loadout.forEach(bomb => {
            let opt = document.createElement('option');
            // Passes Physics Data as a string to the browser
            opt.value = JSON.stringify({cx: bomb.drag_cx, cal: bomb.caliber_m});
            opt.innerHTML = bomb.bomb_name;
            bombSel.appendChild(opt);
        });
    }
}

// 4. THE BALLISTICS COMPUTER (NORDEN II MATH)
function runSimulation() {
    try {
        const speedKmh = parseFloat(document.getElementById('speed-input').value);
        const bombData = JSON.parse(document.getElementById('bombA-select').value);

        // Convert Speed to m/s
        const speedMs = speedKmh / 3.6;

        // Calculate CdA: PI * r^2 * Cx
        const radius = bombData.cal / 2;
        const area = Math.PI * Math.pow(radius, 2);
        const cda = (area * bombData.cx).toFixed(6);

        // Output to Screen
        document.getElementById('cda-display').innerText = cda;

        console.log(`BOMBS AWAY: Velocity ${speedMs.toFixed(2)}m/s | CdA ${cda}`);
        alert(`CALCULATION COMPLETE\nRelease Velocity: ${speedMs.toFixed(2)} m/s\nDrag Area (CdA): ${cda}`);
    } catch (e) {
        alert("ERROR: Ensure a Munition is selected before dropping.");
    }
}

// 5. MASTER ARM
function toggleMasterArm() {
    const isArmed = document.getElementById('master-arm').checked;
    const simBtn = document.getElementById('run-sim');
    const status = document.getElementById('systemStatus');

    simBtn.disabled = !isArmed;
    status.innerText = isArmed ? "SYSTEM HOT" : "SAFE";
    status.style.color = isArmed ? "#FF0000" : "#00FF41";
}
