// Independent re-computation of the headline numbers stated in the experiment pages.
// No dependencies: node tests/check_physics.mjs   (Node 18+)
// Every check recomputes a number from a textbook formula and the constants the page itself
// declares, then compares it with the value the page states. "page" is the experiment file
// where the statement appears. Exit code 1 if any check fails.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'experiments');
const src = (f) => readFileSync(join(root, f + '.html'), 'utf8');
const it = (x, d) => x.toLocaleString('it-IT', { minimumFractionDigits: d, maximumFractionDigits: d });

const PI = Math.PI;
const C = 299792458;            // m/s, exact by SI definition
const H = 6.62607015e-34;       // J s, exact
const HBAR = H / (2 * PI);
const KB = 1.380649e-23;        // J/K, exact
const G = 6.67430e-11;          // CODATA 2022 as used in the pages
const ME = 9.1093837015e-31;    // kg, CODATA 2018 as used in the pages

let fail = 0, n = 0;
function check(page, what, computed, stated, relTol, token) {
  n++;
  const ok = Math.abs(computed - stated) <= relTol * Math.abs(stated);
  // The pages keep the Italian number format in their source dictionary and show English formatting
  // (en-US) when run, so a token is looked for in both forms: '870,50' and '870.50', '256.965' and '256,965'.
  const enTok = token ? (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(token) ? token.replace(/\./g, '\u0000').replace(',', '.').replace(/\u0000/g, ',') : token.replace(',', '.')) : '';
  const inSrc = token ? ((src(page).includes(token) || src(page).includes(enTok)) ? 'text found' : 'text not static') : '';
  console.log(`${ok ? 'PASS' : 'FAIL'}  [${page}] ${what}: computed ${computed.toPrecision(6)} vs stated ${stated}  ${inSrc}`);
  if (!ok) fail++;
}

