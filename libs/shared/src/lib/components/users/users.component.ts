import { Apollo } from 'apollo-angular';
import {
  Component,
  Input,
  ViewChild,
  TemplateRef,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import {
  User,
  Role,
  AddUsersMutationResponse,
  DeleteUsersMutationResponse,
} from '../../models/user.model';
import { DELETE_USERS, ADD_USERS } from './graphql/mutations';
import { ConfirmService } from '../../services/confirm/confirm.service';
import { SelectionModel } from '@angular/cdk/collections';
import { DownloadService } from '../../services/download/download.service';
import { TranslateService } from '@ngx-translate/core';
import { Router, ActivatedRoute } from '@angular/router';
import { SnackbarService } from '@oort-front/ui';
import { takeUntil } from 'rxjs';
import { UnsubscribeComponent } from '../utils/unsubscribe/unsubscribe.component';
import uniqBy from 'lodash/uniqBy';
import { FormBuilder } from '@angular/forms';

/**
 * A component to display the list of users
 */
@Component({
  selector: 'shared-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent extends UnsubscribeComponent implements OnChanges {
  // === INPUT DATA ===
  /** List of users */
  @Input() users: Array<User> = new Array<User>();
  /** List of roles */
  @Input() roles: Role[] = [];
  /** Whether the component is loading */
  @Input() loading = true;

  // === DISPLAYED COLUMNS ===
  /** Columns to display */
  public displayedColumns = [
    'select',
    'name',
    'username',
    'oid',
    'roles',
    'actions',
  ];

  // === FILTERS ===
  /** Search text */
  private searchText = '';
  /** Form */
  public form = this.fb.group({});
  /** Role filter */
  public roleFilter = '';
  /** Whether to show the filters */
  public showFilters = false;
  /** Array of filtered users */
  public filteredUsers = new Array<User>();
  /** Selection */
  selection = new SelectionModel<User>(true, []);

  /** Reference to expanded filter template */
  @ViewChild('expandedFilter')
  expandedFilter!: TemplateRef<any>;

  /**
   * Constructor of the users component
   *
   * @param apollo The apollo client
   * @param snackBar The snack bar service
   * @param dialog The Dialog service
   * @param downloadService The download service
   * @param confirmService The confirm service
   * @param translate The translation service
   * @param router Angular router
   * @param activatedRoute Angular active route
   * @param fb Angular form builder
   */
  constructor(
    private apollo: Apollo,
    private snackBar: SnackbarService,
    public dialog: Dialog,
    private downloadService: DownloadService,
    private confirmService: ConfirmService,
    private translate: TranslateService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder
  ) {
    super();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.users) {
      this.filterPredicate();
    }
  }

  /**
   * Filter current user list by search and role
   */
  private filterPredicate() {
    this.filteredUsers = this.users.filter(
      (data: any) =>
        (this.searchText.trim().length === 0 ||
          (this.searchText.trim().length > 0 &&
            !!data.name &&
            data.name.toLowerCase().includes(this.searchText.trim())) ||
          (!!data.username &&
            data.username.toLowerCase().includes(this.searchText.trim()))) &&
        (this.roleFilter.trim().toLowerCase().length === 0 ||
          (this.roleFilter.trim().toLowerCase().length > 0 &&
            !!data.roles &&
            data.roles.length > 0 &&
            data.roles.filter((r: any) =>
              r.title
                .toLowerCase()
                .includes(this.roleFilter.trim().toLowerCase())
            ).length > 0))
    );
  }

  /**
   * Show a dialog for inviting someone
   */
  async onInvite(): Promise<void> {
    const { InviteUsersComponent } = await import(
      './components/invite-users/invite-users.component'
    );
    const dialogRef = this.dialog.open(InviteUsersComponent, {
      data: {
        roles: this.roles,
        users: this.filteredUsers,
        downloadPath: 'download/invite',
        uploadPath: 'upload/invite',
      },
    });
    dialogRef.closed.pipe(takeUntil(this.destroy$)).subscribe((value: any) => {
      if (value) {
        this.apollo
          .mutate<AddUsersMutationResponse>({
            mutation: ADD_USERS,
            variables: {
              users: value,
              application: this.roles[0].application?.id,
            },
          })
          .subscribe({
            next: ({ errors, data }) => {
              if (!errors) {
                if (data?.addUsers.length) {
                  this.snackBar.openSnackBar(
                    this.translate.instant('components.users.onInvite.plural')
                  );
                } else {
                  this.snackBar.openSnackBar(
                    this.translate.instant('components.users.onInvite.singular')
                  );
                }
                this.users = uniqBy(
                  [...(data?.addUsers || []), ...this.users],
                  'username'
                );
                this.filterPredicate();
              } else {
                if (value.length > 1) {
                  this.snackBar.openSnackBar(
                    this.translate.instant(
                      'components.users.onNotInvite.plural',
                      { error: errors[0].message }
                    ),
                    { error: true }
                  );
                } else {
                  this.snackBar.openSnackBar(
                    this.translate.instant(
                      'components.users.onNotInvite.singular',
                      { error: errors[0].message }
                    ),
                    { error: true }
                  );
                }
              }
            },
          });
      }
    });
  }

  /**
   * Handle click on user row.
   * Redirect to user page
   *
   * @param user user to see details of
   */
  onClick(user: User): void {
    this.router.navigate([user.id], { relativeTo: this.activatedRoute });
  }

  /**
   * Show a dialog to confirm the deletion of users
   *
   * @param users The list of users to delete
   */
  onDelete(users: User[]): void {
    let title = this.translate.instant('common.deleteObject', {
      name: this.translate.instant('common.user.one'),
    });
    let content = this.translate.instant(
      'components.user.delete.confirmationMessage',
      {
        name: users[0].username,
      }
    );
    if (users.length > 1) {
      title = this.translate.instant('common.deleteObject', {
        name: this.translate.instant('common.user.few'),
      });
      content = this.translate.instant(
        'components.user.delete.confirmationMessage',
        {
          name: users[0].username,
        }
      );
    }
    const dialogRef = this.confirmService.openConfirmModal({
      title,
      content,
      confirmText: this.translate.instant('components.confirmModal.delete'),
      confirmVariant: 'danger',
    });
    dialogRef.closed.pipe(takeUntil(this.destroy$)).subscribe((value: any) => {
      if (value) {
        const ids = users.map((u) => u.id);
        this.loading = true;
        this.selection.clear();

        this.apollo
          .mutate<DeleteUsersMutationResponse>({
            mutation: DELETE_USERS,
            variables: { ids },
          })
          .subscribe({
            next: ({ errors, data }) => {
              if (errors) {
                if (ids.length > 1) {
                  this.snackBar.openSnackBar(
                    this.translate.instant(
                      'components.users.onNotDelete.plural',
                      { error: errors ? errors[0].message : '' }
                    ),
                    { error: true }
                  );
                } else {
                  this.snackBar.openSnackBar(
                    this.translate.instant(
                      'components.users.onNotDelete.singular',
                      { error: errors ? errors[0].message : '' }
                    ),
                    { error: true }
                  );
                }
              } else {
                this.loading = false;
                if (data?.deleteUsers) {
                  if (data.deleteUsers > 1) {
                    this.snackBar.openSnackBar(
                      this.translate.instant('components.users.onDelete.plural')
                    );
                  } else {
                    this.snackBar.openSnackBar(
                      this.translate.instant(
                        'components.users.onDelete.singular'
                      )
                    );
                  }
                  this.users = this.users.filter((u) => !ids.includes(u.id));
                  this.filteredUsers = this.users;
                } else {
                  if (ids.length > 1) {
                    this.snackBar.openSnackBar(
                      this.translate.instant(
                        'components.users.onNotDelete.plural',
                        { error: '' }
                      ),
                      { error: true }
                    );
                  } else {
                    this.snackBar.openSnackBar(
                      this.translate.instant(
                        'components.users.onNotDelete.singular',
                        { error: '' }
                      ),
                      { error: true }
                    );
                  }
                }
              }
            },
          });
      }
    });
  }

  /**
   * Apply the filters to the list
   *
   * @param event event value
   */
  applyFilter(event: any): void {
    if (event.roleFilter) {
      this.roleFilter = event.roleFilter;
    } else {
      this.roleFilter = '';
    }
    if (event.search) {
      this.searchText = event.search.toLowerCase();
    } else {
      this.searchText = '';
    }
    this.filterPredicate();
  }

  /**
   * Clear all the filters
   */
  clearAllFilters(): void {
    this.roleFilter = '';
    this.form.reset();
  }

  /**
   * Whether the number of selected elements matches the total number of rows.
   *
   * @returns True if it matches, else False
   */
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.filteredUsers.length;
    return numSelected === numRows;
  }

  /**
   * Selects all rows if they are not all selected; otherwise clear selection.
   */
  masterToggle(): void {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    this.isAllSelected()
      ? this.selection.clear()
      : this.filteredUsers.forEach((row) => this.selection.select(row));
  }

  /**
   * Get the label for the checkbox on the passed row
   *
   * @param row The current row
   * @returns The label for the checkbox
   */
  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${
      row.position + 1
    }`;
  }

  /**
   * Export the list of users
   *
   * @param type The type of file we want ('csv' or 'xlsx')
   */
  async onExport(type: 'csv' | 'xlsx') {
    this.downloadService.getUsersExport(
      type,
      this.selection.selected.map((x) => x.id || '').filter((x) => x !== '')
    );
  }
}
