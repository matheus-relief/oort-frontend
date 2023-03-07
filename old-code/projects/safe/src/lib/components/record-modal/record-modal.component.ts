import { Apollo } from 'apollo-angular';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  ViewChild,
} from '@angular/core';
import {
  MatLegacyDialogRef as MatDialogRef,
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
  MatLegacyDialog as MatDialog,
} from '@angular/material/legacy-dialog';
import { Form } from '../../models/form.model';
import { Record } from '../../models/record.model';
import * as Survey from 'survey-angular';
import {
  GetRecordByIdQueryResponse,
  GET_RECORD_BY_ID,
  GetFormByIdQueryResponse,
  GET_FORM_STRUCTURE,
} from './graphql/queries';
import addCustomFunctions from '../../utils/custom-functions';
import { SafeRestService } from '../../services/rest/rest.service';
import { SafeAuthService } from '../../services/auth/auth.service';
import { SafeConfirmService } from '../../services/confirm/confirm.service';
import { EDIT_RECORD, EditRecordMutationResponse } from './graphql/mutations';
import { SafeSnackBarService } from '../../services/snackbar/snackbar.service';
import { SafeFormBuilderService } from '../../services/form-builder/form-builder.service';
import { RecordHistoryModalComponent } from '../record-history-modal/record-history-modal.component';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import isEqual from 'lodash/isEqual';

/**
 * Interface that describes the structure of the data that will be shown in the dialog
 */
interface DialogData {
  recordId: string;
  compareTo?: any;
  canUpdate?: boolean;
  template?: string;
}

/**
 * Component used to display a modal to modify a record
 */
@Component({
  selector: 'safe-record-modal',
  templateUrl: './record-modal.component.html',
  styleUrls: ['./record-modal.component.scss'],
})
export class SafeRecordModalComponent implements AfterViewInit {
  // === DATA ===
  public loading = true;
  public form?: Form;
  public record: Record = {};
  public modifiedAt: Date | null = null;
  public selectedTabIndex = 0;
  public survey!: Survey.SurveyModel;
  public surveyNext?: Survey.SurveyModel;
  private pages = new BehaviorSubject<any[]>([]);
  public canEdit: boolean | undefined = false;

  @ViewChild('formContainer', { static: false })
  formContainer!: ElementRef;
  @ViewChild('formContainerNext', { static: false })
  formContainerNext!: ElementRef;

  environment: any;

  /**
   * Getter for the different pages of the form
   *
   * @returns The pages as an observable
   */
  public get pages$(): Observable<any[]> {
    return this.pages.asObservable();
  }

  /**
   * The constructor function is a special function that is called when a new instance of the class is
   * created.
   *
   * @param dialogRef This is the reference to the dialog that is being opened.
   * @param data This is the data that is passed to the modal when it is opened.
   * @param apollo This is the Apollo client that we'll use to make GraphQL requests.
   * @param dialog This is the Material dialog service
   * @param restService This is the service that is used to make http requests.
   * @param authService This is the service that handles the authentication of the user
   * @param snackBar This is the service that allows you to display a snackbar message to the user.
   * @param formBuilderService This is the service that will be used to build forms.
   * @param confirmService This is the service that will be used to display confirm window.
   * @param translate This is the service that allows us to translate the text in the modal.
   */
  constructor(
    public dialogRef: MatDialogRef<SafeRecordModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private apollo: Apollo,
    public dialog: MatDialog,
    private restService: SafeRestService,
    private authService: SafeAuthService,
    private snackBar: SafeSnackBarService,
    private formBuilderService: SafeFormBuilderService,
    private confirmService: SafeConfirmService,
    private translate: TranslateService
  ) {}

  async ngAfterViewInit(): Promise<void> {
    this.canEdit = this.data.canUpdate;

    Survey.StylesManager.applyTheme();
    const promises: Promise<
      GetFormByIdQueryResponse | GetRecordByIdQueryResponse | void
    >[] = [];
    // Fetch structure from template if needed
    if (this.data.template) {
      promises.push(
        firstValueFrom(
          this.apollo.query<GetFormByIdQueryResponse>({
            query: GET_FORM_STRUCTURE,
            variables: {
              id: this.data.template,
            },
          })
        ).then(({ data }) => {
          this.form = data.form;
        })
      );
    }
    // Fetch record data
    promises.push(
      firstValueFrom(
        this.apollo.query<GetRecordByIdQueryResponse>({
          query: GET_RECORD_BY_ID,
          variables: {
            id: this.data.recordId,
          },
        })
      ).then(({ data }) => {
        this.record = data.record;
        this.modifiedAt = this.record.modifiedAt || null;
        if (!this.data.template) {
          this.form = this.record.form;
        }
      })
    );
    await Promise.all(promises);
    // INIT SURVEY
    addCustomFunctions(Survey, this.authService, this.apollo, this.record);
    this.survey = this.formBuilderService.createSurvey(
      this.form?.structure || '',
      this.form?.metadata,
      this.record
    );
    this.survey.onDownloadFile.add((survey: Survey.SurveyModel, options: any) =>
      this.onDownloadFile(survey, options)
    );
    this.survey.onCurrentPageChanged.add((survey: Survey.SurveyModel) => {
      this.selectedTabIndex = survey.currentPageNo;
    });
    this.survey.onUpdateQuestionCssClasses.add(
      (survey: Survey.SurveyModel, options: any) => this.onSetCustomCss(options)
    );
    this.survey.data = this.record.data;
    this.survey.mode = 'display';
    this.survey.showNavigationButtons = 'none';
    this.survey.focusFirstQuestionAutomatic = false;
    this.survey.showProgressBar = 'off';
    this.survey.render(this.formContainer.nativeElement);
    setTimeout(() => {}, 100);
    this.setPages();
    this.survey.onDownloadFile.add((survey: Survey.SurveyModel, options: any) =>
      this.onDownloadFile(survey, options)
    );
    if (this.data.compareTo) {
      this.surveyNext = this.formBuilderService.createSurvey(
        this.form?.structure || '',
        this.form?.metadata,
        this.record
      );
      this.surveyNext.data = this.data.compareTo.data;
      this.surveyNext.mode = 'display';
      this.surveyNext.showNavigationButtons = 'none';
      this.surveyNext.focusFirstQuestionAutomatic = false;
      this.surveyNext.showProgressBar = 'off';
      // Set list of updated questions
      const updatedQuestions: string[] = [];
      const allQuestions = [this.surveyNext.data, this.survey.data].reduce(
        (keys, object) => keys.concat(Object.keys(object)),
        []
      );
      for (const question of allQuestions) {
        const valueNext = this.surveyNext.data[question];
        const value = this.survey.data[question];
        if (!isEqual(value, valueNext)) {
          updatedQuestions.push(question);
        }
      }
      this.survey.onAfterRenderQuestion.add(
        (survey: Survey.SurveyModel, options: any): void => {
          if (updatedQuestions.includes(options.question.valueName)) {
            options.htmlElement.style.background = '#b2ebbf';
          }
        }
      );
      this.surveyNext.onAfterRenderQuestion.add(
        (survey: Survey.SurveyModel, options: any): void => {
          if (updatedQuestions.includes(options.question.valueName)) {
            options.htmlElement.style.background = '#EBB2B2';
          }
        }
      );
      this.surveyNext.onUpdateQuestionCssClasses.add(
        (survey: Survey.SurveyModel, options: any) =>
          this.onSetCustomCss(options)
      );
      this.surveyNext.render(this.formContainerNext.nativeElement);
    }
    this.loading = false;
  }

