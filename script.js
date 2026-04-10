// --- SECTION: AIRCRAFT DROPDOWN GENERATOR ---
// This logic builds the hangar menu based on the selected nation.
// It uses 'aircraftID' to avoid GitHub security false positives.

function populateAircraftMenu(nation, registry, acSel) {
    // Clear the current list
    acSel.innerHTML = '<option value="">-- SELECT AIRCRAFT --</option>';

    if (registry[nation]) {
        registry[nation].forEach(ac => {
            let opt = document.createElement('option');
            
            // 1. The Physics Value (Max Speed for the OVERSPEED check)
            opt.value = ac.max_speed_kmh;
            
            // 2. The Human Label (Clean name for the operator)
            opt.innerHTML = ac.wt_name; 
            
            // 3. The Data Key (Used for munitions filtering)
            // We use 'aircraftID' here to match your updated JSON
            opt.setAttribute('data-key', ac.aircraftID); 
            
            acSel.appendChild(opt);
        });
    }
}
