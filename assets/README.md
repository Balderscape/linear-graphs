# Course component library

Every lesson links these three files (relative from `lessons/`):

```html
<link rel="stylesheet" href="../assets/course.css">
<script src="../assets/graph.js"></script>
<script src="../assets/quiz.js"></script>
```

Reference pages in `reference/` link `../assets/course.css` only.
Everything must work offline from `file://` — no CDNs, fonts, or fetches.

## Graph (graph.js)

```js
const g = Graph.create('someDivId', {
  xmin: -10, xmax: 10, ymin: -10, ymax: 10,   // defaults shown
  width: 420, height: 420, labelEvery: 2,      // axis numbers every 2 units
});

g.line(m, c, {color, width, dash, label});     // draws y = mx + c, auto-clipped
g.hline(y, {…});  g.vline(x, {…});             // horizontal / vertical lines
g.segment(x1, y1, x2, y2, {…});
g.point(x, y, {color, size, label});
g.text(x, y, 'hi', {color, size, anchor});     // white-outlined, always readable
g.riseRun(x0, dx, m, c, {color});              // dashed "across dx / up rise" triangle on the line
g.clear();                                     // removes drawn shapes, keeps grid+axes
g.onClick((x, y) => {…}, snap);                // snapped click coords (default snap 1)
```

Style opts: `color` (CSS colour), `width` (stroke px), `dash: true`, `label: 'y = 2x'`.
Palette to reuse: purple `#7c3aed`, pink `#ec4899` (use for **m**/gradient), teal `#0d9488`
(use for **c**/intercept), amber `#f59e0b` (annotations), red `#ef4444`, green `#16a34a`.

```js
const s = Graph.slider('divId', {label: 'm', min: -5, max: 5, step: 1, value: 1,
                                 color: '#ec4899', onInput: v => redraw()});
s.value;  s.set(2);
```

## Quiz (quiz.js)

```js
Quiz.create('someDivId', {
  title: 'Drill: read the gradient 🔥',
  intro: 'optional html shown before the Start button',
  rounds: 10,
  generate: (i) => question,     // called fresh each question — randomise!
});
```

A `question` is one of:

```js
// Multiple choice (keep all choices the same length/format — no give-away formatting):
{ prompt: 'What is the gradient of <span class="eq">y = 3x − 2</span>?',
  choices: [{html: '3', correct: true}, {html: '−2'}, {html: '2'}, {html: '−3'}],
  explain: 'shown under a wrong answer' }

// Typed input:
{ prompt: (el) => { el.innerHTML = 'Equation of this line?';
                    const g = Graph.create(el, {width: 320, height: 320}); g.line(2, 1); },
  input: { placeholder: 'y = …',
           check: s => Quiz.checkLine(s, {m: 2, c: 1}),
           answer: 'y = 2x + 1' },
  explain: '…' }
```

`prompt` may be an html string **or** a function receiving the prompt element
(use the function form to embed a Graph in the question).

Helpers:

```js
Quiz.parseLine('y = -x/2 + 3')   // → {type:'line', m:-0.5, c:3};  'x = 4' → {type:'vline', x:4}; bad → null
Quiz.checkLine(str, {m, c})      // typed-answer checker (also {type:'vline', x: k})
Quiz.fmtLine(m, c)               // → 'y = 2x − 3', handles m of 0 / 1 / −1, fractions
Quiz.fmtNum(-0.5)                // → '-1/2'
Quiz.ri(a, b)                    // random int in [a, b]
Quiz.rnz(a, b)                   // random NON-ZERO int in [a, b]
Quiz.pick(arr)  Quiz.shuffle(arr)  Quiz.approx(a, b)
Quiz.confetti()                  // celebration burst
```

The engine already gives: progress bar, ⭐ score, 🔥 streaks, praise/nudge messages,
auto-advance on correct, Next button + explanation on wrong, end screen with stars
and Play-again (which regenerates fresh random questions).

## CSS classes to reuse (course.css)

- Page skeleton: `body > .wrap`, hero header `.hero` (with `.kicker`, `h1`, `p`)
- `.card` content sections; `.card.goal` for the "In this lesson" box
- `.tip` (amber callout), `.win` (green "easy win" callout)
- `.eq` inline equation chip, `.eq-big` centred display equation;
  `.m-color` / `.c-color` to tint m pink and c teal inside equations
- `.btn`, `.btn.secondary`
- `table.vals` for x/y tables of values
- `.lesson-nav` prev/next pill links, `.footer-links`
- `.map-grid` / `.map-item` / `.map-num` for the course index
- `.no-print` hides from printing (reference pages print well)