// 03 microwave: c = 2 * d * f
{
  const d = 0.06118213428571428, f = 2450e6;   // half-wavelength implied by the page's reference case
  check('luce_microonde', 'c = 2 d f (m/s)', 2 * d * f, C, 1e-6);
  check('luce_microonde', 'wavelength 12.24 cm', 2 * d * 100, 12.24, 1e-3, '12,24');
  const beat = 60 / 70;
  check('luce_microonde', 'seconds between heartbeats at 70/min', beat, 0.857, 1e-3, '0,857');
  check('luce_microonde', 'light path in one beat (km)', C / 1000 * beat, 256965, 1e-5, '256.965');
  check('luce_microonde', 'Earth circumferences', C / 1000 * beat / 40075, 6.41, 1e-3);
  check('luce_microonde', 'wavelength / 550 nm', 2 * d / 550e-9, 222480, 1e-3, '222.480');
  check('luce_microonde', 'Maxwell vs Fizeau gap (%)', (3.14858e8 - 3.1074e8) / 3.14858e8 * 100, 1.31, 5e-3, '1,31%');
  check('luce_microonde', 'example 6.1 cm at 2450 MHz -> offset %', (2 * 0.061 * 2450e6 - C) / C * 100, -0.30, 0.02);
}
// 02 Doppler
{
  const f0 = 800, c = 343, v = 100 / 3.6;
  const fa = f0 * c / (c - v), fr = f0 * c / (c + v);
  check('doppler', 'approaching 870.50 Hz', fa, 870.50, 1e-4, '870,50');
  check('doppler', 'receding 740.07 Hz', fr, 740.07, 1e-4, '740,07');
  check('doppler', 'jump 130.43 Hz', fa - fr, 130.43, 1e-4, '130,43');
  check('doppler', 'jump in semitones 2.81', 12 * Math.log2(fa / fr), 2.81, 1e-3, '2,810');
  check('doppler', 'moving listener 864.79 Hz', f0 * (c + v) / c, 864.79, 1e-4, '864,79');
  check('doppler', 'octave speed v=c/3 in km/h', c / 3 * 3.6, 411.6, 1e-3, '411,6');
  const cAria = (T) => 331.3 * Math.sqrt(1 + T / 273.15);
  const salto = (cc) => f0 * 2 * cc * v / (cc * cc - v * v);
  check('doppler', 'jump at -5 C', salto(cAria(-5)), 136.4, 2e-3, '136,4');
  check('doppler', 'jump at 35 C', salto(cAria(35)), 127.1, 2e-3, '127,1');
  check('doppler', 'c at 20 C = 343.2', cAria(20), 343.2, 1e-3, '343,2');
  // heard at the instant the source passes abeam (d = 5 m): emission time te = -d / sqrt(c^2 - v^2)
  const d = 5, te = -d / Math.sqrt(c * c - v * v), x = v * te, r = Math.hypot(x, d);
  check('doppler', 'note heard at the exact overtake 805.3 Hz', f0 * c / (c + v * x / r), 805.3, 1e-3, '805,3');
}
// 04 weigh a planet: M = 4 pi^2 r^3 / (G T^2)
{
  const M = (r, T) => 4 * PI * PI * r ** 3 / (G * T * T);
  const GM = 3.986004418e14, rI = 6791e3;
  check('pesare_pianeta', 'ISS period 5569.4 s from GM', 2 * PI * Math.sqrt(rI ** 3 / GM), 5569.4, 1e-4, '5569,4');
  check('pesare_pianeta', 'ISS weighs Earth (kg)', M(rI, 5569), 5.972e24, 5e-3);
  const Mm = M(384400e3, 27.32166 * 86400);
  check('pesare_pianeta', 'Moon orbit gives Earth+Moon 6.0292e24', Mm, 6.0292e24, 1e-3, '6,0292');
  check('pesare_pianeta', 'Earth+Moon table value', 5.972e24 + 7.346e22, 6.0456e24, 1e-3, '6,0456');
  check('pesare_pianeta', 'Io weighs Jupiter (kg)', M(421800e3, 1.769138 * 86400), 1.8981e27, 5e-3);
  check('pesare_pianeta', 'Earth orbit weighs the Sun (kg)', M(1.495979e11, 365.2564 * 86400), 1.98841e30, 5e-3);
  check('pesare_pianeta', 'Moon mass ratio m/M = 1.23 %', 7.346e22 / 5.972e24 * 100, 1.23, 5e-3, '1,23%');
  check('pesare_pianeta', 'Moon result is +0.96 % above 5.972e24', (Mm / 5.972e24 - 1) * 100, 0.96, 0.05, '0,96%');
  check('pesare_pianeta', 'ISS mass / Earth mass 7.5e-20', 450000 / 5.97e24, 7.5e-20, 1e-2, '7,5');
  check('pesare_pianeta', 'G uncertainty 22 ppm', 0.00015 / 6.6743 * 1e6, 22, 0.05, '22 ppm');
  check('pesare_pianeta', 'Earth mass uncertainty from G (kg)', 5.972e24 * 22e-6, 1.3e20, 0.05, '1,3');
}
// 05 square-cube
{
  const k = Math.cbrt(70 / 9.3e-6);
  check('quadrato_cubo', 'scale factor for a 70 kg ant', k, 195.98, 1e-4, '195,98');
  check('quadrato_cubo', 'ant length at 70 kg (m)', 7.5e-3 * 196, 1.47, 2e-3, '1,47');
  check('quadrato_cubo', 'relative strength 9.78/196', 9.78 / 196, 0.0499, 2e-3);
  check('quadrato_cubo', 'ant length where it collapses (mm)', 7.5 * 9.78, 73.35, 1e-3, '73,35');
  check('quadrato_cubo', 'its mass (g)', 9.3e-3 * 9.78 ** 3, 8.70, 2e-3, '8,70');
  check('quadrato_cubo', 'femur thickness with constant stress (mm)', 26 * 3 ** 1.5, 135.1, 1e-3, '135,1');
  const A = 2 * PI / 4 * (26 ** 2 - 14 ** 2);
  check('quadrato_cubo', 'two femurs section (mm2)', A, 754, 1e-3, '754');
  check('quadrato_cubo', 'stress 0.911 MPa', 70 * 9.81 / A, 0.911, 1e-3, '0,911');
  check('quadrato_cubo', 'margin vs 170 MPa', 170 / (70 * 9.81 / A), 187, 5e-3, '187');
  check('quadrato_cubo', 'isometric man for 6000 kg, height (m)', Math.cbrt(6000 / 70) * 1.75, 7.7, 5e-3, '7,7');
}
// 06 diffusion
{
  const D = 2.0e-9;
  check('caso_attraversa', 't = x^2/(2D) for 20 um', (20e-6) ** 2 / (2 * D), 0.1, 1e-9, '1,00×10⁻¹');
  const T = 293.15, eta = 1.002e-3, r = 0.5e-6;
  check('caso_attraversa', 'kT', KB * T, 4.0474e-21, 1e-4, '4,0474');
  check('caso_attraversa', '6 pi eta r', 6 * PI * eta * r, 9.4436e-9, 1e-4, '9,4436');
  check('caso_attraversa', 'Stokes-Einstein D', KB * T / (6 * PI * eta * r), 4.2858e-13, 1e-4, '4,2858');
  check('caso_attraversa', 'inertial time tau = m/(6 pi eta r)', 1200 * 4 / 3 * PI * r ** 3 / (6 * PI * eta * r), 6.7e-8, 0.02, '6,7');
  check('caso_attraversa', 'time ratio 1 m vs 20 um', (1 / 20e-6) ** 2, 2.5e9, 1e-9, '2,5 miliardi');
  check('caso_attraversa', 't with D=2.3e-9 is 0.087 s', (20e-6) ** 2 / (2 * 2.3e-9), 0.087, 5e-3, '0,087');
}
// 07 reshuffle
{
  check('rimescolare', 'W = 2^4', 2 ** 4, 16, 0, '16');
  check('rimescolare', 'entropy change for N=4 (J/K)', -4 * KB * Math.log(2), -3.83e-23, 2e-3, '3,83');
  check('rimescolare', '16 reshuffles at 20/s (s)', 16 / 20, 0.8, 0, '0,800');
  check('rimescolare', 'sum of binomial row for N=4', [1, 4, 6, 4, 1].reduce((a, b) => a + b), 16, 0);
}
// 08 forecast (logistic map r = 4)
{
  let x = 0.2; const seq = [];
  for (let i = 0; i < 3; i++) { x = 4 * x * (1 - x); seq.push(x); }
  check('previsione', 'step 1 (x0=0.2)', seq[0], 0.64, 1e-12, '0,64');
  check('previsione', 'step 2', seq[1], 0.9216, 1e-12, '0,9216');
  check('previsione', 'step 3', seq[2], 0.28901376, 1e-12, '0,28901376');
  check('previsione', 'N = log2(1e6) = 19.93', Math.log2(1e6), 19.93, 1e-3, '19,93');
  check('previsione', 'closed form x_n = sin^2(2^n asin sqrt x0), n=3', Math.sin(8 * Math.asin(Math.sqrt(0.2))) ** 2, seq[2], 1e-9);
  const iter = (r, n) => { let y = 0.3; for (let i = 0; i < n; i++) y = r * y * (1 - y); return y; };
  check('previsione', 'r = 2.8 settles on 1 - 1/2.8 = 0.642857', iter(2.8, 3000), 0.642857, 1e-6, '0,642857');
  const a = iter(3.2, 3000), b = 3.2 * a * (1 - a);
  check('previsione', 'r = 3.2 two-cycle, low value 0.513045', Math.min(a, b), 0.513045, 1e-6, '0,513045');
  check('previsione', 'r = 3.2 two-cycle, high value 0.799455', Math.max(a, b), 0.799455, 1e-6, '0,799455');
  check('previsione', 'fraction of time below x=0.1', 2 / PI * Math.asin(Math.sqrt(0.1)), 0.2048, 1e-3, '0,2048');
  check('previsione', 'paper folded 53 times at 0.1 mm (m)', 1e-4 * 2 ** 53, 9.007e11, 1e-3, '9,007×10¹¹');
}
// 09 muons
{
  const mmu = 105.6583755, tau = 2.1969811e-6, h = 15000;
  const gam = 4000 / mmu, beta = Math.sqrt(1 - 1 / gam ** 2);
  const t = h / (beta * C);
  check('muoni', 'travel time 50 us', t * 1e6, 50, 5e-3);
  check('muoni', 'proper time 1.32 us', t / gam * 1e6, 1.32, 5e-3, '1,32');
  check('muoni', 'atmosphere seen by muon 396 m', h / gam, 396, 5e-3, '396');
  check('muoni', 'survivors with relativity, of 10000', 1e4 * Math.exp(-t / gam / tau), 5478, 2e-3);
  check('muoni', 'mean free path c*tau 659 m', C * tau, 659, 1e-3, '659');
  check('muoni', 'beta 99.97 %', beta * 100, 99.97, 1e-4, '99,97');
  const noRel = 1e4 * Math.exp(-t / tau);
  check('muoni', 'survivors without relativity ~1e-6 of a muon', noRel, 1.3e-6, 0.1);
  check('muoni', 'ratio of the two worlds 4.3e9', 5478 / noRel, 4.3e9, 0.03, '4,3 miliardi');
}
// 10 particle in a box
{
  const L = 3.16e-8, p = H / (2 * L);
  check('scatola', 'momentum p = h/2L', p, 1.05e-26, 5e-3, '1,05');
  check('scatola', 'speed (m/s)', p / ME, 1.15e4, 5e-3, '1,15×10');
  check('scatola', 'energy p^2/2m (J)', p * p / (2 * ME), 6.02e-23, 5e-3, '6,02');
  check('scatola', 'energy in eV', p * p / (2 * ME) / 1.602176634e-19, 3.76e-4, 5e-3, '3,76');
  const dx = Math.sqrt(1 / 12 - 1 / (2 * PI * PI));
  check('scatola', 'ground-state dx/L = 0.180756', dx, 0.180756, 1e-5, '0,180756');
  check('scatola', 'dx*dp in units of hbar = 0.568', dx * (H / 2) / HBAR, 0.568, 1e-3, '0,568');
  check('scatola', 'relativistic limit for the electron (pm)', H / (2 * ME * C) * 1e12, 1.213, 1e-3, '1,213');
}
// 01 Kolmogorov scales, nu = 1.5e-5 m2/s (air)
{
  const nu = 1.5e-5;
  const eta = (e) => (nu ** 3 / e) ** 0.25, u = (e) => (nu * e) ** 0.25, tau = (e) => Math.sqrt(nu / e);
  check('microscale', 'eta at eps=1 W/kg (um)', eta(1) * 1e6, 241, 5e-3);
  check('microscale', 'u at eps=1 (cm/s)', u(1) * 100, 6.2, 1e-2);
  check('microscale', 'tau at eps=1 (s)', tau(1), 0.0039, 1e-2);
  check('microscale', 'eta at eps=10 (um)', eta(10) * 1e6, 135.5, 2e-3);
  check('microscale', 'eta/hair (70 um) = 3.4', eta(1) * 1e6 / 70, 3.4, 2e-2);
  const C2 = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); };
  check('microscale', 'C(10,5) = 252 line-ups', C2(10, 5), 252, 0, '252');
  check('microscale', 'C(30,10) = 30,045,015 line-ups', C2(30, 10), 30045015, 0, '30.045.015');
  check('microscale', 'C(10,2) = 45 pairs', C2(10, 2), 45, 0, '45');
}
console.log(`\n${n - fail}/${n} checks passed`);
process.exit(fail ? 1 : 0);
