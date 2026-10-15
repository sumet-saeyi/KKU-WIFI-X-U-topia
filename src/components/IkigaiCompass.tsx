'use client';

import { motion } from 'framer-motion';
import { IkigaiMark } from '@/components/IkigaiMark';
import { guideText } from '@/lib/presetData';
import { pillarOrder, t, words } from '@/lib/i18n';
import type { LanguageCode, PillarId } from '@/lib/types';

interface CompassProps {
  activePillar: PillarId;
  language: LanguageCode;
  speaking: boolean;
  onSelect: (pillar: PillarId) => void;
  onSpeak: (text: string) => void;
}

const icons: Record<PillarId, string> = { passion: '♡', vocation: '✦', mission: '◎', profession: '↗' };

export function IkigaiCompass({ activePillar, language, speaking, onSelect, onSpeak }: CompassProps) {
  const copy = t(language);
  return (
    <section className="hero-card" id="top">
      <div className="hero-copy">
        <div className="eyebrow"><span className="eyebrow-line" />{copy.eyebrow}</div>
        <h1>{copy.tagline}</h1>
        <p>{copy.intro}</p>
        <div className="journey-strip" aria-label={words(language, 'How it works', 'วิธีใช้งาน', 'Cómo funciona')}>
          {copy.journey.map((step, index) => (
            <div key={step}><span>{index + 1}</span><small>{step}</small>{index < copy.journey.length - 1 && <b aria-hidden="true">→</b>}</div>
          ))}
        </div>
        <button className={`voice-guide ${speaking ? 'speaking' : ''}`} onClick={() => onSpeak(guideText[language][activePillar])}>
          <motion.span
            className="voice-orb"
            animate={{ scale: speaking ? [1, 1.18, 1] : [1, 1.07, 1], opacity: [0.75, 1, 0.75] }}
            transition={{ duration: speaking ? 1.2 : 5, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden="true"
          >◉</motion.span>
          <span><strong>{speaking ? words(language, 'Stop guide', 'หยุดเสียงไกด์', 'Detener guía') : words(language, 'Listen to your calm guide', 'ฟังไกด์ที่ใจเย็น', 'Escucha a tu guía')}</strong><small>{copy.pillars[activePillar].summary}</small></span>
          <span aria-hidden="true">{speaking ? 'Ⅱ' : '▶'}</span>
        </button>
      </div>

      <div className="compass" aria-label={words(language, 'Choose one of the four parts of your Ikigai', 'เลือกหนึ่งในสี่ด้านของอิคิไก', 'Elige una de las cuatro partes de tu Ikigai')}>
        <div className="compass-center">
          <IkigaiMark />
          <span className="compass-wordmark"><strong>生き甲斐</strong><small>IKIGAI</small></span>
        </div>
        {pillarOrder.map((pillar, index) => (
          <motion.button
            key={pillar}
            className={`compass-petal petal-${pillar} ${activePillar === pillar ? 'active' : ''}`}
            onClick={() => onSelect(pillar)}
            animate={{ scale: activePillar === pillar ? [1, 1.025, 1] : 1 }}
            transition={{ duration: 5, repeat: activePillar === pillar ? Infinity : 0, ease: 'easeInOut' }}
            aria-pressed={activePillar === pillar}
          >
            <span className="petal-icon" aria-hidden="true">{icons[pillar]}</span>
            <strong>{copy.pillars[pillar].name}</strong>
            <small>{copy.pillars[pillar].question}</small>
            <i>{index + 1}</i>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
