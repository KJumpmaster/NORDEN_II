// --- NORDEN II: MASTER CONTROL LOGIC ---
let registry = {};

// 1. BOOT SEQUENCE: Load the Registry from GitHub
fetch('aircraft_registry.json')
    .then(response => {
        if (!response.ok) throw new Error("Registry not found");
        return response.json();
    })
    .then(data => {
        registry = data;
        console.log("Systems Online: Registry Loaded.");
    })
    .catch(err => {
        console.error("AVIONICS FAILURE:", err);
        alert("Data Link Failed. Check aircraft_registry.json for typos.");
    });

// 2. NATION FILTER: Triggered when Theater or Nation changes
function updateNationMenu() {
    const nationSel = document.getElementById('nation-select');
    const acSel = document.getElementById('aircraft-select');
    
    // Clear menus
    nationSel.innerHTML = '<option value="">-- SELECT NATION --</option>';
    acSel.innerHTML = '<option value="">-- SELECT AIRCRAFT --</option>';

    const nations = Object.keys(registry);
    nations.forEach(nation => {
        let opt = document.createElement('option');
        opt.value = nation;
        opt.innerHTML = nation;
        nationSel.appendChild(opt);
    });
}

// 3. AIRCRAFT FILTER: Triggered by Nation selection
function updateAircraftMenu() {
    const nation = document.getElementById('nation-select').value;
    const acSel = document.getElementById('aircraft-select');
    acSel.innerHTML = '<option value="">-- SELECT AIRCRAFT --</option>';

    if (registry[nation]) {
        registry[nation].forEach(ac => {
            let opt = document.createElement('option');
            opt.value = ac.max_speed_kmh;
            opt.innerHTML = ac.wt_name;
            opt.setAttribute('data-key', ac.aircraft_ID); // Matches your security fix
            acSel.appendChild(opt);
        });
    }
}

// 4. MASTER ARM & SIMULATION
function toggleMasterArm() {
    const isArmed = document.getElementById('master-arm').checked;
    const simBtn = document.getElementById('run-sim');
    simBtn.disabled = !isArmed; // Only enables button if switch is ON
    console.log("Master Arm:", isArmed ? "HOT" : "SAFE");
}

function runSimulation() {
    console.log("Bombs Away! Running ABE Physics...");
    // Your ABE Math loop goes here
}
