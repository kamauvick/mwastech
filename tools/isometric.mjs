// Isometric SVG generator for the MWASTECH machine drawings in index.html.
// Run: node tools/isometric.mjs  -> writes tools/iso.json (SVG markup per drawing) and tools/preview.html.
// Paste a drawing's SVG from iso.json into the matching <div class="iso-art"> in index.html.
import fs from 'fs';

const INK = '#0B2236';
const SW = 1.6;
const COS = Math.cos(Math.PI / 6);
const C = {
  top: '#FFFFFF', left: '#DCEEFA', right: '#9FCFF2',
  accent: '#0A8CFF', accentL: '#5CB6FF', accentR: '#0670D0',
  recess: '#8FB8D2', floor: '#EEF6FB', floorL: '#D6E9F5', floorR: '#BFDCEF',
  muddy: '#C9A77A', water: '#7FD3F7', milk: '#FFFFFF', oil: '#F5B43C'
};
// brushed stainless steel, for the counter and cabinet machines
const ST = { top: '#F7FAFC', left: '#E2EAF0', right: '#B5C6D3' };
// hero mode: no floor plate and no step badges, so a drawing floats on the page
let HERO = false;

function scene(s) {
  const parts = [];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const P = (x, y, z) => {
    const px = (x - y) * COS * s, py = (x + y) * 0.5 * s - z * s;
    minX = Math.min(minX, px); maxX = Math.max(maxX, px); minY = Math.min(minY, py); maxY = Math.max(maxY, py);
    return [px, py];
  };
  const f = n => n.toFixed(1);
  const pts = arr => arr.map(p => f(p[0]) + ' ' + f(p[1]));
  const poly = (arr, fill, extra = '') => parts.push(`<path d="M${pts(arr).join(' L')} Z" fill="${fill}" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"${extra}></path>`);

  const api = {
    P,
    raw: str => parts.push(str),
    box(x, y, z, w, d, h, o = {}) {
      const top = o.top || C.top, left = o.left || C.left, right = o.right || C.right;
      const ex = o.cls ? ` class="${o.cls}"` : '';
      if (!o.noLeft) poly([P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)], left, ex);
      if (!o.noRight) poly([P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)], right, o.rightExtra || ex);
      if (!o.noTop) poly([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], top, ex);
    },
    // rectangle on the front-left face plane y = Y
    rectL(Y, x1, z1, x2, z2, fill, extra = '') { poly([P(x1, Y, z1), P(x2, Y, z1), P(x2, Y, z2), P(x1, Y, z2)], fill, extra); },
    // rectangle on the front-right face plane x = X
    rectR(X, y1, z1, y2, z2, fill, extra = '') { poly([P(X, y1, z1), P(X, y2, z1), P(X, y2, z2), P(X, y1, z2)], fill, extra); },
    // rectangle on a horizontal plane z = Z
    rectT(Z, x1, y1, x2, y2, fill, extra = '') { poly([P(x1, y1, Z), P(x2, y1, Z), P(x2, y2, Z), P(x1, y2, Z)], fill, extra); },
    cyl(cx, cy, z, r, h, o = {}) {
      const [bx, by] = P(cx, cy, z), [, ty] = P(cx, cy, z + h);
      P(cx + r, cy + r, z); P(cx - r, cy - r, z + h);
      const rx = r * s * 1.2247, ry = r * s * 0.7071;
      const op = o.opacity != null ? ` fill-opacity="${o.opacity}"` : '';
      const ex = o.cls ? ` class="${o.cls}"` : '';
      parts.push(`<path d="M${f(bx - rx)} ${f(ty)} L${f(bx - rx)} ${f(by)} A${f(rx)} ${f(ry)} 0 0 0 ${f(bx + rx)} ${f(by)} L${f(bx + rx)} ${f(ty)} A${f(rx)} ${f(ry)} 0 0 1 ${f(bx - rx)} ${f(ty)} Z" fill="${o.fill || C.left}"${op} stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"${ex}></path>`);
      if (!o.noTop) parts.push(`<ellipse cx="${f(bx)}" cy="${f(ty)}" rx="${f(rx)}" ry="${f(ry)}" fill="${o.top || C.top}"${o.topOpacity != null ? ` fill-opacity="${o.topOpacity}"` : ''} stroke="${INK}" stroke-width="${SW}"${ex}></ellipse>`);
      return { rx, ry, bx, by, ty };
    },
    // glass cylinder with liquid inside
    tank(cx, cy, z, r, h, level, liquid, o = {}) {
      api.cyl(cx, cy, z, r * 0.94, level, { fill: liquid, top: o.surface || liquid, cls: o.liquidCls });
      if (o.inside) o.inside();
      api.cyl(cx, cy, z, r, h, { fill: '#FFFFFF', opacity: 0.28, top: '#FFFFFF', topOpacity: 0.6 });
      // glass highlight
      const [bx] = P(cx, cy, z); const [, ty] = P(cx, cy, z + h * 0.85), [, by2] = P(cx, cy, z + h * 0.2);
      const rx = r * s * 1.2247;
      parts.push(`<path d="M${f(bx - rx * 0.62)} ${f(ty)} L${f(bx - rx * 0.62)} ${f(by2)}" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".8"></path>`);
      if (o.cap) api.cyl(cx, cy, z + h, r * 1.02, 0.18, { fill: o.cap, top: o.capTop || C.accentL });
    },
    pipe(points, o = {}) {
      const d = 'M' + points.map(p => { const q = P(...p); return f(q[0]) + ' ' + f(q[1]); }).join(' L');
      parts.push(`<path d="${d}" fill="none" stroke="${INK}" stroke-width="${o.w || 8}" stroke-linecap="round" stroke-linejoin="round"></path>`);
      parts.push(`<path d="${d}" fill="none" stroke="${o.fill || '#E4F2F9'}" stroke-width="${(o.w || 8) - 3.4}" stroke-linecap="round" stroke-linejoin="round"></path>`);
      parts.push(`<path class="e-flow" d="${d}" fill="none" stroke="${o.flow || C.accent}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path>`);
    },
    badge(n, x, y, z) {
      if (HERO) return;
      const [px, py] = P(x, y, z);
      parts.push(`<g class="e-badge"><circle cx="${f(px)}" cy="${f(py)}" r="13" fill="${C.accent}" stroke="#FFFFFF" stroke-width="2.5"></circle><text x="${f(px)}" y="${f(py + 4.2)}" text-anchor="middle" font-family="Sora, sans-serif" font-weight="700" font-size="11.5" fill="#FFFFFF">${n}</text></g>`);
    },
    drips(x, y, z1, z2, color, n = 3) {
      const [px, py1] = P(x, y, z1), [, py2] = P(x, y, z2);
      for (let i = 0; i < n; i++) {
        parts.push(`<path class="e-drip" style="animation-delay:${(i * 0.4).toFixed(1)}s" d="M${f(px)} ${f(py1)} c2.6 3.4 3.8 5.2 3.8 6.6 a3.8 3.8 0 0 1 -7.6 0 c0 -1.4 1.2 -3.2 3.8 -6.6 Z" fill="${color}" stroke="${INK}" stroke-width="1.2"></path>`);
      }
      return py2 - py1;
    },
    keypad(Y, x1, z1, x2, z2) {
      api.rectL(Y, x1, z1, x2, z2, C.accent);
      const cols = 3, rows = 3, gx = (x2 - x1) / (cols + 1), gz = (z2 - z1) * 0.55 / (rows + 1);
      api.rectL(Y, x1 + gx * 0.5, z2 - (z2 - z1) * 0.38, x2 - gx * 0.5, z2 - (z2 - z1) * 0.1, '#B8F0C8');
      for (let i = 1; i <= cols; i++) for (let j = 1; j <= rows; j++) {
        const [px, py] = P(x1 + gx * i, Y, z1 + gz * j);
        parts.push(`<circle cx="${f(px)}" cy="${f(py)}" r="1.9" fill="#FFFFFF"></circle>`);
      }
    },
    jerrycan(x, y, z, w = 0.9, d = 0.7, h = 1.0, fill = C.water) {
      api.box(x, y, z, w, d, h, { top: '#E8F7FF', left: fill, right: '#4FB8E6' });
      api.pipe([[x + w * 0.25, y + d * 0.5, z + h], [x + w * 0.25, y + d * 0.5, z + h + 0.25], [x + w * 0.75, y + d * 0.5, z + h + 0.25], [x + w * 0.75, y + d * 0.5, z + h]], { w: 5, fill: '#E8F7FF', flow: 'transparent' });
    },
    ground(x, y, w, d) {
      if (HERO) return;
      api.box(x, y, -0.3, w, d, 0.3, { top: C.floor, left: C.floorL, right: C.floorR });
    },
    legs(x, y, w, d, h, t = 0.22, o = ST) {
      [[x, y], [x + w - t, y], [x, y + d - t], [x + w - t, y + d - t]].forEach(([lx, ly]) => api.box(lx, ly, 0, t, t, h, o));
    },
    // text lying on the front-left plane y = Y ('L') or the front-right plane x = X ('R'), centred on u
    text(kind, c, u, z, str, o = {}) {
      const [ex, ey] = kind === 'L' ? P(u, c, z) : P(c, u, z);
      const m = kind === 'L' ? `${COS.toFixed(4)} 0.5 0 1` : `${COS.toFixed(4)} -0.5 0 1`;
      parts.push(`<text transform="matrix(${m} ${f(ex)} ${f(ey)})" text-anchor="middle" font-family="Sora, sans-serif" font-weight="${o.weight || 800}"${o.italic ? ' font-style="italic"' : ''} font-size="${f(o.size || 11)}" fill="${o.fill || '#FFFFFF'}">${str}</text>`);
    },
    // printed vinyl wrap: blue panel, wave, white title strip, optional drop and subtitle
    poster(kind, c, u1, v1, u2, v2, o = {}) {
      const F = kind === 'L' ? (u, v) => P(u, c, v) : (u, v) => P(c, u, v);
      const quad = [F(u1, v1), F(u2, v1), F(u2, v2), F(u1, v2)];
      poly(quad, o.base || '#3FA9FF');
      const H = v2 - v1, wl = v1 + H * (o.wave ?? 0.34), amp = Math.min(0.12, H * 0.04), w = [];
      for (let i = 0; i <= 16; i++) w.push(F(u1 + (u2 - u1) * i / 16, wl + amp * Math.sin(i * 1.1 + (o.phase || 0))));
      parts.push(`<path d="M${pts([...w, F(u2, v1), F(u1, v1)]).join(' L')} Z" fill="${o.waveFill || '#A5E0FA'}"></path>`);
      const wPx = Math.abs(u2 - u1) * COS * s;
      let top = v2;
      if (o.title) {
        const sh = o.stripH || Math.min(0.5, H * 0.22), m = (u2 - u1) * 0.07, z1 = v2 - 0.12 - sh, z2 = v2 - 0.12;
        parts.push(`<path d="M${pts([F(u1 + m, z1), F(u2 - m, z1), F(u2 - m, z2), F(u1 + m, z2)]).join(' L')} Z" fill="#FFFFFF"></path>`);
        const size = Math.min(o.size || 12, sh * s * 0.72, (wPx - 2 * m * COS * s) * 0.9 / (o.title.length * 0.68));
        api.text(kind, c, (u1 + u2) / 2, (z1 + z2) / 2 - size * 0.36 / s, o.title, { size, fill: o.titleFill || C.accentR });
        top = z1;
      }
      if (o.sub) {
        const size = Math.min(9, wPx * 0.85 / (o.sub.length * 0.52));
        api.text(kind, c, (u1 + u2) / 2, top - 0.12 - size / s, o.sub, { size, fill: o.subFill || '#FFFFFF', weight: 700, italic: true });
        top -= 0.2 + size / s;
      }
      const gap = (top - wl - amp) * s;
      if (o.drop !== false && gap > 20) {
        const [px, py] = F((u1 + u2) / 2, (wl + amp + top) / 2), k = Math.min(o.dropScale || 1, gap / 26);
        parts.push(`<path d="M${f(px)} ${f(py - 9 * k)} c${f(3.6 * k)} ${f(4.8 * k)} ${f(5.4 * k)} ${f(7.2 * k)} ${f(5.4 * k)} ${f(9.2 * k)} a${f(5.4 * k)} ${f(5.4 * k)} 0 0 1 ${f(-10.8 * k)} 0 c0 ${f(-2 * k)} ${f(1.8 * k)} ${f(-4.4 * k)} ${f(5.4 * k)} ${f(-9.2 * k)} Z" fill="#FFFFFF" stroke="${INK}" stroke-width="1.2"></path>`);
      }
      poly(quad, 'none');
    },
    // front-left face (plane y = Y) with rectangular cut-outs; holes are [x1, z1, x2, z2]
    faceHole(Y, x1, z1, x2, z2, holes, fill) {
      const ring = a => 'M' + pts(a).join(' L') + ' Z';
      const r = (a, b, c2, d2) => [P(a, Y, b), P(c2, Y, b), P(c2, Y, d2), P(a, Y, d2)];
      parts.push(`<path d="${ring(r(x1, z1, x2, z2))} ${holes.map(h => ring(r(...h))).join(' ')}" fill="${fill}" fill-rule="evenodd" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"></path>`);
    },
    clip(id, shapes) {
      parts.push(`<clipPath id="${id}">${shapes.map(a => `<path d="M${pts(a).join(' L')} Z"></path>`).join('')}</clipPath><g clip-path="url(#${id})">`);
    },
    endClip() { parts.push('</g>'); },
    // open bay recessed into the front-left face; draw the face itself afterwards with faceHole
    bay(Y, x1, z1, x2, z2, dep, id, inside) {
      api.clip(id, [[P(x1, Y, z1), P(x2, Y, z1), P(x2, Y, z2), P(x1, Y, z2)]]);
      api.rectL(Y - dep, x1, z1, x2, z2, '#AFC2D0');
      api.rectR(x1, Y - dep, z1, Y, z2, '#C7D5DF');
      api.rectT(z1, x1, Y - dep, x2, Y, '#DCE6ED');
      if (inside) inside();
      api.endClip();
    },
    // basin sunk into a counter top at height Z
    sink(Z, x1, y1, x2, y2, dep, id, o = {}) {
      const hole = [P(x1, y1, Z), P(x2, y1, Z), P(x2, y2, Z), P(x1, y2, Z)];
      api.clip(id, [hole]);
      api.rectT(Z - dep, x1, y1, x2, y2, '#B9CAD6');
      api.rectL(y1, x1, Z - dep, x2, Z, '#C9D7E1');
      api.rectR(x1, y1, Z - dep, y2, Z, '#DCE6EE');
      (o.drains || [(x1 + x2) / 2]).forEach(dx => {
        const [px, py] = P(dx, (y1 + y2) / 2, Z - dep);
        parts.push(`<ellipse cx="${f(px)}" cy="${f(py)}" rx="${f(0.16 * s * 1.2247)}" ry="${f(0.16 * s * 0.7071)}" fill="#7F97A8" stroke="${INK}" stroke-width="1.2"></ellipse>`);
      });
      if (o.divider) api.rectR(o.divider, y1, Z - dep, y2, Z, '#E4ECF2');
      api.endClip();
      poly(hole, 'none');
    },
    // clip that shows what stands inside a basin: the opening plus everything above its front rim
    sinkReveal(id, Z, x1, y1, x2, y2) {
      const a = P(x1, y2, Z), b = P(x2, y2, Z), c2 = P(x2, y1, Z);
      api.clip(id, [[P(x1, y1, Z), c2, b, a], [a, b, c2, [c2[0], -9999], [a[0], -9999]]]);
    },
    // swan-neck tap rising from (x, y0, Z) and bending toward the viewer; returns the spout tip.
    // With o.splitY, only the part behind that plane is drawn now and the rest is returned as drawFront().
    gooseneck(x, y0, Z, h, r, o = {}) {
      const p3 = [[x, y0, Z], [x, y0, Z + h - r]];
      for (let a = 20; a <= 180; a += 20) { const t = a * Math.PI / 180; p3.push([x, y0 + r - r * Math.cos(t), Z + h - r + r * Math.sin(t)]); }
      const tip = [x, y0 + 2 * r, Z + h - r - (o.drop ?? 0.35)];
      p3.push(tip);
      const opt = { w: o.w || 7, fill: '#EEF3F7', flow: o.flow };
      if (o.splitY == null) { api.pipe(p3, opt); return { tip }; }
      const k = p3.findIndex(p => p[1] > o.splitY);
      api.pipe(p3.slice(0, k), opt);
      return { tip, drawFront: () => api.pipe(p3.slice(k - 1), opt) };
    },
    // keypad in its own small housing; the keypad faces the viewer on y + d
    housing(x, y, z, w, d, h) {
      api.box(x, y, z, w, d, h);
      api.keypad(y + d, x + 0.1, z + 0.1, x + w - 0.1, z + h - 0.1);
    },
    svg(label, m = 26) {
      const vb = `${f(minX - m)} ${f(minY - m)} ${f(maxX - minX + 2 * m)} ${f(maxY - minY + 2 * m)}`;
      return `<svg viewBox="${vb}" role="img" aria-label="${label}" style="width: 100%; height: 100%; display: block; overflow: visible;">${parts.join('')}</svg>`;
    }
  };
  return api;
}

