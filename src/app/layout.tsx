import type { Metadata } from 'next';
import './globals.css';
import './refinements.css';
import './product.css';
import './ai.css';

export const metadata: Metadata = {
  title: 'U-Ikigai — U-topia With Meaning',
  description: 'A calm, human-first AI and Avalanche companion for everyday money.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
