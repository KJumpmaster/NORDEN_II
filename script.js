
const BOMBS = [
  { id:"mk82", name:"Mk 82", nation:"usa" },
  { id:"fab500", name:"FAB-500", nation:"ussr" },
  { id:"gbu12", name:"GBU-12", nation:"usa" }
];

function getFilteredBombs() {
  const watup = document.getElementById("watupToggle").checked;
  const country = document.getElementById("country")?.value;
  if (watup) return BOMBS;
  return BOMBS.filter(b => b.nation === country);
}

function populateBombs() {
  console.log("Filtered bombs:", getFilteredBombs());
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("watupToggle").addEventListener("change", populateBombs);
});
