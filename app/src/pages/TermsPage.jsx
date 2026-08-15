const SECTIONS = [
  {
    title: '1. Overview',
    body: 'Plundrix is a multiplayer strategy game built on the Ethereum blockchain and operated by Lucky Machines, LLC ("we", "us", "our"). By using game.plundrix.com or interacting with the Plundrix smart contract, you agree to these Terms.',
  },
  {
    title: '2. Eligibility',
    body: 'You must be at least 18 years old to use Plundrix. You are responsible for confirming that your use complies with the laws that apply to you.',
  },
  {
    title: '3. Current Game Mode',
    body: 'The public beta is free to play, with no entry fees and no prizes. Standard blockchain gas fees may apply. The smart contract contains dormant paid-competition code, but that mode is not offered through the public beta. If it is ever offered, these Terms and the product disclosures will be updated before launch.',
  },
  {
    title: '4. Strategy and Variable Outcomes',
    body: 'Each round, players choose Pick, Search, or Sabotage. Those decisions affect lock-cracking probabilities, tool collection, and opponent disruption. Pick and Search include variable onchain resolution. Player decisions materially affect position and probabilities, but no particular result is guaranteed.',
  },
  {
    title: '5. Blockchain Transactions',
    body: 'Game actions are recorded on a public blockchain. You are responsible for wallet security, transaction review, and gas fees. Blockchain transactions are irreversible. Never share a private key or seed phrase with Plundrix or anyone claiming to represent Plundrix.',
  },
  {
    title: '6. Smart Contract Risk',
    body: 'The Plundrix contract uses an upgradeable proxy and may contain bugs or unforeseen behavior. The beta is provided as is. Interact only with the published proxy address and do not send funds to unsupported contract paths.',
  },
  {
    title: '7. Agents and Bots',
    body: 'Some players may be automated agents or bots. The product labels agent participation where that information is available, including on competition and session surfaces.',
  },
  {
    title: '8. Beta Changes',
    body: 'Features, mechanics, networks, and availability may change during beta. Sepolia is a test network and test-only fee settings do not represent a live production economy. Withdrawals and paid competition are not part of the current public beta.',
  },
  {
    title: '9. Limitation of Liability',
    body: 'To the maximum extent permitted by law, Lucky Machines, LLC is not liable for indirect, incidental, special, consequential, or punitive damages arising from use of Plundrix, including loss caused by wallet mistakes, network failures, or smart contract behavior.',
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
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-tungsten">Legal / Public beta</p>
        <h1 className="mt-3 font-display text-4xl font-bold uppercase tracking-[0.08em] text-vault-text">Terms of Service</h1>
        <p className="mt-3 font-mono text-xs uppercase tracking-wider text-vault-text-dim">Effective date: August 13, 2026</p>
      </header>

      <div className="divide-y divide-vault-border">
        {SECTIONS.map((section) => (
          <section key={section.title} className="py-7">
            <h2 className="font-display text-xl font-semibold uppercase tracking-[0.08em] text-vault-text">{section.title}</h2>
            <p className="mt-3 text-base leading-7 text-vault-text-dim">{section.body}</p>
          </section>
        ))}
      </div>

      <a
        href="https://github.com/LuckyMachines/plundrix"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-[44px] items-center border border-tungsten/45 px-4 font-mono text-xs uppercase tracking-[0.14em] text-tungsten hover:bg-tungsten/10"
      >
        Plundrix on GitHub
      </a>
      <p className="mt-8 border-t border-vault-border pt-5 font-mono text-xs text-vault-text-dim">Lucky Machines, LLC. All rights reserved.</p>
    </div>
  );
}
