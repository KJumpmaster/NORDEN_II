/* GE3M ENGINE V2.4 - BLAST RADIUS & KINETICS */

const AC_LIST = [
    { id: "b52h", name: "B-52H STRATOFORTRESS", nation: "USA", speed: 520, maxSpeed: 650 },
    { id: "a10a", name: "A-10A THUNDERBOLT II", nation: "USA", speed: 350, maxSpeed: 450 },
    { id: "su25", name: "Su-25 FROGFOOT", nation: "USSR", speed: 420, maxSpeed: 600 }
];

const BOMB_LIST = [
    { id: "mk82", name: "Mk 82 (CCIP)", nation: "USA", type: "CCIP", cx: 0.012, mass: 227, tnt: 118 },
    { id: "gbu12", name: "GBU-12 (LASER)", nation: "USA", type: "LASER", cx: 0.014, mass: 230, tnt: 87 },
    { id: "fab500", name: "FAB-500 (CCIP)", nation: "USSR", type: "CCIP", cx: 0.015, mass: 500, tnt: 213 }
];

let flightTime = 0; 

function applyFilters() {
    const nation = document.getElementById('nation-select').value;
    const useCCIP = document.getElementById('ccip-toggle').checked;
    const useLaser = document.getElementById('laser-toggle').checked;
    const acSelect = document.getElementById('ac-select');
    acSelect.innerHTML = '<option value="">-- SELECT AIRFRAME --</option>';
    AC_LIST.filter(ac => nation === "ALL" || ac.nation === nation).forEach(ac => acSelect.innerHTML += `<option value="${ac.id}">${ac.name}</option>`);
    const bombSelect = document.getElementById('bomb-select');
    bombSelect.innerHTML = '<option value="">-- SELECT MUNITION --</option>';
    BOMB_LIST.filter(b => (nation === "ALL" || b.nation === nation) && ((b.type === "CCIP" && useCCIP) || (b.type === "LASER" && useLaser))).forEach(b => bombSelect.innerHTML += `<option value="${b.id}">${b.name}</option>`);
}

function loadAircraft() {
    const id = document.getElementById('ac-select').value;
    const ac = AC_LIST.find(a => a.id === id);
    if(ac) document.getElementById('speed-input').value = ac.speed;
}

function loadOrdnance() {
    const id = document.getElementById('bomb-select').value;
    const b = BOMB_LIST.find(bomb => bomb.id === id);
    if(b) {
        document.getElementById('tnt-input').value = b.tnt;
        document.getElementById('mass-input').value = b.mass;
        document.getElementById('drag-input').value = b.cx;
    }
}

function toggleGuard() {
    const guard = document.getElementById('switch-guard');
    const armBtn = document.getElementById('physical-switch');
    const light = document.getElementById('status-light');
    guard.classList.toggle('guard-open');
    if (guard.classList.contains('guard-open')) { armBtn.disabled = false; light.className = 'light-caution'; }
    else { armBtn.disabled = true; armBtn.innerText = "OFF"; light.className = 'light-off'; }
}

function toggleMasterArm() {
    const armBtn = document.getElementById('physical-switch');
    const light = document.getElementById('status-light');
    if (armBtn.innerText === "OFF") { armBtn.innerText = "ARMED"; light.className = 'light-danger'; }
    else { armBtn.innerText = "OFF"; light.className = 'light-caution'; }
}

function runPhysics() {
    const isArmed = document.getElementById('physical-switch').innerText === "ARMED";
    if (!isArmed) { alert("SYSTEM LOCKED: ENGAGE MASTER ARM"); return; }
    const acID = document.getElementById('ac-select').value;
    const speed = parseFloat(document.getElementById('speed-input').value);
    const ac = AC_LIST.find(a => a.id === acID);
    if (ac && speed > ac.maxSpeed) {
        alert(`AIRFRAME LIMIT EXCEEDED: ${ac.name} MAX SPEED IS ${ac.maxSpeed} MPH`);
        document.getElementById('speed-input').value = ac.maxSpeed;
        return;
    }

    const qty = document.getElementById('salvo-select').value;
    for (let i = 1; i <= 9; i++) document.getElementById(`py-${i}`).classList.remove('pylon-active');
    const map = {"1":[5], "2":[4,6], "4":[3,4,6,7], "8":[1,2,3,4,6,7,8,9]};
    map[qty].forEach(p => document.getElementById(`py-${p}`).classList.add('pylon-active'));

    const alt = document.getElementById('alt-input').value;
    const tnt = document.getElementById('tnt-input').value;
    flightTime = Math.sqrt((2 * (alt * 0.3048)) / 9.81);
    
    // BLAST RADIUS CALCULATION (Simplified cube root scaling)
    const radius = Math.round(Math.pow(tnt, 1/3) * 15);

    const readout = document.getElementById('mission-readout');
    readout.innerHTML = `
        <div style="border: 1px solid var(--terminal-green); padding: 10px;">
            SOLUTION CALCULATED: ${flightTime.toFixed(2)}s | TC: 4X<br>
            EST. BLAST RADIUS: <span style="color:white">${radius}m</span><br>
            <button id="final-pickle" onclick="executeRelease()">!!! EXECUTE RELEASE !!!</button>
        </div>
    `;
}

function executeRelease() {
    const readout = document.getElementById('mission-readout');
    let timeLeft = flightTime;
    const timer = setInterval(() => {
        timeLeft -= 0.4; 
        if (timeLeft <= 0) {
            clearInterval(timer);
            readout.innerHTML = "<h2 style='color:red; text-align:center;'>--- IMPACT CONFIRMED ---</h2>";
            for (let i = 1; i <= 9; i++) document.getElementById(`py-${i}`).classList.remove('pylon-active');
        } else {
            readout.innerHTML = `
                <div style="text-align:center;">
                    <p style="color:red; font-weight:bold;">WEAPONS AWAY</p>
                    <h1 style="font-size: 2.5em;">TOF: ${timeLeft.toFixed(1)}s</h1>
                </div>
            `;
        }
    }, 100);
}

window.onload = applyFilters;
