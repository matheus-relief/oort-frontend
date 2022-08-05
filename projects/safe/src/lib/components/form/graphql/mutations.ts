import { gql } from 'apollo-angular';
import { Record } from '../../../models/record.model';

// === ADD RECORD ===

/** Graphql request for adding a new record to a form */
export const ADD_RECORD = gql`
  mutation addRecord($form: ID!, $data: JSON!, $display: Boolean) {
    addRecord(form: $form, data: $data) {
      id
      createdAt
      modifiedAt
      createdBy {
        name
      }
      data(display: $display)
      form {
        uniqueRecord {
          id
          modifiedAt
          createdBy {
            name
          }
          data
        }
      }
    }
  }
`;

/** Model for AddRecordMutationResponse object */
export interface AddRecordMutationResponse {
  loading: boolean;
  addRecord: Record;
}

// === EDIT RECORD ===

/** Graphql request for editing a record by its id */
export const EDIT_RECORD = gql`
  mutation editRecord(
    $id: ID!
    $data: JSON
    $version: ID
    $template: ID
    $display: Boolean
    $lang: String
  ) {
    editRecord(
      id: $id
      data: $data
      version: $version
      template: $template
      lang: $lang
    ) {
      id
      incrementalId
      data(display: $display)
      createdAt
      modifiedAt
      createdBy {
        name
      }
      validationErrors {
        question
        errors
      }
    }
  }
`;

/** Model for EditRecordMutationResponse object */
export interface EditRecordMutationResponse {
  loading: boolean;
  editRecord: Record;
}

// === UPLOAD FILE ===

/** Graphql request for uploading a file to a form */
export const UPLOAD_FILE = gql`
  mutation uploadFile($file: Upload!, $form: ID!) {
    uploadFile(file: $file, form: $form)
  }
`;

/** Model for UploadFileMutationResponse object */
export interface UploadFileMutationResponse {
  loading: boolean;
  uploadFile: string;
}