/* ---------- Water vending station ---------- */
function water() {
  const g = scene(30);
  g.ground(0, 0, 13.4, 9.8);
  // back rack
  g.box(3.6, 0.5, 0, 6.2, 0.25, 3.8, { top: '#FFFFFF', left: '#EAF4FA', right: '#C8E3F4' });
  // pipes behind the cartridges
  g.pipe([[2.9, 1.7, 0.45], [4.6, 1.7, 0.45]], { flow: '#B08A57' });
  g.pipe([[4.6, 1.7, 0.45], [9.0, 1.7, 0.45]]);
  g.pipe([[9.0, 1.7, 0.45], [10.8, 1.9, 0.45]]);
  // 1 feed tank (muddy) with bubbles
  g.tank(1.7, 1.7, 0, 1.25, 3.5, 2.5, C.muddy, { surface: '#D8BD94', cap: '#DCEEFA', capTop: '#FFFFFF' });
  // 2 sediment, 3 carbon, 4 RO, 5 UV
  g.tank(4.7, 1.7, 0, 0.5, 2.4, 2.1, '#E9D6B5', { cap: C.accent });
  g.tank(5.95, 1.7, 0, 0.5, 2.4, 2.1, '#2B3440', { cap: C.accent });
  g.tank(7.35, 1.7, 0, 0.62, 3.0, 2.7, '#CFEAF7', { cap: C.accent });
  g.raw('<g>');
  for (let i = 0; i < 5; i++) { const z = 0.5 + i * 0.45; const a = g.P(7.35 - 0.55, 1.7 + 0.55, z), b = g.P(7.35 + 0.55, 1.7 - 0.55, z); g.raw(`<path d="M${a[0].toFixed(1)} ${a[1].toFixed(1)} Q ${((a[0] + b[0]) / 2).toFixed(1)} ${(a[1] + 8).toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}" fill="none" stroke="#6AA9CF" stroke-width="1.2"></path>`); }
  g.raw('</g>');
  g.cyl(8.75, 1.7, 0, 0.34, 2.7, { fill: '#DCEEFA', top: '#FFFFFF' });
  g.cyl(8.75, 1.7, 0.35, 0.16, 2.0, { fill: '#C4B5FD', top: '#EDE9FE', cls: 'e-uv' });
  // clean tank
  g.tank(11.0, 2.0, 0, 1.15, 3.1, 2.3, C.water, { surface: '#B5E6FA', cap: '#DCEEFA', capTop: '#FFFFFF' });
  // supply to the cabinet
  g.pipe([[11.0, 3.2, 0.35], [11.0, 6.2, 0.35]]);
  // cabinet + back panel
  g.box(6.6, 6.2, 0, 6.0, 2.8, 2.3);
  g.rectT(2.3, 7.1, 6.9, 12.1, 8.6, '#CFE6F3');
  g.box(6.6, 6.2, 2.3, 6.0, 0.35, 2.1, { top: '#FFFFFF', left: '#EAF4FA', right: C.right });
  g.rectL(6.55, 6.9, 3.95, 12.3, 4.3, C.accent);
  g.keypad(6.55, 7.2, 2.55, 8.2, 3.75);
  // taps
  g.pipe([[9.6, 6.55, 3.6], [9.6, 7.4, 3.6], [9.6, 7.4, 3.3]], { w: 7 });
  g.pipe([[11.4, 6.55, 3.6], [11.4, 7.4, 3.6], [11.4, 7.4, 3.3]], { w: 7 });
  g.drips(9.6, 7.4, 3.25, 2.9, '#7FD3F7', 3);
  g.jerrycan(9.15, 7.05, 2.3, 0.9, 0.75, 0.95);
  // badges
  g.badge('01', 1.7, 1.7, 4.3);
  g.badge('02', 4.7, 1.7, 3.1);
  g.badge('03', 5.95, 1.7, 3.1);
  g.badge('04', 7.35, 1.7, 3.7);
  g.badge('05', 8.75, 1.7, 3.35);
  g.badge('06', 11.4, 7.4, 4.3);
  return g.svg('Cutaway of a water vending station: feed tank, sediment, carbon, reverse osmosis and UV stages, clean tank and keypad tap');
}

