#![no_std]

//! PledgeRun — Soroban escrow for crowdfunding campaigns (MVP).
//!
//! **MVP flow:** `init` (creator opens campaign) → `pledge` (backers commit amounts on-chain) →
//! after the deadline, either `release` (goal met) or `refund` (goal not met). Read-only
//! `get_campaign` / `get_pledge` support the UI.

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Address, Env, Map, Symbol,
};

// ---------------------------------------------------------------------------
// Storage keys — instance storage (single campaign per contract deployment)
// ---------------------------------------------------------------------------

/// Key for the [`Campaign`] struct (one record per deployed contract in MVP).
const CAMPAIGN: Symbol = symbol_short!("CAMPAIGN");

/// Key for the map of backer [`Address`] → pledged amount (stroops).
const PLEDGES: Symbol = symbol_short!("PLEDGES");

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

/// On-chain campaign record: goal, deadline, running total, lifecycle flag.
#[contracttype]
#[derive(Clone)]
pub struct Campaign {
    /// Account that created the campaign; must authorize `init`.
    pub creator: Address,
    /// Funding target in stroops (1 XLM = 10_000_000 stroops).
    pub goal: i128,
    /// Unix time (seconds); pledges allowed only while `ledger.timestamp <= deadline`.
    pub deadline: u64,
    /// Sum of all pledge amounts (stroops).
    pub total: i128,
    /// Set true after a successful `release` or `refund`.
    pub finalized: bool,
}

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

#[contract]
pub struct PledgeRun;

#[contractimpl]
impl PledgeRun {
    /// **MVP: initialize campaign** — one-time setup so backers can `pledge`.
    ///
    /// The creator proves control by signing (`require_auth`). Stores goal and deadline,
    /// initializes an empty pledge map. Panics if the campaign already exists (duplicate `init`).
    pub fn init(env: Env, creator: Address, goal: i128, deadline: u64) {
        creator.require_auth();

        if env.storage().instance().has(&CAMPAIGN) {
            panic!("campaign already exists");
        }

        assert!(goal > 0, "goal must be positive");
        assert!(deadline > env.ledger().timestamp(), "deadline must be in the future");

        let campaign = Campaign {
            creator,
            goal,
            deadline,
            total: 0,
            finalized: false,
        };

        env.storage().instance().set(&CAMPAIGN, &campaign);

        let pledges: Map<Address, i128> = Map::new(&env);
        env.storage().instance().set(&PLEDGES, &pledges);
    }

    /// **MVP: record a pledge** — backer commits an amount toward the goal before the deadline.
    ///
    /// The backer must sign. Increments per-address totals and campaign `total`. Token transfer
    /// is out of scope for MVP; amounts are tracked for deterministic release/refund logic later.
    pub fn pledge(env: Env, backer: Address, amount: i128) {
        backer.require_auth();

        assert!(amount > 0, "pledge amount must be positive");

        let mut campaign: Campaign = env.storage().instance().get(&CAMPAIGN).unwrap();

        assert!(!campaign.finalized, "campaign already finalized");
        assert!(
            env.ledger().timestamp() <= campaign.deadline,
            "campaign deadline has passed"
        );

        let mut pledges: Map<Address, i128> = env.storage().instance().get(&PLEDGES).unwrap();
        let existing = pledges.get(backer.clone()).unwrap_or(0);
        pledges.set(backer, existing + amount);
        campaign.total += amount;

        env.storage().instance().set(&PLEDGES, &pledges);
        env.storage().instance().set(&CAMPAIGN, &campaign);
    }

    /// **MVP: finalize success** — after the deadline, if `total >= goal`, mark campaign finalized.
    ///
    /// Callable after the deadline; contract checks goal reached. Returns total released (stroops).
    pub fn release(env: Env) -> i128 {
        let mut campaign: Campaign = env.storage().instance().get(&CAMPAIGN).unwrap();

        assert!(!campaign.finalized, "already finalized");
        assert!(
            env.ledger().timestamp() > campaign.deadline,
            "deadline has not passed yet"
        );
        assert!(campaign.total >= campaign.goal, "goal not reached — use refund()");

        campaign.finalized = true;
        env.storage().instance().set(&CAMPAIGN, &campaign);

        campaign.total
    }

    /// **MVP: finalize failure** — after the deadline, if `total < goal`, mark finalized for refund semantics.
    ///
    /// Returns backer count from storage (MVP bookkeeping; actual token payouts are a follow-on).
    pub fn refund(env: Env) -> u32 {
        let mut campaign: Campaign = env.storage().instance().get(&CAMPAIGN).unwrap();

        assert!(!campaign.finalized, "already finalized");
        assert!(
            env.ledger().timestamp() > campaign.deadline,
            "deadline has not passed yet"
        );
        assert!(campaign.total < campaign.goal, "goal was reached — use release()");

        campaign.finalized = true;
        env.storage().instance().set(&CAMPAIGN, &campaign);

        let pledges: Map<Address, i128> = env.storage().instance().get(&PLEDGES).unwrap();
        pledges.len()
    }

    /// Read campaign state (RPC / UI).
    pub fn get_campaign(env: Env) -> Campaign {
        env.storage().instance().get(&CAMPAIGN).unwrap()
    }

    /// Read one backer’s cumulative pledge (stroops).
    pub fn get_pledge(env: Env, backer: Address) -> i128 {
        let pledges: Map<Address, i128> = env.storage().instance().get(&PLEDGES).unwrap();
        pledges.get(backer).unwrap_or(0)
    }
}

#[cfg(test)]
#[path = "test.rs"]
mod tests;
