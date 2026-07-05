/* ============================================================
   Quiz — drill engine with instant feedback, streaks, confetti.
   Shared by all lessons. See assets/README.md for the API.
   ============================================================ */
const Quiz = (() => {

  /* ---------- random helpers ---------- */
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  // random non-zero int in [a,b]
  const rnz = (a, b) => { let v = 0; while (v === 0) v = ri(a, b); return v; };

  const approx = (a, b) => Math.abs(a - b) < 1e-9;

  /* ---------- number & equation formatting ---------- */
  function fmtNum(n) {
    if (Number.isInteger(n)) return String(n);
    for (const d of [2, 3, 4, 5]) {
      if (approx(Math.round(n * d), n * d)) {
        const num = Math.round(n * d);
        return `${num}/${d}`;
      }
    }
    return String(Math.round(n * 100) / 100);
  }

  function fmtLine(m, c) {
    if (m === 0) return `y = ${fmtNum(c)}`;
    let mtxt;
    if (approx(m, 1)) mtxt = '';
    else if (approx(m, -1)) mtxt = '−';
    else mtxt = fmtNum(m).replace('-', '−');
    let s = `y = ${mtxt}x`;
    if (c > 0) s += ` + ${fmtNum(c)}`;
    else if (c < 0) s += ` − ${fmtNum(-c)}`;
    return s;
  }

  /* ---------- equation parser ----------
     Accepts things like:
       y = 2x + 3   y=-x    y = 3 + 2x   y = x/2 - 1   y = 1/2x + 4
       y = 0.5x     y = 7   y = -3       x = 4          x=-2
     Returns {type:'line', m, c} | {type:'vline', x} | null.       */
  function evalNum(s) {
    if (/^\d+\/\d+$/.test(s)) {
      const [a, b] = s.split('/').map(Number);
      return b ? a / b : null;
    }
    if (/^\d*\.?\d+$/.test(s)) return parseFloat(s);
    return null;
  }

  function parseLine(raw) {
    if (raw == null) return null;
    let s = String(raw).toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[−–—]/g, '-')
      .replace(/\*/g, '');
    let m1 = s.match(/^x=(-?[\d./]+)$/);
    if (m1) {
      const neg = m1[1].startsWith('-');
      const v = evalNum(neg ? m1[1].slice(1) : m1[1]);
      return v == null ? null : { type: 'vline', x: neg ? -v : v };
    }
    if (!s.startsWith('y=')) return null;
    const rhs = s.slice(2);
    if (!rhs || /[+-]$/.test(rhs)) return null;
    const terms = rhs.match(/[+-]?[^+-]+/g);
    if (!terms) return null;
    let m = 0, c = 0;
    for (let t of terms) {
      let sign = 1;
      if (t[0] === '+') t = t.slice(1);
      else if (t[0] === '-') { sign = -1; t = t.slice(1); }
      if (!t) return null;
      if (t.includes('x')) {
        const [pre, post] = t.split('x');
        if (post !== '' && !/^\/\d*\.?\d+$/.test(post)) return null;
        let coef = pre === '' ? 1 : evalNum(pre);
        if (coef == null) return null;
        if (post) {
          const den = evalNum(post.slice(1));
          if (!den) return null;
          coef /= den;
        }
        m += sign * coef;
      } else {
        const v = evalNum(t);
        if (v == null) return null;
        c += sign * v;
      }
    }
    return { type: 'line', m, c };
  }

  // convenience: check a typed answer against an expected line / vline
  function checkLine(str, expected) {
    const p = parseLine(str);
    if (!p) return false;
    if (expected.type === 'vline' || expected.x !== undefined && expected.m === undefined) {
      return p.type === 'vline' && approx(p.x, expected.x);
    }
    return p.type === 'line' && approx(p.m, expected.m) && approx(p.c, expected.c);
  }

  /* ---------- confetti ---------- */
  const EMOJI = ['🎉', '✨', '🌟', '💜', '💖', '🎊', '⭐', '🥳'];
  function confetti(n = 26) {
    for (let i = 0; i < n; i++) {
      const bit = document.createElement('span');
      bit.className = 'confetti-bit';
      bit.textContent = pick(EMOJI);
      bit.style.left = Math.random() * 100 + 'vw';
      bit.style.animationDuration = 1.6 + Math.random() * 1.8 + 's';
      bit.style.animationDelay = Math.random() * 0.5 + 's';
      document.body.appendChild(bit);
      setTimeout(() => bit.remove(), 4200);
    }
  }

  const PRAISE = ['Nailed it!', 'Yes! Exactly right.', 'Boom — correct!', 'You star!',
    'Perfect!', 'Too easy for you!', 'Smashed it!', 'Lovely work!'];
  const NUDGE = ['Not quite — look below.', 'So close! Here’s the trick.',
    'Good try — check this out.', 'Almost! Have a look.'];

  /* ---------- on-screen keypad (phone-friendly answer entry) ----------
     A big-button pad so equations can be entered without the fiddly phone
     keyboard. The layout is picked automatically from the question's
     placeholder, so lessons need no changes:
       'y = …'                → line pad, with a locked "y =" prefix
       'y = …  or  x = …'     → adds y / x / = keys, no forced prefix
       '(x, y)' / '… never'   → coordinate pad ( ( , ) and a "never" key )
     A question may override with input.keypad ('line'|'linevar'|'coord')
     and/or input.prefix (a locked, un-typed string like 'y = ').           */
  const KEYPADS = {
    line: [
      ['7', '8', '9', { t: 'x', v: 'x' }],
      ['4', '5', '6', { t: '∕', v: '/' }],
      ['1', '2', '3', { t: '−', v: '-' }],
      [{ t: '.', v: '.' }, '0', { t: '+', v: '+' }, { t: '⌫', act: 'back' }],
    ],
    linevar: [
      [{ t: 'y', v: 'y' }, { t: 'x', v: 'x' }, { t: '=', v: '=' }, { t: '⌫', act: 'back' }],
      ['7', '8', '9', { t: '∕', v: '/' }],
      ['4', '5', '6', { t: '−', v: '-' }],
      ['1', '2', '3', { t: '+', v: '+' }],
      [{ t: '.', v: '.' }, '0'],
    ],
    coord: [
      [{ t: '(', v: '(' }, { t: ',', v: ', ' }, { t: ')', v: ')' }],
      ['7', '8', '9', { t: '−', v: '-' }],
      ['4', '5', '6', { t: '⌫', act: 'back' }],
      ['1', '2', '3', '0'],
    ],
  };

  const normKey = k => (typeof k === 'string' ? { t: k, v: k } : k);

  function keypadMode(input) {
    if (input.keypad) return input.keypad;
    const p = String(input.placeholder || '').toLowerCase();
    if (p.includes('(')) return 'coord';
    if (p.includes('x =') || p.includes('x=')) return 'linevar';
    if (/^\s*y\s*=/.test(p)) return 'line';
    return 'linevar';
  }

  function keypadPrefix(input, mode) {
    if (input.prefix != null) return input.prefix;
    return mode === 'line' ? 'y = ' : '';
  }

  function keypadRows(mode, input) {
    const rows = (KEYPADS[mode] || KEYPADS.linevar).map(r => r.slice());
    if (mode === 'coord' && /never/i.test(String(input.placeholder || ''))) {
      rows.push([{ t: 'never', act: 'never', wide: true }]);
    }
    return rows;
  }

  function insertAtCaret(inp, text) {
    const len = inp.value.length;
    let s = inp.selectionStart, e = inp.selectionEnd;
    if (s == null) { s = len; e = len; }
    inp.value = inp.value.slice(0, s) + text + inp.value.slice(e);
    const pos = s + text.length;
    try { inp.setSelectionRange(pos, pos); } catch (_) {}
  }

  function backspace(inp) {
    const len = inp.value.length;
    let s = inp.selectionStart, e = inp.selectionEnd;
    if (s == null) { s = len; e = len; }
    if (s === e) {
      if (s === 0) return;
      inp.value = inp.value.slice(0, s - 1) + inp.value.slice(e);
      s -= 1;
    } else {
      inp.value = inp.value.slice(0, s) + inp.value.slice(e);
    }
    try { inp.setSelectionRange(s, s); } catch (_) {}
  }

  /* ---------- drill engine ----------
     Quiz.create(target, {
       title: 'Drill: …',
       intro: 'optional html shown before starting',
       rounds: 10,
       generate: (i) => question,
       onFinish: (score, rounds) => {}   // optional
     })
     A question is:
       { prompt: htmlString | (el) => void,     // fn may build a Graph inside el
         choices: [{ html, correct: true? }],   // multiple choice … or:
         input: { placeholder, check(str)=>bool, answer: 'shown when wrong' },
         explain: 'html shown after a wrong answer' }                       */
  function create(target, opts) {
    const host = typeof target === 'string'
      ? (document.getElementById(target) || document.querySelector(target))
      : target;
    const o = Object.assign({ rounds: 10, title: 'Drill' }, opts);

    const root = document.createElement('div');
    root.className = 'quiz';
    host.appendChild(root);

    let i = 0, score = 0, streak = 0, best = 0;

    function header() {
      return `<div class="quiz-head">
        <div class="quiz-title">${o.title}</div>
        <div class="quiz-stats">
          <span>⭐ ${score}</span>
          <span>🔥 ${streak}</span>
        </div>
      </div>
      <div class="quiz-progress"><div style="width:${(i / o.rounds) * 100}%"></div></div>`;
    }

    function start() {
      i = 0; score = 0; streak = 0; best = 0;
      next();
    }

    function startScreen() {
      root.innerHTML = `<div class="quiz-head"><div class="quiz-title">${o.title}</div></div>
        ${o.intro ? `<p>${o.intro}</p>` : ''}
        <p style="text-align:center"><button class="btn">Start! 🚀</button></p>`;
      root.querySelector('.btn').addEventListener('click', start);
    }

    function next() {
      if (i >= o.rounds) return finish();
      const q = o.generate(i);
      root.innerHTML = header() +
        `<div style="font-size:.85rem;color:#8b7fb8;font-weight:700">Question ${i + 1} of ${o.rounds}</div>
         <div class="quiz-prompt"></div>
         <div class="quiz-body"></div>
         <div class="quiz-feedback"></div>
         <div class="quiz-next" style="text-align:right"></div>`;
      const promptEl = root.querySelector('.quiz-prompt');
      const bodyEl = root.querySelector('.quiz-body');
      if (typeof q.prompt === 'function') q.prompt(promptEl);
      else promptEl.innerHTML = q.prompt;

      if (q.choices) {
        const wrap = document.createElement('div');
        wrap.className = 'quiz-choices';
        bodyEl.appendChild(wrap);
        shuffle(q.choices).forEach(ch => {
          const b = document.createElement('button');
          b.className = 'quiz-choice';
          b.innerHTML = ch.html;
          b.addEventListener('click', () => {
            wrap.querySelectorAll('button').forEach(x => x.disabled = true);
            if (ch.correct) {
              b.classList.add('correct');
              good(q);
            } else {
              b.classList.add('wrong');
              wrap.querySelectorAll('button').forEach(x => {
                const match = q.choices.find(cc => cc.html === x.innerHTML && cc.correct);
                if (match) x.classList.add('correct');
              });
              bad(q);
            }
          });
          wrap.appendChild(b);
        });
      } else if (q.input) {
        const mode = keypadMode(q.input);
        const prefix = keypadPrefix(q.input, mode);

        // Answer field: an optional locked prefix (e.g. "y =") + the typed part.
        const field = document.createElement('div');
        field.className = 'quiz-field';
        if (prefix) {
          const pf = document.createElement('span');
          pf.className = 'quiz-prefix';
          pf.textContent = prefix.trim();
          field.appendChild(pf);
        }
        const inp = document.createElement('input');
        inp.className = 'quiz-answer';
        inp.placeholder = prefix ? '…' : (q.input.placeholder || 'your answer…');
        // The big on-screen pad is the only way to type, so suppress the phone's
        // OS keyboard. readOnly is the reliable guarantee on Android (inputmode
        // alone isn't always honoured); focus still shows a caret and the pad
        // writes into the field programmatically.
        inp.inputMode = 'none';
        inp.readOnly = true;
        inp.autocapitalize = 'off'; inp.autocomplete = 'off'; inp.spellcheck = false;
        field.appendChild(inp);
        bodyEl.appendChild(field);

        const submit = () => {
          if (btn.disabled || !inp.value.trim()) return;
          btn.disabled = true; inp.disabled = true;
          keypad.querySelectorAll('.quiz-key').forEach(k => k.disabled = true);
          let val = inp.value;
          if (prefix && !/^\s*y\s*=/i.test(val)) val = prefix + val;
          if (q.input.check(val)) good(q);
          else bad(q, q.input.answer);
        };

        // Big-button keypad.
        const keypad = document.createElement('div');
        keypad.className = 'quiz-keypad';
        keypadRows(mode, q.input).forEach(r => {
          const rowEl = document.createElement('div');
          rowEl.className = 'krow';
          r.forEach(raw => {
            const k = normKey(raw);
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'quiz-key' + (k.act ? ' act' : '') +
              (k.wide ? ' wide' : '') + (k.act === 'never' ? ' never' : '');
            b.textContent = k.t;
            // pointerdown + preventDefault keeps focus on the field so the
            // caret stays put and never triggers the OS keyboard.
            b.addEventListener('pointerdown', e => {
              e.preventDefault();
              if (b.disabled) return;
              if (k.act === 'back') backspace(inp);
              else if (k.act === 'never') { inp.value = 'never'; try { inp.setSelectionRange(5, 5); } catch (_) {} }
              else insertAtCaret(inp, k.v);
              inp.focus();
            });
            rowEl.appendChild(b);
          });
          keypad.appendChild(rowEl);
        });
        // Full-width Check button as the last row.
        const goRow = document.createElement('div');
        goRow.className = 'krow';
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'quiz-key go wide';
        btn.textContent = 'Check ✓';
        btn.addEventListener('pointerdown', e => { e.preventDefault(); submit(); });
        goRow.appendChild(btn);
        keypad.appendChild(goRow);
        bodyEl.appendChild(keypad);

        inp.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
        inp.focus();
      }
    }

    function good(q) {
      score++; streak++; best = Math.max(best, streak);
      const fb = root.querySelector('.quiz-feedback');
      fb.className = 'quiz-feedback good';
      fb.innerHTML = `✓ ${pick(PRAISE)}${streak >= 3 ? ` &nbsp;🔥 ${streak} in a row!` : ''}`;
      if (streak > 0 && streak % 5 === 0) confetti(14);
      refreshStats();
      setTimeout(() => { i++; next(); }, 1100);
    }

    function bad(q, answerText) {
      streak = 0;
      const fb = root.querySelector('.quiz-feedback');
      fb.className = 'quiz-feedback bad';
      let msg = `✗ ${pick(NUDGE)}`;
      if (answerText) msg += `<br>Answer: <span class="eq">${answerText}</span>`;
      if (q.explain) msg += `<div style="font-weight:400;margin-top:6px">${q.explain}</div>`;
      fb.innerHTML = msg;
      refreshStats();
      const nextEl = root.querySelector('.quiz-next');
      nextEl.innerHTML = '<button class="btn">Next →</button>';
      nextEl.querySelector('.btn').addEventListener('click', () => { i++; next(); });
    }

    function refreshStats() {
      const stats = root.querySelector('.quiz-stats');
      if (stats) stats.innerHTML = `<span>⭐ ${score}</span><span>🔥 ${streak}</span>`;
    }

    function finish() {
      const frac = score / o.rounds;
      const stars = frac === 1 ? '🌟🌟🌟' : frac >= 0.8 ? '⭐⭐⭐' : frac >= 0.6 ? '⭐⭐' : '⭐';
      const msg = frac === 1 ? 'PERFECT SCORE! Absolute legend.'
        : frac >= 0.8 ? 'Brilliant — you’ve got this!'
        : frac >= 0.6 ? 'Solid work! One more round to lock it in?'
        : 'Good effort — replay the round, it’ll click!';
      root.innerHTML = header() + `<div class="quiz-final">
          <div class="stars">${stars}</div>
          <div class="big">${score} / ${o.rounds}</div>
          <p><strong>${msg}</strong>${best >= 3 ? `<br>Longest streak: 🔥 ${best}` : ''}</p>
          <button class="btn">Play again 🔁</button>
        </div>`;
      root.querySelector('.btn').addEventListener('click', start);
      if (frac >= 0.8) confetti();
      if (o.onFinish) o.onFinish(score, o.rounds);
    }

    startScreen();
    return { restart: start };
  }

  return { create, parseLine, checkLine, fmtLine, fmtNum, ri, rnz, pick, shuffle, approx, confetti,
    keypadMode, keypadPrefix, keypadRows };
})();
