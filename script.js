const masterArm = document.getElementById('masterArm');
const dropBtn = document.getElementById('dropBtn');
const statusDisplay = document.getElementById('systemStatus');

masterArm.addEventListener('click', () => {
    if (masterArm.classList.contains('safe')) {
        // Switch to ARMED
        masterArm.classList.replace('safe', 'armed');
        masterArm.innerText = 'ARMED';
        statusDisplay.innerText = 'SYSTEM READY';
        statusDisplay.style.color = '#ff0000';
        dropBtn.disabled = false;
    } else {
        // Switch to SAFE
        masterArm.classList.replace('armed', 'safe');
        masterArm.innerText = 'SAFE';
        statusDisplay.innerText = 'SYSTEM LOCKED';
        statusDisplay.style.color = '#00ff00';
        dropBtn.disabled = true;
    }
});
