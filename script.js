/* --- NORDEN II: TACTICAL ENGINE --- */

// 1. MASTER REGISTRY DATA
const AC_LIST = [
    { id: "b52h", name: "B-52H STRATOFORTRESS", nation: "USA", speed: 520 },
    { id: "a10a", name: "A-10A THUNDERBOLT II", nation: "USA", speed: 350 },
    { id: "su25", name: "Su-25 FROGFOOT", nation: "USSR", speed: 420 }
];

const BOMB_LIST = [
    { id: "mk82", name: "Mk 82 (CCIP)", nation: "USA", type: "CCIP", cx: 0.012, mass: 227 },
    { id: "gbu12", name: "GBU-12 (LASER)", nation: "USA", type: "LASER", cx: 0.014, mass: 230 },
    { id: "fab500", name: "FAB-500 (CCIP)", nation: "USSR", type: "CCIP", cx: 0.015, mass: 500 }
];

// 2. FILTER & LOADING LOGIC
function applyFilters() {
    const nation = document.getElementById('nation-select').value;
    const useCCIP = document.getElementById('ccip-toggle').checked;
    const useLaser = document.getElementById('laser-toggle').checked;

    const acSelect = document.getElementById('ac-select');
    acSelect.innerHTML = '<option value="">-- SELECT --</option>';
    AC_LIST.filter(ac => nation === "ALL" || ac.nation === nation)
           .forEach(ac => acSelect.innerHTML += `<option value="${ac.id}">${ac.name}</option>`);

    const bombSelect = document.getElementById('bomb-select');
    bombSelect.innerHTML = '<option value="">-- SELECT --</option>';
    BOMB_LIST.filter(b => (nation === "ALL" || b.nation === nation) && 
                          ((b.type === "CCIP" && useCCIP) || (b.type === "LASER" && useLaser)))
             .forEach(b => bombSelect.innerHTML += `<option value="${b.id}">${b.name}</option>`);
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
        document.getElementById('drag-input').value = b.cx;
        document.getElementById('mass-input').value = b.mass;
    }
}

// 3. ARMAMENT SWITCH LOGIC (The part that isn't working for you!)
function toggleGuard() {
    const guard = document.getElementById('switch-guard');
    const armBtn = document.getElementById('physical-switch');
    const light = document.getElementById('status-light');
    
    guard.classList.toggle('guard-open');
    
    if (guard.classList.contains('guard-open')) {
        armBtn.disabled = false;
        light.className = 'light-caution';
    } else {
        armBtn.disabled = true;
        armBtn.innerText = "OFF";
        light.className = 'light-off';
    }
}

function toggleMasterArm() {
    const armBtn = document.getElementById('physical-switch');
    const light = document.getElementById('status-light');
    
    if (armBtn.innerText === "OFF") {
        armBtn.innerText = "ARMED";
        light.className = 'light-danger';
    } else {
        armBtn.innerText = "OFF";
        light.className = 'light-caution';
    }
}

// 4. BALLISTICS MATH
function runPhysics() {
    const isArmed = document.getElementById('physical-switch').innerText === "ARMED";
    if (!isArmed) { alert("SYSTEM LOCKED: ENGAGE MASTER ARM"); return; }
    
    const alt = document.getElementById('alt-input').value;
    const qty = document.getElementById('salvo-select') ? document.getElementById('salvo-select').value : 1;
    const readout = document.getElementById('mission-readout');

    const time = Math.sqrt((2 * (alt * 0.3048)) / 9.81).toFixed(2);

    for (let i = 1; i <= 9; i++) document.getElementById(`py-${i}`).classList.remove('pylon-active');
    
    // Default 8-salvo map for testing
    const map = {"1":[5], "2":[4,6], "4":[3,4,6,7], "8":[1,2,3,4,6,7,8,9]};
    if (map[qty]) {
        map[qty].forEach(p => document.getElementById(`py-${p}`).classList.add('pylon-active'));
    }

    readout.innerHTML = `--- TARGETING SOLUTION --- <br> TIME TO IMPACT: ${time} SEC <br> STATUS: RELEASE AUTHORIZED`;
}

// Initialize on load
window.onload = applyFilters;
