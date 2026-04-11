function toggleGuard() {
    const guard = document.getElementById('switch-guard');
    const btn = document.getElementById('physical-switch');
    
    if (guard.style.transform === "rotateX(-110deg)") {
        // Close Guard
        guard.style.transform = "rotateX(0deg)";
        btn.disabled = true;
    } else {
        // Open Guard
        guard.style.transform = "rotateX(-110deg)";
        btn.disabled = false;
        console.log("MASTER ARM ACCESSIBLE");
    }
}

// Update the DSMS light when a bomb is picked
function updateDSMS(bombName, pylonNum) {
    // Clear all pylons first
    for(let i=1; i<=9; i++) {
        document.getElementById('py-'+i).classList.remove('pylon-active');
    }
    // Light up the selected pylon
    const active = document.getElementById('py-' + pylonNum);
    if(active) {
        active.classList.add('pylon-active');
        document.getElementById('active-store').innerText = bombName;
    }
}
