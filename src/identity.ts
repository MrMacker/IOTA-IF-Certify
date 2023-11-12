import {
  IotaIdentityClient,
  JwkMemStore,
  KeyIdMemStore,
  IotaDocument,
  JwsAlgorithm,
  MethodScope,
  RevocationBitmap,
  Storage,
} from "@iota/identity-wasm/node";
import { Client, Utils } from "@iota/sdk-wasm/node";
import { BuildCredential } from "./credential";
import { CreatePresentationResponse } from "./presentation";
import {
  IdentityWalletOptions,
  IdentityState,
  CoverStorageDeposit,
} from "./types";
import { Build, deriveAddressFromMnemonic } from "./utils";

export class IdentityWallet {
  private client: IotaIdentityClient;

  constructor(options: IdentityWalletOptions) {
    this.client = new IotaIdentityClient(options.client);
  }

  static new() {
    return new BuildIdentityWallet({});
  }

  generateIdentity() {
    const action = async () => {
      const network = await this.client.getNetworkHrp();
      const mnemonic = Utils.generateMnemonic();

      const storage = new Storage(new JwkMemStore(), new KeyIdMemStore());
      const address = await deriveAddressFromMnemonic(network, mnemonic);
      const document = new IotaDocument(network);

      console.log("Address:", address);

      return {
        client: this.client,
        mnemonic,
        storage,
        address,
        document,
      };
    };

    const state = action();
    return new BuildIdentity(state);
  }
}

class BuildIdentityWallet extends Build<IdentityWalletOptions, IdentityWallet> {
  withClient(client: Client) {
    return this.update((state) => {
      state.client = client;
      return state;
    });
  }

  create() {
    return this.finalize((state) => {
      return new IdentityWallet(state);
    });
  }
}

class BuildIdentity extends Build<IdentityState, Identity> {
  withVerificationMethod(fragment: string) {
    return this.update(async (state) => {
      await state.document.generateMethod(
        state.storage,
        JwkMemStore.ed25519KeyType(),
        JwsAlgorithm.EdDSA,
        fragment,
        MethodScope.VerificationMethod()
      );

      return state;
    });
  }

  withRevocationService(fragment: string) {
    return this.update(async (state) => {
      const revocationBitmap = new RevocationBitmap();
      const serviceUrl = state.document.id().join(`#${fragment}`);
      const service = revocationBitmap.toService(serviceUrl);
      state.document.insertService(service);

      return state;
    });
  }

  withStorageDepositCovered(coverStorageDeposit: CoverStorageDeposit) {
    return this.update(async (state) => {
      const output = await state.client.newDidOutput(
        Utils.parseBech32Address(state.address),
        state.document
      );
      const rentStructure = await state.client.getRentStructure();
      const tokensRequired = Utils.computeStorageDeposit(output, rentStructure);

      await coverStorageDeposit(state.address, tokensRequired);

      return state;
    });
  }

  async create() {
    return this.finalize(async (state) => {
      const output = await state.client.newDidOutput(
        Utils.parseBech32Address(state.address),
        state.document
      );

      state.document = await state.client.publishDidOutput(
        { mnemonic: state.mnemonic },
        output
      );

      console.log("DID:", state.document.id().toString());

      return new Identity(state);
    });
  }
}

export class Identity {
  client: IotaIdentityClient;
  address: string;
  storage: Storage;
  document: IotaDocument;
  mnemonic: string;

  constructor(state: IdentityState) {
    Object.assign(this, state);
  }

  generateCredential() {
    const action = async () => {
      const state = {
        issuer: this,
        properties: {},
      };

      return state;
    };

    const state = action();
    return new BuildCredential(state);
  }

  generatePresentationResponse() {
    return new CreatePresentationResponse({
      holder: this,
      credentials: [],
    });
  }
}
