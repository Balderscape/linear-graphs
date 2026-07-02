/* ============================================================
   Graph — tiny interactive coordinate-grid engine (SVG).
   Shared by all lessons. See assets/README.md for the API.
   ============================================================ */
const Graph = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  let uid = 0;

  function make(name, attrs, parent) {
    const node = document.createElementNS(NS, name);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }

  function resolve(target) {
    if (typeof target === 'string') {
      return document.getElementById(target) || document.querySelector(target);
    }
    return target;
  }

  function create(target, opts = {}) {
    const host = resolve(target);
    const o = Object.assign({
      xmin: -10, xmax: 10, ymin: -10, ymax: 10,
      width: 420, height: 420, pad: 30, labelEvery: 2, grid: true,
    }, opts);

    const box = document.createElement('div');
    box.className = 'graph-box';
    host.appendChild(box);

    const svg = make('svg', {
      viewBox: `0 0 ${o.width} ${o.height}`,
      class: 'graph-svg', role: 'img',
    }, box);
    svg.style.maxWidth = o.width + 'px';

    const X = x => o.pad + (x - o.xmin) / (o.xmax - o.xmin) * (o.width - 2 * o.pad);
    const Y = y => o.height - o.pad - (y - o.ymin) / (o.ymax - o.ymin) * (o.height - 2 * o.pad);

    const defs = make('defs', {}, svg);
    const clipId = 'gclip' + (++uid);
    const clip = make('clipPath', { id: clipId }, defs);
    make('rect', {
      x: o.pad, y: o.pad,
      width: o.width - 2 * o.pad, height: o.height - 2 * o.pad,
    }, clip);

    const gridG = make('g', {}, svg);
    const axesG = make('g', {}, svg);
    const content = make('g', { 'clip-path': `url(#${clipId})` }, svg);
    const overlay = make('g', {}, svg); // labels that may sit outside the clip

    // grid lines
    if (o.grid) {
      for (let x = Math.ceil(o.xmin); x <= Math.floor(o.xmax); x++) {
        make('line', { x1: X(x), y1: Y(o.ymin), x2: X(x), y2: Y(o.ymax),
          stroke: '#ece4fb', 'stroke-width': 1 }, gridG);
      }
      for (let y = Math.ceil(o.ymin); y <= Math.floor(o.ymax); y++) {
        make('line', { x1: X(o.xmin), y1: Y(y), x2: X(o.xmax), y2: Y(y),
          stroke: '#ece4fb', 'stroke-width': 1 }, gridG);
      }
    }

    // axes (drawn at 0 if 0 is in range, else at the nearest edge)
    const ax = Math.min(Math.max(0, o.ymin), o.ymax); // y-value of x-axis
    const ay = Math.min(Math.max(0, o.xmin), o.xmax); // x-value of y-axis
    make('line', { x1: X(o.xmin) - 6, y1: Y(ax), x2: X(o.xmax) + 6, y2: Y(ax),
      stroke: '#5b21b6', 'stroke-width': 2 }, axesG);
    make('line', { x1: X(ay), y1: Y(o.ymin) + 6, x2: X(ay), y2: Y(o.ymax) - 6,
      stroke: '#5b21b6', 'stroke-width': 2 }, axesG);
    // arrowheads
    make('path', { d: `M ${X(o.xmax) + 6} ${Y(ax)} l -9 -5 v 10 z`, fill: '#5b21b6' }, axesG);
    make('path', { d: `M ${X(ay)} ${Y(o.ymax) - 6} l -5 9 h 10 z`, fill: '#5b21b6' }, axesG);
    // axis names
    make('text', { x: X(o.xmax) + 4, y: Y(ax) - 10, fill: '#5b21b6',
      'font-size': 14, 'font-style': 'italic', 'font-weight': 700 }, axesG).textContent = 'x';
    make('text', { x: X(ay) + 10, y: Y(o.ymax) + 2, fill: '#5b21b6',
      'font-size': 14, 'font-style': 'italic', 'font-weight': 700 }, axesG).textContent = 'y';

    // axis numbers
    for (let x = Math.ceil(o.xmin); x <= Math.floor(o.xmax); x++) {
      if (x === 0 || x % o.labelEvery !== 0) continue;
      make('text', { x: X(x), y: Y(ax) + 16, fill: '#8b7fb8', 'font-size': 11,
        'text-anchor': 'middle' }, axesG).textContent = x;
    }
    for (let y = Math.ceil(o.ymin); y <= Math.floor(o.ymax); y++) {
      if (y === 0 || y % o.labelEvery !== 0) continue;
      make('text', { x: X(ay) - 7, y: Y(y) + 4, fill: '#8b7fb8', 'font-size': 11,
        'text-anchor': 'end' }, axesG).textContent = y;
    }
    if (o.xmin < 0 && o.ymin < 0) {
      make('text', { x: X(0) - 6, y: Y(0) + 15, fill: '#8b7fb8', 'font-size': 11,
        'text-anchor': 'end' }, axesG).textContent = '0';
    }

    function styled(elname, attrs, st) {
      const a = Object.assign({
        stroke: st.color || '#7c3aed',
        'stroke-width': st.width || 3,
        'stroke-linecap': 'round',
        fill: 'none',
      }, attrs);
      if (st.dash) a['stroke-dasharray'] = st.dash === true ? '7 6' : st.dash;
      return make(elname, a, content);
    }

    const g = {
      svg, X, Y, opts: o,

      segment(x1, y1, x2, y2, st = {}) {
        const el = styled('line', { x1: X(x1), y1: Y(y1), x2: X(x2), y2: Y(y2) }, st);
        if (st.label) {
          g.text((x1 + x2) / 2 + (st.labelDx || 0.4), (y1 + y2) / 2 + (st.labelDy || 0.4),
            st.label, { color: st.color });
        }
        return el;
      },

      line(m, c, st = {}) {
        const x1 = o.xmin - 1, x2 = o.xmax + 1;
        const el = styled('line', { x1: X(x1), y1: Y(m * x1 + c), x2: X(x2), y2: Y(m * x2 + c) }, st);
        if (st.label) {
          // place the label where the line is comfortably inside the plot
          let lx = o.xmax - 2.2;
          let ly = m * lx + c;
          if (ly > o.ymax - 1 || ly < o.ymin + 1) {
            ly = Math.min(Math.max(m * lx + c, o.ymin + 1.4), o.ymax - 1.4);
            lx = m !== 0 ? (ly - c) / m - (m > 0 ? 1.4 : -1.4) : lx;
          }
          g.text(lx, ly + 0.9, st.label, { color: st.color, anchor: 'middle' });
        }
        return el;
      },

      hline(y, st = {}) { return g.line(0, y, st); },

      vline(x, st = {}) {
        const el = styled('line', { x1: X(x), y1: Y(o.ymin - 1), x2: X(x), y2: Y(o.ymax + 1) }, st);
        if (st.label) g.text(x + 0.4, o.ymax - 1.4, st.label, { color: st.color });
        return el;
      },

      point(x, y, st = {}) {
        const el = make('circle', {
          cx: X(x), cy: Y(y), r: st.size || 6,
          fill: st.color || '#ec4899', stroke: '#fff', 'stroke-width': 2,
        }, st.noclip ? overlay : content);
        if (st.label) g.text(x + 0.45, y + 0.55, st.label, { color: st.color || '#ec4899' });
        return el;
      },

      text(x, y, str, st = {}) {
        const el = make('text', {
          x: X(x), y: Y(y),
          fill: st.color || '#5b21b6',
          'font-size': st.size || 13, 'font-weight': 700,
          'text-anchor': st.anchor || 'start',
          'paint-order': 'stroke', stroke: '#ffffff', 'stroke-width': 4,
          'stroke-linejoin': 'round',
        }, overlay);
        el.textContent = str;
        return el;
      },

      // Rise/run staircase triangle for gradient teaching:
      // starts at (x0, m*x0+c), runs dx across, then rises to the line.
      riseRun(x0, dx, m, c, st = {}) {
        const y0 = m * x0 + c, y1 = m * (x0 + dx) + c;
        const color = st.color || '#f59e0b';
        g.segment(x0, y0, x0 + dx, y0, { color, width: 2.5, dash: true });
        g.segment(x0 + dx, y0, x0 + dx, y1, { color, width: 2.5, dash: true });
        if (st.labels !== false) {
          g.text(x0 + dx / 2, y0 - (y1 >= y0 ? 0.5 : -1.1),
            (st.runLabel || 'across ') + dx, { color, anchor: 'middle', size: 12 });
          g.text(x0 + dx + 0.35, (y0 + y1) / 2 + 0.25,
            (st.riseLabel || (y1 >= y0 ? 'up ' : 'down ')) + Math.abs(y1 - y0), { color, size: 12 });
        }
      },

      clear() {
        content.innerHTML = '';
        overlay.innerHTML = '';
      },

      // cb(x, y) with coordinates snapped to `snap` (default 1). Clicks
      // outside the plot area are ignored.
      onClick(cb, snap = 1) {
        svg.style.cursor = 'crosshair';
        svg.addEventListener('pointerdown', e => {
          const r = svg.getBoundingClientRect();
          const px = (e.clientX - r.left) * o.width / r.width;
          const py = (e.clientY - r.top) * o.height / r.height;
          let x = o.xmin + (px - o.pad) / (o.width - 2 * o.pad) * (o.xmax - o.xmin);
          let y = o.ymin + (o.height - o.pad - py) / (o.height - 2 * o.pad) * (o.ymax - o.ymin);
          x = Math.round(x / snap) * snap;
          y = Math.round(y / snap) * snap;
          if (x < o.xmin - 0.01 || x > o.xmax + 0.01 || y < o.ymin - 0.01 || y > o.ymax + 0.01) return;
          cb(x, y);
        });
      },
    };
    return g;
  }

  // Labelled slider with live value bubble.
  // opts: { label, min, max, step, value, color, fmt, onInput(value) }
  function slider(target, opts) {
    const host = resolve(target);
    const o = Object.assign({ min: -5, max: 5, step: 1, value: 1, fmt: v => v }, opts);
    const row = document.createElement('div');
    row.className = 'slider-row';
    const lab = document.createElement('label');
    lab.innerHTML = o.label || '';
    if (o.color) lab.style.color = o.color;
    const input = document.createElement('input');
    input.type = 'range';
    input.min = o.min; input.max = o.max; input.step = o.step; input.value = o.value;
    if (o.color) input.style.accentColor = o.color;
    const val = document.createElement('span');
    val.className = 'slider-val';
    if (o.color) val.style.color = o.color;
    row.append(lab, input, val);
    host.appendChild(row);

    function refresh() { val.textContent = o.fmt(parseFloat(input.value)); }
    input.addEventListener('input', () => { refresh(); if (o.onInput) o.onInput(parseFloat(input.value)); });
    refresh();

    return {
      get value() { return parseFloat(input.value); },
      set(v) { input.value = v; refresh(); if (o.onInput) o.onInput(parseFloat(input.value)); },
      el: row,
    };
  }

  return { create, slider };
})();
