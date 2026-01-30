import Image from 'next/image';
import { brand } from '../brand';
import MotionToggle from './components/MotionToggle';

const features = [
  {
    title: 'Curated communities',
    description: 'Follow the people, topics, and spaces that actually move you.',
  },
  {
    title: 'Thoughtful conversations',
    description: 'Posts are built for depth, not noise. Share what you believe in.',
  },
  {
    title: 'Trust built-in',
    description: 'Moderation tools and community rules keep things healthy.',
  },
];

const appStoreUrl = process.env.NEXT_PUBLIC_APP_STORE_URL ?? '';
const playStoreUrl = process.env.NEXT_PUBLIC_PLAY_STORE_URL ?? '';

type StoreBadgeProps = {
  href: string;
  badgeSrc: string;
  badgeAlt: string;
  width: number;
  height: number;
};

function StoreBadge({ href, badgeSrc, badgeAlt, width, height }: StoreBadgeProps) {
  const isLive = Boolean(href);
  const baseClass =
    'inline-flex h-12 items-center justify-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:h-14';
  const stateClass = isLive ? 'hover:-translate-y-0.5' : 'cursor-not-allowed';
  const wrapperClass = `${baseClass} ${stateClass}`;
  const badge = (
    <div className="relative">
      <Image
        src={badgeSrc}
        alt={badgeAlt}
        width={width}
        height={height}
        className="h-full w-[132px] object-contain sm:w-[150px]"
        priority
      />
    </div>
  );

  if (isLive) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={wrapperClass}
        aria-label={badgeAlt}
      >
        {badge}
      </a>
    );
  }

  return (
    <div aria-disabled="true" className={wrapperClass} aria-label={badgeAlt}>
      {badge}
    </div>
  );
}

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[color:var(--background)]">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at top, rgba(68, 162, 214, 0.22) 0%, rgba(68, 162, 214, 0) 62%)',
          }}
        />
        <div className="bg-blob blob-one -top-32 right-[-8rem] h-[28rem] w-[28rem] bg-[radial-gradient(circle_at_center,_rgba(68,162,214,0.45),_rgba(255,255,255,0))]" />
        <div className="bg-blob blob-two bottom-[-10rem] left-[-6rem] h-[26rem] w-[26rem] bg-[radial-gradient(circle_at_center,_rgba(15,118,110,0.35),_rgba(255,255,255,0))]" />
        <div className="bg-blob blob-three left-[48%] top-1/3 h-[18rem] w-[18rem] bg-[radial-gradient(circle_at_center,_rgba(124,58,237,0.28),_rgba(255,255,255,0))]" />
        <div className="bg-blob blob-four right-[10%] top-[55%] h-[20rem] w-[20rem] bg-[radial-gradient(circle_at_center,_rgba(68,162,214,0.25),_rgba(255,255,255,0))]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pb-20 pt-16 md:px-12 md:pt-24">
        <header className="flex flex-col gap-10">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
              <Image
                src="/icon.png"
                alt={`${brand.name} logo`}
                width={36}
                height={36}
                priority
                className="rounded-full"
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Finn Social</p>
              <p className="text-lg font-semibold text-[color:var(--foreground)]">{brand.domain}</p>
            </div>
          </div>

          <div className="max-w-3xl">
            <h1 className="text-4xl font-semibold leading-tight text-[color:var(--foreground)] md:text-6xl">
              Find your people. Share what matters. Build real community.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-[color:var(--muted)] md:text-xl">
              {brand.name} is a social space for thoughtful communities and conversations. Follow
              the people who get you, and explore posts that go deeper than the feed.
            </p>
          </div>

          <div className="flex flex-col gap-4 md:flex-row">
            <StoreBadge
              href={appStoreUrl}
              badgeSrc="/badges/app-store.svg"
              badgeAlt="Download on the App Store"
              width={120}
              height={40}
            />
            <StoreBadge
              href={playStoreUrl}
              badgeSrc="/badges/google-play.png"
              badgeAlt="Get it on Google Play"
              width={172}
              height={60}
            />
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-[0_20px_40px_rgba(15,23,42,0.06)] backdrop-blur"
            >
              <h3 className="text-xl font-semibold text-[color:var(--foreground)]">{feature.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[color:var(--muted)]">
                {feature.description}
              </p>
            </article>
          ))}
        </section>

      </div>
      <MotionToggle />
    </main>
  );
}
