export type Identifier = string | number;

export interface RaRecord<IdentifierType extends Identifier = Identifier>
  extends Record<string, any> {
  id: IdentifierType;
}

export interface GetListResult<RecordType extends RaRecord = any> {
  data: RecordType[];
  total?: number;
  pageInfo?: {
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  };
}
