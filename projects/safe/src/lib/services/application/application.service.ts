import { Apollo } from 'apollo-angular';
import { Inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { Role } from '../../models/user.model';
import { Page, ContentType } from '../../models/page.model';
import { Application } from '../../models/application.model';
import { Channel } from '../../models/channel.model';
import { SafeSnackBarService } from '../snackbar/snackbar.service';
import {
  AddPageMutationResponse,
  ADD_PAGE,
  AddRoleMutationResponse,
  ADD_ROLE,
  DeletePageMutationResponse,
  DELETE_PAGE,
  DeleteRoleMutationResponse,
  DELETE_ROLE,
  EditApplicationMutationResponse,
  EDIT_APPLICATION,
  EditRoleMutationResponse,
  EDIT_ROLE,
  AddChannelMutationResponse,
  ADD_CHANNEL,
  DeleteChannelMutationResponse,
  DELETE_CHANNEL,
  AddSubscriptionMutationResponse,
  ADD_SUBSCRIPTION,
  EditSubscriptionMutationResponse,
  EDIT_SUBSCRIPTION,
  DeleteSubscriptionMutationResponse,
  DELETE_SUBSCRIPTION,
  AddPositionAttributeCategoryMutationResponse,
  ADD_POSITION_ATTRIBUTE_CATEGORY,
  DeleteUsersFromApplicationMutationResponse,
  DELETE_USERS_FROM_APPLICATION,
  DeletePositionAttributeCategoryMutationResponse,
  DELETE_POSITION_ATTRIBUTE_CATEGORY,
  EditPositionAttributeCategoryMutationResponse,
  EDIT_POSITION_ATTRIBUTE_CATEGORY,
  EditChannelMutationResponse,
  EDIT_CHANNEL,
  ToggleApplicationLockMutationResponse,
  TOGGLE_APPLICATION_LOCK,
  duplicatePageMutationResponse,
  DUPLICATE_PAGE,
  AddTemplateMutationResponse,
  ADD_TEMPLATE,
  UpdateTemplateMutationResponse,
  UPDATE_TEMPLATE,
  DeleteTemplateMutationResponse,
  DELETE_TEMPLATE,
  UpdateDistributionListMutationResponse,
  UPDATE_DISTRIBUTION_LIST,
  AddDistributionListMutationResponse,
  ADD_DISTRIBUTION_LIST,
  DeleteDistributionListMutationResponse,
  DELETE_DISTRIBUTION_LIST,
} from './graphql/mutations';
import {
  GetApplicationByIdQueryResponse,
  GET_APPLICATION_BY_ID,
} from './graphql/queries';
import { PositionAttributeCategory } from '../../models/position-attribute-category.model';
import {
  ApplicationEditedSubscriptionResponse,
  ApplicationUnlockedSubscriptionResponse,
  APPLICATION_EDITED_SUBSCRIPTION,
  APPLICATION_UNLOCKED_SUBSCRIPTION,
} from './graphql/subscriptions';
import { SafeAuthService } from '../auth/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { Template } from '../../models/template.model';
import { DistributionList } from '../../models/distribution-list.model';
import { SafeDownloadService } from '../download/download.service';

/**
 * Shared application service. Handles events of opened application.
 */
@Injectable({
  providedIn: 'root',
})
export class SafeApplicationService {
  /** Current application */
  private application = new BehaviorSubject<Application | null>(null);
  /** @returns Current application as observable */
  get application$(): Observable<Application | null> {
    return this.application.asObservable();
  }

  /** Application query subscription */
  private applicationSubscription?: Subscription;
  /** Notifications query subscription */
  private notificationSubscription?: Subscription;
  /** Edit right subscription */
  private lockSubscription?: Subscription;
  /** Current environment */
  private environment: any;

  /** @returns Path to download application users */
  get usersDownloadPath(): string {
    const id = this.application.getValue()?.id;
    return `download/application/${id}/invite`;
  }
  /** @returns Path to upload application users */
  get usersUploadPath(): string {
    const id = this.application.getValue()?.id;
    return `upload/application/${id}/invite`;
  }

  /** @returns Edit status of the application */
  get isUnlocked(): boolean {
    const application = this.application.getValue();
    if (application) {
      if (application?.locked && !application.lockedByUser) {
        this.snackBar.openSnackBar(
          this.translate.instant('common.notifications.objectLocked', {
            name: application.name,
          })
        );
        return false;
      }
    }
    return true;
  }

  /** @returns Name of the current application */
  get name(): string {
    return this.application.value?.name || '';
  }

  /** @returns Current application's templates */
  get templates(): Template[] {
    return this.application.value?.templates || [];
  }

  /** @returns Current application's distributionList */
  get distributionLists(): DistributionList[] {
    return this.application.value?.distributionLists || [];
  }

  /**
   * Shared application service. Handles events of opened application.
   *
   * @param environment Current environment
   * @param apollo Apollo client
   * @param snackBar Shared snackbar service
   * @param authService Shared authentication service
   * @param router Angular router
   * @param translate Angular translate service
   * @param downloadService Shared download service
   */
  constructor(
    @Inject('environment') environment: any,
    private apollo: Apollo,
    private snackBar: SafeSnackBarService,
    private authService: SafeAuthService,
    private router: Router,
    private translate: TranslateService,
    private downloadService: SafeDownloadService
  ) {
    this.environment = environment;
  }

  /**
   * Gets the application from the database, using GraphQL.
   *
   * @param id application id
   * @param asRole Role to use to preview
   */
  loadApplication(id: string, asRole?: string): void {
    this.applicationSubscription = this.apollo
      .query<GetApplicationByIdQueryResponse>({
        query: GET_APPLICATION_BY_ID,
        variables: {
          id,
          asRole,
        },
      })
      .subscribe((res) => {
        // extend user abilities for application
        if (res.data.application)
          this.authService.extendAbilityForApplication(res.data.application);
        this.application.next(res.data.application);
        const application = this.application.getValue();
        if (res.data.application.locked) {
          if (!application?.lockedByUser) {
            this.snackBar.openSnackBar(
              this.translate.instant('common.notifications.objectLocked', {
                name: res.data.application.name,
              })
            );
          }
        }
      });
    this.notificationSubscription = this.apollo
      .subscribe<ApplicationEditedSubscriptionResponse>({
        query: APPLICATION_EDITED_SUBSCRIPTION,
        variables: {
          id,
        },
      })
      .subscribe(() => {
        const snackBar = this.snackBar.openSnackBar(
          this.translate.instant('models.application.notifications.updated'),
          {
            action: 'Reload',
            duration: 0,
          }
        );
        snackBar.onAction().subscribe(() => window.location.reload());
      });
    this.lockSubscription = this.apollo
      .subscribe<ApplicationUnlockedSubscriptionResponse>({
        query: APPLICATION_UNLOCKED_SUBSCRIPTION,
        variables: {
          id,
        },
      })
      .subscribe((res) => {
        if (res.data?.applicationUnlocked) {
          const application = this.application.getValue();
          const newApplication = {
            ...application,
            locked: res.data?.applicationUnlocked.locked,
            lockedByUser: res.data?.applicationUnlocked.lockedByUser,
          };
          this.application.next(newApplication);
        }
      });
  }

  /**
   * Leaves application and unsubscribe to application changes.
   */
  leaveApplication(): void {
    const application = this.application.getValue();
    this.application.next(null);
    this.applicationSubscription?.unsubscribe();
    this.notificationSubscription?.unsubscribe();
    this.lockSubscription?.unsubscribe();
    this.apollo
      .mutate<ToggleApplicationLockMutationResponse>({
        mutation: TOGGLE_APPLICATION_LOCK,
        variables: {
          id: application?.id,
          lock: false,
        },
      })
      .subscribe();
  }

  /**
   * Locks application edition.
   */
  lockApplication(): void {
    const application = this.application.getValue();
    this.apollo
      .mutate<ToggleApplicationLockMutationResponse>({
        mutation: TOGGLE_APPLICATION_LOCK,
        variables: {
          id: application?.id,
          lock: true,
        },
      })
      .subscribe((res) => {
        if (res.data?.toggleApplicationLock) {
          if (!res.data.toggleApplicationLock.lockedByUser) {
            const newApplication = {
              ...application,
              locked: res.data?.toggleApplicationLock.locked,
              lockedByUser: res.data?.toggleApplicationLock.lockedByUser,
            };
            this.application.next(newApplication);
          }
        }
      });
  }

  /**
   * Edits current application.
   *
   * @param value New application value.
   */
  editApplication(value: any): void {
    const application = this.application.getValue();
    if (application && this.isUnlocked) {
      this.apollo
        .mutate<EditApplicationMutationResponse>({
          mutation: EDIT_APPLICATION,
          variables: {
            id: application?.id,
            name: value.name,
            description: value.description,
            status: value.status,
          },
        })
        .subscribe((res) => {
          if (res.errors) {
            this.snackBar.openSnackBar(
              this.translate.instant('common.notifications.objectNotUpdated', {
                type: this.translate.instant('common.application.one'),
                error: res.errors[0].message,
              })
            );
          } else {
            this.snackBar.openSnackBar(
              this.translate.instant('common.notifications.objectUpdated', {
                type: this.translate
                  .instant('common.application.one')
                  .toLowerCase(),
                value: value.name,
              })
            );
            if (res.data?.editApplication) {
              const newApplication = {
                ...application,
                name: res.data.editApplication.name,
                description: res.data.editApplication.description,
                status: res.data.editApplication.status,
              };
              this.application.next(newApplication);
            }
          }
        });
    }
  }

  /**
   * Edits current permissions.
   *
   * @param newPermissions New application value.
   */
  editPermissions(newPermissions: any): void {
    const application = this.application.getValue();
    if (application && this.isUnlocked) {
      this.apollo
        .mutate<EditApplicationMutationResponse>({
          mutation: EDIT_APPLICATION,
          variables: {
            id: application?.id,
            permissions: newPermissions,
          },
        })
        .subscribe((res) => {
          if (res.data) {
            this.snackBar.openSnackBar(
              this.translate.instant('common.notifications.objectUpdated', {
                type: this.translate.instant('common.access').toLowerCase(),
                value: application?.name,
              })
            );
            if (res.data?.editApplication) {
              const newApplication = {
                ...application,
                permissions: res.data.editApplication.permissions,
              };
              this.application.next(newApplication);
            }
          }
        });
    }
  }

  /**
   * Updates the application status to published.
   */
  publish(): void {
    const application = this.application.getValue();
    if (application && this.isUnlocked) {
      this.apollo
        .mutate<EditApplicationMutationResponse>({
          mutation: EDIT_APPLICATION,
          variables: {
            id: application.id,
            status: 'active',
          },
        })
        .subscribe((res) => {
          if (res.data) {
            this.snackBar.openSnackBar(
              this.translate.instant(
                'models.application.notifications.published',
                {
                  value: res.data.editApplication.name,
                }
              )
            );
            this.router.navigate(['/applications']);
          }
        });
    }
  }

  /**
   * Deletes a page and the associated content.
   *
   * @param id id of the page
   */
  deletePage(id: string): void {
    const application = this.application.getValue();
    if (application && this.isUnlocked) {
      this.apollo
        .mutate<DeletePageMutationResponse>({
          mutation: DELETE_PAGE,
          variables: {
            id,
          },
        })
        .subscribe((res) => {
          if (res.data) {
            this.snackBar.openSnackBar(
              this.translate.instant('common.notifications.objectDeleted', {
                value: this.translate.instant('common.page.one'),
              })
            );
            const app = this.application.getValue();
            if (app) {
              const newApplication = {
                ...app,
                pages: app.pages?.filter(
                  (x) => x.id !== res.data?.deletePage.id
                ),
              };
              this.application.next(newApplication);
              this.router.navigate([`./applications/${app.id}`]);
            }
          } else {
            this.snackBar.openSnackBar(
              this.translate.instant('common.notifications.objectNotDeleted', {
                value: this.translate.instant('common.page.one').toLowerCase(),
                error: res.errors ? res.errors[0].message : '',
              }),
              { error: true }
            );
          }
        });
    }
  }

  /**
   * Reorders the pages.
   *
   * @param pages new pages order
   */
  reorderPages(pages: string[]): void {
    const application = this.application.getValue();
    if (application && this.isUnlocked) {
      this.apollo
        .mutate<EditApplicationMutationResponse>({
          mutation: EDIT_APPLICATION,
          variables: {
            id: application?.id,
            pages,
          },
        })
        .subscribe((res) => {
          this.snackBar.openSnackBar(
            this.translate.instant('common.notifications.objectReordered', {
              type: this.translate.instant('common.page.few').toLowerCase(),
            })
          );
          this.application.next({
            ...application,
            ...{ pages: res.data?.editApplication.pages },
          });
        });
    }
  }

  /**
   * Updates a specific page name in the opened application.
   *
   * @param page updated page
   */
  updatePageName(page: Page): void {
    const application = this.application.getValue();
    if (application && this.isUnlocked) {
      const newApplication = {
        ...application,
        pages: application.pages?.map((x) => {
          if (x.id === page.id) {
            x = { ...x, name: page.name };
          }
          return x;
        }),
      };
      this.application.next(newApplication);
    }
  }

  /**
   * Adds a new page to the opened application.
   *
   * @param page new page
   */
  addPage(page: any): void {
    const application = this.application.getValue();
    if (application && this.isUnlocked) {
      this.apollo
        .mutate<AddPageMutationResponse>({
          mutation: ADD_PAGE,
          variables: {
            type: page.type,
            content: page.content,
            application: application.id,
          },
        })
        .subscribe((res) => {
          if (res.data?.addPage) {
            this.snackBar.openSnackBar(
              this.translate.instant('common.notifications.objectCreated', {
                type: this.translate.instant('common.page.one').toLowerCase(),
                value: res.data.addPage.name,
              })
            );
            const content = res.data.addPage.content;
            const newApplication = {
              ...application,
              pages: application.pages?.concat([res.data.addPage]),
            };
            this.application.next(newApplication);
            this.router.navigate([
              page.type === ContentType.form
                ? `/applications/${application.id}/${page.type}/${res.data.addPage.id}`
                : `/applications/${application.id}/${page.type}/${content}`,
            ]);
          } else {
            this.snackBar.openSnackBar(
              this.translate.instant('common.notifications.objectNotCreated', {
                type: this.translate.instant('common.page.one').toLowerCase(),
                error: res.errors ? res.errors[0].message : '',
              }),
              { error: true }
            );
          }
        });
    }
  }

  /**
   * Duplicates page in the indicated application.
   *
   * @param pageId page id which will be duplicated
   * @param applicationId id of the application where it should be duplicated
   */
  duplicatePage(pageId: string, applicationId: string): void {
    this.apollo
      .mutate<duplicatePageMutationResponse>({
        mutation: DUPLICATE_PAGE,
        variables: {
          id: pageId,
          application: applicationId,
        },
      })
      .subscribe((res) => {
        if (res.errors) {
          this.snackBar.openSnackBar(
            this.translate.instant('common.notifications.objectNotCreated', {
              type: this.translate.instant('common.page.one').toLowerCase(),
              error: res.errors ? res.errors[0].message : '',
            }),
            { error: true }
          );
        } else {
          if (res.data?.duplicatePage) {
            const newPage = res.data.duplicatePage;
            this.translate.instant('common.notifications.objectCreated', {
              type: this.translate.instant('common.page.one').toLowerCase(),
              value: newPage?.name,
            });
            const application = this.application.getValue();
            if (applicationId === application?.id) {
              const newApplication = {
                ...application,
                pages: application.pages?.concat([newPage]),
              };
              this.application.next(newApplication);
            }
            this.router.navigate([
              `/applications/${applicationId}/${newPage?.type}/${newPage?.content}`,
            ]);
          }
        }
      });
  }

  /**
   * Adds a new role to the opened application.
   *
   * @param role new role
   */
  addRole(role: any): void {
    const application = this.application.getValue();
    if (application && this.isUnlocked) {
      this.apollo
        .mutate<AddRoleMutationResponse>({
          mutation: ADD_ROLE,
          variables: {
            title: role.title,
            application: application.id,
          },
        })
        .subscribe((res) => {
          if (res.data) {
            this.snackBar.openSnackBar(
              this.translate.instant('common.notifications.objectCreated', {
                type: this.translate.instant('common.role.one').toLowerCase(),
                value: role.title,
              })
            );
            const newApplication = {
              ...application,
              roles: application.roles?.concat([res.data.addRole]),
            };
            this.application.next(newApplication);
          }
        });
    }
  }

  /**
   * Edits an existing role.
   *
   * @param role role to edit
   * @param value new value
   */
  editRole(role: Role, value: any): void {
    const application = this.application.getValue();
    if (application && this.isUnlocked) {
      this.apollo
        .mutate<EditRoleMutationResponse>({
          mutation: EDIT_ROLE,
          variables: {
            id: role.id,
            permissions: value.permissions,
            channels: value.channels,
            title: value.title,
          },
        })
        .subscribe((res) => {
          if (res.data) {
            this.snackBar.openSnackBar(
              this.translate.instant('common.notifications.objectUpdated', {
                type: this.translate.instant('common.role.one').toLowerCase(),
                value: role.title,
              })
            );
            const newApplication: Application = {
              ...application,
              roles: application.roles?.map((x) => {
                if (x.id === role.id) {
                  x = {
                    ...x,
                    permissions: res.data?.editRole.permissions,
                    channels: res.data?.editRole.channels,
                  };
                }
                return x;
              }),
              channels: application.channels?.map((x) => {
                if (value.channels.includes(x.id)) {
                  x = {
                    ...x,
                    subscribedRoles: x.subscribedRoles?.concat([role]),
                  };
                } else if (
                  x.subscribedRoles?.some((subRole) => subRole.id === role.id)
                ) {
                  x = {
                    ...x,
                    subscribedRoles: x.subscribedRoles.filter(
                      (subRole) => subRole.id !== role.id
                    ),
                  };
                }
                return x;
              }),
            };
            this.application.next(newApplication);
          }
        });
    }
  }

  /**
   * Deletes an existing role.
   *
   * @param role Role to delete.
   */
  deleteRole(role: Role): void {
    const application = this.application.getValue();
    if (application && this.isUnlocked) {
      this.apollo
        .mutate<DeleteRoleMutationResponse>({
          mutation: DELETE_ROLE,
          variables: {
            id: role.id,
          },
        })
        .subscribe(() => {
          this.snackBar.openSnackBar(
            this.translate.instant('common.notifications.objectDeleted', {
              value: role.title,
            })
          );
          const newApplication = {
            ...application,
            roles: application.roles?.filter((x) => x.id !== role.id),
          };
          this.application.next(newApplication);
        });
    }
  }

  /**
   * Deletes users of the opened application. Users are only removed from the application, but are still active.
   *
   * @param ids user ids to remove
   * @param resolved status of the request
   */
  deleteUsersFromApplication(ids: any[], resolved: any): void {
    const application = this.application.getValue();
    if (application && this.isUnlocked) {
      this.apollo
        .mutate<DeleteUsersFromApplicationMutationResponse>({
          mutation: DELETE_USERS_FROM_APPLICATION,
          variables: {
            ids,
            application: application.id,
          },
        })
        .subscribe((res) => {
          if (res.data) {
            const deletedUsers = res.data.deleteUsersFromApplication.map(
              (x) => x.id
            );
            this.snackBar.openSnackBar(
              this.translate.instant('common.notifications.objectDeleted', {
                value: this.translate
                  .instant(
                    deletedUsers.length > 1
                      ? 'common.user.few'
                      : 'common.user.one'
                  )
                  .toLowerCase(),
              })
            );
          } else {
            this.snackBar.openSnackBar(
              this.translate.instant('common.notifications.objectNotDeleted', {
                value: this.translate
                  .instant(
                    ids.length > 1 ? 'common.user.few' : 'common.user.one'
                  )
                  .toLowerCase(),
                error: '',
              }),
              { error: true }
            );
          }
          resolved();
        });
    }
  }

  /**
   * Download application users
   *
   * @param type export type
   */
  downloadUsers(type: 'csv' | 'xlsx'): void {
    const application = this.application.getValue();
    if (application) {
      const fileName = `users_${application?.name}.${type}`;
      const path = `download/application/${application?.id}/users`;
      const queryString = new URLSearchParams({ type }).toString();
      this.downloadService.getFile(
        `${path}?${queryString}`,
        `text/${type};charset=utf-8;`,
        fileName
      );
    }
  }

  /**
   * Adds a new position to the opened application.
   *
   * @param category new category
   */
  addPositionAttributeCategory(category: any): void {
    const application = this.application.getValue();
    if (application && this.isUnlocked) {
      this.apollo
        .mutate<AddPositionAttributeCategoryMutationResponse>({
          mutation: ADD_POSITION_ATTRIBUTE_CATEGORY,
          variables: {
            title: category.title,
            application: application.id,
          },
        })
        .subscribe((res) => {
          if (res.data) {
            this.snackBar.openSnackBar(
              this.translate.instant('common.notifications.objectCreated', {
                type: this.translate
                  .instant('common.positionCategory.one')
                  .toLowerCase(),
                value: category.title,
              })
            );
            const newApplication: Application = {
              ...application,
              positionAttributeCategories:
                application.positionAttributeCategories?.concat([
                  res.data.addPositionAttributeCategory,
                ]),
            };
            this.application.next(newApplication);
          }
        });
    }
  }

  /**
   * Removes a position from the opened application.
   *
   * @param category category to remove
   */
  deletePositionAttributeCategory(category: PositionAttributeCategory): void {
    const application = this.application.getValue();
    if (application && this.isUnlocked) {
      this.apollo
        .mutate<DeletePositionAttributeCategoryMutationResponse>({
          mutation: DELETE_POSITION_ATTRIBUTE_CATEGORY,
          variables: {
            id: category.id,
            application: application.id,
          },
        })
        .subscribe((res) => {
          if (res.data) {
            this.snackBar.openSnackBar(
              this.translate.instant('common.notifications.objectDeleted', {
                value: category.title,
              })
            );
            const newApplication: Application = {
              ...application,
              positionAttributeCategories:
                application.positionAttributeCategories?.filter(
                  (x) => x.id !== res.data?.deletePositionAttributeCategory.id
                ),
            };
            this.application.next(newApplication);
          }
        });
    }
  }

  /**
   * Edits a position's name from the opened application.
   *
   * @param value new value
   * @param category category to edit
   */
  editPositionAttributeCategory(
    value: any,
    category: PositionAttributeCategory
  ): void {
    const application = this.application.getValue();
    if (application && this.isUnlocked) {
      this.apollo
        .mutate<EditPositionAttributeCategoryMutationResponse>({
          mutation: EDIT_POSITION_ATTRIBUTE_CATEGORY,
          variables: {
            id: category.id,
            application: application.id,
            title: value.title,
          },
        })
        .subscribe((res) => {
          if (res.errors) {
            this.snackBar.openSnackBar(
              this.translate.instant('common.errors.objectDuplicated', {
                type: this.translate
                  .instant('common.positionCategory.one')
                  .toLowerCase(),
                value: value.title,
              }),
              { error: true }
            );
          } else {
            this.snackBar.openSnackBar(
              this.translate.instant('common.notifications.objectUpdated', {
                type: this.translate.instant('common.positionCategory.one'),
                value: value.title,
              })
            );
            const newApplication: Application = {
              ...application,
              positionAttributeCategories:
                application.positionAttributeCategories?.map((pos) => {
                  if (pos.title === category.title) {
                    pos = {
                      ...pos,
                      title: res.data?.editPositionAttributeCategory.title,
                    };
                  }
                  return pos;
                }),
            };
            this.application.next(newApplication);
          }
        });
    }
  }

  /**
   * Adds a new channel to the application.
   *
   * @param channel new channel
   * @param channel.title title of the channel
   */
  addChannel(channel: { title: string }): void {
    const application = this.application.getValue();
    if (application && this.isUnlocked) {
      this.apollo
        .mutate<AddChannelMutationResponse>({
          mutation: ADD_CHANNEL,
          variables: {
            title: channel.title,
            application: application.id,
          },
        })
        .subscribe((res) => {
          if (res.data) {
            this.snackBar.openSnackBar(
              this.translate.instant('common.notifications.objectCreated', {
                type: this.translate
                  .instant('common.channel.one')
                  .toLowerCase(),
                value: channel.title,
              })
            );
            const newApplication: Application = {
              ...application,
              channels: application.channels?.concat([res.data.addChannel]),
            };
            this.application.next(newApplication);
          }
        });
    }
  }

  /**
   * Edits a channel's title.
   *
   * @param channel channel to edit
   * @param title new title
   */
  editChannel(channel: Channel, title: string): void {
    const application = this.application.getValue();
    this.apollo
      .mutate<EditChannelMutationResponse>({
        mutation: EDIT_CHANNEL,
        variables: {
          id: channel.id,
          title,
        },
      })
      .subscribe((res) => {
        if (res.data) {
          this.snackBar.openSnackBar(
            this.translate.instant('common.notifications.objectUpdated', {
              type: this.translate.instant('common.channel.one'),
              value: title,
            })
          );
          const newApplication: Application = {
            ...application,
            channels: application?.channels?.map((x) => {
              if (x.id === channel.id) {
                x = { ...x, title: res.data?.editChannel.title };
              }
              return x;
            }),
          };
          this.application.next(newApplication);
        }
      });
  }

  /**
   * Removes a channel from the system with all notifications linked to it.
   *
   * @param channel channel to delete
   */
  deleteChannel(channel: Channel): void {
    const application = this.application.getValue();
    if (application && this.isUnlocked) {
      this.apollo
        .mutate<DeleteChannelMutationResponse>({
          mutation: DELETE_CHANNEL,
          variables: {
            id: channel.id,
          },
        })
        .subscribe((res) => {
          if (res.data) {
            this.snackBar.openSnackBar(
              this.translate.instant('common.notifications.objectDeleted', {
                value: channel.title,
              })
            );
            const newApplication: Application = {
              ...application,
              channels: application.channels?.filter(
                (x) => x.id !== res.data?.deleteChannel.id
              ),
            };
            this.application.next(newApplication);
          }
        });
    }
  }

  /**
   * Adds a new subscription to the application.
   *
   * @param subscription new subscription
   * @param subscription.routingKey routing key of the subscription
   * @param subscription.title title of the subscription
   * @param subscription.convertTo the format in which we want to convert
   * @param subscription.channel the channel where to send subscriptions
   */
  addSubscription(subscription: {
    routingKey: string;
    title: string;
    convertTo: string;
    channel: string;
  }): void {
    const application = this.application.getValue();
    if (application && this.isUnlocked) {
      this.apollo
        .mutate<AddSubscriptionMutationResponse>({
          mutation: ADD_SUBSCRIPTION,
          variables: {
            application: application.id,
            routingKey: subscription.routingKey,
            title: subscription.title,
            convertTo: subscription.convertTo,
            channel: subscription.channel,
          },
        })
        .subscribe((res) => {
          if (res.data) {
            this.snackBar.openSnackBar(
              this.translate.instant('common.notifications.objectCreated', {
                type: this.translate
                  .instant('common.subscription.one')
                  .toLowerCase(),
                value: subscription.title,
              })
            );
            const newApplication: Application = {
              ...application,
              subscriptions: application.subscriptions?.concat([
                res.data.addSubscription,
              ]),
            };
            this.application.next(newApplication);
          }
        });
    }
  }

  /**
   * Deletes subscription from application.
   *
   * @param subscription subscription to delete
   */
  deleteSubscription(subscription: any): void {
    const application = this.application.getValue();
    if (application && this.isUnlocked) {
      this.apollo
        .mutate<DeleteSubscriptionMutationResponse>({
          mutation: DELETE_SUBSCRIPTION,
          variables: {
            applicationId: application.id,
            routingKey: subscription,
          },
        })
        .subscribe(() => {
          this.snackBar.openSnackBar(
            this.translate.instant('common.notifications.objectDeleted', {
              value: this.translate.instant('common.subscription.one'),
            })
          );
          const newApplication = {
            ...application,
            subscriptions: application.subscriptions?.filter(
              (sub) => sub.routingKey !== subscription
            ),
          };
          this.application.next(newApplication);
        });
    }
  }

  /**
   * Edits existing subscription.
   *
   * @param value new value
   * @param previousSubscription previous subscription
   */
  editSubscription(value: any, previousSubscription: any): void {
    const application = this.application.getValue();
    if (application && this.isUnlocked) {
      this.apollo
        .mutate<EditSubscriptionMutationResponse>({
          mutation: EDIT_SUBSCRIPTION,
          variables: {
            applicationId: application.id,
            title: value.title,
            routingKey: value.routingKey,
            convertTo: value.convertTo,
            channel: value.channel,
            previousSubscription,
          },
        })
        .subscribe((res) => {
          if (res.data) {
            const subscription = res.data.editSubscription;
            this.snackBar.openSnackBar(
              this.translate.instant('common.notifications.objectUpdated', {
                type: this.translate
                  .instant('common.subscription.one')
                  .toLowerCase(),
                value: value.title,
              })
            );
            const newApplication = {
              ...application,
              subscriptions: application.subscriptions?.map((sub) => {
                if (sub.routingKey === previousSubscription) {
                  sub = subscription;
                }
                return sub;
              }),
            };
            this.application.next(newApplication);
          }
        });
    }
  }

  /**
   * Moves to the first page of the application.
   */
  goToFirstPage(): void {
    const application = this.application.getValue();
    if (application?.pages && application.pages.length > 0) {
      const page = application.pages[0];
      if (this.environment.module === 'backoffice') {
        this.router.navigate([
          page.type === ContentType.form
            ? `applications/${application.id}/${page.type}/${page.id}`
            : `applications/${application.id}/${page.type}/${page.content}`,
        ]);
      } else {
        this.router.navigate([
          page.type === ContentType.form
            ? `/${page.type}/${page.id}`
            : `/${page.type}/${page.content}`,
        ]);
      }
    }
  }

  /**
   * Adds a new template to the application.
   *
   * @param template new template to be added
   * @param callback additional callback
   */
  addTemplate(template: Template, callback?: any): void {
    const application = this.application.getValue();
    if (application?.id) {
      this.apollo
        .mutate<AddTemplateMutationResponse>({
          mutation: ADD_TEMPLATE,
          variables: {
            application: application.id,
            template: {
              name: template.name,
              type: 'email',
              content: template.content,
            },
          },
        })
        .subscribe((res) => {
          if (res.data) {
            const newApplication: Application = {
              ...application,
              templates: [
                ...(application.templates || []),
                res.data.addTemplate,
              ],
            };

            this.application.next(newApplication);
            if (callback) callback(res.data.addTemplate);
          }
        });
    }
  }

  /**
   * Removes a template by its id.
   *
   * @param id template's id to be deleted
   */
  deleteTemplate(id: string): void {
    const application = this.application.getValue();
    if (application && this.isUnlocked) {
      this.apollo
        .mutate<DeleteTemplateMutationResponse>({
          mutation: DELETE_TEMPLATE,
          variables: {
            application: application.id,
            id,
          },
        })
        .subscribe((res) => {
          if (res.data) {
            const newApplication: Application = {
              ...application,
              templates: this.templates.filter((t) => t.id !== id),
            };
            this.application.next(newApplication);
          }
        });
    }
  }

  /**
   * Edits existing template.
   *
   * @param template new template to be added
   */
  editTemplate(template: Template): void {
    const application = this.application.getValue();
    if (application && this.isUnlocked) {
      this.apollo
        .mutate<UpdateTemplateMutationResponse>({
          mutation: UPDATE_TEMPLATE,
          variables: {
            application: application.id,
            id: template.id,
            template: {
              name: template.name,
              type: template.type,
              content: template.content,
            },
          },
        })
        .subscribe((res) => {
          if (res.data?.editTemplate) {
            const updatedTemplate = res.data.editTemplate;
            const newApplication: Application = {
              ...application,
              templates: application.templates?.map((t) => {
                if (t.id === template.id) {
                  t = updatedTemplate;
                }
                return t;
              }),
            };
            this.application.next(newApplication);
          }
        });
    }
  }

  /**
   * Edits existing distribution list.
   *
   * @param distributionList distribution list to modify
   */
  editDistributionList(distributionList: DistributionList): void {
    const application = this.application.getValue();
    if (application && this.isUnlocked) {
      this.apollo
        .mutate<UpdateDistributionListMutationResponse>({
          mutation: UPDATE_DISTRIBUTION_LIST,
          variables: {
            application: application.id,
            id: distributionList.id,
            distributionList: {
              name: distributionList.name,
              emails: distributionList.emails,
            },
          },
        })
        .subscribe((res) => {
          if (res.data?.editDistributionList) {
            const updatedDistributionList = res.data.editDistributionList;
            const newApplication: Application = {
              ...application,
              distributionLists: application.distributionLists?.map((dist) => {
                if (dist.id === distributionList.id) {
                  dist = updatedDistributionList;
                }
                return dist;
              }),
            };
            this.application.next(newApplication);
          }
        });
    }
  }

  /**
   * Add new distribution list
   *
   * @param distributionList new distribution list to be added
   * @param callback additional callback
   */
  addDistributionList(
    distributionList: DistributionList,
    callback?: any
  ): void {
    const application = this.application.getValue();
    if (application && this.isUnlocked) {
      this.apollo
        .mutate<AddDistributionListMutationResponse>({
          mutation: ADD_DISTRIBUTION_LIST,
          variables: {
            application: application.id,
            distributionList: {
              name: distributionList.name,
              emails: distributionList.emails,
            },
          },
        })
        .subscribe((res) => {
          if (res.data?.addDistributionList) {
            const newApplication: Application = {
              ...application,
              distributionLists: [
                ...(application.distributionLists || []),
                res.data.addDistributionList,
              ],
            };
            this.application.next(newApplication);
            if (callback) callback(res.data.addDistributionList);
          }
        });
    }
  }

  /**
   * Removes a distribution list by its id.
   *
   * @param id template's id to be deleted
   */
  deleteDistributionList(id: string): void {
    const application = this.application.getValue();
    if (application && this.isUnlocked) {
      this.apollo
        .mutate<DeleteDistributionListMutationResponse>({
          mutation: DELETE_DISTRIBUTION_LIST,
          variables: {
            application: application.id,
            id,
          },
        })
        .subscribe((res) => {
          if (res.data) {
            const newApplication: Application = {
              ...application,
              distributionLists: application.distributionLists?.filter(
                (dist) => dist.id !== id
              ),
            };
            this.application.next(newApplication);
          }
        });
    }
  }
}