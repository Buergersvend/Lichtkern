// src/components/Decorations.jsx
// Dekorative SVG-Komponenten: Flower, TreeOfLife
// Importiere T aus deiner constants/theme-Datei (Pfad ggf. anpassen)
import { T } from "../config/theme";

// ─── FLOWER ───────────────────────────────────
export function Flower({ size = 280, opacity = 0.09, color }) {
  const c = color || T.teal;
  const r = 44;
  const cx = size / 2;
  const cy = size / 2;
  const pts = [
    [0, 0],
    [r, 0],
    [-r, 0],
    [r / 2, r * 0.866],
    [-r / 2, r * 0.866],
    [r / 2, -r * 0.866],
    [-r / 2, -r * 0.866],
  ];
  return (
    <svg
      width={size}
      height={size}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        opacity,
        pointerEvents: "none",
      }}
      viewBox={`0 0 ${size} ${size}`}
    >
      {pts.map(([dx, dy], i) => (
        <circle
          key={i}
          cx={cx + dx}
          cy={cy + dy}
          r={r}
          fill="none"
          stroke={c}
          strokeWidth="1.1"
        />
      ))}
      <circle
        cx={cx}
        cy={cy}
        r={r * 2}
        fill="none"
        stroke={c}
        strokeWidth="0.5"
      />
    </svg>
  );
}

