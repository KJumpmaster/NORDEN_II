// MASTER REGISTRY
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

function applyFilters() {
    const nation = document.getElementById('nation-select').value;
    const useCCIP = document.getElementById('ccip-toggle').checked;
    const useLaser = document.getElementById('laser-toggle').checked;

    // Filter Aircraft
    const acSelect = document.getElementById('ac-select');
    acSelect.innerHTML = '<option value="">-- SELECT --</option>';
    AC_LIST.filter(ac => nation === "ALL" || ac.nation === nation)
           .forEach(ac => acSelect.innerHTML += `<option value="${ac.id}">${ac.name}</option>`);

    // Filter Ordnance
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

// RUN INITIAL FILTER ON LOAD
window.onload = applyFilters;

// --- KEEP YOUR PREVIOUS toggleGuard, toggleMasterArm, and runPhysics FUNCTIONS BELOW ---
