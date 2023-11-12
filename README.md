# IOTA-IF-Certify
IOTA Certify provides a tool to manage identities and credentials as holder and issuer and a tool to verify these credentials and their attributes as verifier.

# Usage
1. Clone the repository:
git clone https://github.com/jlvandenhout/iota-certify.git

2. Change directory to the root of the repository:
cd iota-certify

3. Install the dependencies:
npm install

4. Build the project:
npm run build

5. Run the program:
node .

# Scenario
At this stage the program is not interactive yet and only verifies one credential. - Proof of Concept Only (PoC)

This proof of concept aims to provide tools to support the scenario where a holder H is required by a verifier V to hold credentials, issued by an issuer I from the set of issuers approved by the verifier, that prove H has sufficiently recent experience to fulfill duties on behalf of some party X. Both H and X (on behalf of H), should be able to provide this proof to V, while H stays in control of what is shared and minimizing the the need to query I.
