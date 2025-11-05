/* script.js — core generator for Zen Pattern Studio
   - seeded RNG
   - SVG drawing routines for several shapes
   - UI bindings for sliders/select/buttons
   - randomize and redraw logic
*/

const DOM = {
  svg: document.getElementById('pattern'),
  seed: document.getElementById('seed'),
  seedVal: document.getElementById('seedVal'),
  complexity: document.getElementById('complexity'),
  complexityVal: document.getElementById('complexityVal'),
  density: document.getElementById('density'),
  densityVal: document.getElementById('densityVal'),
  paletteSize: document.getElementById('paletteSize'),
  paletteVal: document.getElementById('paletteVal'),
  shape: document.getElementById('shape'),
  randomize: document.getElementById('randomize'),
  exportBtn: document.getElementById('export'),
  presetName: document.getElementById('presetName'),
  savePreset: document.getElementById('savePreset'),
  presetsList: document.getElementById('presetsList'),
};

const state = {
  seed: Number(DOM.seed.value),
  complexity: Number(DOM.complexity.value),
  density: Number(DOM.density.value),
  paletteSize: Number(DOM.paletteSize.value),
  shape: DOM.shape.value,
  width: 900,
  height: 700,
  palette: []
};

// seeded random (Mulberry32) for deterministic patterns
function mulberry32(seed) {
  let t = seed >>> 0;
  return function() {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ t >>> 15, 1 | t);
    r ^= r + Math.imul(r ^ r >>> 7, 61 | r);
    return ((r ^ r >>> 14) >>> 0) / 4294967296;
  };
}

// generate a pleasant palette from RNG
function generatePalette(rng, size) {
  // base hue
  const base = Math.floor(rng() * 360);
  const palette = [];
  for (let i = 0; i < size; i++) {
    const hue = (base + i * Math.round(360 / size) + Math.floor(rng() * 20 - 10)) % 360;
    const sat = 50 + Math.floor(rng() * 30);
    const light = 45 + Math.floor(rng() * 20);
    palette.push(`hsl(${hue} ${sat}% ${light}%)`);
  }
  return palette;
}

// clear svg
function clearSVG() {
  while (DOM.svg.firstChild) DOM.svg.removeChild(DOM.svg.firstChild);
}

// draw pattern
function draw() {
  clearSVG();
  const rng = mulberry32(state.seed);
  state.palette = generatePalette(rng, state.paletteSize);

  const cols = Math.max(4, Math.floor(state.complexity * (state.width / 900)));
  const rows = Math.max(4, Math.floor(state.complexity * (state.height / 700)));
  const gapX = state.width / cols;
  const gapY = state.height / rows;

  // background rect for export friendliness
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('width', state.width);
  bg.setAttribute('height', state.height);
  bg.setAttribute('fill', '#071827');
  DOM.svg.appendChild(bg);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (rng() > state.density) continue; // sparseness

      const cx = (x + 0.5 + (rng() - 0.5) * 0.6) * gapX;
      const cy = (y + 0.5 + (rng() - 0.5) * 0.6) * gapY;
      const index = Math.floor(rng() * state.palette.length);
      const color = state.palette[index];
      const scale = (0.25 + rng() * 0.9) * Math.min(gapX, gapY) * 0.6;

      drawShape(state.shape, cx, cy, scale, color, rng, DOM.svg);
    }
  }
}

