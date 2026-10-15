'use client';

import { IkigaiMark } from '@/components/IkigaiMark';
import { Icon } from '@/components/ui/Icon';
import { screenLabel } from '@/lib/product';
import { words, pillarOrder } from '@/lib/i18n';
import type { LanguageCode, PillarId } from '@/lib/types';

export function IkigaiSelector({ language, activePillar, onSelect }: { language: LanguageCode; activePillar: PillarId; onSelect: (pillar: PillarId) => void }) {
  return <div className="ikigai-selector"><span className="selector-mark"><IkigaiMark compact /></span><label htmlFor="ikigai-focus"><span>生き甲斐 · IKIGAI</span><strong>{words(language, 'What matters today?', 'วันนี้อะไรสำคัญกับคุณ', '¿Qué importa hoy?')}</strong></label><div className="selector-control"><select id="ikigai-focus" value={activePillar} onChange={(event) => onSelect(event.target.value as PillarId)} aria-controls={`panel-${activePillar}`}>{pillarOrder.map((pillar) => <option value={pillar} key={pillar}>{screenLabel(pillar, language)}</option>)}</select><Icon name="down" size={17} /></div></div>;
}