/* ---------- Twin-bay kiosk ---------- */
function kiosk() {
  const g = scene(30);
  g.ground(0, 0, 10.5, 6.2);
  // purification unit
  g.box(0.5, 0.6, 0, 2.4, 1.8, 2.8);
  g.rectL(2.4, 0.8, 0.4, 2.6, 2.4, '#CFE6F3');
  g.cyl(1.2, 1.2, 2.8, 0.3, 0.9, { fill: C.accent, top: C.accentL });
  g.cyl(2.1, 1.2, 2.8, 0.3, 0.9, { fill: C.accent, top: C.accentL });
  g.pipe([[2.9, 1.5, 0.5], [4.2, 1.5, 0.5]]);
  // kiosk cabinet
  g.box(4.0, 0.4, 0, 5.4, 2.4, 6.6);
  const Y = 2.8;
  g.rectL(Y, 4.2, 6.0, 9.2, 6.45, C.accent);
  g.rectL(Y, 4.4, 1.2, 6.5, 4.4, C.recess);
  g.rectL(Y, 6.9, 1.2, 9.0, 4.4, C.recess);
  g.keypad(Y, 4.9, 4.75, 6.0, 5.75);
  g.keypad(Y, 7.4, 4.75, 8.5, 5.75);
  g.pipe([[5.45, 2.5, 4.4], [5.45, 2.5, 4.05]], { w: 6 });
  g.pipe([[7.95, 2.5, 4.4], [7.95, 2.5, 4.05]], { w: 6 });
  g.drips(5.45, 2.5, 4.0, 3.6, '#7FD3F7', 2);
  g.drips(7.95, 2.5, 4.0, 3.6, '#7FD3F7', 2);
  g.jerrycan(5.0, 2.0, 1.2, 0.9, 0.7, 1.05);
  g.jerrycan(7.5, 2.0, 1.2, 0.9, 0.7, 1.05);
  g.badge('01', 1.7, 1.5, 4.2);
  g.badge('02', 5.45, 2.8, 6.1);
  g.badge('03', 7.95, 2.8, 6.1);
  g.badge('04', 8.8, 2.8, 2.6);
  return g.svg('Isometric view of a twin-bay water vending kiosk fed by a purification unit');
}

