// Inside your aircraft/munition selection logic
function updateCdA(caliber, dragCx) {
    const radius = caliber / 2;
    const area = Math.PI * Math.pow(radius, 2);
    const cda = area * dragCx;
    
    // Display to the operator
    document.getElementById('cda-display').innerText = cda.toFixed(5);
    return cda; // This goes into the ABE Engine
}

// Nation -> Aircraft filtering using wt_name
registry[nation].forEach(ac => {
    let opt = document.createElement('option');
    opt.value = ac.max_speed_kmh;
    opt.innerHTML = ac.wt_name; // Cleaner name for the UI
    acSel.appendChild(opt);
});
