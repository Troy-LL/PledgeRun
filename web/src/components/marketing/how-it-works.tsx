import { Banknote, Share2, Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"

const steps = [
  {
    step: "1",
    icon: Sparkles,
    title: "Create your campaign",
    body: "Set a title, funding goal, and deadline. Initialize the contract once per deployment with your wallet as creator.",
  },
  {
    step: "2",
    icon: Share2,
    title: "Share with backers",
    body: "Send your link and story. Backers pledge through Freighter — amounts are recorded on-chain in escrow.",
  },
  {
    step: "3",
    icon: Banknote,
    title: "Funds flow by the rules",
    body: "If the goal is met in time, funds can release to the creator; otherwise backers are refunded per contract logic.",
  },
]

type HowItWorksProps = {
  className?: string
}

export function HowItWorks({ className }: HowItWorksProps) {
  return (
    <section id="how-it-works" className={cn("scroll-mt-20", className)}>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
            Fundraising that&apos;s easy to explain
          </h2>
          <p className="text-muted-foreground mt-3 text-lg">
            Three steps — same clarity as leading crowdfunding sites, with on-chain accountability.
          </p>
        </div>
        <ol className="mt-12 grid gap-8 lg:grid-cols-3">
          {steps.map(({ step, icon: Icon, title, body }) => (
            <li key={step} className="relative rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="text-primary mb-4 flex items-center gap-3">
                <span className="bg-primary/10 font-display flex size-8 items-center justify-center rounded-full text-sm font-bold">
                  {step}
                </span>
                <Icon className="size-6" aria-hidden />
              </div>
              <h3 className="text-foreground text-lg font-semibold">{title}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
