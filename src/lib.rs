#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Env, String, Symbol};

// ─────────────────────────────────────────────
// Data Types
// ─────────────────────────────────────────────

/// On-chain record for a single student achievement.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Achievement {
    /// Student's name (stored on-chain).
    pub student_name: String,
    /// Name of the completed course / bootcamp.
    pub course_name: String,
    /// Unix timestamp (seconds) when the achievement was registered.
    pub timestamp: u64,
    /// Whether the achievement has been verified by an admin.
    pub verified: bool,
}

// Storage keys
const ADMIN: Symbol = symbol_short!("ADMIN");
const COUNT: Symbol = symbol_short!("COUNT");

// ─────────────────────────────────────────────
// Contract
// ─────────────────────────────────────────────

#[contract]
pub struct AchievementRegistry;

#[contractimpl]
impl AchievementRegistry {
    // ── Initialisation ──────────────────────────────────────────────────────

    /// Initialise the registry.  Must be called once after deployment.
    /// `admin` is the address that can later verify achievements.
    pub fn initialize(env: Env, admin: String) {
        // Prevent re-initialisation
        if env.storage().instance().has(&ADMIN) {
            panic!("already initialised");
        }
        env.storage().instance().set(&ADMIN, &admin);
        env.storage().instance().set(&COUNT, &0_u64);
    }

    // ── Core actions ────────────────────────────────────────────────────────

    /// Register a new achievement and return its auto-assigned `id`.
    pub fn register(env: Env, student_name: String, course_name: String) -> u64 {
        let id: u64 = env.storage().instance().get(&COUNT).unwrap_or(0);

        let achievement = Achievement {
            student_name,
            course_name,
            timestamp: env.ledger().timestamp(),
            verified: false,
        };

        env.storage().persistent().set(&id, &achievement);

        // Increment counter
        env.storage().instance().set(&COUNT, &(id + 1));

        id
    }

    /// Mark an achievement as verified (admin only).
    pub fn verify(env: Env, caller: String, id: u64) {
        let admin: String = env.storage().instance().get(&ADMIN).expect("not initialised");
        if caller != admin {
            panic!("only admin can verify achievements");
        }

        let mut achievement: Achievement = env
            .storage()
            .persistent()
            .get(&id)
            .expect("achievement not found");

        achievement.verified = true;
        env.storage().persistent().set(&id, &achievement);
    }

    // ── Queries ─────────────────────────────────────────────────────────────

    /// Retrieve an achievement record by its `id`.
    pub fn get(env: Env, id: u64) -> Achievement {
        env.storage()
            .persistent()
            .get(&id)
            .expect("achievement not found")
    }

    /// Return `true` when the achievement exists **and** has been verified.
    pub fn is_verified(env: Env, id: u64) -> bool {
        env.storage()
            .persistent()
            .get::<u64, Achievement>(&id)
            .map(|a| a.verified)
            .unwrap_or(false)
    }

    /// Return the total number of achievements registered so far.
    pub fn count(env: Env) -> u64 {
        env.storage().instance().get(&COUNT).unwrap_or(0)
    }
}

// ─────────────────────────────────────────────
// Tests live in test.rs (see mod below)
// ─────────────────────────────────────────────

#[cfg(test)]
mod test;
