let registry = {};

// 1. INITIALIZE DATA LINK
fetch('aircraft_registry.json')
    .then(res => res.json())
    .then(data => {
        registry = data;
        console.log("Registry Loaded.");
    })
    .catch(err => console.error("Critical Failure:", err));

// 2. LOAD AIRCRAFT
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
        document.getElementById('advisory-display').innerText = "THEATER ONLINE. SELECT AIRFRAME.";
    }
}

// 3. LOAD WEAPONS & ACTIVATE REAL-TIME CdA
function updateWeaponMenu() {
    const nation = document.getElementById('nation-select').value;
    const acIndex = document.getElementById('aircraft-select').value;
    const bombSel = document.getElementById('bombA-select');
    const cdaDisplay = document.getElementById('cda-display');

    bombSel.innerHTML = '<option value="">-- SELECT MUNITION --</option>';

    if (nation && acIndex !== "") {
        const selectedPlane = registry[nation][acIndex];
        selectedPlane.loadout.forEach(bomb => {
            let opt = document.createElement('option');
            opt.value = JSON.stringify({cx: bomb.drag_cx, cal: bomb.caliber_m});
            opt.innerHTML = bomb.bomb_name;
            bombSel.appendChild(opt);
        });
        
        document.getElementById('advisory-display').innerText = "AIRFRAME CONFIGURED. SELECT LOADOUT.";

        // Real-time CdA listener
        bombSel.onchange = function() {
            if (this.value) {
                const data = JSON.parse(this.value);
                const radius = data.cal / 2;
                const area = Math.PI * Math.pow(radius, 2);
                const cda = (area * data.cx).toFixed(6);
                cdaDisplay.innerText = cda;
                document.getElementById('advisory-display').innerText = "BALLISTICS DATA READY: CdA " + cda;
            } else {
                cdaDisplay.innerText = "0.000000";
            }
        };
    }
}

// 4. PHYSICS ENGINE SIMULATION
function runSimulation() {
    const speedKmh = parseFloat(document.getElementById('speed-input').value);
    const bombVal = document.getElementById('bombA-select').value;
    
    if(!bombVal) {
        document.getElementById('advisory-display').innerText = "ERROR: NO MUNITION SELECTED";
        return;
    }

    const bombData = JSON.parse(bombVal);
    const speedMs = speedKmh / 3.6;
    
    // Placeholder logic for future ABE math integration
    document.getElementById('advisory-display').innerText = "BOMBS AWAY! RUNNING TRAJECTORY ANALYSIS.";
    document.getElementById('toa-out').innerText = "14.2s";
    document.getElementById('imp-vel').innerText = (speedMs * 1.5).toFixed(1) + " M/S";
    document.getElementById('margin-out').innerText = "± 10M";
}

// 5. MASTER ARM SYSTEM
function toggleMasterArm() {
    const isArmed = document.getElementById('master-arm').checked;
    const simBtn = document.getElementById('run-sim');
    const status = document.getElementById('systemStatus');
    const advisory = document.getElementById('advisory-display');

    simBtn.disabled = !isArmed;
    status.innerText = isArmed ? "SYSTEM HOT" : "SAFE";
    status.style.color = isArmed ? "#FF0000" : "#00FF41";
    advisory.innerText = isArmed ? "WEAPONS LIVE. STANDBY FOR RELEASE." : "SYSTEMS INHIBITED.";
}
