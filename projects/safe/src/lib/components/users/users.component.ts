import { Apollo } from 'apollo-angular';
import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { SafeSnackBarService } from '../../services/snackbar/snackbar.service';
import { User, Role } from '../../models/user.model';
import {
  DELETE_USERS,
  DeleteUsersMutationResponse,
  AddUsersMutationResponse,
  ADD_USERS,
} from './graphql/mutations';
import { SafeConfirmService } from '../../services/confirm/confirm.service';
import { SelectionModel } from '@angular/cdk/collections';
import { SafeInviteUsersComponent } from './components/invite-users/invite-users.component';
import { SafeDownloadService } from '../../services/download/download.service';
import { TranslateService } from '@ngx-translate/core';
import { Router, ActivatedRoute } from '@angular/router';

/**
 * A component to display the list of users
 */
@Component({
  selector: 'safe-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class SafeUsersComponent implements OnInit {
  // === INPUT DATA ===
  @Input() users: MatTableDataSource<User> = new MatTableDataSource<User>([]);
  @Input() roles: Role[] = [];
  @Input() loading = true;

  // === DISPLAYED COLUMNS ===
  public displayedColumns = [
    'select',
    'name',
    'username',
    'oid',
    'roles',
    'actions',
  ];

  // === FILTERS ===
  public searchText = '';
  public roleFilter = '';
  public showFilters = false;

  selection = new SelectionModel<User>(true, []);

  /**
   * Constructor of the users component
   *
   * @param apollo The apollo client
   * @param snackBar The snack bar service
   * @param dialog The material dialog service
   * @param downloadService The download service
   * @param confirmService The confirm service
   * @param translate The translation service
   * @param router Angular router
   * @param activatedRoute Angular active route
   */
  constructor(
    private apollo: Apollo,
    private snackBar: SafeSnackBarService,
    public dialog: MatDialog,
    private downloadService: SafeDownloadService,
    private confirmService: SafeConfirmService,
    private translate: TranslateService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.users.filterPredicate = (data: any) =>
      (this.searchText.trim().length === 0 ||
        (this.searchText.trim().length > 0 &&
          !!data.name &&
          data.name.toLowerCase().includes(this.searchText.trim()))) &&
      (this.roleFilter.trim().toLowerCase().length === 0 ||
        (this.roleFilter.trim().toLowerCase().length > 0 &&
          !!data.roles &&
          data.roles.length > 0 &&
          data.roles.filter((r: any) =>
            r.title.toLowerCase().includes(this.roleFilter.trim().toLowerCase())
          ).length > 0));
  }

  /**
   * Show a dialog for inviting someone
   */
  onInvite(): void {
    const dialogRef = this.dialog.open(SafeInviteUsersComponent, {
      data: {
        roles: this.roles,
        users: this.users.data,
        downloadPath: 'download/invite',
        uploadPath: 'upload/invite',
      },
    });
    dialogRef.afterClosed().subscribe((value) => {
      if (value) {
        this.apollo
          .mutate<AddUsersMutationResponse>({
            mutation: ADD_USERS,
            variables: {
              users: value,
              application: this.roles[0].application?.id,
            },
          })
          .subscribe((res) => {
            if (!res.errors) {
              this.snackBar.openSnackBar(
                this.translate.instant('common.notifications.objectInvited', {
                  name: this.translate
                    .instant(
                      res.data?.addUsers.length
                        ? 'common.user.few'
                        : 'common.user.one'
                    )
                    .toLowerCase(),
                })
              );
              this.users.data = this.users.data.concat(
                res?.data?.addUsers || []
              );
            } else {
              this.snackBar.openSnackBar(
                this.translate.instant(
                  'common.notifications.objectNotInvited',
                  {
                    name: this.translate
                      .instant(
                        res.data?.addUsers.length
                          ? 'common.user.few'
                          : 'common.user.one'
                      )
                      .toLowerCase(),
                  }
                ),
                { error: true }
              );
            }
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
      confirmColor: 'warn',
    });
    dialogRef.afterClosed().subscribe((value) => {
      if (value) {
        const ids = users.map((u) => u.id);
        this.loading = true;
        this.selection.clear();

        this.apollo
          .mutate<DeleteUsersMutationResponse>({
            mutation: DELETE_USERS,
            variables: { ids },
          })
          .subscribe((res) => {
            this.loading = false;
            if (res.data?.deleteUsers) {
              this.snackBar.openSnackBar(
                this.translate.instant('common.notifications.objectDeleted', {
                  value: this.translate
                    .instant(
                      res.data.deleteUsers > 1
                        ? 'common.user.few'
                        : 'common.user.one'
                    )
                    .toLowerCase(),
                })
              );
              this.users.data = this.users.data.filter(
                (u) => !ids.includes(u.id)
              );
            } else {
              this.snackBar.openSnackBar(
                this.translate.instant(
                  'common.notifications.objectNotDeleted',
                  {
                    value: this.translate
                      .instant(
                        ids.length > 1 ? 'common.user.few' : 'common.user.one'
                      )
                      .toLowerCase(),
                    error: '',
                  }
                ),
                { error: true }
              );
            }
          });
      }
    });
  }

  /**
   * Apply the filters to the list
   *
   * @param column The column used for filtering
   * @param event The event triggered on filter action
   */
  applyFilter(column: string, event: any): void {
    if (column === 'role') {
      this.roleFilter = !!event.value ? event.value.trim() : '';
    } else {
      this.searchText = !!event
        ? event.target.value.trim().toLowerCase()
        : this.searchText;
    }
    this.users.filter = '##';
  }

  /**
   * Clear all the filters
   */
  clearAllFilters(): void {
    this.searchText = '';
    this.roleFilter = '';
    this.applyFilter('', null);
  }

  /**
   * Whether the number of selected elements matches the total number of rows.
   *
   * @returns True if it matches, else False
   */
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.users.data.length;
    return numSelected === numRows;
  }

  /**
   * Selects all rows if they are not all selected; otherwise clear selection.
   */
  masterToggle(): void {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    this.isAllSelected()
      ? this.selection.clear()
      : this.users.data.forEach((row) => this.selection.select(row));
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
   * @param type The type of file we want ('csv' or 'xslx')
   */
  onExport(type: string): void {
    const fileName = `users.${type}`;
    const path = `download/users`;
    const queryString = new URLSearchParams({ type }).toString();
    this.downloadService.getFile(
      `${path}?${queryString}`,
      `text/${type};charset=utf-8;`,
      fileName
    );
  }
}
