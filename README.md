# IOTA-IF-Certify
IOTA Certify provides a tool to manage identities and credentials as holder and issuer and a tool to verify these credentials and their attributes as verifier.

# Usage
1. Clone the repository:
git clone https://github.com/MrMacker/IOTA-IF-Certify

2. Change directory to the root of the repository:
 - cd iota-certify

3. Install the dependencies:
 - npm install

4. Build the project:
 - npm run build

5. Run the program:
 - node .

# Scenario
At this stage the software coding is not interactive yet and only verifies one credential. - Proof of Concept Only (PoC)

This proof of concept aims to provide tools to support the scenario where a holder H is required by a verifier V to hold credentials, issued by an issuer I from the set of issuers approved by the verifier, that prove H has sufficiently recent experience to fulfill duties on behalf of some party X. Both H and X (on behalf of H), should be able to provide this proof to V, while H stays in control of what is shared and minimizing the the need to query I.

# Design
At this stage the software coding nothing is persisted to disk yet. - Proof of Concept Only (PoC)

As a proof of concept we seek to get full insight in the process of creating, managing, and verifying Decentralised Identities (DID) documents and credentials. As such, this PoC does not adhere to security standards when dealing with secret management, where a production grade implementation must. For example seeds and private keys are commited to disk unsecured.

# DID derivation

The [IOTA Identity framework](https://wiki.iota.org/identity.rs/introduction/) builds on top of [alias outputs](https://wiki.iota.org/tips/tips/TIP-0018/#alias-output) provided by the IOTA protocol, which in turn are controlled by addresses derived from a seed using BIP32 key derivation. While this allows the derivation of a near limitless amount of DIDs from a single seed, in this proof of concept we limit ourselves to the creation of a single DID document and consequently a single DID per seed for each entity.




