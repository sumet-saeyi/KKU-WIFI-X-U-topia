export function Dreamscape() {
  return <svg className="dreamscape" viewBox="0 0 340 300" fill="none" aria-hidden="true">
    <defs><linearGradient id="dream-arch" x1="80" y1="0" x2="290" y2="300" gradientUnits="userSpaceOnUse"><stop stopColor="#abcdbb" /><stop offset="1" stopColor="#497b65" /></linearGradient><linearGradient id="dream-hill" x1="120" y1="150" x2="270" y2="290" gradientUnits="userSpaceOnUse"><stop stopColor="#6ea28a" /><stop offset="1" stopColor="#183c31" /></linearGradient><radialGradient id="dream-sun"><stop stopColor="#fff0b7" /><stop offset="1" stopColor="#e5bb7f" /></radialGradient></defs>
    <ellipse cx="171" cy="275" rx="134" ry="13" fill="#041a14" opacity=".35" />
    <path d="M61 260V130a110 110 0 0 1 220 0v130H61Z" fill="url(#dream-arch)" />
    <path d="M77 260V132a94 94 0 0 1 188 0v128H77Z" fill="#d1e0cc" />
    <circle cx="203" cy="104" r="37" fill="url(#dream-sun)" />
    <path d="M77 196c38-9 60-51 99-41 41 10 51 43 89 28v77H77v-64Z" fill="#a8bfa0" />
    <path d="M77 227c58-57 85-70 130-39 27 18 38 38 58 30v42H77v-33Z" fill="url(#dream-hill)" />
    <path d="M77 250c53-16 69-8 112 10H77v-10Z" fill="#203f32" />
    <path d="M172 260c-21-21-14-37 4-50s33-23 23-38" stroke="#dfdac0" strokeWidth="10" opacity=".75" />
    <path d="M77 260V132a94 94 0 0 1 188 0v128" stroke="#e6ecd7" strokeWidth="2" strokeOpacity=".4" />
    <path d="M34 254c7-36 14-62 16-87" stroke="#73977b" strokeWidth="3" /><path d="M49 200c-16 1-26-7-24-24 16 0 24 9 24 24Zm-5 23c17 0 28-10 26-26-17 0-26 11-26 26Z" fill="#779c7a" />
    <path d="M300 255c-6-24-9-43-9-64" stroke="#c0bc8f" strokeWidth="3" /><path d="M291 217c14-1 23-10 22-24-15 2-22 10-22 24Zm6 22c-13 1-23-5-24-18 15-2 23 4 24 18Z" fill="#a7ae83" />
    <rect x="12" y="103" width="107" height="49" rx="15" fill="#f2eade" /><path d="m31 128 5 5 10-12" stroke="#48795e" strokeWidth="2" strokeLinecap="round" /><path d="M56 122h47M56 131h32" stroke="#879781" strokeWidth="4" strokeLinecap="round" />
    <rect x="225" y="202" width="107" height="53" rx="15" fill="#f2eade" /><circle cx="247" cy="228" r="11" fill="#b7c7a0" /><path d="M245 222v12m-3-9h7m-7 6h7" stroke="#486344" strokeWidth="1.7" /><path d="M267 223h46M267 233h30" stroke="#879781" strokeWidth="4" strokeLinecap="round" />
    <path d="m282 62 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" fill="#c7d4b2" /><circle cx="48" cy="94" r="3" fill="#b2bd94" />
  </svg>;
}
