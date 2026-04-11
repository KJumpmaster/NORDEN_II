let registry = {};

fetch('aircraft_registry.json').then(res => res.json()).then(data => { registry = data; });

function updateAircraftMenu() {
    const nation = document.getElementById('nation-select').value;
    const acSel = document.getElementById('aircraft-select');
    acSel.innerHTML = '<option value="">-- SELECT --</option>';
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
    const cdaDisp = document.getElementById('cda-display');
    bombSel.innerHTML = '<option value="">-- SELECT --</option>';

    if (nation && acIndex !== "") {
        const selectedPlane = registry[nation][acIndex];
        selectedPlane.loadout.forEach(bomb => {
            let opt = document.createElement('option');
            opt.value = JSON.stringify({cx: bomb.drag_cx, cal: bomb.caliber_m, tnt: bomb.tnt_kg});
            opt.innerHTML = bomb.bomb_name;
            bombSel.appendChild(opt);
        });
        
        bombSel.onchange = function() {
            if (this.value) {
                const data = JSON.parse(this.value);
                const area = Math.PI * Math.pow(data.cal / 2, 2);
                cdaDisp.innerText = (area * data.cx).toFixed(6);
            }
        };
    }
}

// THE UPDATED CALCULATOR WITH OVERSPEED CHECK
function runSimulation() {
    const nation = document.getElementById('nation-select').value;
    const acIndex = document.getElementById('aircraft-select').value;
    const speedKmh = parseFloat(document.getElementById('speed-input').value);
    const advisory = document.getElementById('advisory-display');
    const warning = document.getElementById('overspeed-warning');
    
    // 1. DATA VALIDATION
    if (!nation || acIndex === "") return alert("SELECT AIRCRAFT FIRST");
    const selectedPlane = registry[nation][acIndex];

    // 2. CHECK FIRE: OVERSPEED LOGIC
    if (speedKmh > selectedPlane.max_speed_kmh) {
        warning.style.display = 'block';
        advisory.innerText = "CHECK FIRE: AIRSPEED EXCEEDS VNE (NEVER EXCEED SPEED)";
        advisory.style.color = "#FF0000";
        return; // HALT THE CALCULATION
    } else {
        warning.style.display = 'none';
        advisory.style.color = "#ffa500"; // Reset to tactical orange
    }

    const bombVal = document.getElementById('bombA-select').value;
    if(!bombVal) return alert("SELECT MUNITION");

    const bombData = JSON.parse(bombVal);
    const cda = parseFloat(document.getElementById('cda-display').innerText);
    const alt = parseFloat(document.getElementById('alt-input').value);
    const diveDeg = parseFloat(document.getElementById('dive-input').value);
    const targetDist = parseFloat(document.getElementById('tgt-input').value);

    let y = alt, x = 0, t = 0;
    const dt = 0.01, g = 9.80665;
    const angleRad = diveDeg * (Math.PI / 180);
    let vx = (speedKmh / 3.6) * Math.cos(angleRad);
    let vy = -(speedKmh / 3.6) * Math.sin(angleRad); 

    while (y > 0 && t < 150) {
        let rho = 1.225 * Math.pow((1 - 0.0000225577 * y), 4.25588);
        let vTotal = Math.sqrt(vx*vx + vy*vy);
        let dragForce = 0.5 * rho * vTotal * vTotal * cda;
        vx += (-(dragForce * (vx / vTotal))) * dt;
        vy += (-g - (dragForce * (vy / vTotal))) * dt;
        y += vy * dt;
        x += vx * dt;
        t += dt;
    }

    const blastRadius = 3.5 * Math.pow(bombData.tnt, 1/3);
    const margin = Math.abs(x - targetDist);
    
    if (margin < 2) advisory.innerText = "DIRECT HIT - SHACK!";
    else if (margin <= blastRadius) advisory.innerText = "TARGET NEUTRALIZED (BLAST)";
    else advisory.innerText = "MISSION FAILURE - OUTSIDE RADIUS";

    document.getElementById('results-table').style.display = 'table';
    document.getElementById('toa-val').innerText = t.toFixed(2);
    document.getElementById('vel-val').innerText = (Math.sqrt(vx*vx + vy*vy) * 3.6).toFixed(0);
    document.getElementById('dist-val').innerText = x.toFixed(0);
    document.getElementById('margin-val').innerText = blastRadius.toFixed(1) + " METERS";
}

function toggleMasterArm() {
    const isArmed = document.getElementById('master-arm').checked;
    document.getElementById('run-sim').disabled = !isArmed;
    document.getElementById('systemStatus').innerText = isArmed ? "HOT" : "SAFE";
    document.getElementById('systemStatus').style.color = isArmed ? "#FF0000" : "#00FF41";
}
