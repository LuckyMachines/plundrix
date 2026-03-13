export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-display font-bold tracking-[0.25em] text-tungsten uppercase">
          Privacy Policy
        </h1>
        <p className="font-mono text-xs text-vault-text-dim uppercase tracking-wider">
          Effective Date: March 13, 2026
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-display font-semibold tracking-[0.2em] text-vault-text uppercase">
          1. Overview
        </h2>
        <p className="font-mono text-xs text-vault-text leading-relaxed">
          This Privacy Policy describes how Lucky Machines, LLC ("we", "us", "our") handles
          information when you use Plundrix at game.plundrix.com or interact with the Plundrix
          smart contract. We are committed to transparency about what data we collect and how
          it is used.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-display font-semibold tracking-[0.2em] text-vault-text uppercase">
          2. Information We Collect
        </h2>

        <div className="space-y-4">
          <div className="border border-vault-border rounded p-3 space-y-2">
            <h3 className="font-mono text-xs text-tungsten uppercase tracking-wider">
              Blockchain Data (Public)
            </h3>
            <p className="font-mono text-xs text-vault-text leading-relaxed">
              All game actions, registrations, and transactions are recorded on the Ethereum
              blockchain and are publicly visible. This includes your wallet address, game
              actions, transaction hashes, and timestamps. This data is inherent to blockchain
              technology and cannot be deleted or modified.
            </p>
          </div>

          <div className="border border-vault-border rounded p-3 space-y-2">
            <h3 className="font-mono text-xs text-tungsten uppercase tracking-wider">
              Wallet Connection
            </h3>
            <p className="font-mono text-xs text-vault-text leading-relaxed">
              When you connect your wallet, we receive your public wallet address. We do not
              access your private keys, seed phrases, or wallet balances beyond what is
              publicly available on the blockchain.
            </p>
          </div>

          <div className="border border-vault-border rounded p-3 space-y-2">
            <h3 className="font-mono text-xs text-tungsten uppercase tracking-wider">
              Hosting and Access Logs
            </h3>
            <p className="font-mono text-xs text-vault-text leading-relaxed">
              Our hosting provider (Railway) may collect standard access logs including IP
              addresses, browser type, and request timestamps. These logs are used for
              operational monitoring and security purposes.
            </p>
          </div>

          <div className="border border-vault-border rounded p-3 space-y-2">
            <h3 className="font-mono text-xs text-tungsten uppercase tracking-wider">
              Analytics
            </h3>
            <p className="font-mono text-xs text-vault-text leading-relaxed">
              We do not currently use third-party analytics services. If analytics tooling is
              added in the future, this policy will be updated accordingly.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-display font-semibold tracking-[0.2em] text-vault-text uppercase">
          3. Information We Do Not Collect
        </h2>
        <ul className="space-y-1">
          {[
            'Email addresses (unless you contact us directly)',
            'Names or personal identification',
            'Phone numbers',
            'Location data',
            'Private keys or seed phrases',
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
        <h2 className="text-sm font-display font-semibold tracking-[0.2em] text-vault-text uppercase">
          4. How We Use Information
        </h2>
        <ul className="space-y-1">
          {[
            'Display game state, leaderboards, and session history',
            'Identify players within games using public wallet addresses',
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
        <h2 className="text-sm font-display font-semibold tracking-[0.2em] text-vault-text uppercase">
          5. Data Sharing
        </h2>
        <p className="font-mono text-xs text-vault-text leading-relaxed">
          We do not sell, rent, or share personal information with third parties for marketing
          purposes. Blockchain data is publicly accessible by nature. Hosting and infrastructure
          providers may process data as necessary to provide their services.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-display font-semibold tracking-[0.2em] text-vault-text uppercase">
          6. Data Retention
        </h2>
        <p className="font-mono text-xs text-vault-text leading-relaxed">
          Blockchain data is permanent and immutable by design. Server access logs are retained
          according to our hosting provider's standard retention policies. We do not maintain
          additional databases of user information.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-display font-semibold tracking-[0.2em] text-vault-text uppercase">
          7. Cookies and Local Storage
        </h2>
        <p className="font-mono text-xs text-vault-text leading-relaxed">
          Plundrix uses browser local storage to save your accessibility preferences (readability
          mode and reduced motion settings). We do not use tracking cookies. Your wallet
          connection state is managed by your wallet provider and is not stored by us.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-display font-semibold tracking-[0.2em] text-vault-text uppercase">
          8. Security
        </h2>
        <p className="font-mono text-xs text-vault-text leading-relaxed">
          We use industry-standard security practices including HTTPS encryption, HSM-backed
          signing keys (GCP Cloud KMS) for operational transactions, and the UUPS proxy pattern
          for contract upgradeability. However, no system is completely secure. You are
          responsible for securing your own wallet and private keys.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-display font-semibold tracking-[0.2em] text-vault-text uppercase">
          9. Children's Privacy
        </h2>
        <p className="font-mono text-xs text-vault-text leading-relaxed">
          Plundrix is not intended for users under 18 years of age. We do not knowingly collect
          information from children.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-display font-semibold tracking-[0.2em] text-vault-text uppercase">
          10. Changes to This Policy
        </h2>
        <p className="font-mono text-xs text-vault-text leading-relaxed">
          We may update this Privacy Policy at any time. Changes will be reflected by updating
          the effective date at the top of this page. Continued use of Plundrix after changes
          constitutes acceptance of the revised policy.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-display font-semibold tracking-[0.2em] text-vault-text uppercase">
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
