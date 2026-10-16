import { words } from '@/lib/i18n';
import type { LanguageCode } from '@/lib/types';
import type { AgentResult } from '@/components/pillars/moduleTypes';

export function AgentSourceNote({ source, language }: { source: AgentResult['source']; language: LanguageCode }) {
  return <small className="agent-source-note">{source === 'stage-safe'
    ? words(language, 'Saved guide · not live AI', 'คำตอบสำรอง · ไม่ใช่ AI สด', 'Guía guardada · no es IA en vivo')
    : words(language, 'U-Bot · AI draft for your review', 'U-Bot · ฉบับร่างจาก AI ให้คุณตรวจสอบ', 'U-Bot · borrador de IA para tu revisión')}</small>;
}
