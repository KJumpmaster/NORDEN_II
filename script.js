const AC = [
{ name:"B52", speed:520, maxSpeed:650 },
{ name:"A10", speed:350, maxSpeed:439 }
];

const BOMBS = [
{ name:"MK82", tnt:118, drag:1.0 },
{ name:"MK84", tnt:428, drag:1.3 },
{ name:"FAB500", tnt:213, drag:1.1 }
];

function init(){
const ac = document.getElementById("ac");
AC.forEach(a=>ac.innerHTML+=`<option>${a.name}</option>`);

[1,2,3].forEach(i=>{
const b = document.getElementById("bomb"+i);
BOMBS.forEach(x=>b.innerHTML+=`<option>${x.name}</option>`);
});
}

function loadAC(){
const index = document.getElementById("ac").selectedIndex;
const ac = AC[index];

const spd = document.getElementById("spd");

spd.value = ac.speed;

// 🔥 apply hard limit
spd.max = ac.maxSpeed;
spd.dataset.max = ac.maxSpeed;
}

function clampSpeed(){
const spd = document.getElementById("spd");
const max = parseFloat(spd.dataset.max);

if(!max) return;

let val = parseFloat(spd.value);

if(val > max){
spd.value = max;

// quick visual cue
spd.style.borderColor = "red";
setTimeout(()=> spd.style.borderColor="#333", 400);
}
}

function sync(n){
updatePreview(n);
}

function updatePreview(n){
const bomb = BOMBS[document.getElementById("bomb"+n).selectedIndex];
const blast = Math.cbrt(bomb.tnt)*15;
document.getElementById("out"+n).innerHTML =
`TNT:${bomb.tnt} | BLAST:${blast.toFixed(0)}m`;
}

function solve(){
const alt = document.getElementById("alt").value * 0.3048;
const spd = document.getElementById("spd").value * 0.447;
const dive = document.getElementById("dive").value * Math.PI/180;
const distTarget = document.getElementById("dist").value * 1000;

const focus = document.getElementById("focus").value;
const bomb = BOMBS[document.getElementById("bomb"+focus).selectedIndex];

let vx = spd * Math.cos(dive);
let vy = spd * Math.sin(dive);

let t = 0;
let x = 0;
let y = alt;

while(y > 0){
let drag = bomb.drag;
vx *= (1 - 0.01 * drag);
vy -= 9.81 * 0.1;
x += vx * 0.1;
y += vy * 0.1;
t += 0.1;
}

const error = x - distTarget;

let result = "HIT";
if(error > 50) result = "LONG";
if(error < -50) result = "SHORT";

document.getElementById("result").innerHTML =
`${result} | ERROR: ${error.toFixed(0)}m | TOF:${t.toFixed(1)}s`;
}

init();
