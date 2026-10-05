/*
  RLC OSCILLOSCOPE SIMULATOR
  Web version based on the original MATLAB simulation by Miguel Nieto.

  The mathematical model follows the original MATLAB code:
    Z = R + j(XL - XC)
    Irms = Vrms / |Z|
    phase = angle(Z)
    Vs = Vpeak sin(omega t)
    I  = Ipeak sin(omega t - phase)
*/

const defaults = {
  R: 100,
  L_mH: 10,
  C_uF: 1,
  f: 1000,
  V: 5,
  timeDiv: 0.5,
  voltDiv: 2,
  currDiv: 0.02
};

const controls = {
  R: { slider: document.getElementById("rSlider"), field: document.getElementById("rValue") },
  L: { slider: document.getElementById("lSlider"), field: document.getElementById("lValue") },
  C: { slider: document.getElementById("cSlider"), field: document.getElementById("cValue") },
  f: { slider: document.getElementById("fSlider"), field: document.getElementById("fValue") },
  V: { slider: document.getElementById("vSlider"), field: document.getElementById("vValue") }
};

const timeDiv = document.getElementById("timeDiv");
const voltDiv = document.getElementById("voltDiv");
const currDiv = document.getElementById("currDiv");
const resetButton = document.getElementById("resetButton");

const canvases = [
  document.getElementById("plot1"),
  document.getElementById("plot2"),
  document.getElementById("plot3"),
  document.getElementById("plot4")
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function syncFromSlider(name) {
  controls[name].field.value = controls[name].slider.value;
  updateSimulation();
}

function syncFromField(name) {
  const slider = controls[name].slider;
  const field = controls[name].field;
  let value = Number(field.value);

  if (!Number.isFinite(value)) {
    value = Number(slider.value);
  }

  value = clamp(value, Number(slider.min), Number(slider.max));
  slider.value = value;
  field.value = value;
  updateSimulation();
}

Object.keys(controls).forEach(name => {
  controls[name].slider.addEventListener("input", () => syncFromSlider(name));
  controls[name].field.addEventListener("change", () => syncFromField(name));
  controls[name].field.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      syncFromField(name);
    }
  });
});

[timeDiv, voltDiv, currDiv].forEach(el => {
  el.addEventListener("change", updateSimulation);
});

resetButton.addEventListener("click", () => {
  controls.R.slider.value = defaults.R;
  controls.L.slider.value = defaults.L_mH;
  controls.C.slider.value = defaults.C_uF;
  controls.f.slider.value = defaults.f;
  controls.V.slider.value = defaults.V;

  controls.R.field.value = defaults.R;
  controls.L.field.value = defaults.L_mH;
  controls.C.field.value = defaults.C_uF;
  controls.f.field.value = defaults.f;
  controls.V.field.value = defaults.V;

  timeDiv.value = defaults.timeDiv;
  voltDiv.value = defaults.voltDiv;
  currDiv.value = defaults.currDiv;

  updateSimulation();
});

function resizeCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(300, rect.width);
  const height = Math.max(260, rect.height);

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  return { ctx, width, height };
}