/* ---------- Milk ATM ---------- */
function milk() {
  const g = scene(30);
  g.ground(0, 0, 8.8, 6.4);
  const x = 2.2, y = 0.5, w = 3.4, d = 2.8, h = 7.2;
  // front and top first, then the interior seen through the glass side
  g.box(x, y, 0, w, d, h, { noRight: true });
  // interior back walls, visible through the glass side panel
  g.rectR(x + w - 0.02, y, 0, y + d, h, '#C9DEEB');
  g.rectR(x + w - 0.02, y + 0.15, 0.2, y + d - 0.15, 1.3, '#DCEEFA');
  for (let i = 0; i < 6; i++) { const a = g.P(x + w, y + 0.35 + i * 0.36, 0.35), b = g.P(x + w, y + 0.35 + i * 0.36 + 0.18, 1.15); g.raw(`<path d="M${a[0].toFixed(1)} ${a[1].toFixed(1)} L${b[0].toFixed(1)} ${b[1].toFixed(1)}" stroke="#6AA9CF" stroke-width="1.4"></path>`); }
  g.tank(x + w - 0.8, y + 1.2, 2.2, 0.62, 2.8, 2.2, '#FFF6E0', { surface: '#FFFDF6', cap: '#DCEEFA', capTop: '#FFFFFF' });
  g.box(x + w - 1.1, y + 1.9, 1.35, 0.6, 0.55, 0.55, { top: C.accentL, left: C.accent, right: C.accentR });
  g.pipe([[x + w - 0.8, y + 1.6, 2.2], [x + w - 0.8, y + 2.15, 1.9]], { w: 6, fill: '#FFFFFF' });
  // glass side panel
  g.raw(`<path d="M${[g.P(x + w, y, 0), g.P(x + w, y + d, 0), g.P(x + w, y + d, h), g.P(x + w, y, h)].map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L')} Z" fill="#BFE3F7" fill-opacity=".32" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"></path>`);
  g.raw(`<path class="e-frost" d="M${g.P(x + w, y + 0.4, h - 0.6).map(n => n.toFixed(1)).join(' ')} L${g.P(x + w, y + 1.4, h - 1.6).map(n => n.toFixed(1)).join(' ')}" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"></path>`);
  // front: header, window, keypad
  const Y = y + d;
  g.rectL(Y, x + 0.25, 6.1, x + w - 0.25, 6.9, C.accent);
  g.rectL(Y, x + 0.4, 2.0, x + 2.2, 4.3, C.recess);
  g.keypad(Y, x + 2.4, 3.3, x + 3.2, 4.3);
  g.pipe([[x + 1.3, Y - 0.35, 4.3], [x + 1.3, Y - 0.35, 3.95]], { w: 6, fill: '#FFFFFF', flow: 'transparent' });
  g.drips(x + 1.3, Y - 0.35, 3.9, 3.45, '#FFFFFF', 2);
  g.cyl(x + 1.3, Y - 0.4, 2.0, 0.42, 1.0, { fill: '#FFFFFF', top: '#F1F5F9' });
  g.badge('01', x + w - 0.8, y + 1.2, 5.5);
  g.badge('02', x + 2.8, Y, 4.75);
  g.badge('03', x + w - 0.8, y + 2.15, 1.3);
  g.badge('04', x + 0.45, Y, 4.75);
  return g.svg('Cutaway of a Milk ATM: chilled milk tank, keypad, metered pump and dispensing window');
}

