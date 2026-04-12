const AC = [
{ name:"B52", speed:520, maxSpeed:650 },
{ name:"A10", speed:350, maxSpeed:439 }
];

const BOMBS = [
{ name:"MK82" },
{ name:"MK84" },
{ name:"FAB500" }
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
const ac = AC[document.getElementById("ac").selectedIndex];
const spd = document.getElementById("spd");
spd.value = ac.speed;
spd.dataset.max = ac.maxSpeed;
}

function clampSpeed(){
const spd = document.getElementById("spd");
const max = spd.dataset.max;
if(spd.value > max){
spd.value = max;
}
}

function applySalvo(){
const focus = document.getElementById("focus").value;
const salvo = parseInt(document.getElementById("salvo"+focus).value);

document.querySelectorAll(".pylon").forEach(p=>p.classList.remove("active"));

let order = ["p4","p5","p3","p6","p2","p7","p1","p8"];

for(let i=0;i<salvo;i++){
document.getElementById(order[i]).classList.add("active");
}
}

init();
