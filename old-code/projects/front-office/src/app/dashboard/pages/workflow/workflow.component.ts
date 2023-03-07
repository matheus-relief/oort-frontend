import { Apollo } from 'apollo-angular';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ContentType,
  Step,
  SafeSnackBarService,
  Workflow,
  SafeUnsubscribeComponent,
} from '@safe/builder';
import {
  GetWorkflowByIdQueryResponse,
  GET_WORKFLOW_BY_ID,
} from './graphql/queries';
import { TranslateService } from '@ngx-translate/core';
import { takeUntil } from 'rxjs/operators';

/**
 * Workflow page.
 */
@Component({
  selector: 'app-workflow',
  templateUrl: './workflow.component.html',
  styleUrls: ['./workflow.component.scss'],
})
export class WorkflowComponent
  extends SafeUnsubscribeComponent
  implements OnInit
{
  /** Loading state of the page */
  public loading = true;
  /** Current workflow id */
  public id = '';
  /** Current workflow */
  public workflow?: Workflow;
  /** Current workflow steps */
  public steps: Step[] = [];
  /** Current step */
  public activeStep = 0;

  /**
   * Workflow page.
   *
   * @param apollo Apollo client
   * @param route Angular current route
   * @param snackBar Shared snackbar service
   * @param router Angular router
   * @param translate Angular translate service
   */
  constructor(
    private apollo: Apollo,
    private route: ActivatedRoute,
    private snackBar: SafeSnackBarService,
    private router: Router,
    private translate: TranslateService
  ) {
    super();
  }

  /**
   * Subscribes to the route to load the workflow accordingly.
   */
  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.loading = true;
      this.id = params.id;
      this.apollo
        .watchQuery<GetWorkflowByIdQueryResponse>({
          query: GET_WORKFLOW_BY_ID,
          variables: {
            id: this.id,
          },
        })
        .valueChanges.subscribe({
          next: ({ data, loading }) => {
            if (data.workflow) {
              this.workflow = data.workflow;
              this.steps = data.workflow.steps || [];
              this.loading = loading;
              if (this.steps.length > 0) {
                this.onOpenStep(0);
              }
            } else {
              this.snackBar.openSnackBar(
                this.translate.instant(
                  'common.notifications.accessNotProvided',
                  {
                    type: this.translate
                      .instant('common.workflow.one')
                      .toLowerCase(),
                    error: '',
                  }
                ),
                { error: true }
              );
            }
          },
          error: (err) => {
            this.snackBar.openSnackBar(err.message, { error: true });
          },
        });
    });
  }

  /**
   * Gets data from within selected step
   *
   * @param elementRef Ref to the stepper
   */
  onActivate(elementRef: any): void {
    if (elementRef.goToNextStep) {
      elementRef.goToNextStep.subscribe((event: any) => {
        if (event) {
          this.goToNextStep();
        }
      });
    }
  }

  /**
   * Navigates to the clicked step.
   *
   * @param index index of step to navigate to
   */
  public onOpenStep(index: number): void {
    if (index >= 0 && index < this.steps.length) {
      const step = this.steps[index];
      this.activeStep = index;
      if (step.type === ContentType.form) {
        this.router.navigate(['./' + step.type + '/' + step.id], {
          relativeTo: this.route,
        });
      } else {
        this.router.navigate(['./' + step.type + '/' + step.content], {
          relativeTo: this.route,
        });
      }
    } else {
      this.router.navigate(['./'], { relativeTo: this.route });
    }
  }

  /**
   * Navigates to the next step if possible and change selected step / index consequently
   */
  private goToNextStep(): void {
    if (this.activeStep + 1 < this.steps.length) {
      this.onOpenStep(this.activeStep + 1);
    } else if (this.activeStep + 1 === this.steps.length) {
      this.onOpenStep(0);
      this.snackBar.openSnackBar(
        this.translate.instant('models.workflow.notifications.goToStep', {
          step: this.steps[0].name,
        })
      );
    } else {
      this.snackBar.openSnackBar(
        this.translate.instant(
          'models.workflow.notifications.cannotGoToNextStep'
        ),
        { error: true }
      );
    }
  }
}