function drawPlot(canvas, config) {
  const { ctx, width, height } = resizeCanvas(canvas);

  const margin = { left: 58, right: 58, top: 50, bottom: 45 };
  const x0 = margin.left;
  const x1 = width - margin.right;
  const y0 = margin.top;
  const y1 = height - margin.bottom;
  const plotW = x1 - x0;
  const plotH = y1 - y0;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Title
  ctx.fillStyle = "#222";
  ctx.font = "bold 14px Arial";
  ctx.textAlign = "center";
  ctx.fillText(config.title, width / 2, 21);

  // Grid
  ctx.strokeStyle = "#d7d7d7";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);

  const verticalDivisions = 10;
  const horizontalDivisions = 8;

  for (let i = 0; i <= verticalDivisions; i++) {
    const x = x0 + (i / verticalDivisions) * plotW;
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.lineTo(x, y1);
    ctx.stroke();
  }

  for (let i = 0; i <= horizontalDivisions; i++) {
    const y = y0 + (i / horizontalDivisions) * plotH;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
  }

  ctx.setLineDash([]);

  // Border
  ctx.strokeStyle = "#777";
  ctx.lineWidth = 1;
  ctx.strokeRect(x0, y0, plotW, plotH);

  // Center horizontal/vertical axes
  ctx.strokeStyle = "#999";
  ctx.beginPath();
  ctx.moveTo(x0, y0 + plotH / 2);
  ctx.lineTo(x1, y0 + plotH / 2);
  ctx.stroke();

  // Data transforms
  const xMin = 0;
  const xMax = config.xMax;
  const leftMin = -config.leftLimit;
  const leftMax = config.leftLimit;
  const rightMin = -config.rightLimit;
  const rightMax = config.rightLimit;

  const xToPx = x => x0 + ((x - xMin) / (xMax - xMin)) * plotW;
  const leftToPy = y => y1 - ((y - leftMin) / (leftMax - leftMin)) * plotH;
  const rightToPy = y => y1 - ((y - rightMin) / (rightMax - rightMin)) * plotH;

  // Left labels
  ctx.fillStyle = "#333";
  ctx.font = "11px Arial";
  ctx.textAlign = "right";
  for (let i = 0; i <= 4; i++) {
    const val = leftMax - i * (leftMax - leftMin) / 4;
    const py = y0 + i * plotH / 4;
    ctx.fillText(formatAxis(val), x0 - 7, py + 4);
  }

  // Right labels
  ctx.textAlign = "left";
  for (let i = 0; i <= 4; i++) {
    const val = rightMax - i * (rightMax - rightMin) / 4;
    const py = y0 + i * plotH / 4;
    ctx.fillText(formatAxis(val), x1 + 7, py + 4);
  }

  // X labels
  ctx.textAlign = "center";
  for (let i = 0; i <= 5; i++) {
    const val = xMax * i / 5;
    const px = x0 + i * plotW / 5;
    ctx.fillText(formatAxis(val), px, y1 + 17);
  }

  // Axis labels
  ctx.font = "12px Arial";
  ctx.fillText("Time (ms)", (x0 + x1) / 2, height - 8);

  ctx.save();
  ctx.translate(14, (y0 + y1) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(config.leftLabel, 0, 0);
  ctx.restore();

  ctx.save();
  ctx.translate(width - 12, (y0 + y1) / 2);
  ctx.rotate(Math.PI / 2);
  ctx.fillText(config.rightLabel, 0, 0);
  ctx.restore();

  // Plot helper
  function drawSeries(values, color, lineDash, transform) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, y0, plotW, plotH);
    ctx.clip();

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.7;
    ctx.setLineDash(lineDash || []);

    ctx.beginPath();
    for (let i = 0; i < values.length; i++) {
      const px = xToPx(config.t[i]);
      const py = transform(values[i]);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    ctx.restore();
  }

  drawSeries(config.leftData, "#1769aa", [], leftToPy);
  drawSeries(config.rightData, "#c62828", [7, 5], rightToPy);

  // Legend
  ctx.setLineDash([]);
  ctx.font = "11px Arial";
  ctx.textAlign = "left";

  ctx.strokeStyle = "#1769aa";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0 + 10, y0 + 14);
  ctx.lineTo(x0 + 32, y0 + 14);
  ctx.stroke();
  ctx.fillStyle = "#222";
  ctx.fillText(config.leftLegend, x0 + 38, y0 + 18);

  ctx.strokeStyle = "#c62828";
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(x0 + 135, y0 + 14);
  ctx.lineTo(x0 + 157, y0 + 14);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#222";
  ctx.fillText(config.rightLegend, x0 + 163, y0 + 18);
}

function formatAxis(value) {
  const abs = Math.abs(value);
  if (abs === 0) return "0";
  if (abs >= 1000 || abs < 0.01) return value.toExponential(1);
  if (abs < 1) return value.toFixed(3);
  if (abs < 10) return value.toFixed(2);
  if (abs < 100) return value.toFixed(1);
  return value.toFixed(0);
}


function formatAnalysis(value, decimals = 3) {
  if (!Number.isFinite(value)) return "—";
  const a = Math.abs(value);
  if (a !== 0 && (a >= 1e5 || a < 1e-3)) return value.toExponential(3);
  return value.toFixed(decimals);
}

function formatFrequency(value) {
  if (!Number.isFinite(value)) return "—";
  return value >= 1000 ? (value / 1000).toFixed(3) + " k" : value.toFixed(1);
}

