// --- NORDEN II: TACTICAL CONTROL LOGIC ---
let registry = {};

// 1. DATA LINK: Load the JSON from GitHub
fetch('aircraft_registry.json')
    .then(response => {
        if (!response.ok) throw new Error("Registry File Not Found");
        return response.json();
    })
    .then(data => {
        registry = data;
        console.log("Systems Online: Registry Loaded.");
    })
    .catch(err => {
        console.error("AVIONICS FAILURE:", err);
        alert("CRITICAL: Data Link Failed. Check your JSON for typos!");
    });

// 2. AIRCRAFT HANGAR: Fills the dropdown based on Nation
function updateAircraftMenu() {
    const nation = document.getElementById('nation-select').value;
    const acSel = document.getElementById('aircraft-select');
    
    // Clear previous aircraft
    acSel.innerHTML = '<option value="">-- INITIALIZING HANGAR --</option>';

    if (registry[nation]) {
        acSel.innerHTML = '<option value="">-- SELECT AIRFRAME --</option>';
        
        registry[nation].forEach(ac => {
            let opt = document.createElement('option');
            
            // Matches "max_speed_kmh" in your JSON
            opt.value = ac.max_speed_kmh; 
            
            // Matches "aircraft_ID" in your JSON (The visible name)
            opt.innerHTML = ac.aircraft_ID; 
            
            // Matches "data_key" in your JSON (The secret-free ID)
            opt.setAttribute('data-key', ac.data_key); 
            
            acSel.appendChild(opt);
        });
        console.log("Hangar populated for: " + nation);
    }
}

// 3. MASTER ARM: Safety Switch Logic
function toggleMasterArm() {
    const isArmed = document.getElementById('master-arm').checked;
    const simBtn = document.getElementById('run-sim');
    const status = document.getElementById('systemStatus');

    simBtn.disabled = !isArmed;
    status.innerText = isArmed ? "SYSTEM HOT" : "SYSTEM SAFE";
    status.style.color = isArmed ? "#FF0000" : "#00FF41";
}

// 4. SIMULATION: Placeholder for the ABE Engine
function runSimulation() {
    alert("BOMBS AWAY! Initiating NORDEN II Physics...");
}
