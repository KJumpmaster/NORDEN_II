/* GE3M V17.1 - REPAIRED FLOW ENGINE */

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
    const nationSelect = document.getElementById('nation-select');
    if (!nationSelect) return;
    
    // Auto-Populate Nation if empty
    if(nationSelect.options.length === 0) {
        nationSelect.innerHTML = '<option value="USA">USA</option><option value="USSR">USSR</option><option value="ALL">ALL</option>';
    }

    const nation = nationSelect.value;
    const acSelect = document.getElementById('ac-select');
    acSelect.innerHTML = '<option value="">-- AIRCRAFT --</option>';
    AC_LIST.filter(a => nation === "ALL" || a.nation === nation).forEach(a => {
        acSelect.innerHTML += `<option value="${a.id}">${a.name}</option>`;
    });

    ['bomb-1', 'bomb-2', 'bomb-3'].forEach(sID => {
        const el = document.getElementById(sID);
        el.innerHTML = '<option value="">-- ARMAMENT --</option>';
        BOMB_LIST.forEach(b => {
            el.innerHTML += `<option value="${b.id}">${b.name}</option>`;
        });
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
    document.getElementById('tgt-dist-const').value = dist + "m Glide Path";

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
    const light = document.getElementById('status-light');
    if (btn.innerText === "OFF") {
        btn.innerText = "ARMED";
        light.className = 'light-danger';
    } else {
        btn.innerText = "OFF";
        light.className = 'light-off';
    }
}

function runPhysics() {
    const isArmed = document.getElementById('physical-switch').innerText === "ARMED";
    if (!isArmed) { alert("ENGAGE MASTER ARM FIRST"); return; }
    
    // Light Pylon for visual feedback
    document.querySelectorAll('.node').forEach(n => n.classList.remove('pylon-active'));
    document.getElementById('py-5').classList.add('pylon-active');

    const alt = document.getElementById('alt-input').value;
    const flightTime = Math.sqrt((2 * (alt * 0.3048)) / 9.81);
    
    document.getElementById('mission-readout').innerHTML = `
        <div style="border:1px solid #00FF41; padding:10px;">
            SOLUTION LOADED: ${(flightTime/4).toFixed(2)}s<br>
            <button onclick="executeRelease(${flightTime})" id="final-pickle" style="background:red; color:white; width:100%; margin-top:5px; font-weight:bold; cursor:pointer; padding:10px; border:none;">!!! EXECUTE DROP !!!</button>
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
            readout.innerHTML = "<h3 style='color:red;'>IMPACT CONFIRMED</h3>";
        } else {
            readout.innerHTML = `<h1 style="font-size: 2em; color:red;">TOF: ${timeLeft.toFixed(1)}s</h1>`;
        }
    }, 100);
}

// 🚩 THE 3-STAR BRIEFING GENERATOR (Separate printable document with 'Pizzazz')
function generateMAC() {
    const win = window.open('', '_blank');
    const alt = document.getElementById('alt-input').value;
    win.document.write(`
        <html><body style="font-family:Arial; padding:40px; background:black; color:white;">
        <h1>M.A.C. ANALYSIS</h1>
        <p>B-52H ALTITUDE: ${alt}FT</p>
        <div style="background:#222; padding:15px; border:1px solid #00FF41; margin-bottom:10px;">
            <button onclick="playMission()">▶ PLAY MISSION (20-STEP)</button>
        </div>
        <canvas id="c" width="800" height="300" style="border:1px solid #00FF41; background:#050505;"></canvas>
        <script>
            const ctx = document.getElementById('c').getContext('2d');
            function draw(step) {
                ctx.clearRect(0,0,800,300);
                // TOC Target
                ctx.fillStyle="gold"; ctx.fillRect(700, 230, 40, 20); ctx.fillText("TOC TARGET", 690, 265);
                ctx.strokeStyle="#666"; ctx.beginPath(); ctx.moveTo(0,250); ctx.lineTo(800,250); ctx.stroke(); // Ground
                [1,2,3].forEach(i => {
                    const color = i==1?"green":(i==2?"blue":"red");
                    ctx.strokeStyle=color; ctx.beginPath(); ctx.moveTo(50,50);
                    ctx.quadraticCurveTo(400, 50, 450+(i*20), 250); ctx.stroke();
                });
            }
            // 20-STEP KINETIC PLAYBACK
            function playMission() {
                let s = 0;
                let t = setInterval(() => { s++; draw(s); if(s>=20) clearInterval(t); }, 100);
            }
            draw(20);
        </script>
        </body></html>
    `);
}

// FORCE INITIALIZATION ON LOAD
document.addEventListener('DOMContentLoaded', applyFilters);
