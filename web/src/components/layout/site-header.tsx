import { Menu } from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type SiteHeaderProps = {
  walletLabel: string | null
  onConnect: () => void
  connecting: boolean
  className?: string
}

const nav = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#campaign", label: "Live demo" },
  { href: "#create", label: "Start a campaign" },
]

export function SiteHeader({ walletLabel, onConnect, connecting, className }: SiteHeaderProps) {
  const [open, setOpen] = useState(false)

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80",
        className
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6 lg:px-8">
        <a href="#" className="font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">
          Pledge<span className="text-primary">Run</span>
        </a>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="hidden font-normal sm:inline-flex">
            Testnet
          </Badge>
          <Button
            className="hidden sm:inline-flex"
            disabled={connecting}
            onClick={() => void onConnect()}
          >
            {walletLabel ?? "Connect wallet"}
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="md:hidden"
            aria-expanded={open}
            aria-label="Menu"
            onClick={() => setOpen((o) => !o)}
          >
            <Menu className="size-5" />
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-foreground rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <Button className="mt-2 w-full" disabled={connecting} onClick={() => void onConnect()}>
              {walletLabel ?? "Connect wallet"}
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}
