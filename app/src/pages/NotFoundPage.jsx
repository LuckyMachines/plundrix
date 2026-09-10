import { Link } from 'react-router-dom';
import Seo from '../components/seo/Seo';

export default function NotFoundPage() {
  return (
    <div className="mx-auto grid min-h-[62vh] max-w-3xl place-items-center px-6 py-16 text-center">
      <Seo title="Page Not Found | Plundrix" description="This Plundrix route does not exist." path="/404" noIndex />
      <section>
        <p className="font-mono text-xs uppercase tracking-beacon text-signal-red">Signal lost / 404</p>
        <h1 className="mt-4 font-display text-5xl font-bold uppercase text-vault-text sm:text-7xl">This vault is sealed.</h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-vault-text-dim">The route you followed does not lead to an active Plundrix operation.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/play" className="btn-primary">Play instantly</Link>
          <Link to="/" className="btn-secondary">Return to the hub</Link>
        </div>
      </section>
    </div>
  );
}
