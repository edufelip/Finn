import Image from 'next/image';
import { brand } from '../../brand';

type LinkFallbackProps = {
  title: string;
  subtitle: string;
};

export default function LinkFallback({ title, subtitle }: LinkFallbackProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[color:var(--background)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 right-[-8rem] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(68,162,214,0.32),_rgba(255,255,255,0))] blur-3xl" />
        <div className="absolute bottom-[-12rem] left-[-6rem] h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(15,118,110,0.2),_rgba(255,255,255,0))] blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-8 px-6 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
          <Image
            src="/icon.png"
            alt={`${brand.name} logo`}
            width={34}
            height={34}
            className="rounded-full"
          />
        </div>
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">{brand.name}</p>
          <h1 className="text-3xl font-semibold text-[color:var(--foreground)] md:text-4xl">{title}</h1>
          <p className="text-base text-[color:var(--muted)]">{subtitle}</p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="rounded-full bg-[color:var(--primary)] px-6 py-3 text-sm font-semibold text-white/90 opacity-70"
          >
            App links coming soon
          </button>
          <p className="text-xs text-[color:var(--muted)]">
            If you already have the app installed, this link should open it automatically.
          </p>
        </div>
      </div>
    </main>
  );
}
