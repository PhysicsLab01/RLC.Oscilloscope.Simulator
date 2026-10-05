# RLC Oscilloscope Simulator — Web Version

This project converts the supplied MATLAB series-RLC oscilloscope simulation to a browser-based application using:

- HTML
- CSS
- JavaScript
- HTML Canvas for the four oscilloscope displays

## Files

- `index.html` — main web page
- `style.css` — visual layout and styling
- `simulator.js` — RLC calculations, controls and plots

## Run locally

No installation is required.

1. Keep all three files in the same folder.
2. Double-click `index.html`.
3. The simulator opens in your web browser.

## Publish online

### GitHub Pages

1. Create a GitHub account.
2. Create a new public repository, for example `rlc-oscilloscope`.
3. Upload `index.html`, `style.css`, and `simulator.js`.
4. Open the repository's Settings → Pages.
5. Select deployment from the main branch.
6. GitHub will provide a public web address.
7. That address can be linked from Google Sites.

### Google Sites

Google Sites can serve as the instructional page, while the simulator itself can be hosted on GitHub Pages.

You can add the GitHub Pages URL to Google Sites using an Embed element.

## Mathematical model

The web version follows the equations used in the supplied MATLAB source:

Z = R + j(XL - XC)

XL = omega L

XC = 1/(omega C)

|Z| = sqrt(R^2 + (XL-XC)^2)

Irms = Vrms / |Z|

phase = atan2(XL-XC, R)

Vpeak = sqrt(2) Vrms

Ipeak = sqrt(2) Irms

The plotted waveforms follow the source code:

Vs = Vpeak sin(omega t)

I = Ipeak sin(omega t - phase)

VR = R Ipeak sin(omega t - phase)

VL = XL Ipeak sin(omega t - phase + pi/2)

VC = XC Ipeak sin(omega t - phase - pi/2)

## Notes

The original MATLAB source contains the Circuit Information and Oscilloscope Measurements panels as commented-out code, but later attempts to update those objects. The web version intentionally omits those panels, consistent with the requested display.

The four oscilloscope plots use independent left and right vertical scales, corresponding to voltage and current.


## Version 2 — Circuit Analysis and Resonance

This version adds a live analysis panel below the oscilloscope showing **Xₗ**, **X꜀**, **|Z|**, **I_RMS**, circuit phase **φ**, and the calculated resonant frequency **f₀**.

For the series RLC circuit, the resonant frequency is

`f₀ = 1 / (2π√(LC))`

The simulator also displays **RESONANCE REACHED** when the selected frequency is sufficiently close to f₀ (1% tolerance) or when Xₗ and X꜀ are sufficiently close.


## RLC Web Simulator v3 – Component ranges

- Resistance R: 1 Ω–1,000,000 Ω (initial value 100 Ω)
- Inductance L: 0.1–100 mH (unchanged; initial value 10 mH)
- Capacitance C: 1–1,000,000 pF (initial value 1,000,000 pF = 1 µF)

Capacitance is displayed in pF and converted to farads internally (C × 10⁻¹²) for the circuit calculations.


## Version 4 – Focused Component Ranges

- Resistance R: 1 kΩ to 50 kΩ (1,000–50,000 Ω), initial 1 kΩ
- Inductance L: 1–10 mH, initial 10 mH
- Capacitance C: 100–5,000 pF, initial 1,000 pF


## Updated Frequency Range

Frequency f: 10 Hz to 1,000,000 Hz (1 MHz), initial value 1,000 Hz.
