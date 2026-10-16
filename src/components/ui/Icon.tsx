import type { CSSProperties } from 'react';

const paths = {
  home: 'm3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  back: 'M19 12H5m6 6-6-6 6-6',
  chevron: 'm9 5 7 7-7 7',
  down: 'm6 9 6 6 6-6',
  wallet: 'M20 8H5a2 2 0 0 1 0-4h13v4M4 6v13a1 1 0 0 0 1 1h15V8m0 4h-5v4h5m-3-2h.01',
  pay: 'M4 6h16v13H4zM4 10h16M7 15h3m4 0h3',
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  learn: 'M12 5C9 3 5 3 2 4v15c3-1 7-1 10 1m0-15c3-2 7-2 10-1v15c-3-1-7-1-10 1V5',
  share: 'M8 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm14-7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm0 14a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM8 10l8-4M8 14l8 4',
  spark: 'm12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z',
  check: 'm5 12 4 4L19 6',
  close: 'm6 6 12 12M6 18 18 6',
  shield: 'm12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6Zm-4 10 3 3 5-6',
  speaker: 'M11 4 6 8H3v8h3l5 4V4m5 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',
  help: 'M9 8a3 3 0 1 1 5 2c-1 1-2 1-2 4m0 3h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  settings: 'm9 3-.5 3-3 1L3 6l-2 4 2.5 2v3L1 17l2 4 3-1 2.5 1L9 24h5l.5-3 3-1 3 1 2-4-2.5-2v-3l2.5-2-2-4-3 1-3-1L14 3Zm7 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  monitor: 'M3 3h18v13H3zM12 16v5m-5 0h10',
  phone: 'M7 2h10a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Zm3 17h4',
  menu: 'M4 6h16M4 12h16M4 18h16',
  receipt: 'M6 2h12v20l-3-2-3 2-3-2-3 2Zm3 5h6m-6 4h6m-6 4h3',
  globe: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM2 12h20M12 2c6 6 6 14 0 20-6-6-6-14 0-20Z',
  leaf: 'M20 3c-8-1-16 2-16 9a6 6 0 0 0 6 6c7 0 10-8 10-15ZM4 21l11-11',
  fridge: 'M6 2h12v20H6zM6 9h12M9 5v1m0 7v4',
  gift: 'M3 8h18v4H3zM5 12v9h14v-9M12 8v13M12 8H8a3 3 0 1 1 3-3Zm0 0h4a3 3 0 1 0-3-3Z',
  coin: 'M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-5-4H10a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H9m3-10v12',
  clock: 'M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  freeze: 'M12 2v20M3.34 7l17.32 10M3.34 17 20.66 7M9 4l3 3 3-3M9 20l3-3 3 3M4 10l4-1-1-4m10 14-1-4 4-1M4 14l4 1-1 4M17 5l-1 4 4 1',
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, size = 22, className = '', style }: { name: IconName; size?: number; className?: string; style?: CSSProperties }) {
  return <svg className={`icon ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" style={style}><path d={paths[name]} /></svg>;
}
