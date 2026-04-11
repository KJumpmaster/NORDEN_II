function toggleGuard() {
    const guard = document.getElementById('switch-guard');
    const armBtn = document.getElementById('physical-switch');
    const light = document.getElementById('status-light');
    
    guard.classList.toggle('guard-open');
    
    if (guard.classList.contains('guard-open')) {
        armBtn.disabled = false;
        light.classList.add('light-caution');
    } else {
        armBtn.disabled = true;
        armBtn.innerText = "OFF";
        light.classList.remove('light-caution', 'light-danger');
    }
}

function toggleMasterArm() {
    const armBtn = document.getElementById('physical-switch');
    const light = document.getElementById('status-light');
    
    if (armBtn.innerText === "OFF") {
        armBtn.innerText = "ARMED";
        light.classList.remove('light-caution');
        light.classList.add('light-danger');
    } else {
        armBtn.innerText = "OFF";
        light.classList.remove('light-danger');
        light.classList.add('light-caution');
    }
}

function runPhysics() {
    const isArmed = document.getElementById('physical-switch').innerText === "ARMED";
    if (!isArmed) { alert("SYSTEM LOCKED: ENGAGE MASTER ARM"); return; }
    
    const qty = document.getElementById('salvo-select').value;
    for (let i = 1; i <= 9; i++) document.getElementById(`py-${i}`).classList.remove('pylon-active');
    
    // Simple symmetry logic for B-52H pylons
    const map = {"1":[5], "2":[4,6], "4":[3,4,6,7], "8":[1,2,3,4,6,7,8,9]};
    map[qty].forEach(p => document.getElementById(`py-${p}`).classList.add('pylon-active'));
    
    console.log("NORDEN II: BOMBS AWAY");
}