function updateCircuitAnalysis(R, L, C, f, Vrms, XL, XC, Zmag, Irms, phase) {
  const f0 = 1 / (2 * Math.PI * Math.sqrt(L * C));
  const relativeFrequencyError = Math.abs(f - f0) / f0;
  const relativeReactanceError = Math.abs(XL - XC) / Math.max(XL, XC, 1e-12);
  // A 1% tolerance is appropriate for a slider-based educational simulator.
  const atResonance = relativeFrequencyError <= 0.01 || relativeReactanceError <= 0.01;

  document.getElementById("xlValue").textContent = formatAnalysis(XL, 3);
  document.getElementById("xcValue").textContent = formatAnalysis(XC, 3);
  document.getElementById("zValue").textContent = formatAnalysis(Zmag, 3);
  document.getElementById("irmsValue").textContent = formatAnalysis(Irms, 4);
  document.getElementById("phaseValue").textContent = (phase * 180 / Math.PI).toFixed(2);
  document.getElementById("resonantFreqValue").textContent = formatFrequency(f0);

  const indicator = document.getElementById("resonanceIndicator");
  const status = document.getElementById("resonanceText");
  const detail = document.getElementById("resonanceDetail");
  indicator.classList.toggle("at-resonance", atResonance);

  if (atResonance) {
    status.textContent = "RESONANCE REACHED";
    detail.innerHTML = "X<sub>L</sub> ≈ X<sub>C</sub> &nbsp;•&nbsp; φ ≈ 0° &nbsp;•&nbsp; I<sub>RMS</sub> is near its maximum for the selected V and R.";
  } else {
    const relation = XL > XC ? "Inductive: X<sub>L</sub> &gt; X<sub>C</sub>" : "Capacitive: X<sub>C</sub> &gt; X<sub>L</sub>";
    detail.innerHTML = relation + " &nbsp;•&nbsp; f = " + f.toFixed(1) + " Hz &nbsp;•&nbsp; f<sub>0</sub> = " + formatFrequency(f0) + " Hz";
  }
}

function updateSimulation() {
  const R = Number(controls.R.slider.value);
  const L = Number(controls.L.slider.value) * 1e-3;
  const C = Number(controls.C.slider.value) * 1e-12;
  const f = Number(controls.f.slider.value);
  const Vrms = Number(controls.V.slider.value);

  const omega = 2 * Math.PI * f;
  const XL = omega * L;
  const XC = 1 / (omega * C);

  const realZ = R;
  const imagZ = XL - XC;
  const Zmag = Math.hypot(realZ, imagZ);
  const phase = Math.atan2(imagZ, realZ);

  const Irms = Vrms / Zmag;
  const Vpeak = Math.sqrt(2) * Vrms;
  const Ipeak = Math.sqrt(2) * Irms;

  const timeDivMs = Number(timeDiv.value);
  const totalTimeMs = 10 * timeDivMs;
  const totalTime = totalTimeMs * 1e-3;
  const N = 3000;

  const t = new Array(N);
  const Vs = new Array(N);
  const I = new Array(N);
  const VR = new Array(N);
  const VL = new Array(N);
  const VC = new Array(N);

  for (let i = 0; i < N; i++) {
    const ti = totalTime * i / (N - 1);
    t[i] = ti * 1000; // ms

    Vs[i] = Vpeak * Math.sin(omega * ti);
    I[i] = Ipeak * Math.sin(omega * ti - phase);
    VR[i] = R * Ipeak * Math.sin(omega * ti - phase);
    VL[i] = XL * Ipeak * Math.sin(omega * ti - phase + Math.PI / 2);
    VC[i] = XC * Ipeak * Math.sin(omega * ti - phase - Math.PI / 2);
  }

  const voltLimit = 4 * Number(voltDiv.value);
  const currLimit = 4 * Number(currDiv.value);

  drawPlot(canvases[0], {
    title: "Source Voltage and Circuit Current",
    t,
    xMax: totalTimeMs,
    leftData: Vs,
    rightData: I,
    leftLimit: voltLimit,
    rightLimit: currLimit,
    leftLabel: "Voltage (V)",
    rightLabel: "Current (A)",
    leftLegend: "Voltage",
    rightLegend: "Current"
  });

  drawPlot(canvases[1], {
    title: "Resistor: V_R and Current",
    t,
    xMax: totalTimeMs,
    leftData: VR,
    rightData: I,
    leftLimit: voltLimit,
    rightLimit: currLimit,
    leftLabel: "V_R (V)",
    rightLabel: "Current (A)",
    leftLegend: "V_R",
    rightLegend: "Current"
  });

  drawPlot(canvases[2], {
    title: "Inductor: V_L and Current",
    t,
    xMax: totalTimeMs,
    leftData: VL,
    rightData: I,
    leftLimit: voltLimit,
    rightLimit: currLimit,
    leftLabel: "V_L (V)",
    rightLabel: "Current (A)",
    leftLegend: "V_L",
    rightLegend: "Current"
  });

  drawPlot(canvases[3], {
    title: "Capacitor: V_C and Current",
    t,
    xMax: totalTimeMs,
    leftData: VC,
    rightData: I,
    leftLimit: voltLimit,
    rightLimit: currLimit,
    leftLabel: "V_C (V)",
    rightLabel: "Current (A)",
    leftLegend: "V_C",
    rightLegend: "Current"
  });

  updateCircuitAnalysis(R, L, C, f, Vrms, XL, XC, Zmag, Irms, phase);
}

window.addEventListener("resize", updateSimulation);
updateSimulation();
