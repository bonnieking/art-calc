const setupForm = document.getElementById("setup-form");
const detailsForm = document.getElementById("details-form");
const detailsSection = document.getElementById("details-section");
const paintingsGrid = document.getElementById("paintings-grid");
const results = document.getElementById("results");
const themeToggle = document.getElementById("theme-toggle");
const trippyCanvas = document.getElementById("trippy-canvas");

const MOBILE_STORAGE_KEY = "art-calc:last-layout";
const THEME_KEY = "art-calc:theme";
const THEMES = ["light", "dark", "rainbow", "trippy"];

const state = {
  eyeHeight: 57,
  wallWidth: 120,
  count: 2,
};

const trippy = {
  ctx: null,
  rafId: null,
  running: false,
  imageData: null,
  renderWidth: 0,
  renderHeight: 0,
  resizeBound: false,
};

function fmt(v) {
  return Number(v).toFixed(2).replace(/\.00$/, "");
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  if (themeToggle) {
    const labels = {
      light: "Theme: Light",
      dark: "Theme: Dark",
      rainbow: "Theme: Rainbow",
      trippy: "Theme: Trippy",
    };
    themeToggle.textContent = labels[theme] || "Theme";
  }

  if (theme === "trippy") {
    startTrippyBackground();
  } else {
    stopTrippyBackground();
  }
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (THEMES.includes(saved)) {
    applyTheme(saved);
    return;
  }

  applyTheme("light");
}

function ensureTrippyCanvasSize() {
  if (!trippyCanvas) return;
  trippyCanvas.width = window.innerWidth;
  trippyCanvas.height = window.innerHeight;

  trippy.renderWidth = Math.max(180, Math.floor(window.innerWidth / 3));
  trippy.renderHeight = Math.max(120, Math.floor(window.innerHeight / 3));
  trippy.imageData = null;
}

function fractalFrame(nowMs) {
  if (!trippy.running || !trippy.ctx || !trippyCanvas) return;

  const width = trippy.renderWidth;
  const height = trippy.renderHeight;
  if (!trippy.imageData || trippy.imageData.width !== width || trippy.imageData.height !== height) {
    trippy.imageData = trippy.ctx.createImageData(width, height);
  }

  const data = trippy.imageData.data;
  const t = nowMs * 0.0005;
  const cRe = -0.75 + Math.sin(t * 0.53) * 0.25;
  const cIm = 0.18 + Math.cos(t * 0.39) * 0.24;
  const zoom = 1.05 + Math.sin(t * 0.21) * 0.2;
  const maxIter = 46;
  let ptr = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let zx = ((x - width * 0.5) / (0.34 * width)) * zoom;
      let zy = ((y - height * 0.5) / (0.34 * height)) * zoom;
      let i = 0;

      while (zx * zx + zy * zy < 4 && i < maxIter) {
        const nextZx = zx * zx - zy * zy + cRe;
        zy = 2 * zx * zy + cIm;
        zx = nextZx;
        i += 1;
      }

      if (i === maxIter) {
        data[ptr] = 6;
        data[ptr + 1] = 2;
        data[ptr + 2] = 16;
      } else {
        const p = i / maxIter;
        data[ptr] = Math.floor(130 + 125 * Math.sin(6.3 * p + t * 2.4));
        data[ptr + 1] = Math.floor(130 + 125 * Math.sin(6.3 * p + t * 3.2 + 2));
        data[ptr + 2] = Math.floor(130 + 125 * Math.sin(6.3 * p + t * 3.8 + 4));
      }

      data[ptr + 3] = 255;
      ptr += 4;
    }
  }

  trippy.ctx.putImageData(trippy.imageData, 0, 0);
  trippy.ctx.imageSmoothingEnabled = true;
  trippy.ctx.drawImage(trippyCanvas, 0, 0, width, height, 0, 0, trippyCanvas.width, trippyCanvas.height);
  trippy.rafId = window.requestAnimationFrame(fractalFrame);
}

function startTrippyBackground() {
  if (!trippyCanvas || trippy.running) return;
  trippy.ctx = trippyCanvas.getContext("2d", { alpha: false });
  if (!trippy.ctx) return;

  ensureTrippyCanvasSize();
  if (!trippy.resizeBound) {
    window.addEventListener("resize", ensureTrippyCanvasSize);
    trippy.resizeBound = true;
  }

  trippy.running = true;
  trippy.rafId = window.requestAnimationFrame(fractalFrame);
}

function stopTrippyBackground() {
  if (!trippy.running) return;
  trippy.running = false;
  if (trippy.rafId) {
    window.cancelAnimationFrame(trippy.rafId);
    trippy.rafId = null;
  }
  if (trippy.ctx && trippyCanvas) {
    trippy.ctx.clearRect(0, 0, trippyCanvas.width, trippyCanvas.height);
  }
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    const currentIdx = THEMES.indexOf(current);
    const next = THEMES[(currentIdx + 1 + THEMES.length) % THEMES.length];
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  });
}

