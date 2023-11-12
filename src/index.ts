import { IdentityWallet } from "./identity";
import { Verifier } from "./verifier";
import ProofOfConcept from "./POC";
import { Duration, IotaIdentityClient } from "@iota/identity-wasm/node";

// This is implementing anything needed for the proof of concept.
const PROOF_OF_CONCEPT = new ProofOfConcept();

async function main() {
  const wallet = await IdentityWallet.new()
    .withClient(PROOF_OF_CONCEPT.client)
    .create();
  const cru = await Verifier.new().withClient(PROOF_OF_CONCEPT.client).create();

  console.log("Generating an identity for Hans...");
  const hans = await wallet
    .generateIdentity()
    .withVerificationMethod("verify")
    .withStorageDepositCovered(PROOF_OF_CONCEPT.coverStorageDeposit)
    .create();
  console.log("Explorer URL:", await PROOF_OF_CONCEPT.linkToAliasOutput(hans));

  console.log("Generating an identity for the college...");
  const college = await wallet
    .generateIdentity()
    .withVerificationMethod("verify")
    .withRevocationService("revoke")
    .withStorageDepositCovered(PROOF_OF_CONCEPT.coverStorageDeposit)
    .create();
  console.log(
    "Explorer URL:",
    await PROOF_OF_CONCEPT.linkToAliasOutput(college)
  );

  console.log("Generating a credential for Hans issued by the college...");
  const credential = await college
    .generateCredential()
    .withSubject(hans)
    .withProperty("degree", "Degree")
    .withVerificationMethod("verify")
    .withRevocationStatus("revoke", 1)
    .create();

  console.log("Requesting a presentation from Hans...");
  const request = await cru
    .generatePresentationRequest()
    .withPredicate(PROOF_OF_CONCEPT.notOlderThan(Duration.seconds(5)))
    .withNonce(PROOF_OF_CONCEPT.generateNonce())
    .create();

  console.log("Generating a presentation response for Hans...");
  const response = await hans
    .generatePresentationResponse()
    .withNonce(request.nonce)
    .withCredential(credential)
    .withVerificationMethod("verify")
    .create();

  console.log("Validating the presentation response from Hans...");
  await cru
    .generatePresentationValidation()
    .withRequest(request)
    .withResponse(response)
    .create();
}

main();
