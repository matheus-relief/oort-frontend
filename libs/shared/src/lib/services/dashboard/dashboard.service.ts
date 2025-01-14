import { Inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SnackbarService } from '@oort-front/ui';
import {
  CreateDashboardWithContextMutationResponse,
  Dashboard,
  EditDashboardMutationResponse,
  WIDGET_TYPES,
} from '../../models/dashboard.model';
import {
  EditPageContextMutationResponse,
  PageContextT,
} from '../../models/page.model';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
import { Apollo } from 'apollo-angular';
import {
  EDIT_DASHBOARD,
  UPDATE_PAGE_CONTEXT,
  CREATE_DASHBOARD_WITH_CONTEXT,
} from './graphql/mutations';
import get from 'lodash/get';
import { GraphQLError } from 'graphql';

/**
 * Shared dashboard service. Handles dashboard events.
 */
@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  /** List of available widgets */
  public availableWidgets = WIDGET_TYPES;
  /** Current dashboard */
  private dashboard = new BehaviorSubject<Dashboard | null>(null);

  /** @returns Current dashboard as observable */
  get dashboard$(): Observable<Dashboard | null> {
    return this.dashboard.asObservable();
  }

  /**
   * Shared dashboard service. Handles dashboard events.
   *
   * @param environment environment in which we run the application
   * @param apollo Apollo client
   * @param snackBar Shared snackbar service
   * @param translate Angular translate service
   */
  constructor(
    @Inject('environment') environment: any,
    private apollo: Apollo,
    private snackBar: SnackbarService,
    private translate: TranslateService
  ) {
    this.availableWidgets = WIDGET_TYPES.filter((widget) =>
      get(environment, 'availableWidgets', []).includes(widget.id)
    );
  }

  /**
   * Handle mutations messages response from the application, pages and steps
   *
   * @param errors errors from the access mutation response if any
   * @param type content type
   * @param value value of the content edited
   */
  handleEditionMutationResponse(
    errors: readonly GraphQLError[] | undefined,
    type: string,
    value?: string
  ) {
    if (errors) {
      this.snackBar.openSnackBar(
        this.translate.instant('common.notifications.objectNotUpdated', {
          type,
          error: errors ? errors[0].message : '',
        }),
        { error: true }
      );
    } else {
      this.snackBar.openSnackBar(
        this.translate.instant('common.notifications.objectUpdated', {
          type,
          value: value ?? '',
        })
      );
    }
  }

  /**
   * Opens a new dashboard.
   *
   * @param dashboard dashboard to open.
   */
  openDashboard(dashboard: Dashboard): void {
    this.dashboard.next(dashboard);
  }

  /**
   * Closes the dashboard.
   */
  closeDashboard(): void {
    this.dashboard.next(null);
  }

  /**
   * Finds the settings component from the widget.
   *
   * @param widget widget to get settings of.
   * @returns Widget settings template.
   */
  public findSettingsTemplate(widget: any): any {
    const availableWidget = this.availableWidgets.find(
      (x) => x.component === widget.component
    );
    return availableWidget && availableWidget.settingsTemplate
      ? availableWidget.settingsTemplate
      : null;
  }

  /**
   * Updates the context of the page.
   *
   * @param context The new context of the page
   * @returns promise the mutation result
   */
  public updateContext(context: PageContextT) {
    const dashboard = this.dashboard.getValue();
    if (!dashboard?.page?.id) return;

    const res = firstValueFrom(
      this.apollo.mutate<EditPageContextMutationResponse>({
        mutation: UPDATE_PAGE_CONTEXT,
        variables: {
          id: dashboard.page.id,
          context,
        },
      })
    );

    res.then(({ data }) => {
      if (data) {
        this.dashboard.next({
          ...dashboard,
          page: {
            ...dashboard.page,
            context,
            contentWithContext: data.editPageContext.contentWithContext,
          },
        });
      }
    });

    return res;
  }

  /**
   * Duplicates a dashboard and adds context to it.
   *
   * @param page Page to copy content from
   * @param context The type of context to be added to the dashboard
   * @param id The id of the context to be added to the dashboard
   * @returns The newly created dashboard
   */
  public createDashboardWithContext(
    page: string,
    context: 'element' | 'record',
    id: string | number
  ) {
    return firstValueFrom(
      this.apollo.mutate<CreateDashboardWithContextMutationResponse>({
        mutation: CREATE_DASHBOARD_WITH_CONTEXT,
        variables: {
          page,
          [context]: id,
        },
      })
    );
  }

  /**
   * Edit dashboard name
   *
   * @param name new name
   * @param callback callback method
   */
  public editName(name: string, callback?: any): void {
    const dashboard = this.dashboard.getValue();
    if (!dashboard?.id) return;
    this.apollo
      .mutate<EditDashboardMutationResponse>({
        mutation: EDIT_DASHBOARD,
        variables: {
          id: dashboard.id,
          name,
        },
      })
      .subscribe(() => {
        if (callback) callback();
      });
  }

  /**
   * Saves the buttons of the dashboard.
   *
   * @param buttons Button actions to save
   */
  public saveDashboardButtons(buttons: Dashboard['buttons']) {
    const dashboard = this.dashboard.getValue();
    if (!dashboard?.id) return;
    buttons = buttons || [];

    this.apollo
      .mutate<EditDashboardMutationResponse>({
        mutation: EDIT_DASHBOARD,
        variables: {
          id: dashboard.id,
          buttons,
        },
      })
      .subscribe(() => {
        this.dashboard.next({
          ...dashboard,
          buttons,
        });
      });
  }

  /**
   * Edit the dashboard's grid options.
   *
   * @param gridOptions new grid options
   * @param callback callback method
   */
  editGridOptions(gridOptions: any, callback?: any): void {
    const dashboard = this.dashboard.getValue();
    if (!dashboard?.id) return;
    this.apollo
      .mutate<EditDashboardMutationResponse>({
        mutation: EDIT_DASHBOARD,
        variables: {
          id: dashboard.id,
          gridOptions,
        },
      })
      .subscribe(({ errors, data }) => {
        this.handleEditionMutationResponse(
          errors,
          this.translate.instant('common.page.one')
        );
        if (!errors && data) {
          this.dashboard.next({
            ...dashboard,
            gridOptions,
          });
          if (callback) callback();
        }
      });
  }
}
