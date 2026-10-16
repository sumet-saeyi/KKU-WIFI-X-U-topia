import { words } from '@/lib/i18n';
import type { LanguageCode } from '@/lib/types';

const brands = [
  { name: 'U-Bot', image: '/brands/ubot.svg', href: 'https://u.bot', width: 24, height: 24 },
  { name: 'U-topia', image: '/brands/u-topia.svg', href: 'https://www.u-topia.com', width: 80, height: 20 },
  { name: 'ElevenLabs', image: '/brands/elevenlabs.svg', href: 'https://elevenlabs.io', width: 94, height: 13 },
  { name: 'Avalanche', image: '/brands/avalanche.svg', href: 'https://www.avalanche.com', width: 24, height: 21 },
];

export function PoweredBy({ language, compact = false }: { language: LanguageCode; compact?: boolean }) {
  return <div className={`powered-by${compact ? ' compact' : ''}`} role="group" aria-label={words(language, 'Powered by', 'ขับเคลื่อนโดย', 'Impulsado por')}>
    <span lang="en">Powered by</span>
    <div>{brands.map((brand) => <a key={brand.name} data-brand={brand.name} href={brand.href} target="_blank" rel="noopener noreferrer" title={brand.name}>
      <img src={brand.image} alt={brand.name} width={brand.width} height={brand.height} />
      {(brand.name === 'U-Bot' || brand.name === 'Avalanche') && !compact && <span>{brand.name}</span>}
    </a>)}</div>
  </div>;
}
