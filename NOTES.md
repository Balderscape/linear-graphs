# Working Notes

## Who I'm teaching
- **Amelia**, Year 10 (~15), Paul's daughter. Strong at maths overall; the graphing *concept* is the sticking point — so build visual intuition first, symbols second.
- Paul (baldrick.solo@gmail.com) commissions and reviews the material; Amelia is the learner. Address lesson copy to Amelia directly ("you"), warm and encouraging.

## Stated preferences (from Paul, 2026-07-03)
- Series of **graded lessons** that build gradually — "lots of easy wins along the way to build confidence".
- **Fun, interactive, colourful, inviting.** Not babyish (she's 15 and capable).
- **Lots of exercises** to drill each concept — instant-feedback drills, streaks, celebrations.

## Design decisions
- Course lives in `lessons/0001…0009` + `index.html` course map at workspace root.
- Shared components in `assets/` — see `assets/README.md` for the component API. All lessons must reuse `course.css`, `graph.js`, `quiz.js`; never inline duplicates.
- Terminology: **gradient** (mention "slope" once as a synonym), **y-intercept**, `y = mx + c`. Glossary at `reference/glossary.html` is canonical.
- Drills use randomised question generators (fresh questions every replay) — retrieval practice over recognition.
- Lesson 9 is a deliberately **interleaved** mixed drill (storage strength, not just fluency).
- Everything must work offline from `file://` — no CDNs, no external fonts.

## Watch for next sessions
- No learning records yet — after Amelia's first sessions, ask Paul (or Amelia) which drills felt easy/hard and record her actual zone of proximal development.
- If the school unit includes midpoints/perpendicular gradients, extend the course (currently out of scope per MISSION.md).
