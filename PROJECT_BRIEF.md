# PledgeRun — Project Brief

**Project name:** PledgeRun

**Problem (1 sentence):** College students and indie creators globally lose money to crowdfunding platforms that charge 5–8% fees, can freeze funds arbitrarily, and offer no guarantee of refund when a campaign fails.

**Solution (1 sentence):** PledgeRun uses a Soroban smart contract on Stellar to hold pledge funds in escrow — automatically releasing to the creator if the goal is met by the deadline, or refunding every backer if it isn't, with zero platform fees.

## Stellar features used

| Feature | MVP / roadmap |
|--------|----------------|
| Soroban smart contract | Yes — escrow, goal/deadline, release/refund logic |
| Web app | Yes — `frontend/index.html` + Freighter |
| XLM / USDC transfer | Roadmap — MVP tracks pledge amounts on-chain; production would settle via Soroban token / host functionality |
| Custom tokens | Optional later |
| Built-in DEX | No |
| Trustline | No |
| Clawback / compliance | No |

## Target users

College students, indie creators, and small community organizers globally (starting in SEA) who want to raise funds transparently without trusting a centralized platform with their money.

## Core feature (MVP)

A backer commits a pledge recorded by the Soroban escrow contract — if the campaign goal is reached before the deadline, execution releases funds to the creator; if not, the contract supports refund semantics. *(Current contract tracks amounts and lifecycle on-chain; wiring native XLM/USDC transfers is the natural next step.)*

## Constraints

- **Region:** Global (SEA-first)
- **User type:** Students, creators
- **Complexity:** Soroban required, web app

## Theme

Finance & payments → savings & lending + marketplace escrow.