// draw a single shape into svg parent
function drawShape(type, cx, cy, size, color, rng, parent) {
  switch (type) {
    case 'circle': {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', cx.toFixed(2));
      c.setAttribute('cy', cy.toFixed(2));
      c.setAttribute('r', (size * (0.5 + rng() * 0.9)).toFixed(2));
      c.setAttribute('fill', color);
      c.setAttribute('fill-opacity', 0.92 - rng() * 0.3);
      parent.appendChild(c);
      break;
    }
    case 'rect': {
      const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      const s = size * (0.45 + rng() * 0.9);
      r.setAttribute('x', (cx - s / 2).toFixed(2));
      r.setAttribute('y', (cy - s / 2).toFixed(2));
      r.setAttribute('width', s.toFixed(2));
      r.setAttribute('height', s.toFixed(2));
      r.setAttribute('rx', (s * 0.2).toFixed(2));
      r.setAttribute('fill', color);
      r.setAttribute('fill-opacity', 0.9 - rng() * 0.4);
      r.setAttribute('transform', `rotate(${(rng() * 50 - 25).toFixed(2)} ${cx.toFixed(2)} ${cy.toFixed(2)})`);
      parent.appendChild(r);
      break;
    }
    case 'line': {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      const count = 3 + Math.floor(rng() * 5);
      for (let i = 0; i < count; i++) {
        const x1 = cx - size * (0.5 + rng() * 0.4);
        const x2 = cx + size * (0.5 + rng() * 0.4);
        const y = cy + (rng() - 0.5) * size * 0.4;
        const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        l.setAttribute('x1', x1.toFixed(2));
        l.setAttribute('y1', y.toFixed(2));
        l.setAttribute('x2', x2.toFixed(2));
        l.setAttribute('y2', y.toFixed(2));
        l.setAttribute('stroke', color);
        l.setAttribute('stroke-width', (1 + rng() * 3).toFixed(2));
        l.setAttribute('stroke-linecap', 'round');
        l.setAttribute('opacity', 0.6 + rng() * 0.4);
        g.appendChild(l);
      }
      g.setAttribute('transform', `rotate(${(rng() * 180 - 90).toFixed(2)} ${cx.toFixed(2)} ${cy.toFixed(2)})`);
      parent.appendChild(g);
      break;
    }
    case 'petal': {
      // draw some petal-like paths
      const petals = 4 + Math.floor(rng() * 5);
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      for (let i = 0; i < petals; i++) {
        const angle = (i / petals) * Math.PI * 2;
        const px = cx + Math.cos(angle) * size * 0.4;
        const py = cy + Math.sin(angle) * size * 0.4;
        const rx = size * (0.2 + rng() * 0.4);
        const ry = size * (0.45 + rng() * 0.35);
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        path.setAttribute('cx', px.toFixed(2));
        path.setAttribute('cy', py.toFixed(2));
        path.setAttribute('rx', rx.toFixed(2));
        path.setAttribute('ry', ry.toFixed(2));
        path.setAttribute('fill', color);
        path.setAttribute('fill-opacity', (0.6 + rng() * 0.4).toFixed(2));
        path.setAttribute('transform', `rotate(${(angle * (180/Math.PI) + rng()*40 - 20).toFixed(2)} ${px.toFixed(2)} ${py.toFixed(2)})`);
        group.appendChild(path);
      }
      parent.appendChild(group);
      break;
    }
    default:
      break;
  }
}

// UI bindings
function syncUItoState() {
  DOM.seedVal.textContent = state.seed;
  DOM.complexityVal.textContent = state.complexity;
  DOM.densityVal.textContent = state.density.toFixed(2);
  DOM.paletteVal.textContent = state.paletteSize;
}

function readControls() {
  state.seed = Number(DOM.seed.value);
  state.complexity = Number(DOM.complexity.value);
  state.density = Number(DOM.density.value);
  state.paletteSize = Number(DOM.paletteSize.value);
  state.shape = DOM.shape.value;
  syncUItoState();
}

// attach events
function attachEvents() {
  ['seed','complexity','density','paletteSize','shape'].forEach(id=>{
    DOM[id].addEventListener('input', ()=> {
      readControls();
      draw();
    });
  });
  DOM.randomize.addEventListener('click', ()=> {
    const r = Math.floor(Math.random() * 9999);
    DOM.seed.value = r;
    DOM.paletteSize.value = 3 + Math.floor(Math.random() * 6);
    DOM.complexity.value = 3 + Math.floor(Math.random() * 18);
    DOM.density.value = (0.3 + Math.random() * 0.7).toFixed(2);
    DOM.shape.value = ['circle','rect','line','petal'][Math.floor(Math.random()*4)];
    readControls();
    draw();
  });

  // export action (placeholder for now)
  DOM.exportBtn.addEventListener('click', ()=> {
    exportPNG();
  });
}

// export SVG to PNG
function exportPNG() {
  const svg = DOM.svg;
  const clone = svg.cloneNode(true);
  // inline styles for background (so it appears in PNG)
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const serializer = new XMLSerializer();
  const str = serializer.serializeToString(clone);
  const blob = new Blob([str], {type:'image/svg+xml;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = state.width;
    canvas.height = state.height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#071827';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    const png = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = png;
    a.download = `zen-pattern-${state.seed}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  img.src = url;
}

// init
function init() {
  readControls();
  attachEvents();
  draw();
}

document.addEventListener('DOMContentLoaded', init);
