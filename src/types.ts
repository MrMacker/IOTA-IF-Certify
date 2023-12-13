import type {
  Credential,
  IotaDocument,
  IotaIdentityClient,
  Jwt,
  JwtCredentialValidator,
  JwtPresentationValidator,
  Resolver,
  Status,
  Storage,
} from "@iota/identity-wasm/node";
import { AliasOutput, Client } from "@iota/sdk-wasm/node";
import { Identity } from "./abstraction/identity";
import { PresentationRequest } from "./abstraction/presentation";

export type IdentityState = {
  client: IotaIdentityClient;
  address: string;
  storage: Storage;
  document: IotaDocument;
  mnemonic: string;
};

export type RevocationState = {
  issuer: Identity;
  output?: AliasOutput;
};

export type CredentialState = {
  issuer: Identity;
  subject?: Identity;
  properties: { [key: string]: string };
  verificationMethod?: string;
  revocationStatus?: Status;
};

export type Predicate = (credential: Credential) => boolean;

export type PresentationRequestOptions = {
  predicates?: Predicate[];
  nonce?: string;
};

export type PresentationResponseState = {
  holder: Identity;
  nonce?: string;
  verificationMethod?: string;
  credentials: Jwt[];
};

export type CreatePresentationValidationState = {
  request?: PresentationRequest;
  response?: Jwt;
  resolver: Resolver;
  presentationValidator: JwtPresentationValidator;
  credentialValidator: JwtCredentialValidator;
};

export type PresentationValidationOptions = {
  validated: boolean;
};

export type CoverStorageDeposit = (
  address: string,
  tokensRequired: bigint
) => Promise<void>;

export type IdentityWalletOptions = {
  client?: Client;
};

export type VerifierOptions = {
  client?: Client;
};
