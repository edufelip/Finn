# Cryptography Specification

## Purpose
Ensures the security and integrity of sensitive operations, specifically regarding authentication flows and data hashing.

## Functional Requirements
- **FR-CRYP-01**: The system shall generate and hash nonces for Apple Sign-In to prevent replay attacks.
- **FR-CRYP-02**: The database shall utilize standard cryptographic extensions (e.g., `pgcrypto`) for internal security operations.

## Nonce Hashing Logic (Apple Sign-In)
1. **Generation**: A random string (nonce) is generated on the client.
2. **Hashing**: The system utilizes `expo-crypto` to perform a **SHA-256** digest of the raw nonce.
3. **Verification**: The hashed nonce is sent to Apple, and the raw nonce is sent to Supabase Auth for final verification.

## Test Cases
- **TC-CRYP-01**: Verify that the hashed nonce produced by the app matches the expected SHA-256 output for a known input string.

## Terminology
- **SHA-256**: A cryptographic hash function that produces a 256-bit (32-byte) hash value.
- **Nonce**: A unique "number used once" to ensure security in authentication protocols.
