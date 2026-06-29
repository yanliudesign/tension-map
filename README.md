# 逐玉 · 张力图谱 — Tension Map

> **Visualize the emotional geometry of a story.**
> A cinematic narrative-intelligence app for the novel/drama *逐玉 (Zhuyu)* — mapping the invisible forces between characters: affection, suspicion, loyalty, betrayal, power, and hidden truths, and how they evolve across the arc.

<p align="center">
  <img src="screenshots/1.png" alt="Character overview — Snowbound Encounter" width="100%" />
</p>

<p align="center">
  <em>张力图谱 · 21 characters · 20+ relationships · 5 story stages · 3 analytical lenses</em>
</p>

---

## ✦ What it is

`逐玉 · 张力图谱` is an interactive D3-powered relationship graph that treats a story like a **dynamic system**, not a static character list. Each character is a node; each relationship is an edge with weighted scores along several emotional dimensions. As you scrub through the story's five stages, the network breathes — bonds tighten, fracture, realign.

It's part literary analysis tool, part data-vis art piece, part "what if?" sandbox.

## ✦ Features

- **Force-directed character graph** — D3 v7 physics simulation, click any node or edge for narrative detail
- **3 analytical modes**, each re-skinning the graph through a different lens
  - **情感张力 · Emotional Tension** — affection, conflict, dependence
  - **忠义图谱 · Loyalty Map** — trust, loyalty, betrayal, duty
  - **权力格局 · Power Dynamics** — political threat, hidden truth, hierarchy
- **5 story stages** — scrub the timeline to watch relationships evolve
  - 雪中初遇 · Snowbound Encounter
  - 契约婚盟 · Contract Marriage
  - 离散烽火 · Separation & War
  - 真相与裂变 · Truth and Fracture
  - 重逢与清算 · Reunion & Reckoning
- **What-if sandbox** — drag relationship scores; adjacent edges cascade automatically (20% delta propagation)
- **Perspective view** — pick a character to see the story through *their* emotional lens
- **AI-style insight cards** — narrative analysis generated per stage and mode
- **Text-input mode** — paste your own story; the parser will sketch a draft graph
- **Cinematic visual language** — gold-on-ink palette, Cormorant Garamond display type, soft floating motion

## ✦ Screenshots

| Character overview | Relationship detail | Text input |
|---|---|---|
| ![](screenshots/1.png) | ![](screenshots/2.png) | ![](screenshots/3.png) |

## ✦ Tech Stack

- **React 18** — UI
- **D3 v7** — force simulation & SVG rendering
- **Tailwind CSS v3** — utility styling with a custom `gold` / `ink` palette
- **Vite 5** — dev server & build
- **lucide-react** — icon set

No backend, no database. Everything runs client-side off `src/data/sampleData.js`.

## ✦ Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Build & preview

```bash
npm run build
npm run preview
```

## ✦ Project Structure

```
src/
├── App.jsx                  # Top-level state, hero intro, layout
├── main.jsx                 # React entry
├── index.css                # Tailwind layers + global styles
├── components/
│   ├── GraphCanvas.jsx      # D3 force simulation + SVG nodes/edges
│   ├── DetailPanel.jsx      # Side panel for selected node/edge
│   ├── Timeline.jsx         # 5-stage scrubber
│   ├── InsightCards.jsx     # Generated narrative analysis
│   ├── InputPanel.jsx       # Paste-your-own-story textarea
│   └── ModeToggle.jsx       # 情感 / 忠义 / 权力 mode switcher
├── data/
│   └── sampleData.js        # Characters, relationships, stages
└── utils/
    ├── parser.js            # Rough text → graph parser
    └── insights.js          # Per-stage / per-mode narrative analysis
```

## ✦ Data Model

A relationship looks roughly like:

```js
{
  id: 'fanchangyu-xiezheng',
  source: 'fanchangyu',
  target: 'xiezheng',
  type: 'affection',          // affection · trust · conflict · dependence ·
                              // betrayal · duty · loyalty ·
                              // political_threat · hidden_truth
  stages: {
    encounter:  { affection: 15, trust: 20, conflict: 40, ... },
    contract:   { affection: 35, trust: 35, conflict: 25, ... },
    separation: { affection: 70, trust: 50, conflict: 10, ... },
    fracture:   { affection: 80, trust: 20, conflict: 75, ... },
    reunion:    { affection: 95, trust: 90, conflict:  5, ... },
  },
}
```

Each score is 0–100. Stages are evaluated lazily and merged with any user "what-if" overrides at render time.

## ✦ Roadmap

- Real LLM call in place of the simulated `setTimeout` in `handleAnalyze`
- Export current view as SVG / PNG
- Animated transitions between stages (currently snap)
- Audio layer — a different motif per mode
- Support for additional novels / dramas

## ✦ Credits

Story · *逐玉* (Zhuyu)
Design & engineering · [@yanliudesign](https://github.com/yanliudesign)
Built with React + D3 + Tailwind + a lot of late-night Cormorant Garamond.

## ✦ License

MIT — do what you want, just keep the attribution.
