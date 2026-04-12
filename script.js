/* GE3M V17.0 - STRATEGIC COMMAND ENGINE */

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

// POPULATE DROPDOWNS ON LOAD
function applyFilters() {
    const nationSelect = document.getElementById('nation-select');
    if (!nationSelect) return; 
    
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

    for (let i = 1; i <= 3; i++) {
        const tnt = parseFloat(document.getElementById(`tnt-${i}`).value) || 0;
        const blast = Math.round(Math.pow(tnt, 1/3) * 15);
        const time = Math.sqrt((2 * (alt * 0.3048)) / 9.81);
        const dist = Math.round((speed * 0.447) * time * Math.cos(dive * Math.PI / 180));
        
        document.getElementById(`blast-${i}`).value = blast + "m";
        document.getElementById(`dist-${i}`).value = dist + "m Glide";
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
    if (document.getElementById('physical-switch').innerText !== "ARMED") { 
        alert("MASTER ARM DISENGAGED"); return; 
    }
    
    const qty = document.getElementById('salvo-select').value;
    document.querySelectorAll('.node').forEach(n => n.classList.remove('pylon-active'));
    
    if (qty === "1") { document.getElementById('py-5').classList.add('pylon-active'); }
    else if (qty === "4") { [3,4,6,7].forEach(n => document.getElementById(`py-${n}`).classList.add('pylon-active')); }
    else { [1,2,3,4,5,6,7,8,9].forEach(n => document.getElementById(`py-${n}`).classList.add('pylon-active')); }

    const alt = document.getElementById('alt-input').value;
    const flightTime = Math.sqrt((2 * (alt * 0.3048)) / 9.81);
    document.getElementById('mission-readout').innerHTML = `
        <div style="border:1px solid #00FF41; padding:10px;">
            SOLUTION LOADED: ${(flightTime/4).toFixed(2)}s TO IMPACT<br>
            <button onclick="executeRelease(${flightTime})" id="final-pickle" style="background:red; color:white; width:100%; margin-top:10px; font-weight:bold; cursor:pointer;">!!! EXECUTE DROP !!!</button>
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

function generateMAC() {
    const win = window.open('', '_blank');
    const alt = document.getElementById('alt-input').value;
    const speed = document.getElementById('speed-input').value;
    
    let sideTable = "<tr><th>PARAMETER</th><th style='color:green;'>A: GREEN</th><th style='color:cyan;'>B: BLUE</th><th style='color:red;'>C: RED</th></tr>";
    sideTable += `<tr><td>ARMAMENT</td><td>${document.getElementById('bomb-1').selectedOptions[0].text}</td><td>${document.getElementById('bomb-2').selectedOptions[0].text}</td><td>${document.getElementById('bomb-3').selectedOptions[0].text}</td></tr>`;
    sideTable += `<tr><td>TNT EQ</td><td>${document.getElementById('tnt-1').value}kg</td><td>${document.getElementById('tnt-2').value}kg</td><td>${document.getElementById('tnt-3').value}kg</td></tr>`;
    sideTable += `<tr><td>BLAST RAD</td><td>${document.getElementById('blast-1').value}</td><td>${document.getElementById('blast-2').value}</td><td>${document.getElementById('blast-3').value}</td></tr>`;
    sideTable += `<tr><td>TGT DIST</td><td>${document.getElementById('dist-1').value}</td><td>${document.getElementById('dist-2').value}</td><td>${document.getElementById('dist-3').value}</td></tr>`;

    win.document.write(\`
        <html>
        <head>
            <title>STRATEGIC MISSION ANALYSIS</title>
            <style>
                body { font-family: sans-serif; padding: 40px; background: black; color: white; }
                h1 { border-bottom: 4px solid #00FF41; color: #00FF41; }
                .intel-header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 10px; }
                .map-container { border: 2px solid #555; background: #050505; height: 350px; margin-top: 15px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; background: #111; }
                th, td { border: 1px solid #333; padding: 10px; text-align: left; }
                .scrubber-control { background: #222; padding: 15px; margin-top: 10px; display: flex; gap: 10px; align-items: center; border: 1px solid #00FF41; }
                #timeline { flex: 1; accent-color: #00FF41; }
                button { background: #333; color: #00FF41; border: 1px solid #00FF41; padding: 10px; cursor: pointer; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="intel-header">
                <div>CLASSIFICATION: <span style="color:red;">CONFIDENTIAL</span></div>
                <div>82nd Airborne Div</div>
            </div>
            <h1>--- STRATEGIC TARGETING ASSESSMENT ---</h1>
            <p>CONSTANTS: ALTITUDE: \${alt}FT | SPEED: \${speed}MPH</p>

            <div class="scrubber-control">
                <button onclick="playTimeline()">▶ PLAY MISSION</button>
                <button onclick="pauseTimeline()">II PAUSE</button>
                <input type="range" id="timeline" min="0" max="20" value="20" oninput="drawBriefingMap(this.value)">
                <div id="frame-count">FRAME: 20/20</div>
            </div>

            <div class="map-container"><canvas id="macCanvas" width="800" height="350"></canvas></div>

            <table>\${sideTable}</table>
            <button onclick="window.print()" style="margin-top:20px;">PRINT BRIEFING CHART</button>

            <script>
                const canvas = document.getElementById('macCanvas');
                const ctx = canvas.getContext('2d');
                let playInterval = null;

                const bombData = [
                    { dist: parseInt('\${document.getElementById('dist-1').value}'), rad: parseInt('\${document.getElementById('blast-1').value}') },
                    { dist: parseInt('\${document.getElementById('dist-2').value}'), rad: parseInt('\${document.getElementById('blast-2').value}') },
                    { dist: parseInt('\${document.getElementById('dist-3').value}'), rad: parseInt('\${document.getElementById('blast-3').value}') }
                ];

                function drawBriefingMap(step) {
                    ctx.clearRect(0,0,800,350);
                    document.getElementById('frame-count').innerText = "FRAME: " + step + "/20";
                    document.getElementById('timeline').value = step;

                    // Ground & TOC Target
                    ctx.strokeStyle="#666"; ctx.beginPath(); ctx.moveTo(0,300); ctx.lineTo(800,300); ctx.stroke();
                    ctx.fillStyle="#FFC700"; ctx.fillRect(700, 270, 40, 30); ctx.fillText("TOC", 710, 315);

                    bombData.forEach((d, i) => {
                        const progress = step/20;
                        const color = i==0?"#00FF41":(i==1?"#00FFFF":"#FF3333");
                        const trail = (d.dist * 0.7) * progress;
                        const drop = 250 * progress;

                        ctx.strokeStyle=color; ctx.setLineDash([5,5]); ctx.beginPath(); ctx.moveTo(50,50);
                        ctx.quadraticCurveTo(350*progress, 50, 50+trail, 50+drop); ctx.stroke();

                        if(step == 20) {
                            ctx.setLineDash([]); ctx.fillStyle=color+"33";
                            ctx.beginPath(); ctx.arc(50+trail, 300, d.rad/2, 0, Math.PI*2); ctx.fill();
                        }
                    });
                }

                function playTimeline() {
                    if (playInterval) return;
                    let s = 0;
                    playInterval = setInterval(() => {
                        s++; drawBriefingMap(s);
                        if (s >= 20) { clearInterval(playInterval); playInterval = null; }
                    }, 100);
                }

                function pauseTimeline() { clearInterval(playInterval); playInterval = null; }
                drawBriefingMap(20);
            </script>
        </body>
        </html>
    \`);
}

document.addEventListener('DOMContentLoaded', applyFilters);
