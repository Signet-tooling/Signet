# Signet

**Cross-platform passkey signer SDK for Soroban smart wallets.**

Signet gives wallet developers everything they need to build passkey-authenticated Stellar wallets — without reimplementing WebAuthn flows, secp256r1 signing, or Soroban's native auth framework from scratch. It handles passkey registration, transaction signing on the only elliptic curve that matters for passkeys, session key derivation for batched transactions, and recovery flows that don't rely on seed phrases.

If you are building a wallet that authenticates with fingerprints instead of mnemonics, Signet is the foundation.

---

## Why Signet Exists

The Stellar Development Foundation has made passkey wallets their top UX priority. Soroban added native secp256r1 signature verification specifically to enable this. The curve is there. The smart contract primitives are there. The intent from SDF is unambiguous.

The problem: no SDK exists to actually build passkey wallets on Soroban. Every team that wants passkey authentication today has to implement the entire stack themselves — WebAuthn ceremony handling, COSE key parsing, challenge construction, authenticator response validation, secp256r1 signature formatting for Soroban's auth framework, and recovery architecture. That's months of security-critical cryptographic plumbing before a single user signs a single transaction.

Freighter doesn't support passkeys. Lobstr doesn't. No existing Stellar wallet does. And the reason is straightforward: the infrastructure layer doesn't exist yet.

Signet is that layer. It is not a wallet. It is the SDK that wallet developers — Freighter, Lobstr, or the next entrant — would use to add passkey support without rebuilding the world.

---

## Features

- **Full WebAuthn lifecycle** — passkey registration, authentication, and ceremony orchestration across platform authenticators (Touch ID, Face ID, Windows Hello) and roaming authenticators (YubiKey, Titan)
- **Native secp256r1 signing** — transaction and Soroban auth entry signing on the curve Soroban actually verifies, with proper ASN.1 DER decoding and signature normalization
- **Session keys** — derived ephemeral keys with scoped permissions and configurable TTLs, so users approve once and batch subsequent transactions without repeated biometric prompts
- **Recovery without seed phrases** — secondary passkey registration, social recovery contract integration, and guardian-based recovery flows that let users recover wallets the way they recover every other account on the internet
- **Soroban auth integration** — constructs and signs Soroban authorization entries directly, compatible with Soroban's `require_auth` pattern and custom account contracts
- **Cross-platform** — Web (WebAuthn API), React Native (platform authenticator bridges), and Flutter (platform channel adapters) from a single core implementation
- **Smart wallet contract toolkit** — reference account contract that verifies secp256r1 signatures on-chain, manages signer rotation, enforces session key policies, and implements the standard Soroban auth interface

---

## Architecture

Signet is organized into five modules that compose into a unified signer interface. The core cryptographic logic is shared across all platforms. Platform-specific modules handle only the authenticator communication layer.

```
User initiates action (sign transaction, add signer, recover)
        │
        ▼
┌───────────────────┐
│  Ceremony Engine  │  Orchestrates WebAuthn registration and authentication
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Credential Store │  Manages credential IDs, public keys, and metadata
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Signature Codec  │  Decodes COSE, normalizes DER, formats for Soroban
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Session Manager  │  Derives ephemeral keys, enforces scope and expiry
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Auth Builder     │  Constructs Soroban auth entries and submits
└────────┬──────────┘
         │
         ▼
   Transaction signed
   Auth entry submitted
   Session state updated
```

### Module 1: Ceremony Engine
Handles the full WebAuthn ceremony — `navigator.credentials.create()` for registration and `navigator.credentials.get()` for authentication. Constructs challenge payloads, validates authenticator responses, extracts public key coordinates from COSE attestation objects, and manages the relying party configuration. On React Native and Flutter, delegates to platform-specific authenticator bridges while keeping the ceremony logic identical.

### Module 2: Credential Store
Manages the mapping between passkey credential IDs and Stellar accounts. Stores public key coordinates, authenticator metadata (AAGUID, transport hints, attestation type), and signer relationships. Pluggable storage backend — IndexedDB on web, Keychain/Keystore on mobile, or any custom adapter. Credential data is non-secret but integrity-protected.

### Module 3: Signature Codec
The cryptographic bridge between WebAuthn and Soroban. Decodes the authenticator's ASN.1 DER-encoded signature into raw (r, s) components. Applies low-S normalization per SEC 1 rules. Reconstructs the signed payload (authenticatorData + SHA-256(clientDataJSON)) so on-chain verification can reproduce the same digest. Outputs the exact byte format that Soroban's `secp256r1_verify` host function expects.

