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

function runPhysics() {
    const isArmed = document.getElementById('physical-switch').innerText === "ARMED";
    if (!isArmed) { alert("SYSTEM LOCKED: ENGAGE MASTER ARM"); return; }
    
    // Pull all data
    const alt = document.getElementById('alt-input').value;
    const speed = document.getElementById('speed-input').value;
    const drag = document.getElementById('drag-input').value;
    const qty = document.getElementById('salvo-select').value;
    const readout = document.getElementById('mission-readout');

    // Simple time-to-impact calculation (sqrt(2*h/g))
    const time = Math.sqrt((2 * (alt * 0.3048)) / 9.81).toFixed(2);

    // Light up Pylons
    for (let i = 1; i <= 9; i++) document.getElementById(`py-${i}`).classList.remove('pylon-active');
    const map = {"1":[5], "2":[4,6], "4":[3,4,6,7], "8":[1,2,3,4,6,7,8,9]};
    map[qty].forEach(p => document.getElementById(`py-${p}`).classList.add('pylon-active'));

    // Update Readout
    readout.innerHTML = ` 
        --- TARGETING SOLUTION --- <br>
        TIME TO IMPACT: <span style="color:white">${time} SEC</span><br>
        SALVO STATUS: <span style="color:var(--terminal-green)">RELEASE AUTHORIZED</span><br>
        DRAG FACTOR: ${drag} Cx
    `;
}
