// --- NORDEN II: MISSION DATA LINK ---
let registry = {};

// 1. LOAD THE DATA
fetch('aircraft_registry.json')
    .then(res => res.json())
    .then(data => {
        registry = data;
        console.log("Registry Loaded Successfully.");
        // We don't need to call a function here because your HTML 
        // already has the Nations (USA, UK, etc.) written in!
    })
    .catch(err => console.error("FAILED TO LOAD REGISTRY:", err));

// 2. WHEN NATION CHANGES -> LOAD AIRCRAFT
function updateAircraftMenu() {
    const nation = document.getElementById('nation-select').value;
    const acSel = document.getElementById('aircraft-select');
    
    // Reset aircraft menu
    acSel.innerHTML = '<option value="">-- SELECT AIRCRAFT --</option>';

    if (registry[nation]) {
        registry[nation].forEach(ac => {
            let opt = document.createElement('option');
            opt.value = ac.max_speed_kmh;
            opt.innerHTML = ac.wt_name;
            opt.setAttribute('data-key', ac.aircraft_ID); // Security-safe ID
            acSel.appendChild(opt);
        });
        console.log("Hangar Updated for " + nation);
    }
}

// 3. MASTER ARM TOGGLE
function toggleMasterArm() {
    const isArmed = document.getElementById('master-arm').checked;
    const simBtn = document.getElementById('run-sim');
    simBtn.disabled = !isArmed;
    document.getElementById('systemStatus').innerText = isArmed ? "SYSTEM HOT" : "SYSTEM COLD";
}
