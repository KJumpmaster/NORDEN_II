let frame = 0;
const totalFrames = 20;

function draw(){
  const side = document.getElementById("sideView");
  const top = document.getElementById("topView");

  const sctx = side.getContext("2d");
  const tctx = top.getContext("2d");

  side.width = side.clientWidth;
  side.height = side.clientHeight;
  top.width = top.clientWidth;
  top.height = top.clientHeight;

  sctx.clearRect(0,0,side.width,side.height);
  tctx.clearRect(0,0,top.width,top.height);

  drawSide(sctx);
  drawTop(tctx);

  document.getElementById("frameLabel").innerText = "FRAME " + (frame+1);
}

function drawSide(ctx){
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;

  ctx.strokeStyle = "#00ff41";
  ctx.beginPath();
  ctx.moveTo(50,50);
  ctx.lineTo(w-50,h-50);
  ctx.stroke();

  ctx.strokeStyle = "blue";
  ctx.beginPath();
  ctx.moveTo(50,60);
  ctx.lineTo(w-50,h-60);
  ctx.stroke();

  ctx.strokeStyle = "orange";
  ctx.beginPath();
  ctx.moveTo(50,70);
  ctx.lineTo(w-50,h-70);
  ctx.stroke();
}

function drawTop(ctx){
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;

  ctx.strokeStyle="#00ff41";
  ctx.beginPath();
  ctx.arc(w/2,h/2,50,0,Math.PI*2);
  ctx.stroke();

  ctx.strokeStyle="blue";
  ctx.beginPath();
  ctx.arc(w/2+20,h/2,50,0,Math.PI*2);
  ctx.stroke();

  ctx.strokeStyle="orange";
  ctx.beginPath();
  ctx.arc(w/2-20,h/2,50,0,Math.PI*2);
  ctx.stroke();
}

function nextFrame(){
  frame = (frame+1)%totalFrames;
  draw();
}

function prevFrame(){
  frame = (frame-1+totalFrames)%totalFrames;
  draw();
}

draw();
