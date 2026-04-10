document.addEventListener('DOMContentLoaded', async () => {
    // UI Connections
    const masterBtn = document.getElementById('masterArm');
    const nationSel = document.getElementById('nation-selector');
    const acSel = document.getElementById('aircraft-selector');
    const speedInput = document.getElementById('speed-input');
    const diveInput = document.getElementById('dive-input');
    const simBtn = document.getElementById('run-sim-btn');

    let registry = {};

    // 1. Fetch Registry
    try {
        const resp = await fetch('aircraft_registry.json');
        registry = await resp.json();
    } catch (e) { console.error("Registry load error"); }

    // 2. Filter by Nation (using wt_name)
    nationSel.addEventListener('change', () => {
        const nation = nationSel.value;
        acSel.innerHTML = '<option value="0">-- SELECT --</option>';
        if (registry[nation]) {
            registry[nation].forEach(ac => {
                let opt = document.createElement('option');
                opt.value = ac.max_speed_kmh;
                opt.innerHTML = ac.wt_name; // Clean name without symbols
                acSel.appendChild(opt);
            });
        }
    });

    // 3. ABE Physics Engine (20Hz)
    function runABE(mass, cx, alt, spdKmh, diveDeg) {
        let t = 0, x = 0, y = alt;
        const dt = 0.05; // 20 updates per second
        const g = 9.81, rho = 1.225;
        
        // Convert Dive Angle (Positive = Down)
        let rad = diveDeg * (Math.PI / 180);
        let vx = (spdKmh / 3.6) * Math.cos(rad);
        let vy = -((spdKmh / 3.6) * Math.sin(rad)); // Moving toward ground

        while (y > 0 && t < 120) {
            let vTotal = Math.sqrt(vx**2 + vy**2);
            let drag = 0.5 * rho * (vTotal**2) * cx;
            vx += (-(drag * (vx / vTotal)) / mass) * dt;
            vy += (-g - (drag * (vy / vTotal)) / mass) * dt;
            x += vx * dt; y += vy * dt; t += dt;
        }
        return x;
    }

    // Master Arm Toggle
    masterBtn.addEventListener('click', () => {
        const isSafe = masterBtn.innerText === 'SAFE';
        masterBtn.innerText = isSafe ? 'ARMED' : 'SAFE';
        simBtn.disabled = !isSafe;
    });
});
