// --- NORDEN II: TACTICAL CONTROL LOGIC ---
let registry = {};

// 1. DATA LINK: Connect to GitHub
fetch('aircraft_registry.json')
    .then(response => {
        if (!response.ok) throw new Error("Registry Missing");
        return response.json();
    })
    .then(data => {
        registry = data;
        console.log("Systems Online: Data Handshake Successful.");
    })
    .catch(err => console.error("DATA LINK FAILURE:", err));

// 2. AIRCRAFT LOADER
function updateAircraftMenu() {
    const nation = document.getElementById('nation-select').value;
    const acSel = document.getElementById('aircraft-select');
    
    acSel.innerHTML = '<option value="">-- SELECT AIRFRAME --</option>';

    if (registry[nation]) {
        registry[nation].forEach((ac, index) => {
            let opt = document.createElement('option');
            opt.value = index; // We use the index to find the plane later
            opt.innerHTML = ac.aircraft_ID;
            acSel.appendChild(opt);
        });
    }
}

// 3. WEAPON LOADER: Triggered when Aircraft is selected
function updateWeaponMenu() {
    const nation = document.getElementById('nation-select').value;
    const acIndex = document.getElementById('aircraft-select').value;
    const bombSel = document.getElementById('bombA-select');

    bombSel.innerHTML = '<option value="">-- SELECT MUNITION --</option>';

    if (nation && acIndex !== "") {
        const selectedPlane = registry[nation][acIndex];
        
        selectedPlane.loadout.forEach(bomb => {
            let opt = document.createElement('option');
            // Store the physics data in the value
            opt.value = JSON.stringify({cx: bomb.drag_cx, cal: bomb.caliber_m});
            opt.innerHTML = bomb.bomb_name;
            bombSel.appendChild(opt);
        });
        console.log("Munitions loaded for " + selectedPlane.aircraft_ID);
    }
}

// 4. MASTER ARM: Safety Switch
function toggleMasterArm() {
    const isArmed = document.getElementById('master-arm').checked;
    const simBtn = document.getElementById('run-sim');
    const status = document.getElementById('systemStatus');

    simBtn.disabled = !isArmed;
    status.innerText = isArmed ? "SYSTEM HOT" : "SYSTEM SAFE";
    status.style.color = isArmed ? "#FF0000" : "#00FF41";
}

function runSimulation() {
    alert("BOMBS AWAY! Calculation engine engaged.");
}
