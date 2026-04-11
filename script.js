/* GE3M V10.0 - RELEASE DAY ENGINE */
const BOMB_LIST = [{id:"mk82",name:"Mk 82",tnt:118},{id:"mk84",name:"Mk 84",tnt:428},{id:"fab500",name:"FAB-500",tnt:213}];
let bayDoorsOpen = false;

function applyFilters() {
    ['bomb-1','bomb-2','bomb-3'].forEach(sID => {
        const el = document.getElementById(sID); el.innerHTML = '<option value="">-- BOMB --</option>';
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
    const speed = parseFloat(document.getElementById('speed-input').value) || 0;
    const dive = parseFloat(document.getElementById('dive-input').value) || 0;
    const time = Math.sqrt((2 * (alt * 0.3048)) / 9.81);
    const dist = Math.round((speed * 0.447) * time * Math.cos(dive * Math.PI / 180));
    document.getElementById('tgt-dist-const').value = dist + "m";
    for (let i = 1; i <= 3; i++) {
        const tnt = parseFloat(document.getElementById(`tnt-${i}`).value) || 0;
        document.getElementById(`blast-${i}`).value = Math.round(Math.pow(tnt, 1/3) * 15) + "m";
    }
}

function toggleBayDoors() {
    bayDoorsOpen = !bayDoorsOpen;
    const btn = document.getElementById('bay-door-btn');
    btn.innerText = bayDoorsOpen ? "BAY: OPEN" : "BAY: CLOSED";
    btn.style.borderColor = bayDoorsOpen ? "red" : "orange"; btn.style.color = bayDoorsOpen ? "red" : "orange";
}

function toggleGuard() {
    const g = document.getElementById('switch-guard'); const btn = document.getElementById('physical-switch');
    g.classList.toggle('guard-open'); btn.disabled = !g.classList.contains('guard-open');
}

function toggleMasterArm() {
    const btn = document.getElementById('physical-switch'); const light = document.getElementById('status-light');
    if (btn.innerText.includes("OFF")) { btn.innerText = "MASTER ARM: ARMED"; light.className = 'light-danger'; }
    else { btn.innerText = "MASTER ARM: OFF"; light.className = 'light-off'; }
}

function runPhysics() {
    if (document.getElementById('physical-switch').innerText.includes("OFF")) { alert("MASTER ARM DISENGAGED"); return; }
    if (!bayDoorsOpen) { alert("BOMB BAY DOORS CLOSED"); return; }
    const alt = document.getElementById('alt-input').value; const flightTime = Math.sqrt((2 * (alt * 0.3048)) / 9.81);
    const focus = document.getElementById('focus-select').value;
    document.querySelectorAll('.node').forEach(n => n.classList.remove('pylon-active'));
    document.getElementById('py-5').classList.add('pylon-active');
    document.getElementById('mission-readout').innerHTML = `<div style="border:1px solid #00FF41; padding:10px;">SOLUTION ${focus} LOCKED: ${(flightTime/4).toFixed(2)}s<br><button onclick="executeRelease(${flightTime})" id="final-pickle" style="background:red; color:white; width:100%; margin-top:5px; font-weight:bold; cursor:pointer; padding:8px; border:none;">!!! RELEASE !!!</button></div>`;
}

function executeRelease(flightTime) {
    let timeLeft = flightTime; const readout = document.getElementById('mission-readout');
    const timer = setInterval(() => {
        timeLeft -= 0.4; 
        if (timeLeft <= 0) {
            clearInterval(timer); document.getElementById('cockpit-body').classList.add('combat-flash');
            setTimeout(() => { document.getElementById('cockpit-body').classList.remove('combat-flash'); }, 150);
            readout.innerHTML = "<h3 style='color:red; text-align:center;'>--- IMPACT ---</h3>";
        } else { readout.innerHTML = `<h1 style="font-size: 2em; color:red; text-align:center;">TOF: ${timeLeft.toFixed(1)}s</h1>`; }
    }, 100);
}

function generateMAC() {
    const win = window.open('', '_blank');
    const alt = document.getElementById('alt-input').value;
    const focus = document.getElementById('focus-select').value;
    win.document.write(`<html><body style="font-family:Arial; padding:40px; background:white;"><h1>M.A.C. MISSION ANALYSIS CHART</h1><p>B-52H STRATOFORTRESS | ALTITUDE: ${alt}FT</p><canvas id="c" width="800" height="250" style="border:1px solid #000;"></canvas><table border="1" width="100%" style="margin-top:20px;"><tr><th>SLOT</th><th>TNT</th><th>BLAST</th><th>STATUS</th></tr><tr><td>1</td><td>${document.getElementById('tnt-1').value}kg</td><td>${document.getElementById('blast-1').value}</td><td>RESERVE</td></tr><tr><td>2</td><td>${document.getElementById('tnt-2').value}kg</td><td>${document.getElementById('blast-2').value}</td><td>PRIMARY</td></tr></table><script>const ctx=document.getElementById('c').getContext('2d'); ctx.moveTo(0,200); ctx.lineTo(800,200); ctx.stroke(); [1,2,3].forEach(i=>{ctx.strokeStyle=i==1?"green":(i==2?"blue":"red"); ctx.beginPath(); ctx.moveTo(50,50); ctx.quadraticCurveTo(400,50,450+(i*20),200); ctx.stroke();});</script></body></html>`);
}

window.onload = () => { applyFilters(); updateAllSlots(); };
