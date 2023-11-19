import {
  Credential,
  RevocationBitmap,
  JwsSignatureOptions,
  Jwt,
} from "@iota/identity-wasm/node";
import { Identity } from "./identity";
import { CredentialState } from "./types";
import { Build } from "./utils";

export class BuildCredential extends Build<CredentialState, Jwt> {
  withSubject(subject: Identity) {
    return this.update((state) => {
      state.subject = subject;
      return state;
    });
  }

  withProperty(property: string, value: string) {
    return this.update((state) => {
      state.properties[property] = value;
      return state;
    });
  }

  withVerificationMethod(fragment: string) {
    return this.update((state) => {
      state.verificationMethod = fragment;
      return state;
    });
  }

  withRevocationStatus(revocationFragment: string, revocationIndex: number) {
    return this.update((state) => {
      const url = state.issuer.document.id().toUrl();
      url.setFragment(revocationFragment);

      const revocationStatus = {
        id: url.toString(),
        type: RevocationBitmap.type(),
        revocationBitmapIndex: revocationIndex.toString(),
      };

      state.revocationStatus = revocationStatus;

      return state;
    });
  }

  async create() {
    return this.finalize(async (state) => {
      const credential = new Credential({
        issuer: state.issuer.document.id(),
        credentialSubject: {
          id: state.subject.document.id(),
          ...state.properties,
        },
        credentialStatus: state.revocationStatus,
      });

      console.log("Credential:", JSON.stringify(credential.toJSON(), null, 2));

      const jwt = await state.issuer.document.createCredentialJwt(
        state.issuer.storage,
        state.verificationMethod,
        credential,
        new JwsSignatureOptions()
      );

      console.log("Credential token:", JSON.stringify(jwt.toJSON(), null, 2));

      return jwt;
    });
  }
}