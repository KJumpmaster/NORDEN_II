const AC=[
{name:"A10",max:439,country:"usa"},
{name:"B52",max:650,country:"usa"},
{name:"BUCC",max:667,country:"britain"}
];

const BOMBS=["MK82","FAB500","GBU"];

function init(){
let c=document.getElementById("country");
["usa","britain"].forEach(x=>c.innerHTML+=`<option>${x}</option>`);
loadCountry();

[1,2,3].forEach(i=>{
let b=document.getElementById("bomb"+i);
let s=document.getElementById("salvo"+i);
BOMBS.forEach(x=>b.innerHTML+=`<option>${x}</option>`);
[1,2,4,6,8].forEach(x=>s.innerHTML+=`<option>${x}</option>`);
});
}

function loadCountry(){
let c=document.getElementById("country").value;
let a=document.getElementById("ac");
a.innerHTML="";
AC.filter(x=>x.country==c).forEach(x=>a.innerHTML+=`<option>${x.name}</option>`);
loadAircraft();
document.getElementById("flag").src="flag_"+c+".png";
}

function loadAircraft(){
let idx=document.getElementById("ac").selectedIndex;
let ac=AC[idx];
let spd=document.getElementById("spd");
spd.dataset.max=ac.max;
}

function clampSpeed(){
let spd=document.getElementById("spd");
let max=spd.dataset.max;
if(spd.value>max){
spd.value=max;
document.getElementById("adv").innerText="LIMIT "+max;
}
}

function solve(){
document.getElementById("res").innerText="SOLUTION READY";
}

init();
