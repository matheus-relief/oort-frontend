import { gql } from 'apollo-angular';
import { Record } from '../../../models/record.model';
import { Form } from '../../../models/form.model';

// === GET RECORD BY ID ===

/** Graphql request for getting a record by its id */
export const GET_RECORD_BY_ID = gql`
  query GetRecordById($id: ID!) {
    record(id: $id) {
      id
      data
      createdAt
      modifiedAt
      createdBy {
        name
      }
      modifiedBy {
        name
      }
      form {
        id
        structure
        permissions {
          recordsUnicity
        }
      }
    }
  }
`;

/** Model for GetRecordByIdQueryResponse object */
export interface GetRecordByIdQueryResponse {
  loading: boolean;
  record: Record;
}

// === GET FORM BY ID ===

/** Graphql request for getting the form structure by its id */
export const GET_FORM_STRUCTURE = gql`
  query GetFormById($id: ID!) {
    form(id: $id) {
      id
      structure
    }
  }
`;

/** Model for GetFormByIdQueryResponse object */
export interface GetFormByIdQueryResponse {
  loading: boolean;
  form: Form;
}
