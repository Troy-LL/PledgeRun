import { useCallback, useEffect, useState } from "react"
import { Address, nativeToScVal } from "@stellar/stellar-sdk"
import { toast } from "sonner"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { HeroSection } from "@/components/marketing/hero-section"
import { HowItWorks } from "@/components/marketing/how-it-works"
import { TrustStrip } from "@/components/marketing/trust-strip"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  callContract,
  connectWallet,
  getContract,
  getContractId,
  isDeployed,
  simulateRead,
  stroopsToXlm,
  xlmToStroops,
} from "@/lib/stellar"

type CampaignUi = {
  name: string
  goal: number
  raised: number
  backerCount: number
  deadline: Date
  finalized: boolean
}

const DEMO: CampaignUi = {
  name: "Open Source Dev Fund",
  goal: 100,
  raised: 42,
  backerCount: 7,
  deadline: new Date(Date.now() + 2 * 86400000 + 14 * 3600000),
  finalized: false,
}

function shortAddr(a: string) {
  return a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a
}

export default function App() {
  const contractId = getContractId()
  const deployed = isDeployed(contractId)

  const [wallet, setWallet] = useState<string | null>(null)
  const [campaign, setCampaign] = useState<CampaignUi>(DEMO)
  const [pledgeInput, setPledgeInput] = useState("")
  const [txHash, setTxHash] = useState<string | null>(null)
  const [loading, setLoading] = useState<null | "wallet" | "pledge" | "init">(null)

  const [formName, setFormName] = useState("")
  const [formGoal, setFormGoal] = useState("")
  const [formDeadline, setFormDeadline] = useState("")
  const [formCreator, setFormCreator] = useState("")

  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const refresh = useCallback(async () => {
    if (!deployed || !wallet) return
    try {
      const c = (await simulateRead(contractId, wallet, getContract(contractId).call("get_campaign"))) as {
        goal: bigint
        deadline: bigint
        total: bigint
        finalized: boolean
      }
      const my = await simulateRead(
        contractId,
        wallet,
        getContract(contractId).call("get_pledge", new Address(wallet).toScVal())
      )
      const myXlm = stroopsToXlm(my as bigint)
      setCampaign((prev) => ({
        ...prev,
        goal: stroopsToXlm(c.goal),
        raised: stroopsToXlm(c.total),
        deadline: new Date(Number(c.deadline) * 1000),
        finalized: !!c.finalized,
        backerCount: myXlm > 0 ? 1 : 0,
      }))
    } catch (e) {
      console.warn("refresh", e)
    }
  }, [contractId, deployed, wallet])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const diff = campaign.deadline.getTime() - Date.now()
  const cd =
    diff <= 0
      ? { d: 0, h: 0, m: 0, s: 0 }
      : {
          d: Math.floor(diff / 86400000),
          h: Math.floor((diff % 86400000) / 3600000),
          m: Math.floor((diff % 3600000) / 60000),
          s: Math.floor((diff % 60000) / 1000),
        }
  void tick

  const pct = Math.min(100, Math.round((campaign.raised / campaign.goal) * 100) || 0)
  const remaining = Math.max(0, campaign.goal - campaign.raised)

  async function onConnect() {
    setLoading("wallet")
    try {
      const addr = await connectWallet()
      setWallet(addr)
      setFormCreator(addr)
      toast.success("Wallet connected")
      await refresh()
    } catch (e) {
      toast.error((e as Error).message ?? "Connect Freighter (Testnet)")
    } finally {
      setLoading(null)
    }
  }

  async function onPledge() {
    const amount = parseFloat(pledgeInput)
    if (!amount || amount <= 0) {
      toast.warning("Enter a valid XLM amount")
      return
    }
    if (!wallet) {
      toast.warning("Connect wallet first")
      return
    }
    if (!deployed) {
      toast.error("Set VITE_CONTRACT_ID in .env (deployed contract)")
      return
    }
    setLoading("pledge")
    try {
      const { hash } = await callContract(
        contractId,
        wallet,
        "pledge",
        new Address(wallet).toScVal(),
        nativeToScVal(xlmToStroops(amount), { type: "i128" })
      )
      setTxHash(hash)
      toast.success(`Pledged ${amount} XLM`)
      setPledgeInput("")
      await refresh()
    } catch (e) {
      toast.error((e as Error).message ?? "Pledge failed")
    } finally {
      setLoading(null)
    }
  }

  async function onCreate() {
    const name = formName.trim()
    const goal = parseFloat(formGoal)
    const deadline = formDeadline
    const creator = formCreator.trim() || wallet || ""
    if (!name || !goal || !deadline) {
      toast.warning("Fill campaign name, goal, and deadline")
      return
    }
    if (!deployed) {
      toast.error("Set VITE_CONTRACT_ID in .env")
      return
    }
    if (!wallet) {
      toast.warning("Connect wallet first — creator must sign init")
      return
    }
    if (creator !== wallet) {
      toast.error("Creator address must match your connected wallet (contract requires creator auth)")
      return
    }
    setLoading("init")
    try {
      const d = new Date(deadline)
      const unix = Math.floor(d.getTime() / 1000)
      const { hash } = await callContract(
        contractId,
        wallet,
        "init",
        new Address(wallet).toScVal(),
        nativeToScVal(xlmToStroops(goal), { type: "i128" }),
        nativeToScVal(BigInt(unix), { type: "u64" })
      )
      setCampaign({
        name,
        goal,
        raised: 0,
        backerCount: 0,
        deadline: d,
        finalized: false,
      })
      setTxHash(hash)
      toast.success("Campaign initialized on-chain")
      await refresh()
    } catch (e) {
      toast.error((e as Error).message ?? "init failed")
    } finally {
      setLoading(null)
    }
  }

  const statusBadge =
    campaign.finalized && campaign.raised >= campaign.goal ? (
      <Badge className="border-primary/30 bg-primary/10 text-primary">Funded</Badge>
    ) : campaign.finalized ? (
      <Badge variant="destructive" className="bg-destructive/10">
        Refunded
      </Badge>
    ) : (
      <Badge className="border-primary/40 bg-primary/15 text-primary">Live</Badge>
    )

  return (
    <div className="bg-background text-foreground min-h-svh">
      <SiteHeader
        walletLabel={wallet ? shortAddr(wallet) : null}
        onConnect={onConnect}
        connecting={loading === "wallet"}
      />

      <HeroSection />
      <TrustStrip />
      <HowItWorks />

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="font-display text-foreground text-2xl font-bold tracking-tight sm:text-3xl">Try the demo</h2>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Connect Freighter on Stellar testnet to pledge XLM or initialize a campaign with your wallet.
          </p>
        </div>

        {!deployed && (
          <Card className="mb-6 border-amber-300/80 bg-amber-50/80 dark:border-amber-500/30 dark:bg-amber-500/5">
            <CardHeader>
              <CardTitle className="text-amber-900 dark:text-amber-200">Contract not configured</CardTitle>
              <CardDescription>
                Add <code className="text-foreground">VITE_CONTRACT_ID</code> to <code className="text-foreground">web/.env</code> after{" "}
                <code className="text-foreground">stellar contract deploy</code>. UI shows demo numbers until then.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <section id="campaign" className="scroll-mt-24">
        <Card className="mb-6 shadow-sm">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
            <div>
              <CardTitle className="font-display text-xl">{campaign.name}</CardTitle>
              <CardDescription>Progress toward goal</CardDescription>
            </div>
            {statusBadge}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Raised <strong className="text-foreground">{campaign.raised.toFixed(2)} XLM</strong>
              </span>
              <span className="text-muted-foreground">
                Goal <strong className="text-foreground">{campaign.goal} XLM</strong>
              </span>
            </div>
            <Progress value={pct} className="h-3 bg-muted [&>div]:bg-primary" />
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div className="bg-muted/50 rounded-xl border border-border p-3">
                <div className="font-display text-primary text-lg">{pct}%</div>
                <div className="text-muted-foreground text-xs uppercase tracking-wide">Funded</div>
              </div>
              <div className="bg-muted/50 rounded-xl border border-border p-3">
                <div className="font-display text-accent-foreground text-lg">{campaign.backerCount}</div>
                <div className="text-muted-foreground text-xs uppercase tracking-wide">Backers</div>
              </div>
              <div className="bg-muted/50 rounded-xl border border-border p-3">
                <div className="font-display text-lg text-foreground">{remaining.toFixed(2)}</div>
                <div className="text-muted-foreground text-xs uppercase tracking-wide">XLM left</div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {[
                ["d", cd.d],
                ["h", cd.h],
                ["m", cd.m],
                ["s", cd.s],
              ].map(([u, v]) => (
                <div
                  key={u as string}
                  className="bg-muted/50 min-w-[4rem] rounded-lg border border-border px-3 py-2 text-center"
                >
                  <div className="font-display text-primary text-2xl">
                    {String(v).padStart(2, "0")}
                  </div>
                  <div className="text-muted-foreground text-[10px] uppercase tracking-widest">{u}</div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                type="number"
                min={1}
                step={1}
                placeholder="Amount (XLM)"
                value={pledgeInput}
                onChange={(e) => setPledgeInput(e.target.value)}
              />
              <Button className="shrink-0" disabled={loading === "pledge"} onClick={() => void onPledge()}>
                {loading === "pledge" ? "Submitting…" : "Pledge"}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-muted-foreground self-center text-xs">Quick:</span>
              {[5, 10, 25, 50].map((n) => (
                <Button key={n} variant="outline" size="sm" onClick={() => setPledgeInput(String(n))}>
                  {n} XLM
                </Button>
              ))}
            </div>

            {txHash && (
              <p className="text-muted-foreground font-mono text-xs break-all">
                Last tx: {txHash}
              </p>
            )}
          </CardContent>
        </Card>
        </section>

        <Card className="mb-6 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Your pledge (on-chain)</CardTitle>
            <CardDescription>Contract does not enumerate all backers; your wallet pledge is shown after refresh.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              {wallet && deployed
                ? "Connected — totals refresh from get_campaign / get_pledge."
                : "Connect wallet and set contract id to load live data."}
            </p>
          </CardContent>
        </Card>

        <section id="create" className="scroll-mt-24">
        <Card className="border-primary/25 border-dashed bg-muted/30 shadow-sm">
          <CardHeader>
            <CardTitle>Create campaign</CardTitle>
            <CardDescription>Initializes the contract (once per deploy). Creator must sign.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value)
                  setCampaign((c) => ({ ...c, name: e.target.value || c.name }))
                }}
                placeholder="Campaign title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal">Goal (XLM)</Label>
              <Input
                id="goal"
                type="number"
                value={formGoal}
                onChange={(e) => setFormGoal(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={formDeadline}
                onChange={(e) => setFormDeadline(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="creator">Creator address</Label>
              <Input
                id="creator"
                value={formCreator}
                onChange={(e) => setFormCreator(e.target.value)}
                placeholder="G…"
              />
            </div>
            <Button variant="outline" className="border-primary/40 text-primary sm:col-span-2" disabled={loading === "init"} onClick={() => void onCreate()}>
              {loading === "init" ? "Submitting…" : "Initialize on testnet"}
            </Button>
          </CardContent>
        </Card>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
