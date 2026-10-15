import { t } from '@/lib/i18n';
import type { LanguageCode, PillarId } from '@/lib/types';

export function ModuleHeader({ pillar, language, title, description, badge }: { pillar: PillarId; language: LanguageCode; title: string; description: string; badge?: string }) {
  const index = { passion: '01', vocation: '02', mission: '03', profession: '04' }[pillar];
  return <header className="module-header"><div className={`module-number ${pillar}`}>{index}</div><div><span className="module-kicker">{t(language).pillars[pillar].question}</span><h2>{title}</h2><p>{description}</p></div>{badge && <div className="xp-pill">✦ {badge}</div>}</header>;
}

export function SectionHeading({ step, title, description }: { step: string; title: string; description?: string }) {
  return <div className="section-heading"><span>{step}</span><div><h3>{title}</h3>{description && <p>{description}</p>}</div></div>;
}
