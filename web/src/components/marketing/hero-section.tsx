import { ArrowRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type HeroSectionProps = {
  className?: string
}

export function HeroSection({ className }: HeroSectionProps) {
  return (
    <section className={cn("relative overflow-hidden", className)}>
      <div className="from-primary/[0.06] pointer-events-none absolute inset-0 bg-gradient-to-b via-transparent to-transparent" />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="mb-4 font-normal">
            Soroban escrow on Stellar testnet
          </Badge>
          <h1 className="font-display text-foreground text-4xl font-black tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Where transparent fundraisers start
          </h1>
          <p className="text-muted-foreground mx-auto mt-5 max-w-xl text-lg leading-relaxed sm:text-xl">
            Set a goal and deadline. Pledges are held in smart-contract escrow — released to the creator if you hit
            your goal, or returned to backers if you don&apos;t.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <a
              href="#create"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-11 min-w-[200px] gap-2 px-8 text-base has-data-[icon=inline-end]:pr-8"
              )}
            >
              Start a campaign
              <ArrowRight className="size-4" data-icon="inline-end" />
            </a>
            <a
              href="#campaign"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-11 min-w-[200px] px-8 text-base"
              )}
            >
              See live demo
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
