<!-- =============================================================== -->
<!--                                                                 -->
<!--   逐玉 · 张力图谱                                                -->
<!--   Tension Map · Narrative Intelligence for any story            -->
<!--                                                                 -->
<!-- =============================================================== -->

<div align="center">

<br />

<h1>
  <span style="letter-spacing: 0.08em;">张</span>·<span style="letter-spacing: 0.08em;">力</span>·<span style="letter-spacing: 0.08em;">图</span>·<span style="letter-spacing: 0.08em;">谱</span>
  <br />
  <sub><sup>Tension Map</sup></sub>
</h1>

<p>
  <em>Visualize the emotional geometry of a story.</em>
</p>

<p>
  绘制人物之间的隐形力量 —— 深情 · 猜忌 · 忠诚 · 背叛 · 权力 · 隐秘真相。<br />
  观察关系如何随剧情推进而演变。
</p>

<br />

<p>
  <a href="#-quick-start"><img src="https://img.shields.io/badge/Quick%20Start-▶-E8B86D?style=for-the-badge&labelColor=0E1014" alt="Quick start" /></a>
  <a href="#-the-methodology"><img src="https://img.shields.io/badge/Methodology-📐-5B9BD5?style=for-the-badge&labelColor=0E1014" alt="Methodology" /></a>
  <a href="#-bring-your-own-story"><img src="https://img.shields.io/badge/Your%20Own%20Story-✦-9B6CF6?style=for-the-badge&labelColor=0E1014" alt="Bring your own story" /></a>
</p>

<p>
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" alt="React 18" />
  <img src="https://img.shields.io/badge/D3-v7-F9A03C?logo=d3.js&logoColor=white" alt="D3 v7" />
  <img src="https://img.shields.io/badge/Tailwind-v3-38BDF8?logo=tailwindcss&logoColor=white" alt="Tailwind v3" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white" alt="Vite 5" />
  <img src="https://img.shields.io/badge/License-MIT-4CAF8B" alt="MIT License" />
</p>

</div>

<br />

<p align="center">
  <img src="screenshots/1.png" alt="Character overview — Snowbound Encounter" width="100%" />
</p>

<p align="center">
  <em>21 characters · 20+ relationships · 5 emotional stages · 3 analytical lenses</em>
</p>

---

## ✦ Why this exists

Most "character relationship diagrams" are wikis with arrows — flat, static, factual.

**A story isn't flat.** Trust erodes. Affection survives betrayal. Power flips. The same character who would die for you in chapter 3 is the one twisting the knife in chapter 9.

`张力图谱` treats a story as a **dynamic system**:

- Every character is a **node** with weight, traits, and a 5-stage emotional arc.
- Every relationship is an **edge** scored 0–100 across four axes — tension, trust, affection, power — and re-evaluated at each story stage.
- Three **analytical lenses** (情感张力 · 忠义图谱 · 权力格局) re-skin the same data to surface different truths.

The result is a graph that **breathes** with the story.

---

## ✦ Features

<table>
<tr>
<td width="50%" valign="top">

#### 🌐 Force-directed character graph
D3 v7 physics simulation. Click any node for a full character panel; any edge for relationship dynamics.

</td>
<td width="50%" valign="top">

#### 🎚 Three analytical modes
The same 21 characters, three different stories:
- **情感张力** — affection, conflict, dependence
- **忠义图谱** — trust, loyalty, betrayal, duty
- **权力格局** — political threat, hidden truth, hierarchy

</td>
</tr>
<tr>
<td width="50%" valign="top">

#### 🎞 Five-stage timeline
Scrub through the arc — *encounter → contract → separation → fracture → reunion* — and watch bonds tighten, snap, and realign.

</td>
<td width="50%" valign="top">

#### 🪞 Perspective view
Pin any character and see the entire story refracted through *their* emotional lens.

</td>
</tr>
<tr>
<td width="50%" valign="top">

#### 🎛 What-if sandbox
Drag relationship scores. Adjacent edges propagate at 20% delta — small disturbances ripple through the network.

</td>
<td width="50%" valign="top">

#### 🔮 Generated narrative insights
Per-stage, per-mode insight cards: *most fractured bond · highest hidden tension · emotional center of the story…*

</td>
</tr>
</table>

---

## ✦ Screenshots

<table>
<tr>
<td width="33%"><img src="screenshots/1.png" alt="Character overview"></td>
<td width="33%"><img src="screenshots/2.png" alt="Relationship detail"></td>
<td width="33%"><img src="screenshots/3.png" alt="Text input"></td>
</tr>
<tr>
<td align="center"><sub>Character overview · 雪中初遇</sub></td>
<td align="center"><sub>Relationship detail · 离散烽火</sub></td>
<td align="center"><sub>Bring your own story</sub></td>
</tr>
</table>

---

## ✦ Quick start

```bash
git clone https://github.com/yanliudesign/tension-map.git
cd tension-map
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

```bash
npm run build      # production bundle
npm run preview    # preview the build locally
```

---

## ✦ How it works

```mermaid
flowchart LR
  A[Source<br/>novel · drama · synopsis] --> B[Cast<br/>15–25 characters]
  B --> C[Arc<br/>5 emotional stages]
  C --> D[Web<br/>20–40 relationships]
  D --> E[Scores<br/>5 × 4 per edge]
  E --> F[(data/slug.js)]
  F --> G[App<br/>D3 force graph]
  G --> M1[情感张力]
  G --> M2[忠义图谱]
  G --> M3[权力格局]
