const SECTIONS = [
  {
    title: '1. Overview',
    body: 'Plundrix is a hosted multiplayer strategy game operated by Lucky Machines, LLC ("we", "us", "our"). By using game.plundrix.com, you agree to these Terms.',
  },
  {
    title: '2. Eligibility',
    body: 'You must be at least 18 years old to use Plundrix. You are responsible for confirming that your use complies with the laws that apply to you.',
  },
  {
    title: '3. Current Game Mode',
    body: 'The public beta is free to play, with no entry fees, purchases, or prizes. Plundrix pays the infrastructure costs for hosted play. Dormant paid-competition code is not offered through the public beta. If paid play is ever offered, these Terms and the product disclosures will be updated before launch.',
  },
  {
    title: '4. Strategy and Variable Outcomes',
    body: 'Each round, players choose Pick, Search, or Sabotage. Those decisions affect lock-cracking probabilities, tool collection, and opponent disruption. Pick and Search include variable resolution. Player decisions materially affect position and probabilities, but no particular result is guaranteed.',
  },
  {
    title: '5. Managed Game Processing',
    body: 'Plundrix submits hosted game commands through service-controlled pseudonymous game accounts. Players do not connect a wallet, sign network transactions, manage cryptographic keys, or pay network fees. Some game records are written to a public blockchain and may be permanent, but those records are not intended to include your name, email address, IP address, or browser session token.',
  },
  {
    title: '6. Service and Protocol Risk',
    body: 'The hosted service and its underlying smart-contract protocol may contain bugs, delays, outages, or unforeseen behavior. The beta is provided as is. Do not send money or digital assets to any address claiming to be part of Plundrix.',
  },
  {
    title: '7. Agents and Bots',
    body: 'Some players may be automated agents or bots. The product labels agent participation where that information is available, including on competition and session surfaces.',
  },
  {
    title: '8. Beta Changes',
    body: 'Features, mechanics, infrastructure, and availability may change during beta. The current test environment and test-only fee settings do not represent a live production economy. Withdrawals and paid competition are not part of the current public beta.',
  },
  {
    title: '9. Limitation of Liability',
    body: 'To the maximum extent permitted by law, Lucky Machines, LLC is not liable for indirect, incidental, special, consequential, or punitive damages arising from use of Plundrix, including loss caused by service failures, network failures, or smart-contract behavior.',
  },
  {
    title: '10. Changes and Contact',
    body: 'We may update these Terms by changing the effective date on this page. For questions, use the public Plundrix GitHub repository linked below.',
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <header className="border-b border-vault-border pb-7">
        <p className="font-mono text-micro uppercase tracking-brand text-tungsten">Legal / Public beta</p>
        <h1 className="mt-3 font-display text-4xl font-bold uppercase tracking-heading text-vault-text">Terms of Service</h1>
        <p className="mt-3 font-mono text-xs uppercase tracking-wider text-vault-text-dim">Effective date: August 13, 2026</p>
      </header>

      <div className="divide-y divide-vault-border">
        {SECTIONS.map((section) => (
          <section key={section.title} className="py-7">
            <h2 className="font-display text-xl font-semibold uppercase tracking-heading text-vault-text">{section.title}</h2>
            <p className="mt-3 text-base leading-7 text-vault-text-dim">{section.body}</p>
          </section>
        ))}
      </div>

      <a
        href="https://github.com/LuckyMachines/plundrix"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-[44px] items-center border border-tungsten/45 px-4 font-mono text-xs uppercase tracking-label text-tungsten hover:bg-tungsten/10"
      >
        Plundrix on GitHub
      </a>
      <p className="mt-8 border-t border-vault-border pt-5 font-mono text-xs text-vault-text-dim">Lucky Machines, LLC. All rights reserved.</p>
    </div>
  );
}
