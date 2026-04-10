// --- NORDEN II: AVIONICS & LOGIC CORE ---
let registry = {};

// 1. BOOT SEQUENCE: Fetch the Registry
fetch('aircraft_registry.json')
    .then(response => {
        if (!response.ok) throw new Error("Registry file not found");
        return response.json();
    })
    .then(data => {
        registry = data;
        populateNationMenu(); // Start the UI once data is loaded
    })
    .catch(err => console.error("FATAL ERROR:", err));

// 2. NATION SELECTOR: Fills the first dropdown
function populateNationMenu() {
    const nationSel = document.getElementById('nation-select');
    const nations = Object.keys(registry); // Gets ["USA", "Great Britain"]
    
    nations.forEach(nation => {
        let opt = document.createElement('option');
        opt.value = nation;
        opt.innerHTML = nation;
        nationSel.appendChild(opt);
    });
}

// 3. AIRCRAFT SELECTOR: Fills the second dropdown based on Nation
function updateAircraftMenu() {
    const nation = document.getElementById('nation-select').value;
    const acSel = document.getElementById('aircraft-select');
    
    // Clear previous aircraft
    acSel.innerHTML = '<option value="">-- SELECT AIRCRAFT --</option>';
    
    if (registry[nation]) {
        registry[nation].forEach(ac => {
            let opt = document.createElement('option');
            opt.value = ac.max_speed_kmh;
            opt.innerHTML = ac.wt_name;
            
            // SECURITY FIX: Match the 'aircraft_ID' from your JSON
            opt.setAttribute('data-key', ac.aircraft_ID); 
            
            acSel.appendChild(opt);
        });
    }
}

// 4. PHYSICS ENGINE: Calculate CdA (STEM Education Block)
function calculateCdA(caliber, dragCx) {
    const radius = caliber / 2;
    const area = Math.PI * Math.pow(radius, 2);
    const cda = area * dragCx;
    return cda;
}