/* ---------- Cooking oil vending ---------- */
function oil() {
  const g = scene(30);
  g.ground(0, 0, 9.4, 6.6);
  g.box(0.6, 1.2, 0, 7.4, 3.0, 2.4);
  g.rectL(4.2, 1.0, 0.3, 7.6, 2.0, '#CFE6F3');
  g.tank(2.0, 2.4, 2.4, 1.0, 2.7, 1.9, C.oil, { surface: '#FAD27F', cap: '#DCEEFA', capTop: '#FFFFFF' });
  g.pipe([[3.0, 2.4, 2.8], [4.1, 2.4, 2.8]], { flow: '#E08A00' });
  g.box(4.1, 2.0, 2.4, 1.1, 1.1, 1.3, { top: C.accentL, left: C.accent, right: C.accentR });
  g.keypad(3.1, 4.25, 2.55, 5.05, 3.5);
  g.pipe([[5.2, 2.6, 3.3], [6.5, 2.6, 3.3], [6.5, 3.4, 3.3], [6.5, 3.4, 3.05]], { w: 7, flow: '#E08A00' });
  g.drips(6.5, 3.4, 3.0, 2.8, C.oil, 2);
  g.tank(6.5, 3.4, 2.4, 0.34, 0.95, 0.55, C.oil, { surface: '#FAD27F' });
  g.cyl(6.5, 3.4, 3.35, 0.14, 0.3, { fill: '#FFFFFF', opacity: 0.5 });
  g.badge('01', 2.0, 2.4, 5.6);
  g.badge('02', 4.65, 3.1, 4.05);
  g.badge('03', 5.2, 2.0, 4.2);
  g.badge('04', 6.5, 3.4, 4.0);
  return g.svg('Isometric view of a cooking oil vending machine: food-grade tank, keypad pump and drip-free nozzle');
}

