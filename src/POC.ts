import {
  Credential,
  Duration,
  IotaIdentityClient,
  Timestamp,
} from "@iota/identity-wasm/node";
import { getTokensAvailable } from "./utils";
import { Client } from "@iota/sdk-wasm/node";
import { EXPLORER, NODE, FAUCET } from "./constants";
import { Identity } from "./identity";

export default class ProofOfConcept {
  client: Client;

  constructor() {
    this.client = new Client({ nodes: [NODE] });
  }

  async linkToAliasOutput(identity: Identity) {
    const [ouputId] = await new IotaIdentityClient(this.client).getAliasOutput(
      identity.document.id().toAliasId()
    );

    return `${EXPLORER}/output/${ouputId}`;
  }

  async requestTokens(address: string) {
    const tokensAvailableBefore = await getTokensAvailable(
      this.client,
      address
    );
    await this.client.requestFundsFromFaucet(FAUCET, address.toString());

    let tokensAvailableNow = tokensAvailableBefore;
    do {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      tokensAvailableNow = await getTokensAvailable(this.client, address);
    } while (tokensAvailableNow === tokensAvailableBefore);
  }

  coverStorageDeposit = async (address: string, tokensRequired: bigint) => {
    while ((await getTokensAvailable(this.client, address)) < tokensRequired) {
      await this.requestTokens(address);
    }
  };

  notOlderThan(duration: Duration) {
    const latestIssuanceDate = Timestamp.nowUTC().checkedSub(duration);

    return (credential: Credential) =>
      credential.issuanceDate() > latestIssuanceDate;
  }

  generateNonce() {
    return Math.floor(Math.random() * Math.pow(2, 32)).toString();
  }
}
