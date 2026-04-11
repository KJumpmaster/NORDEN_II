/* GE3M V8.0 - TACTICAL COMMAND CENTER ENGINE */

const BOMB_LIST = [
    { id: "mk82", name: "Mk 82", tnt: 118 },
    { id: "mk84", name: "Mk 84", tnt: 428 },
    { id: "fab500", name: "FAB-500", tnt: 213 }
];

function applyFilters() {
    ['bomb-1', 'bomb-2', 'bomb-3'].forEach(sID => {
        const el = document.getElementById(sID);
        el.innerHTML = '<option value="">-- SELECT MUNITION --</option>';
        BOMB_LIST.forEach(b => el.innerHTML += `<option value="${b.id}">${b.name}</option>`);
    });
}

function syncSlot(num) {
    const bombID = document.getElementById(`bomb-${num}`).value;
    const bomb = BOMB_LIST.find(b => b.id === bombID);
    if (bomb) document.getElementById(`tnt-${num}`).value = bomb.tnt;
    updateAllSlots();
}

function updateAllSlots() {
    const alt = parseFloat(document.getElementById('alt-input').value) || 0;
    const speedMPH = parseFloat(document.getElementById('speed-input').value) || 0;
    const dive = parseFloat(document.getElementById('dive-input').value) || 0;

    for (let i = 1; i <= 3; i++) {
        const tnt = parseFloat(document.getElementById(`tnt-${i}`).value) || 0;
        
        // BLAST RADIUS
        const blast = Math.round(Math.pow(tnt, 1/3) * 15);
        document.getElementById(`blast-${i}`).value = blast + "m";
        
        // TARGET DISTANCE (Horizontal Glide)
        const speedMPS = speedMPH * 0.44704;
        const altM = alt * 0.3048;
        const time = Math.sqrt((2 * altM) / 9.81);
        const trail = Math.round(speedMPS * time * Math.cos(dive * Math.PI / 180));
        document.getElementById(`dist-${i}`).value = trail + "m Glide";
    }
}

function toggleGuard() {
    const g = document.getElementById('switch-guard');
    const btn = document.getElementById('physical-switch');
    const light = document.getElementById('status-light');
    g.classList.toggle('guard-open');
    btn.disabled = !g.classList.contains('guard-open');
    if (btn.disabled) { light.className = 'light-off'; btn.innerText = "OFF"; }
    else { light.className = 'light-caution'; }
}

function toggleMasterArm() {
    const btn = document.getElementById('physical-switch');
    const light = document.getElementById('status-light');
    if (btn.innerText === "OFF") { btn.innerText = "ARMED"; light.className = 'light-danger'; }
    else { btn.innerText = "OFF"; light.className = 'light-caution'; }
}

function runPhysics() {
    if (document.getElementById('physical-switch').innerText !== "ARMED") { 
        alert("CRITICAL ERROR: MASTER ARM MUST BE ENGAGED"); return; 
    }
    const alt = document.getElementById('alt-input').value;
    const flightTime = Math.sqrt((2 * (alt * 0.3048)) / 9.81);
    
    // LIGHT PYLONS BASED ON SALVO
    const qty = document.getElementById('salvo-select').value;
    const pNodes = document.querySelectorAll('.pylon-node');
    pNodes.forEach(p => p.classList.remove('pylon-active'));
    
    if (qty === "1") { document.getElementById('py-5').classList.add('pylon-active'); }
    else if (qty === "4") { [3,4,6,7].forEach(n => document.getElementById(`py-${n}`).classList.add('pylon-active')); }
    else { [1,2,3,4,5,6,7,8,9].forEach(n => document.getElementById(`py-${n}`).classList.add('pylon-active')); }

    document.getElementById('mission-readout').innerHTML = `
        <div style="border:2px solid #00FF41; padding:10px; background:rgba(0,0,0,0.5);">
            SOLUTION CALCULATED: READY FOR DROP<br>
            <button onclick="executeRelease(${flightTime})" id="final-pickle" style="background:red; color:white; width:100%; margin-top:10px; font-weight:bold;">!!! EXECUTE FOCUS RELEASE !!!</button>
        </div>`;
}

function executeRelease(flightTime) {
    let timeLeft = flightTime;
    const readout = document.getElementById('mission-readout');
    const timer = setInterval(() => {
        timeLeft -= 0.4; 
        if (timeLeft <= 0) {
            clearInterval(timer);
            document.getElementById('cockpit-body').classList.add('combat-flash');
            setTimeout(() => { document.getElementById('cockpit-body').classList.remove('combat-flash'); }, 150);
            readout.innerHTML = "<h3 style='color:red;'>MISSION SUCCESS: IMPACT CONFIRMED</h3>";
        } else {
            readout.innerHTML = `<h1 style="font-size: 2.5em; color:red; text-shadow: 0 0 10px red;">TOF: ${timeLeft.toFixed(1)}s</h1>`;
        }
    }, 100);
}

window.onload = applyFilters;
