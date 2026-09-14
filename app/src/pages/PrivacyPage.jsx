export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-display font-bold tracking-beacon text-tungsten uppercase">
          Privacy Policy
        </h1>
        <p className="font-mono text-xs text-vault-text-dim uppercase tracking-wider">
          Effective Date: August 13, 2026
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-display font-semibold tracking-brand text-vault-text uppercase">
          1. Overview
        </h2>
        <p className="font-mono text-xs text-vault-text leading-relaxed">
          This Privacy Policy describes how Lucky Machines, LLC ("we", "us", "our") handles
          information when you use Plundrix at game.plundrix.com. We are committed to transparency
          about what data we collect and how
          it is used.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-display font-semibold tracking-brand text-vault-text uppercase">
          2. Information We Collect
        </h2>

        <div className="space-y-4">
          <div className="border border-vault-border rounded p-3 space-y-2">
            <h3 className="font-mono text-xs text-tungsten uppercase tracking-wider">
              Game Processing Records
            </h3>
            <p className="font-mono text-xs text-vault-text leading-relaxed">
              Hosted multiplayer commands may be recorded through service-controlled pseudonymous
              accounts on a public blockchain. Those records can include game actions and timestamps
              and may be permanent. They are not intended to contain your name, email address, IP
              address, browser session token, or a wallet belonging to you.
            </p>
          </div>

          <div className="border border-vault-border rounded p-3 space-y-2">
            <h3 className="font-mono text-xs text-tungsten uppercase tracking-wider">
              Managed Play Session
            </h3>
            <p className="font-mono text-xs text-vault-text leading-relaxed">
              We use a pseudonymous, HttpOnly session cookie to keep your hosted player identity
              consistent. The service derives and controls a separate game account for processing
              commands. You do not provide a wallet, private key, seed phrase, or payment account.
            </p>
          </div>

          <div className="border border-vault-border rounded p-3 space-y-2">
            <h3 className="font-mono text-xs text-tungsten uppercase tracking-wider">
              Hosting and Access Logs
            </h3>
            <p className="font-mono text-xs text-vault-text leading-relaxed">
              Our self-hosted infrastructure may process standard access logs including IP
              addresses, browser type, and request timestamps. These logs are used only for
              operational monitoring and security purposes.
            </p>
          </div>

          <div className="border border-vault-border rounded p-3 space-y-2">
            <h3 className="font-mono text-xs text-tungsten uppercase tracking-wider">
              Analytics
            </h3>
            <p className="font-mono text-xs text-vault-text leading-relaxed">
              We use a self-hosted Plausible Analytics service at plausible.racerverse.com to
              measure aggregate page views, outbound-link activity, and product events such as
              starting or completing a match, choosing a mode, or sharing a challenge. Event
              properties are limited to coarse gameplay categories and do not include managed
              account identifiers, session tokens, replay seeds, names, or free-form text. Plausible is configured
              without tracking cookies. The analytics service and its infrastructure may process
              request metadata such as IP address and user agent to produce aggregate statistics.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-display font-semibold tracking-brand text-vault-text uppercase">
          3. Information We Do Not Collect
        </h2>
        <ul className="space-y-1">
          {[
            'Email addresses (unless you contact us directly)',
            'Names or personal identification',
            'Phone numbers',
            'Location data',
            'Personal wallet details, private keys, or seed phrases',
            'Off-chain financial information',
          ].map((item) => (
            <li key={item} className="font-mono text-xs text-vault-text leading-relaxed flex items-start gap-2">
              <span className="text-oxide-green mt-0.5 shrink-0">-</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-display font-semibold tracking-brand text-vault-text uppercase">
          4. How We Use Information
        </h2>
        <ul className="space-y-1">
          {[
            'Display game state, leaderboards, and session history',
            'Maintain pseudonymous players within hosted games',
            'Track agent and bot participation for disclosure purposes',
            'Monitor service health and debug technical issues',
            'Comply with legal obligations if required',
          ].map((item) => (
            <li key={item} className="font-mono text-xs text-vault-text leading-relaxed flex items-start gap-2">
              <span className="text-tungsten mt-0.5 shrink-0">-</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-display font-semibold tracking-brand text-vault-text uppercase">
          5. Data Sharing
        </h2>
        <p className="font-mono text-xs text-vault-text leading-relaxed">
          We do not sell, rent, or share personal information with third parties for marketing
          purposes. Public game-processing records are accessible by nature. Hosting and infrastructure
          providers may process data as necessary to provide their services.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-display font-semibold tracking-brand text-vault-text uppercase">
          6. Data Retention
        </h2>
        <p className="font-mono text-xs text-vault-text leading-relaxed">
          Public game-processing records may be permanent and immutable by design. Pseudonymous
          session cookies expire after 180 days. Server access logs are retained according to our
          hosting provider's standard retention policies.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-display font-semibold tracking-brand text-vault-text uppercase">
          7. Cookies and Local Storage
        </h2>
        <p className="font-mono text-xs text-vault-text leading-relaxed">
          Plundrix uses browser local storage to save versioned game and accessibility preferences,
          instant-play progression, operator names, and background-alert preferences. Preferences
          can be reset, exported, imported, or disabled from Game Settings. A required HttpOnly
          session cookie maintains your pseudonymous hosted-play identity and is not used for
          advertising. Browser notifications require your explicit permission. Anonymous product
          signals respect the Game Settings control and exclude names, managed account identifiers,
          session tokens, seeds, and free text. We do not use third-party tracking cookies.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-display font-semibold tracking-brand text-vault-text uppercase">
          8. Security
        </h2>
        <p className="font-mono text-xs text-vault-text leading-relaxed">
          We use HTTPS encryption, HttpOnly session cookies, rate limits, command and daily spending
          ceilings, reserve protection, and isolated service signing credentials. Managed account
          identifiers and signing material are never returned to the browser. No system is completely secure.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-display font-semibold tracking-brand text-vault-text uppercase">
          9. Children's Privacy
        </h2>
        <p className="font-mono text-xs text-vault-text leading-relaxed">
          Plundrix is not intended for users under 18 years of age. We do not knowingly collect
          information from children.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-display font-semibold tracking-brand text-vault-text uppercase">
          10. Changes to This Policy
        </h2>
        <p className="font-mono text-xs text-vault-text leading-relaxed">
          We may update this Privacy Policy at any time. Changes will be reflected by updating
          the effective date at the top of this page. Continued use of Plundrix after changes
          constitutes acceptance of the revised policy.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-display font-semibold tracking-brand text-vault-text uppercase">
          11. Contact
        </h2>
        <p className="font-mono text-xs text-vault-text leading-relaxed">
          For privacy-related questions, contact us via the{' '}
          <a
            href="https://github.com/LuckyMachines/plundrix"
            target="_blank"
            rel="noopener noreferrer"
            className="text-tungsten hover:text-tungsten-bright transition-colors underline"
          >
            Plundrix GitHub repository
          </a>.
        </p>
      </section>

      <div className="border-t border-vault-border pt-4">
        <p className="font-mono text-xs text-vault-text-dim">
          Lucky Machines, LLC. All rights reserved.
        </p>
      </div>
    </div>
  );
}
