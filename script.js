/* GE3M ENGINE V3.1 - TACTICAL DIAGRAMMING */

const AC_LIST = [
    { id: "b52h", name: "B-52H STRATOFORTRESS", nation: "USA", speed: 520, maxSpeed: 650 },
    { id: "a10a", name: "A-10A THUNDERBOLT II", nation: "USA", speed: 350, maxSpeed: 450 },
    { id: "su25", name: "Su-25 FROGFOOT", nation: "USSR", speed: 420, maxSpeed: 600 }
];

const BOMB_LIST = [
    { id: "mk82", name: "Mk 82 (CCIP)", nation: "USA", type: "CCIP", cx: 0.012, mass: 227, tnt: 118 },
    { id: "mk84", name: "Mk 84 (CCIP)", nation: "USA", type: "CCIP", cx: 0.015, mass: 907, tnt: 428 },
    { id: "fab500", name: "FAB-500 (CCIP)", nation: "USSR", type: "CCIP", cx: 0.015, mass: 500, tnt: 213 }
];

let flightTime = 0; 

function updateLiveStats() {
    const tnt = parseFloat(document.getElementById('tnt-input').value) || 0;
    const blastRad = Math.round(Math.pow(tnt, 1/3) * 15);
    document.getElementById('blast-output').value = blastRad + "m";
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

function loadAircraft() {
    const id = document.getElementById('ac-select').value;
    const ac = AC_LIST.find(a => a.id === id);
    if(ac) { document.getElementById('speed-input').value = ac.speed; updateLiveStats(); }
}

function loadOrdnance() {
    const id = document.getElementById('bomb-select').value;
    const b = BOMB_LIST.find(bomb => bomb.id === id);
    if(b) { document.getElementById('tnt-input').value = b.tnt; updateLiveStats(); }
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
    if (!isArmed) { alert("SYSTEM LOCKED"); return; }
    const alt = document.getElementById('alt-input').value;
    flightTime = Math.sqrt((2 * (alt * 0.3048)) / 9.81);
    
    // DSMS Pylons
    const qty = document.getElementById('salvo-select').value;
    for (let i = 1; i <= 9; i++) document.getElementById(`py-${i}`).classList.remove('pylon-active');
    const map = {"1":[5], "2":[4,6], "4":[3,4,6,7], "8":[1,2,3,4,6,7,8,9]};
    map[qty].forEach(p => document.getElementById(`py-${p}`).classList.add('pylon-active'));

    document.getElementById('mission-map-container').style.display = "none";
    document.getElementById('mission-readout').innerHTML = `
        <div style="text-align:center;">
            <p>TOF: ${(flightTime/4).toFixed(2)}s</p>
            <button id="final-pickle" onclick="executeRelease()">!!! EXECUTE RELEASE !!!</button>
        </div>`;
}

function drawMissionMap() {
    const canvas = document.getElementById('missionCanvas');
    const ctx = canvas.getContext('2d');
    const speed = document.getElementById('speed-input').value;
    const tnt = document.getElementById('tnt-input').value;
    const blastRad = Math.round(Math.pow(tnt, 1/3) * 15);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    document.getElementById('mission-map-container').style.display = "block";

    // Draw Ground
    ctx.strokeStyle = "#333";
    ctx.beginPath(); ctx.moveTo(0, 130); ctx.lineTo(500, 130); ctx.stroke();

    // Draw Flight Path (Arc)
    ctx.strokeStyle = "#00FF41";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(50, 20); // Aircraft pos
    ctx.quadraticCurveTo(250, 20, 450, 130); // Ballistic arc
    ctx.stroke();

    // Draw Impact Zone
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(255, 0, 0, 0.4)";
    ctx.beginPath();
    ctx.arc(450, 130, blastRad/2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = "#FF0000";
    ctx.font = "10px Arial";
    ctx.fillText("IMPACT ZONE", 410, 145);
}

function executeRelease() {
    const readout = document.getElementById('mission-readout');
    let timeLeft = flightTime;
    const timer = setInterval(() => {
        timeLeft -= 0.4; 
        if (timeLeft <= 0) {
            clearInterval(timer);
            document.getElementById('cockpit-body').classList.add('combat-flash');
            setTimeout(() => { document.getElementById('cockpit-body').classList.remove('combat-flash'); }, 150);
            readout.innerHTML = "<h3 style='color:red; text-align:center;'>IMPACT CONFIRMED</h3>";
            drawMissionMap();
        } else {
            readout.innerHTML = `<h1 style="font-size: 2.5em; text-align:center; color:red;">TOF: ${timeLeft.toFixed(1)}s</h1>`;
        }
    }, 100);
}

window.onload = () => { applyFilters(); updateLiveStats(); };
