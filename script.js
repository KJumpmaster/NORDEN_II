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
            opt.value = JSON.stringify({cx: bomb.drag_cx, cal: bomb.caliber_m});
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

function runSimulation() {
    const alt = parseFloat(document.getElementById('alt-input').value);
    const speedKmh = parseFloat(document.getElementById('speed-input').value);
    const diveDeg = parseFloat(document.getElementById('dive-input').value);
    const targetDist = parseFloat(document.getElementById('tgt-input').value);
    const bombVal = document.getElementById('bombA-select').value;

    if(!bombVal) return alert("SELECT MUNITION");

    const cda = parseFloat(document.getElementById('cda-display').innerText);

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

    const margin = x - targetDist;
    const marginText = margin > 0 ? `OVERSHOT BY ${margin.toFixed(1)}` : `UNDERSHOT BY ${Math.abs(margin).toFixed(1)}`;

    document.getElementById('results-table').style.display = 'table';
    document.getElementById('toa-val').innerText = t.toFixed(2);
    document.getElementById('vel-val').innerText = (Math.sqrt(vx*vx + vy*vy) * 3.6).toFixed(0);
    document.getElementById('dist-val').innerText = x.toFixed(0);
    document.getElementById('margin-val').innerText = marginText;
    
    document.getElementById('advisory-display').innerText = (Math.abs(margin) < 15) ? "DIRECT HIT CONFIRMED!" : "IMPACT OUTSIDE MARGIN.";
}

function toggleMasterArm() {
    const isArmed = document.getElementById('master-arm').checked;
    document.getElementById('run-sim').disabled = !isArmed;
    document.getElementById('systemStatus').innerText = isArmed ? "HOT" : "SAFE";
    document.getElementById('systemStatus').style.color = isArmed ? "#FF0000" : "#00FF41";
}
