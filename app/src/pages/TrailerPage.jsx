import { Link } from 'react-router-dom';
import Seo from '../components/seo/Seo';

const CHAPTERS = [
  ['00:00', 'Enter the vault', 'Five locks stand between the table and the score.'],
  ['00:04', 'Assemble the table', 'Operators take their seats and the first round opens.'],
  ['00:08', 'Make the read', 'Locks, tools, and rival intentions shape the next move.'],
  ['00:12', 'Resolve together', 'All four decisions land and the table changes at once.'],
  ['00:16', 'Break their plan', 'A well-timed Sabotage turns a leader into a target.'],
  ['00:24', 'Breach confirmed', 'One operator cracks the final lock and takes the vault.'],
];

export default function TrailerPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <Seo
        title="Plundrix Gameplay Trailer"
        description="Watch a 32-second Plundrix vault race from the first move to the final lock."
        path="/trailer"
        image="/images/og/plundrix-trailer.jpg"
        imageAlt="Plundrix gameplay trailer - One vault. No safe turn."
        video="/video/plundrix-gameplay-trailer.mp4"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'VideoObject',
          name: 'Plundrix Gameplay Trailer',
          description: 'A 32-second Plundrix vault race from the first move to the final lock.',
          thumbnailUrl: 'https://game.plundrix.com/images/og/plundrix-trailer.jpg',
          contentUrl: 'https://game.plundrix.com/video/plundrix-gameplay-trailer.mp4',
          embedUrl: 'https://game.plundrix.com/trailer',
          uploadDate: '2026-08-15',
          duration: 'PT32S',
          inLanguage: 'en',
          isFamilyFriendly: true,
        }}
      />

      <header className="max-w-4xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-oxide-green">32-second trailer</p>
        <h1 className="mt-4 font-display text-5xl font-bold uppercase leading-[0.88] text-vault-text sm:text-7xl lg:text-8xl">One vault. Three intentions. No safe turn.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-vault-text-dim">Four operators. Five locks. Every choice lands at once. Watch the table turn in 32 seconds.</p>
      </header>

      <section className="mt-9 overflow-hidden border border-vault-border bg-black shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
        <video
          className="aspect-video w-full bg-black object-contain"
          controls
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/images/plundrix-vault-hero.webp"
          aria-label="Plundrix gameplay trailer"
        >
          <source src="/video/plundrix-gameplay-trailer.mp4" type="video/mp4" />
          Your browser does not support the Plundrix gameplay trailer.
        </video>
      </section>

      <section className="mt-8 grid gap-px border border-vault-border bg-vault-border md:grid-cols-2 xl:grid-cols-3">
        {CHAPTERS.map(([time, title, copy]) => (
          <article key={time} className="bg-vault-surface p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-tungsten">{time}</p>
            <h2 className="mt-2 font-display text-2xl uppercase text-vault-text">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-vault-text-dim">{copy}</p>
          </article>
        ))}
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/play" className="inline-flex min-h-[52px] items-center bg-tungsten-bright px-6 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-vault-dark">Play instantly -&gt;</Link>
        <Link to="/#live-operations" className="inline-flex min-h-[52px] items-center border border-tungsten/45 px-6 font-mono text-xs uppercase tracking-[0.14em] text-tungsten">Open Sepolia tables</Link>
        <a href="/video/plundrix-gameplay-trailer.mp4" download className="inline-flex min-h-[52px] items-center border border-vault-border px-6 font-mono text-xs uppercase tracking-[0.14em] text-vault-text">Download trailer</a>
      </div>
    </div>
  );
}
