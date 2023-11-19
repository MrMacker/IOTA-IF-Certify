import { IdentityWallet } from "./identity";
import { Verifier } from "./verifier";
import ProofOfConcept from "./POC";
import { Duration, IotaIdentityClient } from "@iota/identity-wasm/node";
import { delay } from "./utils";

// This is implementing anything needed for the proof of concept.
const PROOF_OF_CONCEPT = new ProofOfConcept();

async function main() {
  // Create a wallet to manage identities.
  const wallet = await IdentityWallet.new()
    .withClient(PROOF_OF_CONCEPT.client)
    .create();

  // Use the wallet to generate identities for Hans and the college.
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

  // Create a verifier for the CRU.
  const cru = await Verifier.new().withClient(PROOF_OF_CONCEPT.client).create();

  // Let the college issue a credential for Hans.
  console.log("Generating a credential for Hans issued by the college...");
  const credential = await college
    .generateCredential()
    .withSubject(hans)
    .withProperty("degree", "Degree")
    .withVerificationMethod("verify")
    .withRevocationStatus("revoke", 1)
    .create();

  // Let the CRU request credentials from Hans.
  // In this proof of concept the request and response are simply passed to
  // the appropriate functions. In a production grade program, it is adviced
  // to implement a standardized exchange specification, like [OpenID](https://openid.github.io/OpenID4VP/openid-4-verifiable-presentations-wg-draft.html).
  console.log("Requesting a presentation from Hans...");
  const request = await cru
    .generatePresentationRequest()
    .withPredicate(PROOF_OF_CONCEPT.notOlderThan(Duration.seconds(5)))
    .withNonce(PROOF_OF_CONCEPT.generateNonce())
    .create();

  // Let Hans gather credentials that meet the requested requirements in a presentation
  // and generate a response.
  console.log("Generating a presentation response for Hans...");
  const response = await hans
    .generatePresentationResponse()
    .withNonce(request.nonce)
    .withCredential(credential)
    .withVerificationMethod("verify")
    .create();

  // Let the CRU verify the response signatures and credentials and validate
  // the credentials against the requirements of the request.
  // NOTE: This validation should succeed.
  console.log("Validating the presentation response from Hans...");
  await cru
    .generatePresentationValidation()
    .withRequest(request)
    .withResponse(response)
    .create();

  // Wait 5 seconds.
  await delay(Duration.seconds(5));

  // Let the CRU again verify the response signatures and credentials and validate
  // the credentials against the requirements of the request.
  // NOTE: This validation should fail because the credential is too old.
  console.log("Validating the presentation response from Hans...");
  await cru
    .generatePresentationValidation()
    .withRequest(request)
    .withResponse(response)
    .create();
}

main();