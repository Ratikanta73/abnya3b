/* Reusable typographic word wall (Instrument Serif, white, no decoration).
   Usage:  <div class="wordcloud"></div>   then   new WordCloud(el, namesArray, { featured: [...], seed: 7, unique: false })
   Names are measured, then packed into justified rows of mixed sizes (some rows stack two small names),
   so nothing overlaps or is cropped. A binary search picks the type scale for the container width,
   and the wall is rebuilt whenever the width changes. */
(function () {
  const rng = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const LH = .96, FONT = '"Instrument Serif", Georgia, "Times New Roman", serif', FEAT = 2.6, TITLE = 3.4;   // focal names = 2.6x the smallest size, heading = 3.4x

  class WordCloud {
    constructor(el, names, opt = {}) {
      this.el = el;
      const r = rng(opt.seed || 7), feat = new Set(opt.featured || []);
      let list = names.map(n => n.trim()).filter(Boolean);
      if (opt.unique) list = [...new Set(list)];
      for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
      const focal = list.filter(n => feat.has(n)); list = list.filter(n => !feat.has(n));
      focal.forEach((n, i) => list.splice(Math.floor(list.length * [.16, .82, .34][i % 3]), 0, n));   // spread away from the centre
      this.items = list.map(t => ({ t, feat: feat.has(t), ital: r() < .22, stack: r() < .5, sc: r() < .7 ? 1 : 1.15 }));
      this.title = opt.heading ? { t: opt.heading, title: true, ital: true, stack: false, sc: 1 } : null;   // heading row, kept at the vertical centre
      this.rowF = Array.from({ length: 800 }, () => { const a = r(); return a < .08 ? 2 : a < .24 ? 1.6 : a < .5 ? 1.3 : 1; });
      [...this.items, this.title].filter(Boolean).forEach(it => { it.span = Object.assign(document.createElement('span'), { textContent: it.t }); if (it.title) { it.span.setAttribute('role', 'heading'); it.span.setAttribute('aria-level', '3'); } if (it.ital) it.span.style.fontStyle = 'italic'; el.appendChild(it.span); });
      this.measure(); this.layout();
      let t; new ResizeObserver(() => { clearTimeout(t); t = setTimeout(() => { if (Math.abs(el.clientWidth - this.w) > 1) this.layout(); }, 120); }).observe(el);
      if (document.fonts) Promise.all(['16px', 'italic 16px'].map(f => document.fonts.load(`${f} "Instrument Serif"`))).catch(() => { }).then(() => { this.measure(); this.layout(); });
    }
    measure() {
      const c = document.createElement('canvas').getContext('2d');
      [...this.items, this.title].filter(Boolean).forEach(it => { c.font = `${it.ital ? 'italic ' : ''}100px ${FONT}`; it.em = c.measureText(it.t).width / 100; });
    }
    layout() {
      const W = this.el.clientWidth; if (!W) return; this.w = W;
      const ratio = W < 600 ? 1.55 : W < 980 ? .55 : .42, minPx = W < 600 ? 8 : 15;   // phones: the wall is capped at 1.55x its width so the whole band fits one 9:16 screen
      let lo = 3, hi = 160;
      for (let i = 0; i < 22; i++) { const g = (lo + hi) / 2; (this.pack(W, g).h > W * ratio) ? hi = g : lo = g; }
      let g = lo, best = this.pack(W, g);
      for (let k = 0; k < 8 && best.min < minPx; k++) { g *= minPx / best.min * 1.02; best = this.pack(W, g); }   // never below a readable size
      let ti = this.items.length >> 1;                                              // move the heading until it sits at the vertical centre
      if (this.title) { for (let k = 0; k < 16; k++) { const res = this.pack(W, g, ti), err = res.ty - res.h / 2; if (Math.abs(err) < res.h * .02) break; ti = Math.max(4, Math.min(this.items.length - 4, Math.round(ti - err / res.h * this.items.length * .9))); } best = this.pack(W, g, ti); }
      this.el.style.height = best.h + 'px';
      best.place.forEach(p => Object.assign(p.it.span.style, { left: p.x + 'px', top: p.y + 'px', fontSize: p.f + 'px' }));
    }
    pack(W, g, ti) {
      const items = this.items.slice(), place = []; let i = 0, y = 0, min = 1e9, ty = 0;
      if (this.title) items.splice(ti == null ? items.length >> 1 : ti, 0, this.title);
      for (let r = 0; i < items.length; r++) {
        if (items[i].title) {                                                       // heading row: heading centred, names fill both sides
          const t = items[i++], f = g * TITLE, wT = t.em * f, hr = f * LH, side = (W - wT) / 2 - f * .3, nL = Math.max(2, Math.round(hr / (g * LH)));
          place.push({ it: t, x: (W - wT) / 2, y, f }); ty = y + hr / 2;
          [0, 1].forEach(s => {
            const cols = []; let T2 = 0;
            while (i < items.length) {
              const grp = []; let j = i; while (grp.length < nL && j < items.length && !items[j].feat && !items[j].title) grp.push(items[j++]);
              if (grp.length < nL) break;
              const fs0 = hr / (nL * LH), w = Math.max(...grp.map(q => q.em)) * fs0, nt = T2 + (cols.length ? fs0 * .5 : 0) + w;
              if (nt > side * 1.12) break;
              cols.push({ grp, w, fs0 }); T2 = nt; i = j;
            }
            if (!cols.length) return;
            const k = Math.min(side / T2, 1), ws = cols.reduce((q, c) => q + c.w, 0) * k, gx = cols.length > 1 ? (side - ws) / (cols.length - 1) : 0;
            let x = (s ? W - side : 0) + (cols.length > 1 ? 0 : (side - ws) / 2);
            cols.forEach(c => {
              const fs = c.fs0 * k, y0 = y + (hr - nL * fs * LH) / 2; min = Math.min(min, fs);
              c.grp.forEach((q, n) => place.push({ it: q, x, y: y0 + n * fs * LH, f: fs }));
              x += c.w * k + gx;
            });
          });
          y += hr; continue;
        }
        const F = g * this.rowF[r % 800], gap = F * .5, cells = []; let T = 0, ws = 0;
        while (i < items.length) {
          const a = items[i], b = items[i + 1]; let c, n = 1;
          if (a.title) { if (T < W * .85 && b) { items[i] = b; items[i + 1] = a; continue; } break; }   // keep the row before the heading full
          if (a.feat) c = { a, f: g * FEAT, h: g * FEAT, w: a.em * g * FEAT };
          else if (F >= g * 2 && a.stack && b && !b.feat && !b.title) { c = { a, b, f: F * .5, h: F, w: Math.max(a.em, b.em) * F * .5 }; n = 2; }
          else c = { a, f: F * a.sc, h: F * a.sc, w: a.em * F * a.sc };
          const nt = T + (cells.length ? gap : 0) + c.w;
          if (cells.length && nt > W * 1.12) break;
          cells.push(c); T = nt; ws += c.w; i += n;
        }
        const k = Math.min(W / T, 1.25), hr = Math.max(...cells.map(c => c.h)) * LH * k, n = cells.length, last = i >= items.length;
        let gx = n > 1 ? (W - ws * k) / (n - 1) : 0, x = n > 1 ? 0 : (W - ws * k) / 2;
        if (last && n > 1) { gx = Math.min(gx, gap * k * 1.8); x = (W - ws * k - gx * (n - 1)) / 2; }   // last row: keep names close, centred
        cells.forEach(c => {
          const f = c.f * k; if (!c.a.feat) min = Math.min(min, f);
          if (c.b) { const t0 = y + (hr - 2 * f * LH) / 2; place.push({ it: c.a, x, y: t0, f }, { it: c.b, x, y: t0 + f * LH, f }); }
          else place.push({ it: c.a, x, y: y + (hr - f * LH) / 2, f });
          x += c.w * k + gx;
        });
        y += hr;
      }
      return { h: y, min, place, ty };
    }
  }
  window.WordCloud = WordCloud;
  document.querySelectorAll('.wordcloud').forEach(el => new WordCloud(el, window.WORDCLOUD_NAMES || [], { featured: window.WORDCLOUD_FEATURED || [], heading: window.WORDCLOUD_HEADING }));
})();
