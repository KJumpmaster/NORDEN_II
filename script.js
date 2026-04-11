/* GE3M ENGINE V2.5 - FULL INTERFACE SYNC */

const AC_LIST = [
    { id: "b52h", name: "B-52H STRATOFORTRESS", nation: "USA", speed: 520, maxSpeed: 650 },
    { id: "a10a", name: "A-10A THUNDERBOLT II", nation: "USA", speed: 350, maxSpeed: 450 },
    { id: "su25", name: "Su-25 FROGFOOT", nation: "USSR", speed: 420, maxSpeed: 600 }
];

const BOMB_LIST = [
    { id: "mk82", name: "Mk 82 (CCIP)", nation: "USA", type: "CCIP", cx: 0.012, mass: 227, tnt: 118 },
    { id: "mk84", name: "Mk 84 (CCIP)", nation: "USA", type: "CCIP", cx: 0.015, mass: 907, tnt: 428 },
    { id: "gbu12", name: "GBU-12 (LASER)", nation: "USA", type: "LASER", cx: 0.014, mass: 230, tnt: 87 }
];

let flightTime = 0; 

function updateLiveStats() {
    const tnt = parseFloat(document.getElementById('tnt-input').value) || 0;
    const alt = parseFloat(document.getElementById('alt-input').value) || 0;
    const qty = parseInt(document.getElementById('salvo-select').value) || 1;

    const blastRad = Math.round(Math.pow(tnt, 1/3) * 15);
    document.getElementById('blast-output').value = blastRad + "m";

    const cep = Math.round((alt * 0.005) * qty);
    document.getElementById('disp-output').value = cep + "m Pattern";
}

function applyFilters() {
    const nation = document.getElementById('nation-select').value;
    const acSelect = document.getElementById('ac-select');
    acSelect.innerHTML = '<option value="">-- SELECT --</option>';
    AC_LIST.filter(ac => nation === "ALL" || ac.nation === nation).forEach(ac => acSelect.innerHTML += `<option value="${ac.id}">${ac.name}</option>`);
    
    const bombSelect = document.getElementById('bomb-select');
    bombSelect.innerHTML = '<option value="">-- SELECT --</option>';
    BOMB_LIST.filter(b => nation === "ALL" || b.nation === nation).forEach(b => bombSelect.innerHTML += `<option value="${b.id}">${b.name}</option>`);
}

function loadOrdnance() {
    const id = document.getElementById('bomb-select').value;
    const b = BOMB_LIST.find(bomb => bomb.id === id);
    if(b) {
        document.getElementById('tnt-input').value = b.tnt;
        updateLiveStats();
    }
}

function loadAircraft() {
    const id = document.getElementById('ac-select').value;
    const ac = AC_LIST.find(a => a.id === id);
    if(ac) {
        document.getElementById('speed-input').value = ac.speed;
        updateLiveStats();
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
    
    const alt = document.getElementById('alt-input').value;
    flightTime = Math.sqrt((2 * (alt * 0.3048)) / 9.81);
    
    const qty = document.getElementById('salvo-select').value;
    for (let i = 1; i <= 9; i++) document.getElementById(`py-${i}`).classList.remove('pylon-active');
    const map = {"1":[5], "2":[4,6], "4":[3,4,6,7], "8":[1,2,3,4,6,7,8,9]};
    map[qty].forEach(p => document.getElementById(`py-${p}`).classList.add('pylon-active'));

    document.getElementById('mission-readout').innerHTML = `
        <div style="border: 1px solid var(--terminal-green); padding: 10px; text-align:center;">
            TIME OF FLIGHT (TC 4X): ${(flightTime/4).toFixed(2)}s<br>
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
            readout.innerHTML = "<h2 style='color:red; text-align:center;'>--- IMPACT ---</h2>";
            for (let i = 1; i <= 9; i++) document.getElementById(`py-${i}`).classList.remove('pylon-active');
        } else {
            readout.innerHTML = `<h1 style="font-size: 2.5em; text-align:center;">TOF: ${timeLeft.toFixed(1)}s</h1>`;
        }
    }, 100);
}

window.onload = () => { applyFilters(); updateLiveStats(); };
