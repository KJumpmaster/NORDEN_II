const AC=[
{name:"B52",speed:520,maxSpeed:650},
{name:"A10",speed:350,maxSpeed:439}
];

const BOMBS=["MK82","MK84","FAB500"];

function init(){
let ac=document.getElementById("ac");
AC.forEach(a=>ac.innerHTML+=`<option>${a.name}</option>`);

[1,2,3].forEach(i=>{
let b=document.getElementById("bomb"+i);
BOMBS.forEach(x=>b.innerHTML+=`<option>${x}</option>`);
});
}

function loadAC(){
let ac=AC[document.getElementById("ac").selectedIndex];
let spd=document.getElementById("spd");
spd.value=ac.speed;
spd.dataset.max=ac.maxSpeed;
}

function clampSpeed(){
let spd=document.getElementById("spd");
let max=spd.dataset.max;
let adv=document.getElementById("advisory");

if(spd.value>max){
spd.value=max;
adv.innerText=`LIMIT: MAX SPEED ${max}`;
}
}

function applySalvo(){
let f=document.getElementById("focus").value;
let salvo=parseInt(document.getElementById("salvo"+f).value);

document.querySelectorAll(".pylon").forEach(p=>p.classList.remove("active"));

let order=["p4","p5","p3","p6","p2","p7","p1","p8"];

for(let i=0;i<salvo;i++){
document.getElementById(order[i]).classList.add("active");
}
}

function solve(){
document.getElementById("result").innerText="SOLUTION READY";
}

init();