initTheme();

function createPaintingInputs(count) {
  paintingsGrid.innerHTML = "";

  for (let i = 0; i < count; i += 1) {
    const idx = i + 1;
    const row = document.createElement("fieldset");
    row.className = "painting-row";
    row.innerHTML = `
      <legend>Picture ${idx}</legend>
      <label>
        Height (in)
        <input name="height-${i}" type="number" step="0.1" min="0.1" value="24" required />
      </label>
      <label>
        Width (in)
        <input name="width-${i}" type="number" step="0.1" min="0.1" value="18" required />
      </label>
      <label>
        Wire distance (in)
        <input name="wire-${i}" type="number" step="0.1" min="0" value="3" required />
      </label>
    `;
    paintingsGrid.appendChild(row);
  }
}

function readPaintingValues(count) {
  const paintings = [];
  for (let i = 0; i < count; i += 1) {
    const height = Number(detailsForm.elements[`height-${i}`].value);
    const width = Number(detailsForm.elements[`width-${i}`].value);
    const wireDistance = Number(detailsForm.elements[`wire-${i}`].value);

    if ([height, width, wireDistance].some((v) => Number.isNaN(v) || v < 0)) {
      throw new Error("Please enter valid non-negative numbers for all picture fields.");
    }

    paintings.push({ height, width, wireDistance });
  }
  return paintings;
}

function calculateLayout({ eyeHeight, wallWidth, paintings }) {
  const totalWidth = paintings.reduce((sum, p) => sum + p.width, 0);
  if (totalWidth > wallWidth) {
    throw new Error("Total picture widths exceed wall width. Increase wall width or reduce picture widths.");
  }

  const gap = (wallWidth - totalWidth) / (paintings.length + 1);

  let cursor = gap;
  return paintings.map((p, i) => {
    const centerX = cursor + p.width / 2;
    const nailHeight = eyeHeight + p.height / 2 - p.wireDistance;

    cursor += p.width + gap;

    return {
      index: i + 1,
      nailHeight,
      lateralDistance: centerX,
      width: p.width,
      height: p.height,
    };
  });
}

function saveMobileLayout(rows, wallWidth) {
  const payload = {
    wallWidth,
    generatedAt: new Date().toISOString(),
    rows,
  };
  localStorage.setItem(MOBILE_STORAGE_KEY, JSON.stringify(payload));
}

function renderResults(rows, wallWidth) {
  const list = rows
    .map(
      (r) => `
      <tr>
        <td>Picture ${r.index}, Nail ${r.index}</td>
        <td>${fmt(r.nailHeight)} in</td>
        <td>${fmt(r.lateralDistance)} in from left wall</td>
      </tr>
    `
    )
    .join("");

  results.innerHTML = `
    <h2>Nail Placements</h2>
    <p class="hint">Wall width: ${fmt(wallWidth)} in. Pictures are evenly spaced horizontally with equal left/right margins and inter-picture gaps.</p>
    <p><a class="mobile-link" href="mobile.html" target="_blank" rel="noopener">Open mobile hanging table (big numbers)</a></p>
    <table>
      <thead>
        <tr>
          <th>Placement</th>
          <th>Nail Height</th>
          <th>Lateral Distance</th>
        </tr>
      </thead>
      <tbody>${list}</tbody>
    </table>
  `;

  results.classList.remove("hidden");
}

setupForm.addEventListener("submit", (e) => {
  e.preventDefault();

  state.eyeHeight = Number(document.getElementById("eyeHeight").value);
  state.count = Number(document.getElementById("paintingCount").value);
  state.wallWidth = Number(document.getElementById("wallWidth").value);

  if ([state.eyeHeight, state.count, state.wallWidth].some((v) => Number.isNaN(v) || v <= 0)) {
    results.classList.remove("hidden");
    results.innerHTML = "<p class='error'>Please enter valid positive values in the initial form.</p>";
    return;
  }

  createPaintingInputs(state.count);
  detailsSection.classList.remove("hidden");
  results.classList.add("hidden");
});

detailsForm.addEventListener("submit", (e) => {
  e.preventDefault();

  try {
    const paintings = readPaintingValues(state.count);
    const rows = calculateLayout({
      eyeHeight: state.eyeHeight,
      wallWidth: state.wallWidth,
      paintings,
    });
    saveMobileLayout(rows, state.wallWidth);
    renderResults(rows, state.wallWidth);
  } catch (err) {
    results.classList.remove("hidden");
    results.innerHTML = `<p class='error'>${err.message}</p>`;
  }
});
