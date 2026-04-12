/* GE3M V16.0 - STRATEGIC COMMAND ENGINE */

const AC_LIST = [
    { id: "b52h", name: "B-52H STRATOFORTRESS", nation: "USA", speed: 520 },
    { id: "a10a", name: "A-10A THUNDERBOLT II", nation: "USA", speed: 350 },
    { id: "su25", name: "Su-25 FROGFOOT", nation: "USSR", speed: 420 }
];

const BOMB_LIST = [
    { id: "mk82", name: "Mk 82", tnt: 118 },
    { id: "mk84", name: "Mk 84", tnt: 428 },
    { id: "fab500", name: "FAB-500", tnt: 213 }
];

function applyFilters() {
    const nation = document.getElementById('nation-select').value;
    const acSelect = document.getElementById('ac-select');
    acSelect.innerHTML = '<option value="">-- AIRCRAFT --</option>';
    AC_LIST.filter(a => nation === "ALL" || a.nation === nation).forEach(a => {
        acSelect.innerHTML += `<option value="${a.id}">${a.name}</option>`;
    });
    ['bomb-1', 'bomb-2', 'bomb-3'].forEach(sID => {
        const el = document.getElementById(sID);
        el.innerHTML = '<option value="">-- BOMB --</option>';
        BOMB_LIST.forEach(b => el.innerHTML += `<option value="${b.id}">${b.name}</option>`);
    });
}

function loadAircraft() {
    const id = document.getElementById('ac-select').value;
    const ac = AC_LIST.find(a => a.id === id);
    if(ac) {
        document.getElementById('speed-input').value = ac.speed;
        updateAllSlots();
    }
}

function syncSlot(num) {
    const bombID = document.getElementById(`bomb-${num}`).value;
    const bomb = BOMB_LIST.find(b => b.id === bombID);
    if (bomb) document.getElementById(`tnt-${num}`).value = bomb.tnt;
    updateAllSlots();
}

function updateAllSlots() {
    const alt = parseFloat(document.getElementById('alt-input').value) || 0;
    const speed = parseFloat(document.getElementById('speed-input').value) || 0;
    const dive = parseFloat(document.getElementById('dive-input').value) || 0;

    // Target Distance (Glide Path Constant)
    const time = Math.sqrt((2 * (alt * 0.3048)) / 9.81);
    const dist = Math.round((speed * 0.447) * time * Math.cos(dive * Math.PI / 180));
    document.getElementById('tgt-dist-const').value = dist + "m";

    for (let i = 1; i <= 3; i++) {
        const tnt = parseFloat(document.getElementById(`tnt-${i}`).value) || 0;
        document.getElementById(`blast-${i}`).value = Math.round(Math.pow(tnt, 1/3) * 15) + "m";
    }
}

function toggleGuard() {
    const g = document.getElementById('switch-guard');
    const btn = document.getElementById('physical-switch');
    g.classList.toggle('guard-open');
    btn.disabled = !g.classList.contains('guard-open');
}

function toggleMasterArm() {
    const btn = document.getElementById('physical-switch');
    btn.innerText = (btn.innerText === "OFF") ? "ARMED" : "OFF";
}

function runPhysics() {
    const isArmed = document.getElementById('physical-switch').innerText === "ARMED";
    if (!isArmed) { alert("ENGAGE MASTER ARM"); return; }
    
    // Light Pylon for visual feedback
    document.querySelectorAll('.node').forEach(n => n.classList.remove('pylon-active'));
    document.getElementById('py-5').classList.add('pylon-active');

    const alt = document.getElementById('alt-input').value;
    const flightTime = Math.sqrt((2 * (alt * 0.3048)) / 9.81);
    document.getElementById('mission-readout').innerHTML = `
        <button onclick="executeRelease(${flightTime})" id="final-pickle" style="background:red; color:white; width:100%; margin-top:5px; font-weight:bold; cursor:pointer; padding:10px; border:none;">!!! RELEASE !!!</button>`;
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
            readout.innerHTML = "<h3 style='color:red;'>IMPACT CONFIRMED</h3>";
        } else {
            readout.innerHTML = `<h1 style="font-size: 2em; color:red;">TOF: ${timeLeft.toFixed(1)}s</h1>`;
        }
    }, 100);
}

function generateMAC() {
    const win = window.open('', '_blank');
    const alt = document.getElementById('alt-input').value;
    win.document.write(`<html><body style="font-family:Arial; padding:40px;"><h1>M.A.C. ANALYSIS</h1><p>ALTITUDE: ${alt}FT</p><canvas id="c" width="800" height="250" style="border:1px solid #000;"></canvas><script>const ctx=document.getElementById('c').getContext('2d'); ctx.moveTo(0,200); ctx.lineTo(800,200); ctx.stroke(); [1,2,3].forEach(i=>{ctx.strokeStyle=i==1?"green":(i==2?"blue":"red"); ctx.beginPath(); ctx.moveTo(50,50); ctx.quadraticCurveTo(400,50,450+(i*20),200); ctx.stroke();});</script></body></html>`);
}

window.onload = () => { applyFilters(); updateAllSlots(); };
