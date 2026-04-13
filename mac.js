
// PHASE 4 – corrected impact visualization (LONG/SHORT + zoomed top view)

const TOTAL_FRAMES = 20;
let currentFrame = 0;
let activeFilter = "all";

function visibleSolutions() {
  if (activeFilter === "all") return payload.solutions;
  return payload.solutions.filter(s => s.label === activeFilter);
}

function renderSideView() {
  const w = sideCanvas.clientWidth;
  const h = sideCanvas.clientHeight;
  sideCtx.clearRect(0,0,w,h);

  const targetX = w - 80;
  const groundY = h - 60;

  // target reference line
  sideCtx.strokeStyle = "#ffd54a";
  sideCtx.beginPath();
  sideCtx.moveTo(targetX, 20);
  sideCtx.lineTo(targetX, groundY+10);
  sideCtx.stroke();

  visibleSolutions().forEach(sol=>{
    const impactX = targetX + sol.centerError; // THIS is key fix
    const releaseX = 80;

    // arc
    sideCtx.strokeStyle = sol.color;
    sideCtx.beginPath();
    sideCtx.moveTo(releaseX,60);
    sideCtx.quadraticCurveTo((releaseX+impactX)/2, 10, impactX, groundY);
    sideCtx.stroke();

    // impact marker
    sideCtx.fillStyle = sol.color;
    sideCtx.beginPath();
    sideCtx.arc(impactX, groundY, 5, 0, Math.PI*2);
    sideCtx.fill();

    // error line
    sideCtx.strokeStyle = "#ff5555";
    sideCtx.beginPath();
    sideCtx.moveTo(targetX, groundY+15);
    sideCtx.lineTo(impactX, groundY+15);
    sideCtx.stroke();

    // label
    sideCtx.fillStyle = "#ff5555";
    const label = sol.centerError > 0 ? "LONG" : "SHORT";
    sideCtx.fillText(label + " " + Math.abs(sol.centerError).toFixed(0)+"m", (targetX+impactX)/2, groundY+30);
  });
}

function renderTopView() {
  const w = topCanvas.clientWidth;
  const h = topCanvas.clientHeight;
  topCtx.clearRect(0,0,w,h);

  const cx = w/2;
  const cy = h/2;

  // draw X target
  topCtx.strokeStyle = "#ffd54a";
  topCtx.beginPath();
  topCtx.moveTo(cx-10, cy-10);
  topCtx.lineTo(cx+10, cy+10);
  topCtx.moveTo(cx+10, cy-10);
  topCtx.lineTo(cx-10, cy+10);
  topCtx.stroke();

  visibleSolutions().forEach(sol=>{
    const impactX = cx + sol.centerError * 0.5;
    const impactY = cy;

    // impact point
    topCtx.fillStyle = sol.color;
    topCtx.beginPath();
    topCtx.arc(impactX, impactY, 5, 0, Math.PI*2);
    topCtx.fill();

    // blast circle
    topCtx.globalAlpha = 0.3;
    topCtx.beginPath();
    topCtx.arc(impactX, impactY, sol.blastRadius*0.3, 0, Math.PI*2);
    topCtx.stroke();
    topCtx.globalAlpha = 1;
  });
}
