function updateAircraftMenu() {
    const nation = document.getElementById('nation-select').value;
    const ccipOnly = document.getElementById('ccip-filter').checked;
    const acSel = document.getElementById('aircraft-select');
    
    acSel.innerHTML = '<option value="">-- SELECT --</option>';

    if (registry[nation]) {
        registry[nation].forEach((ac, index) => {
            // THE CCIP FILTER LOGIC
            if (ccipOnly && !ac.has_ccip) return; // Skip this plane if it lacks CCIP

            let opt = document.createElement('option');
            opt.value = index;
            opt.innerHTML = ac.aircraft_ID + (ac.has_ccip ? " [CCIP]" : "");
            acSel.appendChild(opt);
        });
    }
}

function checkLaserStatus() {
    const bombVal = document.getElementById('bombA-select').value;
    const laserText = document.getElementById('laser-status');
    
    if (bombVal) {
        const data = JSON.parse(bombVal);
        if (data.is_laser_guided) {
            laserText.innerText = "🛰️ LASER LINK: LOCKED";
            laserText.style.color = "#ff0000";
            laserText.style.textShadow = "0 0 10px #ff0000";
        } else {
            laserText.innerText = "🛰️ LASER LINK: N/A (BALLISTIC)";
            laserText.style.color = "#555";
            laserText.style.textShadow = "none";
        }
    }
}
