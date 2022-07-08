import SurveyCreator from 'survey-creator';
import {
  Question,
  QuestionSelectBase,
  JsonMetadata,
  SurveyModel,
} from 'survey-angular';
import { DomService } from '../../services/dom.service';
import { SafeReferenceDataService } from '../../services/reference-data.service';
import { SafeReferenceDataDropdownComponent } from '../../components/reference-data-dropdown/reference-data-dropdown.component';

/** Custom type of questions for this widget */
interface CustomSelectBaseQuestion extends QuestionSelectBase {
  survey: SurveyModel;
  referenceData?: string;
  referenceDataDisplayField?: string;
  referenceDataFilterFilterFromQuestion?: string;
  referenceDataFilterForeignField?: string;
  referenceDataFilterFilterCondition?: string;
  referenceDataFilterLocalField?: string;
  referenceDataChoicesLoaded?: boolean;
}

/** Types that inherit from select-base question */
const SELECTABLE_TYPES = ['dropdown', 'checkbox', 'radiogroup', 'tagbox'];

/**
 * Custom definition for overriding the text question. Allowed support for dates.
 *
 * @param Survey Survey library
 * @param domService Shared DOM service
 * @param referenceDataService The reference Data service
 */
export const init = (
  Survey: any,
  domService: DomService,
  referenceDataService: SafeReferenceDataService
): void => {
  const widget = {
    name: 'select-base-widget',
    widgetIsLoaded: (): boolean => true,
    isFit: (question: Question): boolean =>
      SELECTABLE_TYPES.includes(question.getType()),
    init: (): void => {
      // declare the serializer
      const serializer: JsonMetadata = Survey.Serializer;

      // add properties
      serializer.addProperty('selectbase', {
        name: 'referenceData',
        category: 'Choices from Reference data',
        type: 'referenceDataDropdown',
        visibleIndex: 1,
      });

      serializer.addProperty('selectbase', {
        displayName: 'Display field',
        name: 'referenceDataDisplayField',
        category: 'Choices from Reference data',
        required: true,
        dependsOn: 'referenceData',
        visibleIf: (obj: any): boolean => obj?.referenceData,
        visibleIndex: 2,
        choices: (obj: any, choicesCallback: any) => {
          if (obj?.referenceData) {
            referenceDataService
              .loadReferenceData(obj.referenceData)
              .then((referenceData) =>
                choicesCallback(referenceData.fields || [])
              );
          }
        },
      });

      serializer.addProperty('selectbase', {
        displayName: 'Filter from question',
        name: 'referenceDataFilterFilterFromQuestion:question_selectbase',
        category: 'Choices from Reference data',
        dependsOn: 'referenceData',
        visibleIf: (obj: any): boolean => obj?.referenceData,
        visibleIndex: 3,
      });

      serializer.addProperty('selectbase', {
        displayName: 'Foreign field',
        name: 'referenceDataFilterForeignField',
        category: 'Choices from Reference data',
        required: true,
        dependsOn: 'referenceDataFilterFilterFromQuestion',
        visibleIf: (obj: null | CustomSelectBaseQuestion): boolean =>
          Boolean(obj?.referenceDataFilterFilterFromQuestion),
        visibleIndex: 4,
        choices: (
          obj: null | CustomSelectBaseQuestion,
          choicesCallback: (choices: any[]) => void
        ) => {
          if (obj?.referenceDataFilterFilterFromQuestion) {
            const foreignQuestion = obj.survey
              .getAllQuestions()
              .find(
                (q) => q.name === obj.referenceDataFilterFilterFromQuestion
              ) as CustomSelectBaseQuestion | undefined;
            if (foreignQuestion?.referenceData) {
              referenceDataService
                .loadReferenceData(foreignQuestion.referenceData)
                .then((referenceData) =>
                  choicesCallback(referenceData.fields || [])
                );
            }
          }
        },
      });

      serializer.addProperty('selectbase', {
        displayName: 'Filter condition',
        name: 'referenceDataFilterFilterCondition',
        category: 'Choices from Reference data',
        required: true,
        dependsOn: 'referenceDataFilterFilterFromQuestion',
        visibleIf: (obj: any): boolean =>
          obj?.referenceDataFilterFilterFromQuestion,
        visibleIndex: 5,
        choices: ['equals'],
      });

      serializer.addProperty('selectbase', {
        displayName: 'Local field',
        name: 'referenceDataFilterLocalField',
        category: 'Choices from Reference data',
        required: true,
        dependsOn: 'referenceDataFilterFilterFromQuestion',
        visibleIf: (obj: any): boolean =>
          obj?.referenceDataFilterFilterFromQuestion,
        visibleIndex: 6,
        choices: (obj: any, choicesCallback: any) => {
          if (obj?.referenceData) {
            referenceDataService
              .loadReferenceData(obj.referenceData)
              .then((referenceData) =>
                choicesCallback(referenceData.fields || [])
              );
          }
        },
      });

      const referenceDataEditor = {
        render: (editor: any, htmlElement: any) => {
          const question = editor.object;
          const dropdown = domService.appendComponentToBody(
            SafeReferenceDataDropdownComponent,
            htmlElement
          );
          const instance: SafeReferenceDataDropdownComponent =
            dropdown.instance;
          instance.referenceData = question.referenceData;
          instance.choice.subscribe((res) => editor.onChanged(res));
        },
      };
      SurveyCreator.SurveyPropertyEditorFactory.registerCustomEditor(
        'referenceDataDropdown',
        referenceDataEditor
      );

      console.log('init !!!');
    },
    isDefaultRender: true,
    afterRender: (
      question: CustomSelectBaseQuestion,
      el: HTMLElement
    ): void => {
      // if (
      //   question.referenceDataFilterFilterFromQuestion &&
      //   question.referenceDataFilterForeignField &&
      //   question.referenceDataFilterFilterCondition &&
      //   question.referenceDataFilterLocalField
      // ) {
      //   filter = {
      //     foreignQuestion: question.survey
      //       .getAllQuestions()
      //       .find(
      //         (x: any) =>
      //           x.name === question.referenceDataFilterFilterFromQuestion
      //       ),
      //     foreignField: question.referenceDataFilterForeignField,
      //     operator: question.referenceDataFilterFilterCondition,
      //     localField: question.referenceDataFilterLocalField,
      //   };
      // }
      // define a function to update the choices
      const updateChoices = () => {
        if (question.referenceData && question.referenceDataDisplayField) {
          referenceDataService
            .getChoices(
              question.referenceData,
              question.referenceDataDisplayField
            )
            .then((choices) => {
              question.choices = choices;
            });
        } else {
          question.choices = [];
        }
        question.referenceDataChoicesLoaded = true;
      };
      // init the choices
      if (!question.referenceDataChoicesLoaded && question.referenceData) {
        updateChoices();
      }
      // look on changes
      question.registerFunctionOnPropertyValueChanged('referenceData', () => {
        question.referenceDataDisplayField = undefined;
      });
      question.registerFunctionOnPropertyValueChanged(
        'referenceDataDisplayField',
        updateChoices
      );
      const foreignQuestion = question.survey
        .getAllQuestions()
        .find(
          (x: any) => x.name === question.referenceDataFilterFilterFromQuestion
        );
      console.log('after render', question.name);
    },
  };

  Survey.CustomWidgetCollection.Instance.addCustomWidget(
    widget,
    'customwidget'
  );
};
