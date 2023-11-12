import {
  Jwt,
  Presentation,
  JwsSignatureOptions,
  JwtPresentationOptions,
  FailFast,
  JwsVerificationOptions,
  JwtCredentialValidationOptions,
  JwtCredentialValidator,
  JwtPresentationValidationOptions,
  JwtPresentationValidator,
  SubjectHolderRelationship,
} from "@iota/identity-wasm/node";
import {
  CreatePresentationValidationState,
  Predicate,
  PresentationRequestOptions,
  PresentationResponseState,
  PresentationValidationOptions,
} from "./types";
import { Build } from "./utils";

export class PresentationRequest {
  nonce: string;
  predicates: Predicate[];

  constructor(options: PresentationRequestOptions) {
    Object.assign(this, options);
  }
}

export class CreatePresentationRequest extends Build<
  PresentationRequestOptions,
  PresentationRequest
> {
  withPredicate(predicate: Predicate) {
    return this.update((state) => {
      state.predicates.push(predicate);
      return state;
    });
  }

  withNonce(nonce: string) {
    return this.update((state) => {
      state.nonce = nonce;
      return state;
    });
  }

  create() {
    return this.finalize(async (state) => {
      return new PresentationRequest(state);
    });
  }
}

export class CreatePresentationResponse extends Build<
  PresentationResponseState,
  Jwt
> {
  withNonce(nonce: string) {
    return this.update((state) => {
      state.nonce = nonce;
      return state;
    });
  }

  withVerificationMethod(fragment: string) {
    return this.update((state) => {
      state.verificationMethod = fragment;
      return state;
    });
  }

  withCredential(credential: Jwt) {
    return this.update((state) => {
      state.credentials.push(credential);
      return state;
    });
  }

  create() {
    return this.finalize(async (state) => {
      if (!state.nonce) throw "Nonce must be set.";
      if (!state.verificationMethod) throw "Verification method must be set.";
      if (!state.credentials.length)
        throw "At least one credential must be added.";

      const presentation = new Presentation({
        holder: state.holder.document.id(),
        verifiableCredential: state.credentials,
      });

      console.log(
        "Presentation:",
        JSON.stringify(presentation.toJSON(), null, 2)
      );

      const jwt = await state.holder.document.createPresentationJwt(
        state.holder.storage,
        state.verificationMethod,
        presentation,
        new JwsSignatureOptions({ nonce: state.nonce }),
        new JwtPresentationOptions()
      );

      console.log("Presentation token:", JSON.stringify(jwt.toJSON(), null, 2));

      return jwt;
    });
  }
}

export class CreatePresentationValidation extends Build<
  CreatePresentationValidationState,
  PresentationValidation
> {
  withRequest(request: PresentationRequest) {
    return this.update((state) => {
      state.request = request;
      return state;
    });
  }

  withResponse(response: Jwt) {
    return this.update((state) => {
      state.response = response;
      return state;
    });
  }

  create() {
    return this.finalize(async (state) => {
      if (!state.request) throw "No request to validate.";
      if (!state.response) throw "No response to validate.";

      const holder = JwtPresentationValidator.extractHolder(
        state.response
      ).toString();
      const holderDocument = await state.resolver.resolve(holder);

      const validatePresentationOptions = new JwtPresentationValidationOptions({
        presentationVerifierOptions: new JwsVerificationOptions({
          nonce: state.request.nonce,
        }),
      });

      const validatedPresentation = state.presentationValidator.validate(
        state.response,
        holderDocument,
        validatePresentationOptions
      );

      const validateCredentialOptions = new JwtCredentialValidationOptions({
        subjectHolderRelationship: [
          holder,
          SubjectHolderRelationship.AlwaysSubject,
        ],
      });

      const credentials = await Promise.all(
        validatedPresentation
          .presentation()
          .verifiableCredential()
          .map((unknown) => {
            const credential = unknown.tryIntoJwt();
            if (!credential) throw "Credentials must be a JWT";
            return credential;
          })
          .map(async (credential) => {
            const issuer =
              JwtCredentialValidator.extractIssuerFromJwt(
                credential
              ).toString();
            const issuerDocument = await state.resolver.resolve(issuer);

            return state.credentialValidator
              .validate(
                credential,
                issuerDocument,
                validateCredentialOptions,
                FailFast.AllErrors
              )
              .credential();
          })
      );

      const validated = state.request.predicates.every((predicate) =>
        credentials.some(predicate)
      );

      console.log("Valid:", validated);

      return new PresentationValidation({ validated });
    });
  }
}

export class PresentationValidation {
  validated: boolean;

  constructor(options: PresentationValidationOptions) {
    Object.assign(this, options);
  }
}