/* ---------- Stainless twin-tap cabinet (open bay, two keypads) ---------- */
function twinCabinet() {
  const g = scene(30);
  g.ground(0, 0, 9.4, 5.6);
  const x = 1.6, y = 1.2, w = 6.2, d = 1.8, Y = y + d, b1 = 2.7, b2 = 4.6;
  g.legs(x, y, w, d, 0.5);
  g.box(x, y, 0.5, w, d, 5.9, { ...ST, noLeft: true });
  g.bay(Y, x + 0.3, b1, x + w - 0.3, b2, 1.2, 'tw-bay', () => {
    [x + 1.55, x + 4.65].forEach(tx => {
      g.pipe([[tx, Y - 0.55, b2], [tx, Y - 0.55, b2 - 0.35]], { w: 6, fill: '#EEF3F7', flow: 'transparent' });
      g.jerrycan(tx - 0.45, Y - 0.9, b1, 0.9, 0.7, 0.95);
      g.drips(tx, Y - 0.55, b2 - 0.4, b2 - 0.9, C.water, 3);
    });
  });
  g.faceHole(Y, x, 0.5, x + w, 6.4, [[x + 0.3, b1, x + w - 0.3, b2]], ST.left);
  g.rectL(Y, x + 0.25, 5.75, x + w - 0.25, 6.2, C.accent);
  g.text('L', Y, x + w / 2, 5.87, 'WATER VENDING MACHINE', { size: 9.5 });
  g.keypad(Y, x + 1.05, 4.85, x + 2.05, 5.6);
  g.keypad(Y, x + 4.15, 4.85, x + 5.15, 5.6);
  g.poster('L', Y, x + 0.3, 0.75, x + 3.0, 2.45, { title: 'REFILL', size: 11 });
  g.poster('L', Y, x + 3.2, 0.75, x + w - 0.3, 2.45, { title: 'REFILL', size: 11, phase: 2 });
  g.badge('01', x + 0.6, Y, 5.25);
  g.badge('02', x + 4.65, Y, 4.35);
  g.badge('03', x + 1.1, Y - 0.2, 3.95);
  return g.svg('Isometric view of a stainless twin-tap water vending cabinet: two keypads above an open refill bay with two nozzles');
}

/* ---------- Counter station with swan-neck taps and a keypad post ---------- */
function counterPost() {
  const g = scene(30);
  g.ground(0, 0, 9.4, 6.4);
  const x = 1.0, y = 1.6, w = 7.2, d = 2.8, h = 2.4, Y = y + d;
  const s1 = [x + 0.5, y + 0.75, x + w - 0.5, y + d - 0.4];
  // keypad on a post behind the counter
  g.box(x + w - 0.75, y - 0.55, 0, 0.18, 0.18, 5.1, ST);
  g.housing(x + w - 1.1, y - 0.75, 5.1, 0.9, 0.5, 0.9);
  g.box(x, y, 0, w, d, h, ST);
  g.box(x, y, h, w, 0.3, 2.2, ST);
  g.poster('L', y + 0.3, x + 0.15, h + 0.15, x + w - 0.15, h + 2.05, { title: 'WATER VENDING MACHINE', sub: 'Purified Drinking Water', subFill: '#FFE3E3', wave: 0.3 });
  g.sink(h, ...s1, 0.55, 'cp-sink', { divider: x + w / 2, drains: [x + 2.2, x + 5.4] });
  const t1 = g.gooseneck(x + 1.9, y + 0.45, h, 1.6, 0.55).tip;
  const t2 = g.gooseneck(x + 5.1, y + 0.45, h, 1.6, 0.55).tip;
  g.sinkReveal('cp-rev', h, ...s1);
  g.jerrycan(t1[0] - 0.45, t1[1] - 0.35, h - 0.55, 0.9, 0.7, 0.95);
  g.endClip();
  g.drips(...t1, t1[2] - 0.5, C.water, 3);
  g.drips(...t2, t2[2] - 0.5, C.water, 3);
  g.poster('L', Y, x + 0.25, 0.25, x + 3.5, h - 0.25, { title: 'WATER VENDING', sub: '1L · 5L · 10L · 20L' });
  g.poster('L', Y, x + 3.7, 0.25, x + w - 0.25, h - 0.25, { title: 'WATER VENDING', sub: '1L · 5L · 10L · 20L', phase: 2 });
  g.poster('R', x + w, y + 0.25, 0.25, Y - 0.25, h - 0.25, { title: 'PURIFIED', phase: 1 });
  g.badge('01', x + w - 0.65, y - 0.25, 6.35);
  g.badge('02', x + 1.9, y + 1.0, h + 1.95);
  g.badge('03', t1[0] - 0.45, t1[1] + 0.35, h + 0.75);
  g.badge('04', x + w - 1.3, s1[3] - 0.2, h - 0.2);
  return g.svg('Isometric view of a stainless water vending counter: keypad post, two swan-neck taps over a double basin, and printed front panels');
}

/* ---------- Water refill station (keypads on the splash-back, tall arched taps) ---------- */
function refillStation() {
  const g = scene(30);
  g.ground(0, 0, 9.6, 6.2);
  const x = 0.8, y = 1.4, w = 7.8, d = 2.8, h = 2.6, Y = y + d, by = y + 0.5;
  const s1 = [x + 0.5, by + 0.55, x + w - 0.5, Y - 0.35];
  g.legs(x, y, w, d, 0.3, 0.3);
  g.box(x, y, 0.3, w, d, h - 0.3, ST);
  // tall taps rise behind the splash-back and arch over it
  const taps = [x + 2.5, x + 4.1].map(tx => g.gooseneck(tx, y + 0.2, h, 2.9, 0.75, { splitY: by + 0.3, drop: 0.8 }));
  g.box(x, by, h, w, 0.3, 1.9, ST);
  g.poster('L', by + 0.3, x + 0.15, h + 0.12, x + w - 0.15, h + 1.78, { title: 'WATER REFILL STATION', sub: 'Purified Drinking Water', subFill: '#FFE3E3', wave: 0.26 });
  g.housing(x + 5.1, by - 0.05, h + 1.9, 0.95, 0.45, 0.75);
  g.housing(x + 6.5, by - 0.05, h + 1.9, 0.95, 0.45, 0.75);
  g.sink(h, ...s1, 0.55, 'rs-sink', { drains: [x + 3.3] });
  taps.forEach(t => t.drawFront());
  const small = g.gooseneck(x + 0.9, by + 0.3, h, 0.9, 0.3).tip;
  g.sinkReveal('rs-rev', h, ...s1);
  g.jerrycan(taps[0].tip[0] - 0.45, taps[0].tip[1] - 0.35, h - 0.55, 0.9, 0.7, 1.0);
  g.endClip();
  taps.forEach(t => g.drips(...t.tip, t.tip[2] - 0.5, C.water, 3));
  const pw = (w - 0.6) / 3;
  for (let i = 0; i < 3; i++) g.poster('L', Y, x + 0.3 + i * pw + 0.08, 0.5, x + 0.3 + (i + 1) * pw - 0.08, h - 0.2, { title: 'PURIFIED', sub: 'Drinking Water', phase: i * 1.3 });
  g.poster('R', x + w, y + 0.3, 0.5, Y - 0.3, h - 0.2, { title: 'PURIFIED', sub: 'Drinking Water', phase: 3 });
  void small;
  g.badge('01', x + 5.575, by + 0.4, h + 2.95);
  g.badge('02', x + 4.1, y + 0.95, h + 3.25);
  g.badge('03', taps[0].tip[0] - 0.45, taps[0].tip[1] + 0.35, h + 0.8);
  g.badge('04', x + w - 1.3, s1[3] - 0.2, h - 0.2);
  return g.svg('Isometric view of a water refill station: keypads on the splash-back, tall arched taps over a steel basin, printed cabinet panels');
}

