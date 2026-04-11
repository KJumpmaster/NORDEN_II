function generateMAC() {
    const win = window.open('', '_blank');
    const alt = document.getElementById('alt-input').value;
    const speed = document.getElementById('speed-input').value;

    win.document.write(`
        <html>
        <head>
            <title>M.A.C. TACTICAL PLAYBACK</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 40px; background: white; color: black; }
                h1 { border-bottom: 3px solid black; margin-bottom: 5px; }
                .playback-controls { background: #f0f0f0; padding: 15px; border: 1px solid #ccc; margin: 10px 0; display: flex; gap: 20px; align-items: center; }
                canvas { border: 2px solid #000; background: #fff; width: 100%; height: 350px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                th, td { border: 1px solid #000; padding: 8px; text-align: left; }
                .play-btn { background: #008000; color: white; padding: 10px 20px; border: none; font-weight: bold; cursor: pointer; }
                .reset-btn { background: #666; color: white; padding: 10px 20px; border: none; cursor: pointer; }
                @media print { .playback-controls { display: none; } }
            </style>
        </head>
        <body>
            <h1>MISSION ANALYSIS CHART (M.A.C.) - V12.0</h1>
            <p><strong>AIRCRAFT:</strong> B-52H STRATOFORTRESS | <strong>ALT:</strong> ${alt} FT | <strong>SPD:</strong> ${speed} MPH</p>
            
            <div class="playback-controls">
                <button class="play-btn" onclick="startPlayback()">▶ PLAY MISSION VIDEO</button>
                <button class="reset-btn" onclick="resetMission()">RESET</button>
                <div id="frame-counter">FRAME: 0 / 20</div>
            </div>

            <canvas id="macCanvas" width="800" height="350"></canvas>

            <table border="1">
                <tr><th>SOLUTION</th><th>TNT EQ</th><th>BLAST RAD</th><th>TGT DIST</th></tr>
                <tr style="color:green;"><td>A: ${document.getElementById('bomb-1', window.opener.document).selectedOptions[0].text}</td><td>${document.getElementById('tnt-1', window.opener.document).value}kg</td><td>${document.getElementById('blast-1', window.opener.document).value}</td><td>${document.getElementById('dist-1', window.opener.document).value}</td></tr>
                <tr style="color:blue;"><td>B: ${document.getElementById('bomb-2', window.opener.document).selectedOptions[0].text}</td><td>${document.getElementById('tnt-2', window.opener.document).value}kg</td><td>${document.getElementById('blast-2', window.opener.document).value}</td><td>${document.getElementById('dist-2', window.opener.document).value}</td></tr>
                <tr style="color:red;"><td>C: ${document.getElementById('bomb-3', window.opener.document).selectedOptions[0].text}</td><td>${document.getElementById('tnt-3', window.opener.document).value}kg</td><td>${document.getElementById('blast-3', window.opener.document).value}</td><td>${document.getElementById('dist-3', window.opener.document).value}</td></tr>
            </table>

            <script>
                const canvas = document.getElementById('macCanvas');
                const ctx = canvas.getContext('2d');
                let currentFrame = 0;
                let playInterval = null;

                function drawFrame(frame) {
                    ctx.clearRect(0,0,800,350);
                    // Ground Line
                    ctx.strokeStyle="#000"; ctx.setLineDash([]); ctx.lineWidth=2;
                    ctx.beginPath(); ctx.moveTo(0,300); ctx.lineTo(800,300); ctx.stroke();
                    // TOC Target
                    ctx.fillStyle="#000"; ctx.fillRect(720, 275, 30, 25); ctx.fillText("TOC", 725, 315);
                    // Aircraft Marker
                    ctx.fillStyle="#333"; ctx.fillRect(20, 30, 60, 15); ctx.fillText("B-52H", 30, 25);

                    const progress = frame / 20;
                    document.getElementById('frame-counter').innerText = "FRAME: " + frame + " / 20";

                    [1,2,3].forEach(i => {
                        const color = i==1 ? "green" : (i==2 ? "blue" : "red");
                        // Pull data from main window
                        const distVal = parseInt(window.opener.document.getElementById('dist-'+i).value);
                        const blastVal = parseInt(window.opener.document.getElementById('blast-'+i).value);
                        
                        const x = 50 + (distVal * 0.5 * progress);
                        const y = 40 + (260 * progress);

                        // Draw Path Up to current frame
                        ctx.strokeStyle = color; ctx.setLineDash([5, 5]);
                        ctx.beginPath(); ctx.moveTo(50, 40);
                        ctx.quadraticCurveTo(x, 40, x, y); ctx.stroke();

                        // Draw Bomb at current position
                        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI*2); ctx.fill();

                        // Draw Blast on Frame 20
                        if(frame === 20) {
                            ctx.setLineDash([]); ctx.fillStyle = color + "33";
                            ctx.beginPath(); ctx.arc(x, 300, blastVal/2, 0, Math.PI*2); ctx.fill();
                            ctx.fillStyle = color; ctx.fillText(blastVal + "m BLAST", x - 20, 320);
                        }
                    });
                }

                function startPlayback() {
                    if (playInterval) return;
                    currentFrame = 0;
                    playInterval = setInterval(() => {
                        currentFrame++;
                        drawFrame(currentFrame);
                        if (currentFrame >= 20) clearInterval(playInterval);
                    }, 100);
                }

                function resetMission() {
                    clearInterval(playInterval);
                    playInterval = null;
                    currentFrame = 0;
                    drawFrame(0);
                }

                drawFrame(0);
            </script>
        </body>
        </html>
    `);
}
