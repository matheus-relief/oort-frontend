import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import * as Survey from 'survey-angular';
import { renderCustomProperties } from '../survey/custom-properties';
import { DomService } from './dom.service';
import { EditRecordMutationResponse, EDIT_RECORD } from '../graphql/mutations';

/**
 * Shared form builder service.
 * Only used to add on complete expression to the survey.
 */
@Injectable({
  providedIn: 'root',
})
export class SafeFormBuilderService {
  /**
   * Constructor of the service
   *
   * @param domService The dom service
   */
  constructor(private domService: DomService, private apollo: Apollo) {}

  /**
   * Creates new survey from the structure and add on complete expression to it.
   *
   * @param structure form structure
   * @returns New survey
   */
  createSurvey(structure: string): Survey.Survey {
    const survey = new Survey.Model(structure);
    survey.onAfterRenderQuestion.add(renderCustomProperties(this.domService));
    // Logic management for resource and resources logic
    survey.onCompleting.add(() => {
      for (const page of survey.toJSON().pages) {
        for (const element of page.elements) {
          if (element.type === 'resources' || element.type === 'resource') {
            const regex = /{\s*(\b.*\b)\s*}\s*=\s*"(.*)"/g;
            for (const record of survey.getValue(element.name)) {
              let operation: any;
              if (
                element.newRecords &&
                element.newRecords.includes(record) &&
                element.afterAddingANewRecord
              ) {
                operation = regex.exec(element.afterAddingANewRecord);
              } else if (element.afterLinkingExistingRecord) {
                operation = regex.exec(element.afterLinkingExistingRecord);
              }
              this.updateRecord(record, operation);
            }
          }
        }
      }
    });
    // const onCompleteExpression = survey.toJSON().onCompleteExpression;
    // if (onCompleteExpression) {
    //   survey.onCompleting.add(() => {
    //     survey.runExpression(onCompleteExpression);
    //   });
    // }
    return survey;
  }

  /**
   * Updates the field with the specified information.
   *
   * @param id Id of the record to update
   * @param operation Operation to execute
   */
  private updateRecord(id: string, operation: any): void {
    if (id && operation) {
      this.apollo
        .mutate<EditRecordMutationResponse>({
          mutation: EDIT_RECORD,
          variables: {
            id,
            data: { [operation[1]]: operation[2] },
          },
        })
        .subscribe(() => {});
    }
  }
}