// ─── TREE OF LIFE ─────────────────────────────
export function TreeOfLife({ width = 220, height = 300, opacity = 0.22, color, style = {} }) {
  const c = color || T.teal;
  const vw = 220, vh = 300;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${vw} ${vh}`}
      style={{ pointerEvents: "none", opacity, ...style }}
    >
      {/* ── ROOTS ── */}
      <path d="M110 245 Q95 252 78 258 Q62 263 45 266" fill="none" stroke={c} strokeWidth="2.8" strokeLinecap="round"/>
      <path d="M110 245 Q104 255 98 263 Q92 270 86 277" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M110 245 Q108 256 107 266 Q106 274 105 282" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M110 245 Q110 257 110 267 Q110 276 110 285" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M110 245 Q112 256 113 266 Q114 274 115 282" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M110 245 Q116 255 122 263 Q128 270 134 277" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M110 245 Q125 252 142 258 Q158 263 175 266" fill="none" stroke={c} strokeWidth="2.8" strokeLinecap="round"/>
      <path d="M45 266 Q32 269 20 272" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M45 266 Q36 270 30 276" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M86 277 Q78 281 70 285" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M134 277 Q142 281 150 285" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M175 266 Q184 269 196 272" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M175 266 Q184 270 190 276" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
      {/* ── MEDITATING FIGURE ── */}
      <path d="M72 243 Q78 234 92 230 Q101 227 110 228 Q119 227 128 230 Q142 234 148 243" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M72 243 Q67 245 62 243 Q58 240 60 236" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M148 243 Q153 245 158 243 Q162 240 160 236" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M92 230 Q88 220 90 210 Q92 202 96 195" fill="none" stroke={c} strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M128 230 Q132 220 130 210 Q128 202 124 195" fill="none" stroke={c} strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M93 224 Q99 218 106 215" fill="none" stroke={c} strokeWidth="1" strokeLinecap="round"/>
      <path d="M127 224 Q121 218 114 215" fill="none" stroke={c} strokeWidth="1" strokeLinecap="round"/>
      <path d="M91 213 Q98 208 105 205" fill="none" stroke={c} strokeWidth="0.9" strokeLinecap="round"/>
      <path d="M129 213 Q122 208 115 205" fill="none" stroke={c} strokeWidth="0.9" strokeLinecap="round"/>
      <path d="M96 208 Q103 212 110 213 Q117 212 124 208" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M96 195 Q89 191 84 185" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M124 195 Q131 191 136 185" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M103 195 Q102 186 102 178" fill="none" stroke={c} strokeWidth="4" strokeLinecap="round"/>
      <path d="M117 195 Q118 186 118 178" fill="none" stroke={c} strokeWidth="4" strokeLinecap="round"/>
      <ellipse cx="110" cy="170" rx="10" ry="12" fill="none" stroke={c} strokeWidth="1.8"/>
      <path d="M104 168 Q107 166 110 168" fill="none" stroke={c} strokeWidth="1.1" strokeLinecap="round"/>
      <path d="M110 168 Q113 166 116 168" fill="none" stroke={c} strokeWidth="1.1" strokeLinecap="round"/>
      <path d="M106 174 Q110 177 114 174" fill="none" stroke={c} strokeWidth="0.9" strokeLinecap="round"/>
      {/* ── TRUNK ── */}
      <path d="M103 160 Q101 148 102 136 Q103 126 104 116" fill="none" stroke={c} strokeWidth="7" strokeLinecap="round"/>
      <path d="M117 160 Q119 148 118 136 Q117 126 116 116" fill="none" stroke={c} strokeWidth="7" strokeLinecap="round"/>
      <path d="M104 116 Q105 104 106 94 Q107 85 108 76" fill="none" stroke={c} strokeWidth="5.5" strokeLinecap="round"/>
      <path d="M116 116 Q115 104 114 94 Q113 85 112 76" fill="none" stroke={c} strokeWidth="5.5" strokeLinecap="round"/>
      <path d="M108 76 Q109 65 110 55 Q110 46 110 38" fill="none" stroke={c} strokeWidth="4" strokeLinecap="round"/>
      <path d="M112 76 Q111 65 110 55" fill="none" stroke={c} strokeWidth="3.5" strokeLinecap="round"/>
      {/* ── MAIN BRANCHES ── */}
      <path d="M104 128 Q88 120 70 114 Q54 109 36 107" fill="none" stroke={c} strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M105 112 Q86 102 66 94 Q48 87 28 84" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round"/>
      <path d="M106 96 Q88 82 70 72 Q54 63 36 56" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M107 80 Q90 65 74 52 Q59 40 44 30" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"/>
      <path d="M108 64 Q93 48 80 34 Q68 21 56 10" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M116 128 Q132 120 150 114 Q166 109 184 107" fill="none" stroke={c} strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M115 112 Q134 102 154 94 Q172 87 192 84" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round"/>
      <path d="M114 96 Q132 82 150 72 Q166 63 184 56" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M113 80 Q130 65 146 52 Q161 40 176 30" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"/>
      <path d="M112 64 Q127 48 140 34 Q152 21 164 10" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M110 38 Q109 26 108 16 Q107 8 107 2" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"/>
      <path d="M110 38 Q111 26 112 16 Q113 8 113 2" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      {/* ── SECONDARY BRANCHES ── */}
      <path d="M36 107 Q26 103 16 100" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M36 107 Q28 104 24 110" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M28 84 Q18 80 10 77" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M36 56 Q24 50 14 46" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M44 30 Q32 22 22 16" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M56 10 Q46 4 38 0" fill="none" stroke={c} strokeWidth="1" strokeLinecap="round"/>
      <path d="M184 107 Q194 103 204 100" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M184 107 Q192 104 196 110" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M192 84 Q202 80 210 77" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M184 56 Q196 50 206 46" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M176 30 Q188 22 198 16" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M164 10 Q174 4 182 0" fill="none" stroke={c} strokeWidth="1" strokeLinecap="round"/>
      {/* ── LEAF CLUSTERS ── */}
      {[
        [16,98],[10,75],[14,44],[22,14],[38,-2],[56,8],[80,32],[107,0],[110,-1],[113,0],
        [140,32],[164,8],[182,-2],[198,14],[206,44],[210,75],[204,98],
        [24,108],[24,82],[26,52],[196,108],[196,82],[194,52]
      ].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={7} fill={c} opacity="0.18"/>
          <circle cx={x} cy={y} r={4.5} fill={c} opacity="0.28"/>
          <circle cx={x} cy={y} r={2} fill={c} opacity="0.45"/>
        </g>
      ))}
      {[
        [30,100],[20,78],[28,48],[36,22],[50,5],[72,20],[100,4],[120,4],[148,20],
        [170,5],[184,22],[192,48],[200,78],[190,100],[42,108],[178,108]
      ].map(([x, y], i) => (
        <circle key={`s${i}`} cx={x} cy={y} r={3} fill={c} opacity="0.16"/>
      ))}
    </svg>
  );
}
