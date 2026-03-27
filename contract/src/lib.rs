#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Address, Env, Map, Symbol,
};

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------
const CAMPAIGN: Symbol = symbol_short!("CAMPAIGN");
const PLEDGES: Symbol = symbol_short!("PLEDGES");

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

/// The campaign record stored on-chain.
#[contracttype]
#[derive(Clone)]
pub struct Campaign {
    pub creator: Address, // who created the campaign
    pub goal: i128,       // target amount in stroops (1 XLM = 10_000_000 stroops)
    pub deadline: u64,   // Unix timestamp after which no new pledges are accepted
    pub total: i128,      // running total of pledges received
    pub finalized: bool,  // true once funds have been released or refunds issued
}

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

#[contract]
pub struct PledgeRun;

#[contractimpl]
impl PledgeRun {
    /// Initialize a new campaign.
    /// Must be called once before any pledging can happen.
    pub fn init(env: Env, creator: Address, goal: i128, deadline: u64) {
        // Require the creator to sign this transaction.
        creator.require_auth();

        // Prevent re-initialization.
        if env.storage().instance().has(&CAMPAIGN) {
            panic!("campaign already exists");
        }

        // Validate inputs.
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

        // Initialize an empty pledges map: Address -> amount pledged.
        let pledges: Map<Address, i128> = Map::new(&env);
        env.storage().instance().set(&PLEDGES, &pledges);
    }

    /// Record a pledge from a backer.
    /// In a real deployment the XLM transfer would be handled via a token contract;
    /// here we track pledge amounts on-chain so refunds / release logic is deterministic.
    pub fn pledge(env: Env, backer: Address, amount: i128) {
        backer.require_auth();

        assert!(amount > 0, "pledge amount must be positive");

        let mut campaign: Campaign = env.storage().instance().get(&CAMPAIGN).unwrap();

        assert!(!campaign.finalized, "campaign already finalized");
        assert!(
            env.ledger().timestamp() <= campaign.deadline,
            "campaign deadline has passed"
        );

        // Update the backer's total pledge (they may pledge multiple times).
        let mut pledges: Map<Address, i128> = env.storage().instance().get(&PLEDGES).unwrap();
        let existing = pledges.get(backer.clone()).unwrap_or(0);
        pledges.set(backer, existing + amount);
        campaign.total += amount;

        env.storage().instance().set(&PLEDGES, &pledges);
        env.storage().instance().set(&CAMPAIGN, &campaign);
    }

    /// Release funds to the creator if the goal has been met.
    /// Anyone can call this after the deadline; the contract verifies conditions.
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

        // Return the total so the caller can confirm the released amount.
        campaign.total
    }

    /// Refund all backers if the deadline passed without reaching the goal.
    /// Returns the number of backers refunded.
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

    /// Read the current campaign state (for the frontend).
    pub fn get_campaign(env: Env) -> Campaign {
        env.storage().instance().get(&CAMPAIGN).unwrap()
    }

    /// Read how much a specific backer has pledged.
    pub fn get_pledge(env: Env, backer: Address) -> i128 {
        let pledges: Map<Address, i128> = env.storage().instance().get(&PLEDGES).unwrap();
        pledges.get(backer).unwrap_or(0)
    }
}

#[cfg(test)]
mod test;
