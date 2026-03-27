import { Shield, Wallet } from "lucide-react"

import { cn } from "@/lib/utils"

const items = [
  {
    icon: Wallet,
    title: "Zero platform fees",
    description: "MVP focuses on transparent escrow — no cut taken by a central platform.",
  },
  {
    icon: Shield,
    title: "Rules you can verify",
    description: "Goal, deadline, and payout logic live in a Soroban contract on testnet.",
  },
]

type TrustStripProps = {
  className?: string
}

export function TrustStrip({ className }: TrustStripProps) {
  return (
    <section className={cn("border-y border-border bg-muted/40", className)} aria-label="Trust highlights">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2">
          {items.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex gap-4">
              <div className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-lg">
                <Icon className="size-6" aria-hidden />
              </div>
              <div>
                <h2 className="text-foreground font-semibold">{title}</h2>
                <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
