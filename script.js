const form = document.getElementById("calc-form");
const result = document.getElementById("result");

function fmt(value) {
  return Number(value).toFixed(2).replace(/\.00$/, "");
}

function calculate() {
  const centerHeight = Number(document.getElementById("centerHeight").value);
  const paintingHeight = Number(document.getElementById("paintingHeight").value);
  const drop = Number(document.getElementById("drop").value);
  const units = document.getElementById("units").value;

  if ([centerHeight, paintingHeight, drop].some((v) => Number.isNaN(v) || v < 0)) {
    result.textContent = "Enter valid positive numbers.";
    return;
  }

  const nailHeight = centerHeight + paintingHeight / 2 - drop;
  const topOfPainting = centerHeight + paintingHeight / 2;

  result.innerHTML =
    `<strong>Nail height:</strong> ${fmt(nailHeight)} ${units} from floor` +
    `<br><strong>Top of painting:</strong> ${fmt(topOfPainting)} ${units}`;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  calculate();
});

calculate();