  /**
   * Shows a page of the form
   *
   * @param i Index of the page to show
   */
  public onShowPage(i: number): void {
    this.survey.currentPageNo = i;
    this.selectedTabIndex = i;
    if (this.data.compareTo && this.surveyNext) {
      this.surveyNext.currentPageNo = i;
    }
  }

  /**
   * Download the file.
   *
   * @param survey The survey from which we download the file
   * @param options Options regarding the download
   */
  private onDownloadFile(survey: Survey.SurveyModel, options: any): void {
    if (
      options.content.indexOf('base64') !== -1 ||
      options.content.indexOf('http') !== -1
    ) {
      options.callback('success', options.content);
    } else {
      const xhr = new XMLHttpRequest();
      xhr.open(
        'GET',
        `${this.restService.apiUrl}/download/file/${options.content}`
      );
      xhr.setRequestHeader(
        'Authorization',
        `Bearer ${localStorage.getItem('idtoken')}`
      );
      xhr.onloadstart = () => {
        xhr.responseType = 'blob';
      };
      xhr.onload = () => {
        const file = new File([xhr.response], options.fileValue.name, {
          type: options.fileValue.type,
        });
        const reader = new FileReader();
        reader.onload = (e) => {
          options.callback('success', e.target?.result);
        };
        reader.readAsDataURL(file);
      };
      xhr.send();
    }
  }

  /**
   * Handles the edition of the record and closes the dialog
   */
  public onEdit(): void {
    this.dialogRef.close(true);
  }

  /**
   * Set the pages of the form
   */
  private setPages(): void {
    const pages = [];
    if (this.survey) {
      for (const page of this.survey.pages) {
        if (page.isVisible) {
          pages.push(page);
        }
      }
    }
    this.pages.next(pages);
  }

  /**
   * Closes the modal without sending any data.
   */
  onClose(): void {
    this.dialogRef.close();
  }

  /**
   * Open a dialog modal to confirm the recovery of data
   *
   * @param record The record whose data we need to recover
   * @param version The version to recover
   */
  private confirmRevertDialog(record: any, version: any): void {
    // eslint-disable-next-line radix
    const date = new Date(parseInt(version.createdAt, 0));
    const formatDate = `${date.getDate()}/${
      date.getMonth() + 1
    }/${date.getFullYear()}`;
    const dialogRef = this.confirmService.openConfirmModal({
      title: this.translate.instant('components.record.recovery.title'),
      content: this.translate.instant(
        'components.record.recovery.confirmationMessage',
        { date: formatDate }
      ),
      confirmText: this.translate.instant('components.confirmModal.confirm'),
      confirmColor: 'primary',
    });
    dialogRef.afterClosed().subscribe((value) => {
      if (value) {
        this.apollo
          .mutate<EditRecordMutationResponse>({
            mutation: EDIT_RECORD,
            variables: {
              id: record.id,
              version: version.id,
            },
          })
          .subscribe({
            next: (errors) => {
              if (errors) {
                this.snackBar.openSnackBar(
                  this.translate.instant(
                    'common.notifications.dataNotRecovered'
                  ),
                  { error: true }
                );
              } else {
                this.snackBar.openSnackBar(
                  this.translate.instant('common.notifications.dataRecovered')
                );
              }
              this.dialogRef.close();
            },
            error: (err) => {
              this.snackBar.openSnackBar(err.message, { error: true });
            },
          });
      }
    });
  }

  /**
   * Opens the history of the record in a modal.
   */
  public onShowHistory(): void {
    this.dialog.open(RecordHistoryModalComponent, {
      data: {
        id: this.record.id,
        revert: (version: any) =>
          this.confirmRevertDialog(this.record, version),
      },
      autoFocus: false,
    });
  }

  /**
   * Add custom CSS classes to the survey elements.
   *
   * @param options survey options.
   */
  private onSetCustomCss(options: any): void {
    const classes = options.cssClasses;
    classes.content += 'safe-qst-content';
  }
}