/* GE3M V6.0 - THE M.A.C. ENGINE */

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
    const selects = ['ac-select', 'bomb-1', 'bomb-2', 'bomb-3'];
    
    selects.forEach(sID => {
        const el = document.getElementById(sID);
        el.innerHTML = '<option value="">-- SELECT --</option>';
        if (sID === 'ac-select') {
            AC_LIST.filter(a => nation === "ALL" || a.nation === nation).forEach(a => el.innerHTML += `<option value="${a.id}">${a.name}</option>`);
        } else {
            BOMB_LIST.forEach(b => el.innerHTML += `<option value="${b.id}">${b.name}</option>`);
        }
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
    for (let i = 1; i <= 3; i++) {
        const tnt = parseFloat(document.getElementById(`tnt-${i}`).value) || 0;
        const blast = Math.round(Math.pow(tnt, 1/3) * 15);
        const cep = Math.round(alt * 0.005);
        document.getElementById(`blast-${i}`).value = blast + "m";
        document.getElementById(`disp-${i}`).value = cep + "m";
    }
}

function loadAircraft() {
    const id = document.getElementById('ac-select').value;
    const ac = AC_LIST.find(a => a.id === id);
    if(ac) document.getElementById('speed-input').value = ac.speed;
}

function toggleGuard() {
    const g = document.getElementById('switch-guard');
    g.classList.toggle('guard-open');
    document.getElementById('physical-switch').disabled = !g.classList.contains('guard-open');
}

function generateMAC() {
    const win = window.open('', '_blank');
    const alt = document.getElementById('alt-input').value;
    const speed = document.getElementById('speed-input').value;
    
    let rows = "";
    for(let i=1; i<=3; i++) {
        rows += `<tr><td>#${i}</td><td>${document.getElementById(`tnt-${i}`).value}kg</td><td>${document.getElementById(`blast-${i}`).value}</td><td>${document.getElementById(`disp-${i}`).value}</td></tr>`;
    }

    win.document.write(`
        <html><body style="font-family:Arial; padding:50px;">
        <h1>M.A.C. - MISSION ANALYSIS CHART</h1>
        <p>AIRCRAFT: ${document.getElementById('ac-select').selectedOptions[0].text} | ALT: ${alt}ft | SPEED: ${speed}mph</p>
        <canvas id="macCanvas" width="800" height="300" style="border:1px solid #000; background:#f0f0f0;"></canvas>
        <table border="1" width="100%" style="margin-top:20px;">
            <tr><th>Slot</th><th>TNT EQ</th><th>Blast Rad</th><th>Dispersion</th></tr>
            ${rows}
        </table>
        <button onclick="window.print()">PRINT CHART</button>
        <script>
            const ctx = document.getElementById('macCanvas').getContext('2d');
            ctx.moveTo(0, 250); ctx.lineTo(800, 250); ctx.stroke(); // Ground
            // Simplified drawing for the finale
            [1, 2, 3].forEach(i => {
                ctx.strokeStyle = i==1 ? "green" : (i==2 ? "blue" : "red");
                ctx.beginPath(); ctx.moveTo(50, 50); ctx.quadraticCurveTo(400, 50, 450 + (i*20), 250); ctx.stroke();
            });
        </script>
        </body></html>
    `);
}

window.onload = applyFilters;
