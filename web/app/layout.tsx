import type { Metadata } from 'next';
import { Fraunces, Manrope } from 'next/font/google';
import './globals.css';
import { brand, brandCssVars } from '../brand';

const displayFont = Fraunces({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['600', '700'],
});

const bodyFont = Manrope({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL(`https://${brand.domain}`),
  title: {
    default: `${brand.name} — Find your people`,
    template: `%s — ${brand.name}`,
  },
  description:
    'Finn is a social space for thoughtful communities and conversations. Join the people who share what you care about.',
  alternates: {
    canonical: `https://${brand.domain}`,
  },
  openGraph: {
    title: `${brand.name} — Find your people`,
    description:
      'Finn is a social space for thoughtful communities and conversations. Join the people who share what you care about.',
    url: `https://${brand.domain}`,
    siteName: brand.name,
    images: [{ url: '/icon.png', width: 512, height: 512 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${brand.name} — Find your people`,
    description:
      'Finn is a social space for thoughtful communities and conversations. Join the people who share what you care about.',
    images: ['/icon.png'],
  },
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        style={brandCssVars}
        className={`${displayFont.variable} ${bodyFont.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
