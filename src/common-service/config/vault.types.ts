export interface VaultAuthResponse {
  request_id: string;
  lease_id: string;
  renewable: boolean;
  lease_duration: number;
  data: null;
  wrap_info: null;
  warnings: null;
  auth: VaultAuth;
}

export interface VaultAuth {
  client_token: string;
  accessor: string;
  policies: string[];
  token_policies: string[];
  metadata: VaultAuthMetadata;
  lease_duration: number;
  renewable: boolean;
  entity_id: string;
  token_type: string;
  orphan: boolean;
  mfa_requirement: null;
  num_uses: number;
}

export interface VaultAuthMetadata {
  role_name: string;
}

export interface VaultRecord {
  request_id: string;
  lease_id: string;
  renewable: boolean;
  lease_duration: number;
  data: VaultRecordData;
  wrap_info: null;
  warnings: null;
  auth: null;
}

export interface VaultRecordData {
  data: VaultRecordSubdata;
  metadata: VaultRecordMetadata;
}

export interface VaultRecordSubdata {
  [key: string]: string;
}

export interface VaultRecordMetadata {
  created_time: Date;
  custom_metadata: null;
  deletion_time: string;
  destroyed: boolean;
  version: number;
}
