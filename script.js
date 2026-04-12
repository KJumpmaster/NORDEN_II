const AC=[{name:"A10",max:439,country:"usa"},{name:"B52",max:650,country:"usa"}];
const BOMBS=["MK82","FAB500","GBU"];

function init(){
let c=document.getElementById("country");
["usa"].forEach(x=>c.innerHTML+=`<option>${x}</option>`);
loadCountry();

[1,2,3].forEach(i=>{
let b=document.getElementById("bomb"+i);
let s=document.getElementById("salvo"+i);
BOMBS.forEach(x=>b.innerHTML+=`<option>${x}</option>`);
[1,2,4,6,8].forEach(x=>s.innerHTML+=`<option>${x}</option>`);
});
}

function loadCountry(){
let a=document.getElementById("ac");
a.innerHTML="";
AC.forEach(x=>a.innerHTML+=`<option>${x.name}</option>`);
document.getElementById("flag").src="flag_usa.png";
loadAircraft();
}

function loadAircraft(){
let idx=document.getElementById("ac").selectedIndex;
let ac=AC[idx];
document.getElementById("spd").dataset.max=ac.max;
}

function clampSpeed(){
let spd=document.getElementById("spd");
let max=spd.dataset.max;
if(spd.value>max){
spd.value=max;
document.getElementById("adv").innerText="LIMIT "+max;
}
}

function solve(){document.getElementById("res").innerText="READY";}

init();
