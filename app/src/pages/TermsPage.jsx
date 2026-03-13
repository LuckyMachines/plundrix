export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-display font-bold tracking-[0.25em] text-tungsten uppercase">
          Terms of Service
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
          Plundrix is a skill-based multiplayer strategy game built on the Ethereum blockchain.
          The game is operated by Lucky Machines, LLC ("we", "us", "our"). By accessing or
          using Plundrix at game.plundrix.com or interacting with the Plundrix smart contract,
          you agree to these Terms of Service.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-display font-semibold tracking-[0.2em] text-vault-text uppercase">
          2. Eligibility
        </h2>
        <p className="font-mono text-xs text-vault-text leading-relaxed">
          You must be at least 18 years old to use Plundrix. By using the service, you represent
          that you meet this requirement and that your use complies with all applicable laws in
          your jurisdiction.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-display font-semibold tracking-[0.2em] text-vault-text uppercase">
          3. Game Modes
        </h2>
        <div className="space-y-2">
          <p className="font-mono text-xs text-vault-text leading-relaxed">
            <span className="text-tungsten">Free Mode:</span> No entry fees and no prizes.
            Games are played for practice and enjoyment. Free-play games do not involve any
            monetary transactions beyond standard blockchain gas fees.
          </p>
          <p className="font-mono text-xs text-vault-text leading-relaxed">
            <span className="text-tungsten">Stakes Mode:</span> Players contribute entry fees
            that form a player-funded prize pool. The winner receives the prize pool minus a 2%
            protocol fee. Stakes mode is a skill-based competition where outcomes are determined
            by player strategy, including action selection, timing, and tool management. Lucky
            Machines does not fund prize pools — all prize money comes from player entry fees.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-display font-semibold tracking-[0.2em] text-vault-text uppercase">
          4. Skill-Based Competition
        </h2>
        <p className="font-mono text-xs text-vault-text leading-relaxed">
          Plundrix is a game of skill. Each round, players choose from strategic actions (Pick,
          Search, Sabotage) that interact with game mechanics including lock-cracking, tool
          collection, and opponent disruption. Outcomes are determined by these player-driven
          decisions, not by chance. The game does not constitute gambling, a sweepstakes, or a
          lottery.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-display font-semibold tracking-[0.2em] text-vault-text uppercase">
          5. Blockchain Transactions
        </h2>
        <p className="font-mono text-xs text-vault-text leading-relaxed">
          All game actions are recorded on the Ethereum blockchain. You are responsible for
          maintaining your wallet security and paying any gas fees associated with transactions.
          Blockchain transactions are irreversible. We are not responsible for lost funds due to
          wallet mismanagement, incorrect transaction parameters, or network issues.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-display font-semibold tracking-[0.2em] text-vault-text uppercase">
          6. Smart Contract Risks
        </h2>
        <p className="font-mono text-xs text-vault-text leading-relaxed">
          The Plundrix smart contract is deployed as a UUPS upgradeable proxy. While we take
          reasonable care to test and audit contract code, smart contracts carry inherent risks
          including potential bugs, vulnerabilities, and unforeseen interactions. You interact
          with the contract at your own risk. We make no guarantees regarding the security or
          correctness of the smart contract.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-display font-semibold tracking-[0.2em] text-vault-text uppercase">
          7. Agent and Bot Participation
        </h2>
        <p className="font-mono text-xs text-vault-text leading-relaxed">
          Some players may be AI agents or automated bots. Agent and bot participation is tracked
          and labeled on the leaderboard. Bot-only games appear on a separate agent ladder. Mixed
          games (human and bot players) are disclosed as such.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-display font-semibold tracking-[0.2em] text-vault-text uppercase">
          8. Beta Status
        </h2>
        <p className="font-mono text-xs text-vault-text leading-relaxed">
          Plundrix is currently in beta. Features, mechanics, and fee structures may change.
          The Sepolia testnet deployment is a staging environment and does not represent the
          final production experience. Test-only fee settings on Sepolia do not constitute a
          live economy.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-display font-semibold tracking-[0.2em] text-vault-text uppercase">
          9. Withdrawals
        </h2>
        <p className="font-mono text-xs text-vault-text leading-relaxed">
          Prize winnings and protocol fees are held in the smart contract and must be withdrawn
          by the recipient. We do not custody user funds. The withdrawal function transfers ETH
          directly from the contract to your wallet address.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-display font-semibold tracking-[0.2em] text-vault-text uppercase">
          10. Limitation of Liability
        </h2>
        <p className="font-mono text-xs text-vault-text leading-relaxed">
          To the maximum extent permitted by law, Lucky Machines, LLC shall not be liable for
          any indirect, incidental, special, consequential, or punitive damages arising from
          your use of Plundrix, including but not limited to loss of funds, data, or profits.
          The service is provided "as is" without warranties of any kind.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-display font-semibold tracking-[0.2em] text-vault-text uppercase">
          11. Modifications
        </h2>
        <p className="font-mono text-xs text-vault-text leading-relaxed">
          We may update these Terms at any time. Continued use of Plundrix after changes
          constitutes acceptance of the revised Terms. Material changes will be noted by
          updating the effective date at the top of this page.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-display font-semibold tracking-[0.2em] text-vault-text uppercase">
          12. Contact
        </h2>
        <p className="font-mono text-xs text-vault-text leading-relaxed">
          For questions about these Terms, contact us via the{' '}
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
