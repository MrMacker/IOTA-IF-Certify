
import { Credential, Timestamp } from "@iota/identity-wasm/node";
import { Client } from "@iota/sdk-wasm/node";
import { EXPLORER, NODE, FAUCET } from "../constants";
import { Identity } from "../abstraction/identity";
import { delay, Duration, getTokensAvailable } from "../abstraction/utils";

class ProofOfConcept {
  client: Client;

  constructor() {
    this.client = new Client({ nodes: [NODE] });
  }

  async linkToExplorer(identity: Identity) {
    const did = identity.document.id().toString();

    return `${EXPLORER}/identity-resolver/${did}`;
  }

  async requestTokens(address: string) {
    const tokensAvailableBefore = await getTokensAvailable(
      this.client,
      address
    );

    await this.client.requestFundsFromFaucet(FAUCET, address.toString());

    while (
      tokensAvailableBefore === (await getTokensAvailable(this.client, address))
    ) {
      await delay(Duration.seconds(1));
    }
  }

  coverStorageDeposit = async (address: string, tokensRequired: bigint) => {
    while ((await getTokensAvailable(this.client, address)) < tokensRequired) {
      await this.requestTokens(address);
    }
  };

  notOlderThan(duration: Duration) {
    return (credential: Credential) => {
      const oldestIssuanceDate = Date.parse(
        Timestamp.nowUTC().checkedSub(duration).toRFC3339()
      );

      const issuanceDate = Date.parse(credential.issuanceDate().toRFC3339());

      return issuanceDate > oldestIssuanceDate;
    };
  }

  generateNonce() {
    return Math.floor(Math.random() * Math.pow(2, 32)).toString();
  }
}

export default new ProofOfConcept();
