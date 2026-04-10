let registry = {};

fetch('aircraft_registry.json').then(res => res.json()).then(data => { registry = data; });

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
        document.getElementById('advisory-display').innerText = "THEATER DATA LOADED. SELECT AIRFRAME.";
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
            opt.value = JSON.stringify({cx: bomb.drag_cx, cal: bomb.caliber_m});
            opt.innerHTML = bomb.bomb_name;
            bombSel.appendChild(opt);
        });
        document.getElementById('advisory-display').innerText = "AIRFRAME CONFIGURED. SELECT LOADOUT.";
    }
}

function runSimulation() {
    const speedKmh = parseFloat(document.getElementById('speed-input').value);
    const bombVal = document.getElementById('bombA-select').value;
    
    if(!bombVal) {
        document.getElementById('advisory-display').innerText = "WARNING: NO MUNITION SELECTED";
        return;
    }

    const bombData = JSON.parse(bombVal);
    const radius = bombData.cal / 2;
    const area = Math.PI * Math.pow(radius, 2);
    const cda = (area * bombData.cx).toFixed(6);
    
    document.getElementById('cda-display').innerText = cda;
    document.getElementById('advisory-display').innerText = "CALCULATION COMPLETE. IMPACT COORDINATES GENERATED.";
    
    // Placeholder math for the footer
    document.getElementById('toa-out').innerText = "12.4s";
    document.getElementById('imp-vel').innerText = (speedKmh * 1.1).toFixed(0) + " KM/H";
    document.getElementById('margin-out').innerText = "± 12M";
}

function toggleMasterArm() {
    const isArmed = document.getElementById('master-arm').checked;
    document.getElementById('run-sim').disabled = !isArmed;
    document.getElementById('systemStatus').innerText = isArmed ? "HOT" : "SAFE";
    document.getElementById('systemStatus').style.color = isArmed ? "#FF0000" : "#00FF41";
    document.getElementById('advisory-display').innerText = isArmed ? "WEAPONS LIVE. READY TO RELEASE." : "SYSTEMS SAFE.";
}
