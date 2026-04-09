// Wait for the DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    const masterBtn = document.getElementById('masterArm');
    const statusText = document.getElementById('systemStatus');
    const dropBtns = document.querySelectorAll('.drop-btn');

    if (masterBtn) {
        masterBtn.addEventListener('click', () => {
            // Check if we are powering up or down
            if (masterBtn.innerText === 'SAFE') {
                // POWER UP
                masterBtn.innerText = 'ARMED';
                masterBtn.classList.add('armed');
                statusText.innerText = 'SYSTEMS ONLINE - NORDEN II READY';
                document.body.classList.add('system-online');
                
                // Enable weapon release buttons
                dropBtns.forEach(btn => btn.disabled = false);
                
                console.log("CAOC: Master Arm Set to ARMED. Avionics Active.");
            } else {
                // POWER DOWN
                masterBtn.innerText = 'SAFE';
                masterBtn.classList.remove('armed');
                statusText.innerText = 'SYSTEM COLD';
                document.body.classList.remove('system-online');
                
                // Disable weapon release buttons
                dropBtns.forEach(btn => btn.disabled = true);
            }
        });
    }
});
