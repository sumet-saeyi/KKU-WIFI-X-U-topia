interface IkigaiMarkProps { compact?: boolean; }

/** Four quiet petals, one shared center: the four parts of a meaningful life. */
export function IkigaiMark({ compact = false }: IkigaiMarkProps) {
  return <span className={`ikigai-mark ${compact ? 'compact' : ''}`} aria-hidden="true"><svg viewBox="0 0 100 100" focusable="false" fill="none">
    <path d="M50 50C24 45 14 29 24 19c10-10 26 0 26 31Z" fill="#e9a9c5" fillOpacity=".16" stroke="#e9a9c5" strokeWidth="2.7" />
    <path d="M50 50c5-26 21-36 31-26 10 10 0 26-31 26Z" fill="#e8cf9e" fillOpacity=".16" stroke="#e8cf9e" strokeWidth="2.7" />
    <path d="M50 50c26 5 36 21 26 31-10 10-26 0-26-31Z" fill="#a9d5ba" fillOpacity=".16" stroke="#a9d5ba" strokeWidth="2.7" />
    <path d="M50 50C45 76 29 86 19 76 9 66 19 50 50 50Z" fill="#9acbdf" fillOpacity=".16" stroke="#9acbdf" strokeWidth="2.7" />
    <circle cx="50" cy="50" r="9" fill="#e9e6cb" /><path d="m46 50 3 3 6-6" stroke="#243c30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg></span>;
}
