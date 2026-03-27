import { cn } from "@/lib/utils"

const columns = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "#how-it-works" },
      { label: "Live demo", href: "#campaign" },
      { label: "Start a campaign", href: "#create" },
    ],
  },
  {
    title: "Network",
    links: [
      { label: "Stellar", href: "https://stellar.org", external: true },
      { label: "Stellar Expert (testnet)", href: "https://stellar.expert/explorer/testnet", external: true },
      { label: "Soroban docs", href: "https://developers.stellar.org/docs/soroban", external: true },
    ],
  },
]

type SiteFooterProps = {
  className?: string
}

export function SiteFooter({ className }: SiteFooterProps) {
  return (
    <footer className={cn("border-t border-border bg-muted/30", className)}>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-2">
          <div>
            <p className="font-display text-lg font-bold tracking-tight">
              Pledge<span className="text-primary">Run</span>
            </p>
            <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-relaxed">
              Crowdfunding with escrow on Soroban — funds release when the goal is met, or refund to backers if it
              isn&apos;t. No platform custody of your money.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:justify-items-end">
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="text-foreground text-sm font-semibold">{col.title}</h3>
                <ul className="mt-3 space-y-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        {...("external" in link && link.external && { target: "_blank", rel: "noreferrer" })}
                        className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <p className="text-muted-foreground mt-10 border-t border-border pt-8 text-center text-xs">
          PledgeRun is a demo interface for testnet. Always verify transactions in your wallet.
        </p>
      </div>
    </footer>
  )
}
