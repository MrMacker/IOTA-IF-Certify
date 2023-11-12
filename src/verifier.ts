import {
  JwtPresentationValidator,
  JwtCredentialValidator,
  Resolver,
  IotaIdentityClient,
  EdDSAJwsVerifier,
} from "@iota/identity-wasm/node";
import { VerifierOptions } from "./types";
import {
  CreatePresentationRequest,
  CreatePresentationValidation,
} from "./presentation";
import { Client } from "@iota/sdk-wasm/node";
import { Build } from "./utils";

export class Verifier {
  private presentationValidator: JwtPresentationValidator;
  private credentialValidator: JwtCredentialValidator;
  private resolver: Resolver;

  constructor(options: VerifierOptions) {
    const client = new IotaIdentityClient(options.client);
    const verifier = new EdDSAJwsVerifier();

    this.presentationValidator = new JwtPresentationValidator(verifier);
    this.credentialValidator = new JwtCredentialValidator(verifier);
    this.resolver = new Resolver({ client });
  }

  static new() {
    return new BuildVerifier({});
  }

  generatePresentationRequest() {
    return new CreatePresentationRequest({
      predicates: [],
    });
  }

  generatePresentationValidation() {
    return new CreatePresentationValidation({
      resolver: this.resolver,
      presentationValidator: this.presentationValidator,
      credentialValidator: this.credentialValidator,
    });
  }
}

class BuildVerifier extends Build<VerifierOptions, Verifier> {
  withClient(client: Client) {
    return this.update((state) => {
      state.client = client;
      return state;
    });
  }

  create() {
    return this.finalize((state) => {
      return new Verifier(state);
    });
  }
}
