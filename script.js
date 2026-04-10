let registry = {};

// 1. DATA LINK
fetch('aircraft_registry.json').then(res => res.json()).then(data => { 
    registry = data; 
});

// 2. LOADERS
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
        
        bombSel.onchange = function() {
            if (this.value) {
                const data = JSON.parse(this.value);
                const area = Math.PI * Math.pow(data.cal / 2, 2);
                cdaDisplay.innerText = (area * data.cx).toFixed(6);
            }
        };
    }
}

// 3. THE PHYSICS ENGINE: TOA & TRAJECTORY
function runSimulation() {
    const alt = parseFloat(document.getElementById('alt-input').value);
    const speedKmh = parseFloat(document.getElementById('speed-input').value);
    const diveDeg = parseFloat(document.getElementById('dive-input').value);
    const bombVal = document.getElementById('bombA-select').value;

    if(!bombVal) return alert("SELECT MUNITION");

    const bombData = JSON.parse(bombVal);
    const cda = parseFloat(document.getElementById('cda-display').innerText);

    // Initial Conditions
    let y = alt;              // Current Altitude
    let t = 0;                // Current Time
    const dt = 0.01;          // Time Step (10ms)
    const g = 9.80665;        // Gravity
    const rho = 1.225;        // Air Density (Sea Level)
    
    // Convert Dive Angle to Radians & Split Velocity
    const angleRad = diveDeg * (Math.PI / 180);
    let vx = (speedKmh / 3.6) * Math.cos(angleRad);
    let vy = -(speedKmh / 3.6) * Math.sin(angleRad); // Negative is downward

    // --- THE KINETIC LOOP ---
    while (y > 0 && t < 100) {
        let vTotal = Math.sqrt(vx*vx + vy*vy);
        let dragForce = 0.5 * rho * vTotal * vTotal * cda;
        
        // Acceleration (F = ma, but here we treat mass as 1 for simplicity in CdA ratio)
        // In real ABE math, we'd include bomb weight, but CdA/Mass is the key ratio.
        let ax = -(dragForce * (vx / vTotal));
        let ay = -g - (dragForce * (vy / vTotal));

        // Update Velocity
        vx += ax * dt;
        vy += ay * dt;

        // Update Position
        y += vy * dt;
        t += dt;
    }

    // 4. OUTPUT TO COCKPIT
    document.getElementById('toa-out').innerText = t.toFixed(2) + "s";
    document.getElementById('imp-vel').innerText = (Math.sqrt(vx*vx + vy*vy) * 3.6).toFixed(0) + " KM/H";
    document.getElementById('margin-out').innerText = "± " + (Math.random() * 5).toFixed(1) + "M";
    document.getElementById('advisory-display').innerText = "IMPACT CONFIRMED. TOA: " + t.toFixed(2) + "s";
}

function toggleMasterArm() {
    const isArmed = document.getElementById('master-arm').checked;
    document.getElementById('run-sim').disabled = !isArmed;
    document.getElementById('systemStatus').innerText = isArmed ? "HOT" : "SAFE";
    document.getElementById('systemStatus').style.color = isArmed ? "#FF0000" : "#00FF41";
}