### Module 4: Session Manager
Derives ephemeral secp256r1 keypairs scoped to specific contract invocations, spending limits, or time windows. A user authenticates with their passkey once, and the session key handles subsequent transactions until the policy boundary is hit or the TTL expires. Session keys are registered with the on-chain account contract as authorized sub-signers — the smart contract enforces the scope, not just the client.

### Module 5: Auth Builder
Constructs Soroban authorization entries from transaction parameters and signed payloads. Handles nonce management, auth entry tree construction, and the mapping between WebAuthn credential assertions and Soroban's `SorobanAuthorizationEntry` structure. Integrates with Stellar SDK transaction builders so signing a Soroban invocation with a passkey is a single method call.

---

## Recovery Model

Seed phrases are the leading cause of permanent wallet loss for non-technical users. Signet treats recovery as a first-class architectural concern, not an afterthought.

**Secondary passkeys.** Users register multiple passkeys across devices during onboarding. Any registered passkey can authorize signer rotation on the account contract. Losing a phone doesn't mean losing a wallet — the YubiKey in the drawer, the laptop at home, or the tablet on the nightstand can recover access.

**Social recovery.** A configurable set of guardian addresses (friends, family, institutional custodians) can collectively authorize a signer change after a time-locked recovery period. The guardian threshold, timelock duration, and cancellation policy are set by the account holder at deployment time and enforced entirely on-chain.

**No fallback to mnemonics.** The entire point of passkey wallets is that users never handle raw key material. Signet does not compromise this by hiding a seed phrase behind a "break glass" option. Recovery works the way users already expect — through their devices and their trusted contacts.

---

## Smart Wallet Contract

Signet includes a reference Soroban account contract that implements the on-chain half of the passkey wallet architecture. The contract is not a toy example — it is designed for production deployment.

The contract verifies secp256r1 signatures using Soroban's native host function. It maintains a signer registry that maps credential IDs to public key coordinates. It enforces session key policies on-chain — scoped permissions, spending limits, and expiry timestamps are contract state, not client-side honor-system checks. It implements the standard `__check_auth` interface so it works with any Soroban contract that calls `require_auth`.

Signer rotation, guardian management, and recovery execution are all contract-level operations with proper authorization checks. The contract is the source of truth. The SDK is the interface.

---

## Platform Support

| Platform | Authenticator Access | Status |
|----------|---------------------|--------|
| Web (Chrome, Safari, Firefox, Edge) | WebAuthn API | Supported |
| React Native (iOS) | ASAuthorizationController | Supported |
| React Native (Android) | FIDO2 CredentialManager | Supported |
| Flutter (iOS) | ASAuthorizationController | Supported |
| Flutter (Android) | FIDO2 CredentialManager | Supported |

All platforms share the same core modules (Signature Codec, Session Manager, Auth Builder). Only the Ceremony Engine has platform-specific implementations.

---

## What Signet Is Not

**Signet is not a wallet.** It does not have a UI. It does not manage balances. It does not display transaction histories or token prices. It is a signing and authentication SDK that wallet developers embed into their products.

**Signet is not a custodial service.** Private keys are never extracted from the authenticator. Passkey credentials are hardware-bound. Signet cannot sign on behalf of a user — it can only facilitate the user signing through their own authenticator.

**Signet is not chain-specific infrastructure disguised as an SDK.** The core WebAuthn and secp256r1 logic is curve-correct and ceremony-correct independent of Stellar. The Soroban integration is a module, not a hard dependency. If another chain adds secp256r1 host-function support tomorrow, the Auth Builder module is the only thing that changes.

---

## Security Considerations

**Passkey private keys never leave the authenticator.** This is a property of the WebAuthn specification, not a Signet implementation detail. The authenticator performs signing internally and returns only the signature. Signet never has access to the private key.

**Signature malleability is handled at the codec layer.** Soroban's `secp256r1_verify` expects low-S normalized signatures. Signet normalizes every signature before it reaches the Auth Builder, preventing on-chain verification failures and replay vectors.

**Session keys are enforced on-chain.** Client-side session expiry is a convenience. The account contract independently verifies that the session key is authorized, within its permitted scope, and not expired. A compromised client cannot extend a session key's authority beyond what the contract allows.

**Challenges are bound to transaction content.** The WebAuthn challenge payload includes the Soroban auth entry hash, not a generic nonce. The user's biometric approval is cryptographically bound to the specific transaction they are authorizing.

---

## License

MIT
