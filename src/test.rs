#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Ledger, Env, String};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

fn setup() -> (Env, AchievementRegistryClient<'static>) {
    let env = Env::default();
    let contract_id = env.register(AchievementRegistry, ());
    let client = AchievementRegistryClient::new(&env, &contract_id);

    // Seed a deterministic timestamp so tests are reproducible
    env.ledger().with_mut(|li| {
        li.timestamp = 1_000_000;
    });

    // Initialise with a fixed admin string
    client.initialize(&String::from_str(&env, "admin"));

    (env, client)
}

// ─────────────────────────────────────────────
// Test 1 – register returns incrementing IDs
// ─────────────────────────────────────────────

#[test]
fn test_register_increments_id() {
    let (env, client) = setup();

    let id0 = client.register(
        &String::from_str(&env, "Alice"),
        &String::from_str(&env, "Stellar Smart Contract Bootcamp"),
    );
    let id1 = client.register(
        &String::from_str(&env, "Bob"),
        &String::from_str(&env, "Stellar Smart Contract Bootcamp"),
    );

    assert_eq!(id0, 0, "First achievement should have id 0");
    assert_eq!(id1, 1, "Second achievement should have id 1");
    assert_eq!(client.count(), 2, "Count should be 2 after two registrations");
}

// ─────────────────────────────────────────────
// Test 2 – get returns the correct fields
// ─────────────────────────────────────────────

#[test]
fn test_get_returns_correct_data() {
    let (env, client) = setup();

    let student = String::from_str(&env, "Troy Macapagal");
    let course = String::from_str(&env, "Soroban Bootcamp – UE Caloocan");

    let id = client.register(&student, &course);
    let record = client.get(&id);

    assert_eq!(record.student_name, student);
    assert_eq!(record.course_name, course);
    assert_eq!(record.timestamp, 1_000_000, "Timestamp should match ledger seed");
    assert!(!record.verified, "Newly registered achievement must not be verified");
}

// ─────────────────────────────────────────────
// Test 3 – admin can verify; is_verified flips
// ─────────────────────────────────────────────

#[test]
fn test_verify_by_admin() {
    let (env, client) = setup();

    let id = client.register(
        &String::from_str(&env, "Carlos"),
        &String::from_str(&env, "Stellar Philippines UniTour"),
    );

    // Before verification
    assert!(!client.is_verified(&id), "Should not be verified yet");

    // Admin verifies
    client.verify(&String::from_str(&env, "admin"), &id);

    // After verification
    assert!(client.is_verified(&id), "Should be verified after admin call");
    assert!(client.get(&id).verified, "Record itself should show verified=true");
}

// ─────────────────────────────────────────────
// Test 4 – non-admin cannot verify (panic expected)
// ─────────────────────────────────────────────

#[test]
#[should_panic(expected = "only admin can verify achievements")]
fn test_non_admin_cannot_verify() {
    let (env, client) = setup();

    let id = client.register(
        &String::from_str(&env, "Dana"),
        &String::from_str(&env, "Stellar Smart Contract Bootcamp"),
    );

    // Attempt to verify with wrong caller – must panic
    client.verify(&String::from_str(&env, "hacker"), &id);
}

// ─────────────────────────────────────────────
// Test 5 – count stays accurate across many registrations
// ─────────────────────────────────────────────

#[test]
fn test_count_accuracy() {
    let (env, client) = setup();

    assert_eq!(client.count(), 0, "Fresh registry should have count 0");

    let students = ["Ana", "Ben", "Cara", "Dan", "Eva"];
    let course = String::from_str(&env, "Bootcamp");
    for name in students {
        client.register(&String::from_str(&env, name), &course);
    }

    assert_eq!(client.count(), 5, "Count should equal the number of registrations");
}
