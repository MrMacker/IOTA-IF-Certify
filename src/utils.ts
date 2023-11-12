import { Client, SecretManager } from "@iota/sdk-wasm/node";
import { COIN_TYPE } from "./constants";

export abstract class Build<T, U> {
  protected state: Promise<T>;

  constructor(state: T | Promise<T>) {
    this.state = (async () => state)();
  }

  update(callback: (state: T) => Promise<T> | T): this {
    this.state = this.state.then(callback);
    return this;
  }

  finalize(callback: (state: T) => Promise<U> | U): Promise<U> {
    return this.state.then(callback);
  }
}

export async function deriveAddressFromMnemonic(
  network: string,
  mnemonic: string
) {
  // Use BIP32 to derive an address that can be controlled with the mnemonic.
  const addresses = await new SecretManager({
    mnemonic,
  }).generateEd25519Addresses({
    bech32Hrp: network,
    coinType: COIN_TYPE,
    accountIndex: 0,
    range: { start: 0, end: 1 },
  });

  // Only return the first address.
  return addresses[0];
}

export async function getTokensAvailable(client: Client, address: string) {
  const outputIdsResponse = await client.basicOutputIds([
    { address },
    { hasExpiration: false },
    { hasTimelock: false },
    { hasStorageDepositReturn: false },
  ]);
  const outputResponses = await client.getOutputs(outputIdsResponse.items);

  const tokensAvailable = outputResponses
    .map((outputResponse) => BigInt(outputResponse.output.amount))
    .reduce((sum, value) => sum + value, BigInt(0));

  return tokensAvailable;
}

export default {
  deriveAddressFromMnemonic,
  getTokensAvailable,
};