/* ---------- Milk ATM, outside view ---------- */
function milkAtm() {
  const g = scene(30);
  g.ground(0, 0, 7.6, 6.2);
  const x = 2.0, y = 1.2, w = 3.2, d = 2.6, h = 7.8, Y = y + d, DK = { top: '#3A5266', left: '#22374A', right: '#172838' };
  const wx1 = x + 0.35, wx2 = x + 1.55, wz1 = 4.2, wz2 = 6.0, cx = (wx1 + wx2) / 2;
  g.box(x, y, 0, w, d, h, DK);
  // chiller grille in the plinth
  for (let i = 1; i <= 4; i++) {
    const z = i * 0.2, a = g.P(x + 0.2, Y, z), b = g.P(x + w - 0.2, Y, z), c = g.P(x + w, Y - 0.2, z), e = g.P(x + w, y + 0.2, z);
    g.raw(`<path d="M${a[0].toFixed(1)} ${a[1].toFixed(1)} L${b[0].toFixed(1)} ${b[1].toFixed(1)} M${c[0].toFixed(1)} ${c[1].toFixed(1)} L${e[0].toFixed(1)} ${e[1].toFixed(1)}" stroke="#6D8AA3" stroke-width="1.6" stroke-linecap="round"></path>`);
  }
  g.poster('L', Y, x + 0.15, 1.1, x + w - 0.15, h - 0.15, { title: 'FRESH MILK', waveFill: '#FFFFFF', wave: 0.3, drop: false, base: '#2F97F7' });
  g.poster('R', x + w, y + 0.15, 1.1, Y - 0.15, h - 0.15, { title: 'MILK ATM', sub: 'Fresh pasteurised milk', waveFill: '#FFFFFF', wave: 0.3, drop: false, base: '#2F97F7', phase: 2 });
  // milk logo roundel
  const ring = [];
  for (let i = 0; i < 28; i++) { const t = i / 28 * Math.PI * 2; ring.push(g.P(x + 2.3 + 0.62 * Math.cos(t), Y, 2.4 + 0.62 * Math.sin(t))); }
  g.raw(`<path d="M${ring.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L')} Z" fill="#FFFFFF" stroke="${INK}" stroke-width="1.4"></path>`);
  g.text('L', Y, x + 2.3, 2.5, 'MILK', { size: 10, fill: '#E5484D' });
  g.text('L', Y, x + 2.3, 2.08, 'ATM', { size: 10, fill: '#E5484D' });
  // dispensing window
  g.bay(Y, wx1, wz1, wx2, wz2, 0.8, 'ma-bay', () => {
    g.pipe([[cx, Y - 0.4, wz2], [cx, Y - 0.4, wz2 - 0.45]], { w: 6, fill: '#FFFFFF', flow: 'transparent' });
    g.tank(cx, Y - 0.4, wz1, 0.3, 0.75, 0.45, '#FFFFFF', { surface: '#FFFDF6' });
    g.drips(cx, Y - 0.4, wz2 - 0.5, wz2 - 1.0, '#FFFFFF', 3);
  });
  g.faceHole(Y, wx1 - 0.12, wz1 - 0.12, wx2 + 0.12, wz2 + 0.12, [[wx1, wz1, wx2, wz2]], ST.left);
  g.keypad(Y, x + 1.85, 5.1, x + 2.8, 6.0);
  // header box
  g.box(x - 0.05, y, h, w + 0.1, d + 0.2, 1.2, DK);
  g.poster('L', Y + 0.2, x + 0.1, h + 0.12, x + w - 0.05, h + 1.08, { title: 'MILK ATM', stripH: 0.62, size: 15, waveFill: '#FFFFFF', wave: 0.15, drop: false, base: '#2F97F7' });
  g.poster('R', x + w + 0.05, y + 0.1, h + 0.12, Y + 0.1, h + 1.08, { waveFill: '#FFFFFF', wave: 0.25, drop: false, base: '#2F97F7', phase: 1 });
  g.badge('01', x + 2.32, Y, 6.3);
  g.badge('02', cx, Y, 6.35);
  g.badge('03', cx - 0.45, Y - 0.2, wz1 + 0.35);
  g.badge('04', x + w - 0.3, Y, 0.5);
  return g.svg('Isometric view of a Milk ATM: chilled cabinet with a keypad, a dispensing window with nozzle and cup, and a chiller grille');
}

