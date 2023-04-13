import {
  AfterViewInit,
  Component,
  Inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import * as SurveyCreator from 'survey-creator';
import * as Survey from 'survey-angular';
import {
  MatLegacyDialogRef as MatDialogRef,
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
} from '@angular/material/legacy-dialog';
import { SafeFormService } from '../../../services/form/form.service';

/**
 * Data passed to initialize the filter builder
 */
interface DialogData {
  surveyStructure: any;
}

/**
 * Array containing the different types of questions.
 * Commented types are not yet implemented.
 */
const QUESTION_TYPES = [
  'text',
  'checkbox',
  'radiogroup',
  'dropdown',
  'tagbox',
  'comment',
  // 'rating',
  // 'ranking',
  // 'imagepicker',
  'boolean',
  'image',
  'html',
  // 'signaturepad',
  'expression',
  'matrix',
  'matrixdropdown',
  'matrixdynamic',
  'multipletext',
  'panel',
  'paneldynamic',
];

/**
 * Allowed properties for a core question in a child form.
 */
const CORE_QUESTION_ALLOWED_PROPERTIES = [
  'width',
  'maxWidth',
  'minWidth',
  'startWithNewLine',
  'indent',
  'page',
  'titleLocation',
  'descriptionLocation',
  'state',
  'defaultValue',
  'defaultValueExpression',
  'relatedName',
  'addRecord',
  'addTemplate',
  'Search resource table',
  'visible',
  'readOnly',
  'isRequired',
  'placeHolder',
  'enableIf',
  'visibleIf',
  'tooltip',
  'referenceData',
  'referenceDataDisplayField',
  'referenceDataFilterFilterFromQuestion',
  'referenceDataFilterForeignField',
  'referenceDataFilterFilterCondition',
  'referenceDataFilterLocalField',
];

/**
 * Filter builder component
 */
@Component({
  selector: 'safe-filter-builder',
  templateUrl: './filter-builder.component.html',
  styleUrls: ['./filter-builder.component.scss'],
})
export class SafeFilterBuilderComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  surveyCreator!: SurveyCreator.SurveyCreator;

  /**
   * Dialog component to build the filter
   *
   * @param formService Shared form service
   * @param dialogRef reference to the dialog component
   * @param data data passed to initialize the filter builder
   */
  constructor(
    private formService: SafeFormService,
    private dialogRef: MatDialogRef<SafeFilterBuilderComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  ngOnInit(): void {
    // Initialize survey creator instance without custom questions
    this.formService.setSurveyCreatorInstance({ customQuestions: false });
  }

  ngAfterViewInit(): void {
    this.setFormBuilder();
  }

  /**
   * Creates the form builder and sets up all the options.
   */
  private setFormBuilder() {
    const creatorOptions = {
      showEmbededSurveyTab: false,
      showJSONEditorTab: false,
      generateValidJSON: true,
      showTranslationTab: false,
      questionTypes: QUESTION_TYPES,
    };
    this.setCustomTheme();
    this.surveyCreator = new SurveyCreator.SurveyCreator(
      'dashboardSurveyCreatorContainer',
      creatorOptions
    );
    this.surveyCreator.text = this.data?.surveyStructure;
    this.surveyCreator.showToolbox = 'right';
    this.surveyCreator.showPropertyGrid = 'none';
    this.surveyCreator.haveCommercialLicense = true;
    this.surveyCreator.survey.showQuestionNumbers = 'off';
    this.surveyCreator.saveSurveyFunc = this.saveMySurvey;

    // Block core fields edition
    this.surveyCreator.onShowingProperty.add((sender: any, opt: any) => {
      const obj = opt.obj;
      if (!obj || !obj.page) {
        return;
      }
      // If it is a core field
      if (!CORE_QUESTION_ALLOWED_PROPERTIES.includes(opt.property.name)) {
        opt.canShow = false;
      }
    });
  }

  /**
   * Set a theme for the form builder depending on the environment
   */
  setCustomTheme(): void {
    Survey.StylesManager.applyTheme();
    SurveyCreator.StylesManager.applyTheme('default');
  }

  /**
   * Custom SurveyJS method, save the survey when edited.
   */
  saveMySurvey = () => {
    this.dialogRef.close(this.surveyCreator);
  };

  /**
   * Close modal
   */
  cancelSurveyCreation() {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    //Once we destroy the dashboard filter survey, set the survey creator with the custom questions config
    this.formService.setSurveyCreatorInstance();
  }
}
