# 02 — Design System: "Calm Ikigai Futurism" (Zen-Tech Aesthetic)

## 1. Aesthetic Philosophy
The UI must never look like a chaotic trading terminal or harsh neon cyberpunk site. It must feel **serene, mindful, warm, and effortlessly futuristic**—blending **Japanese Zen garden tranquility** with **Apple VisionOS spatial frosted glass**.

---

## 2. Color Tokens & Atmospheric Background
- **Primary Canvas:** Deep Meditative Ink (`#090F1A` / `bg-[#090F1A] text-slate-100`).
- **Ambient Bioluminescent Light Wells (Fixed Background Layer):**
  - Top-Left Zen Jade Aura: `bg-[radial-gradient(circle_at_15%_15%,rgba(52,211,153,0.12),transparent_50%)]`
  - Bottom-Right Sky Cyan Aura: `bg-[radial-gradient(circle_at_85%_85%,rgba(56,189,248,0.12),transparent_50%)]`
  - Center Ikigai Gold Warmth: `bg-[radial-gradient(circle_at_50%_40%,rgba(251,191,36,0.07),transparent_45%)]`

### The 4 Ikigai Pillar Color Signatures
| Pillar | Meaning | Primary Accent | Tailwind Classes (Badge / Border / Glow) |
| :--- | :--- | :--- | :--- |
| **1. Passion** *(What You Love)* | Family Legacy & Gold Gifting | Warm Rose Lotus (`#F472B6`) | `text-pink-300 border-pink-400/30 bg-pink-500/10 shadow-pink-500/10` |
| **2. Vocation** *(What You Are Good At)* | U Academy & U-AI Mastery | Serene Sky Cyan (`#38BDF8`) | `text-sky-300 border-sky-400/30 bg-sky-500/10 shadow-sky-500/10` |
| **3. Mission** *(What the World Needs)* | U.Center DAO & Compliance | Bioluminescent Jade (`#34D399`) | `text-emerald-300 border-emerald-400/30 bg-emerald-500/10 shadow-emerald-500/10` |
| **4. Profession** *(What You Get Paid For)* | U-Agent Pay & Avalanche Split | Champagne Sunrise Gold (`#FBBF24`) | `text-amber-300 border-amber-400/30 bg-amber-500/10 shadow-amber-500/10` |

---

## 3. Spatial Frosted Glass & Card Styling
- **Main Container Cards:**
  `bg-white/[0.04] backdrop-blur-2xl border border-white/[0.10] rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.35)]`
- **Interactive Preset / Selection Cards:**
  `bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/[0.22] rounded-2xl p-4 transition-all duration-300 cursor-pointer`
- **Primary Action Buttons:**
  `bg-gradient-to-r from-emerald-400/90 via-teal-400/90 to-sky-400/90 hover:from-emerald-300 hover:to-sky-300 text-slate-950 font-semibold rounded-2xl px-5 py-3 shadow-lg shadow-emerald-500/20 transition-all duration-300`

---

## 4. Calm Breathing Animations (Framer Motion)
- **The Ikigai Compass Circles & Voice Orb:**
  Use slow, meditative breathing loops (`duration: 5`, `repeat: Infinity`, `ease: "easeInOut"`) rather than rapid, jarring animations.
- **Module Transitions:**
  Wrap active pillar views in `<AnimatePresence mode="wait">` with `initial={{ opacity: 0, y: 10 }}`, `animate={{ opacity: 1, y: 0 }}`, `exit={{ opacity: 0, y: -10 }}`, `transition={{ duration: 0.35 }}`.

---

## 5. Responsive Split-Screen Workspace Layout
- **Top Sticky Navbar (`Navbar.tsx`):** Full width, `h-20`, glassmorphic (`bg-[#090F1A]/80 backdrop-blur-xl border-b border-white/10`).
- **Desktop 12-Column Grid (`max-w-[1440px] mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8`):**
  - **Left Column (`lg:col-span-8`):**
    1. Top Card: **Interactive 4-Circle Ikigai Compass (`IkigaiCompass.tsx`)** + Slogan Header (*"U-topia With Meaning"*) + Active Voice Companion Bar.
    2. Bottom Card: **Active Pillar Workspace** (renders Pillar 1, 2, 3, or 4 based on selection).
  - **Right Column (`lg:col-span-4`):**
    - Sticky **U-topia Non-Custodial Super App Phone Simulator (`PhoneSimulator.tsx`)** inside a realistic rounded iPhone titanium bezel (`rounded-[44px] border-[6px] border-slate-800/90 bg-[#070B14] shadow-2xl`).