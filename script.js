/* --- NORDEN II: TACTICAL CONTROL LOGIC --- */

// Toggle the 3D Safety Guard
function toggleGuard() {
    const guard = document.getElementById('switch-guard');
    const armBtn = document.getElementById('physical-switch');
    
    guard.classList.toggle('guard-open');
    
    // Enable/Disable the switch based on guard state
    if (guard.classList.contains('guard-open')) {
        armBtn.disabled = false;
        console.log("SAFETY OFF: MASTER ARM ACCESSIBLE");
    } else {
        armBtn.disabled = true;
        armBtn.innerText = "OFF";
        armBtn.style.background = "#333";
        armBtn.style.color = "#FF0000";
        console.log("SAFETY ON: SYSTEM LOCKED");
    }
}

// Master Arm Toggle
function toggleMasterArm() {
    const armBtn = document.getElementById('physical-switch');
    
    if (armBtn.innerText === "OFF") {
        armBtn.innerText = "ARMED";
        armBtn.style.background = "#FF0000";
        armBtn.style.color = "#000";
        armBtn.style.boxShadow = "0 0 15px #FF0000";
        updateAdvisory("MASTER ARM: HOT");
    } else {
        armBtn.innerText = "OFF";
        armBtn.style.background = "#333";
        armBtn.style.color = "#FF0000";
        armBtn.style.boxShadow = "none";
        updateAdvisory("MASTER ARM: COLD");
    }
}

// Update the DSMS (Pylons) based on Salvo Quantity
function updatePylons(qty) {
    // Reset all pylons
    for (let i = 1; i <= 9; i++) {
        document.getElementById(`py-${i}`).classList.remove('pylon-active');
    }

    // Light up pylons symmetrically based on qty
    const mapping = {
        "1": [5],                   // Center
        "2": [4, 6],                // Inner wings
        "4": [3, 4, 6, 7],          // Mid wings
        "6": [2, 3, 4, 6, 7, 8],    // Full wings
        "8": [1, 2, 3, 4, 6, 7, 8, 9] // Heavy loadout
    };

    if (mapping[qty]) {
        mapping[qty].forEach(p => {
            document.getElementById(`py-${p}`).classList.add('pylon-active');
        });
    }
}

// Update the Advisory Screen
function updateAdvisory(msg) {
    const adv = document.getElementById('advisory-display');
    adv.innerHTML = `STATUS: ${msg}<br>AESA MODE: ACTIVE`;
}

// Physics Placeholder (Connects to your existing ballistics engine)
function runPhysics() {
    const isArmed = document.getElementById('physical-switch').innerText === "ARMED";
    const qty = document.getElementById('salvo-select').value;
    
    if (!isArmed) {
        alert("CRITICAL ERROR: MASTER ARM NOT ENGAGED");
        return;
    }

    updatePylons(qty);
    updateAdvisory(`RELEASING ${qty} MUNITION(S)...`);
    
    // Add your ballistic math calls here (trajectories, impact points, etc.)
    console.log(`Executing Salvo Release: ${qty} units at current airspeed.`);
}

// Event Listener for Salvo changes to update the DSMS instantly
document.getElementById('salvo-select').onchange = function() {
    updatePylons(this.value);
};