```

The data layer is plain ES modules. The render layer is React + D3 + Tailwind. No backend, no database — everything runs client-side off the static dataset you load.

### The data model

```js
relationship = {
  id, source, target,
  primaryType: 'affection',
  types: ['affection', 'hidden_truth'],
  label: '契约之情', labelEn: 'Bound by contract, forged in fire',
  quote: '我不需要你喜欢我，我只需要你活着。',
  summary, literaryNote,
  stages: {
    encounter:  { tensionScore: 32, trustScore: 12, affectionScore:  8, powerScore: 68 },
    contract:   { tensionScore: 55, trustScore: 28, affectionScore: 32, powerScore: 60 },
    separation: { tensionScore: 82, trustScore: 52, affectionScore: 72, powerScore: 45 },
    fracture:   { tensionScore: 97, trustScore:  8, affectionScore: 88, powerScore: 38 },
    reunion:    { tensionScore: 68, trustScore: 82, affectionScore: 92, powerScore: 50 },
  },
}
```

Each score is 0–100. Stages merge with any user "what-if" overrides at render time, and cascade 20% of the delta to adjacent edges.

---

## ✦ Bring your own story

The 逐玉 dataset (`src/data/sampleData.js`) is the **first reference**. The graph engine is IP-agnostic — feed it any story.

### Option A · Hand-write a dataset

Copy `sampleData.js` → `src/data/yourstory.js`, rewrite characters/relationships/stages.

```diff
// src/App.jsx
- import { characters, relationships, STAGES } from './data/sampleData'
+ import { characters, relationships, STAGES } from './data/yourstory'
```

`npm run dev` and you're in.

### Option B · Generate it with the `tension-map` skill

This repo is the **canonical renderer** of the [`tension-map`](https://github.com/yanliudesign) Claude / Copilot skill — a literary methodology for turning *any* novel or drama into a structured `data/{slug}.js` file.

In your AI agent of choice, just say:

> 帮我做《琅琊榜》的张力图谱

The skill will walk you through: research → cast (15–25 characters) → arc (5 stages) → web (20–40 relationships) → scores → voice → assembled `src/data/langyabang.js`.

Then swap the import as in Option A.

> The skill lives outside this repo (in `~/.claude/skills/tension-map`). The data files it produces drop into `src/data/`.

---

## ✦ The methodology

Even without the agent skill, the methodology itself is portable. Every dataset is built on:

| Layer | Constraint | Why |
|---|---|---|
| **Cast** | 15–25 characters | Below 15 = thin; above 25 = visual noise that breaks the force layout |
| **Stages** | Exactly 5, each a *psychological* turning point — not a chapter | The Timeline UI is hard-locked to 5; arbitrary chapter slicing produces flat curves |
| **Edges** | 20–40 relationships | Sparse enough to read; dense enough to feel like a network |
| **Types** | 9 fixed types | `affection · trust · conflict · dependence · betrayal · duty · loyalty · political_threat · hidden_truth` |
| **Scores** | 4 dimensions × 5 stages × 0–100 | Calibrated against an anchor table so the curves *narrate* |
| **Voice** | Cinematic, em-dashes, no plot-summary tone | The text fields are not flavor — they're the literary surface |

These six constraints are what makes the visualization mean something. Strip any one and it collapses into a wiki.

---

## ✦ Tech stack

<table>
<tr>
<td valign="top">

**Core**
- React 18
- D3 v7 (force simulation + SVG)
- Tailwind CSS v3
- Vite 5
- lucide-react

</td>
<td valign="top">

**Visual language**
- Display · *Cormorant Garamond*
- Body · *Inter*
- Palette · Gold `#E8B86D` × Ink `#0E1014`
- Motion · floating, easing on every state change

</td>
</tr>
</table>

---

## ✦ Project structure

<details>
<summary><strong>Click to expand</strong></summary>

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
│   ├── sampleData.js        # 逐玉 — the first reference dataset
│   └── {slug}.js            # add your own here
└── utils/
    ├── parser.js            # Rough text → graph parser
    └── insights.js          # Per-stage / per-mode narrative analysis
```

</details>

---

## ✦ Roadmap

- [x] 21-character force graph with three analytical modes
- [x] Five-stage timeline with score cascading
- [x] What-if sandbox with 20% delta propagation
- [x] Generated insight cards per stage × mode
- [x] Portable methodology packaged as `tension-map` skill
- [ ] In-app story switcher (drop the import-swap step)
- [ ] Real LLM call replacing the simulated `setTimeout` in `handleAnalyze`
- [ ] Export current view as SVG / PNG
- [ ] Animated transitions between stages (currently snap)
- [ ] Audio layer — a different motif per mode
- [ ] Additional reference datasets — *琅琊榜 · 庆余年 · 红楼梦*…

Want to contribute a dataset? PR a `src/data/{slug}.js` and we'll feature it.

---

## ✦ Credits

<table>
<tr>
<td valign="top" width="60%">

**Story** · *逐玉 (Zhuyu)*<br />
**Design & engineering** · [@yanliudesign](https://github.com/yanliudesign)<br />
**Methodology** · [`tension-map`](https://github.com/yanliudesign) Claude / Copilot skill<br />
**Built with** · React · D3 · Tailwind · Vite · Cormorant Garamond

</td>
<td valign="top" width="40%">

<sub>If this graph made you see the story differently, give it a ⭐.</sub>

</td>
</tr>
</table>

---

## ✦ License

MIT © 2026 [@yanliudesign](https://github.com/yanliudesign)

<div align="center"><br />

<sub>玉 · ink · gold · garamond</sub>

</div>