/* ---------- Vending counter with a corner keypad and single tap ---------- */
function counterSide() {
  const g = scene(30);
  g.ground(0, 0, 9.0, 6.0);
  const x = 1.0, y = 1.4, w = 7.0, d = 2.8, h = 2.4, Y = y + d, by = y + 0.3;
  const s1 = [x + 0.5, by + 0.6, x + w - 0.5, Y - 0.35];
  g.box(x + 0.15, y + 0.15, 0, w - 0.3, d - 0.3, 0.25, ST);
  g.box(x, y, 0.25, w, d, h - 0.25, ST);
  g.box(x, by, h, w, 0.3, 2.3, ST);
  g.poster('L', by + 0.3, x + 0.15, h + 0.12, x + w - 0.15, h + 2.18, { title: 'WATER VENDING MACHINE', wave: 0.3, dropScale: 1.2 });
  // keypad on a short stem at the left corner
  g.box(x + 0.45, by + 0.05, h + 2.3, 0.15, 0.15, 0.3, ST);
  g.housing(x + 0.1, by - 0.1, h + 2.6, 0.95, 0.45, 0.8);
  g.sink(h, ...s1, 0.55, 'cs-sink', { drains: [x + 2.4, x + 4.6] });
  const t = g.gooseneck(x + 5.4, by + 0.15, h + 2.3, 0.6, 0.55, { drop: 0.95 }).tip;
  g.sinkReveal('cs-rev', h, ...s1);
  g.jerrycan(t[0] - 0.45, t[1] - 0.3, h - 0.55, 0.9, 0.6, 1.0);
  g.endClip();
  g.drips(...t, t[2] - 0.5, C.water, 3);
  g.poster('L', Y, x + 0.25, 0.45, x + 3.4, h - 0.2, { title: 'WATER VENDING', sub: 'Station' });
  g.poster('L', Y, x + 3.6, 0.45, x + w - 0.25, h - 0.2, { title: 'WATER VENDING', sub: 'Station', phase: 2 });
  g.poster('R', x + w, y + 0.25, 0.45, Y - 0.25, h - 0.2, { title: 'PURIFIED', phase: 1 });
  g.badge('01', x + 0.575, by + 0.1, h + 3.75);
  g.badge('02', x + 5.4, by + 0.7, h + 3.25);
  g.badge('03', t[0] - 0.45, t[1] + 0.3, h + 0.8);
  g.badge('04', x + w - 1.3, s1[3] - 0.2, h - 0.2);
  return g.svg('Isometric view of a water vending counter: corner keypad, swan-neck tap over a steel basin, and printed front panels');
}

/* ---------- small icons for the explanation cards ---------- */
function iconCabinet() {
  const g = scene(16);
  g.box(0, 0, 0, 4, 3, 3.2);
  g.rectL(3, 0.5, 2.3, 3.5, 2.9, C.accent);
  g.keypad(3, 2.3, 0.6, 3.5, 1.9);
  g.rectL(3, 0.5, 0.5, 1.9, 1.9, C.recess);
  return g.svg('', 6);
}
function iconJerrycan() {
  const g = scene(18);
  g.jerrycan(0, 0, 0, 2.2, 1.6, 2.4);
  return g.svg('', 6);
}
function iconRoutine() {
  const g = scene(15);
  g.box(0, 0, 0, 4.2, 4.2, 0.5, { top: '#FFFFFF' });
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) g.rectT(0.5, 0.45 + i * 1.2, 0.45 + j * 1.2, 1.35 + i * 1.2, 1.35 + j * 1.2, (i === 1 && j === 2) ? C.accent : '#DCEEFA');
  g.box(1.2, -0.2, 0.5, 0.35, 0.35, 0.8, { top: C.accentL, left: C.accent, right: C.accentR });
  g.box(2.8, -0.2, 0.5, 0.35, 0.35, 0.8, { top: C.accentL, left: C.accent, right: C.accentR });
  return g.svg('', 6);
}

const out = {
  water: water(), kiosk: kiosk(), milk: milk(), oil: oil(),
  twinCabinet: twinCabinet(), counterPost: counterPost(), refillStation: refillStation(), milkAtm: milkAtm(), counterSide: counterSide(),
  iconCabinet: iconCabinet(), iconJerrycan: iconJerrycan(), iconRoutine: iconRoutine()
};
// hero versions of the real-machine drawings (ids prefixed so they can share a page with the others)
HERO = true;
const heroId = (k, svg) => svg.replace(/id="([^"]+)"/g, `id="h${k}-$1"`).replace(/url(#([^)]+))/g, `url(#h${k}-$1)`);
out.hero = Object.fromEntries([['refillStation', refillStation], ['counterPost', counterPost], ['twinCabinet', twinCabinet], ['milkAtm', milkAtm], ['counterSide', counterSide]].map(([k, fn], i) => [k, heroId(i, fn())]));
HERO = false;

fs.writeFileSync(new URL('./iso.json', import.meta.url), JSON.stringify(out));
// preview page for a quick visual check
fs.writeFileSync(new URL('./preview.html', import.meta.url), `<!doctype html><html><head><style>
body{margin:0;background:#F4FAFD;display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:20px;font-family:sans-serif}
div{background:#fff;height:520px;padding:10px;box-sizing:border-box}.s{height:140px;width:140px}
.e-flow{stroke-dasharray:3 9;animation:fl 1s linear infinite}@keyframes fl{to{stroke-dashoffset:-24}}
.e-drip{animation:dr 1.2s ease-in infinite}@keyframes dr{0%{transform:translateY(0);opacity:0}15%{opacity:1}100%{transform:translateY(16px);opacity:0}}
.e-badge{transform-box:fill-box;transform-origin:center;animation:bd 2.8s ease-in-out infinite}@keyframes bd{50%{transform:translateY(-3px)}}
</style></head><body>${['water', 'kiosk', 'milk', 'oil', 'twinCabinet', 'counterPost', 'refillStation', 'milkAtm', 'counterSide'].map(k => `<div>${out[k]}</div>`).join('')}
<div style="display:flex;gap:30px;height:180px"><span class="s">${out.iconCabinet}</span><span class="s">${out.iconJerrycan}</span><span class="s">${out.iconRoutine}</span></div></body></html>`);
console.log(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, typeof v === 'string' ? v.length : Object.keys(v).join(', ')])));
