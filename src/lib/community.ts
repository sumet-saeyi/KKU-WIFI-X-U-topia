const riskyPhrases = [
  'guaranteed', 'passive dividends', 'crypto profits', 'risk-free', 'get rich quick', '15% monthly',
  'รับประกัน', 'กำไรแน่นอน', 'รายได้แน่นอน', 'ปันผลทุกเดือน', 'ไร้ความเสี่ยง',
  'garantizado', 'garantizada', 'dividendos pasivos', 'ganancias seguras', 'sin riesgo', '15% mensual',
];

export function riskySegments(text: string): { text: string; risky: boolean }[] {
  const escaped = riskyPhrases.map((phrase) => phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  return text.split(regex).filter(Boolean).map((segment) => ({ text: segment, risky: riskyPhrases.some((phrase) => phrase.toLowerCase() === segment.toLowerCase()) }));
}

export function detectedRisks(text: string) {
  return [...new Set(riskySegments(text).filter((segment) => segment.risky).map((segment) => segment.text))];
}
