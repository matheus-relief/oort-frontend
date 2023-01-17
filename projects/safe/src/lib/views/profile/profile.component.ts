import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Apollo } from 'apollo-angular';
import {
  EditUserProfileMutationResponse,
  EDIT_USER_PROFILE,
} from './graphql/mutations';
import { User } from '../../models/user.model';
import { SafeAuthService } from '../../services/auth/auth.service';
import { SafeSnackBarService } from '../../services/snackbar/snackbar.service';
import { TranslateService } from '@ngx-translate/core';
import { SafeUnsubscribeComponent } from '../../components/utils/unsubscribe/unsubscribe.component';
import { takeUntil } from 'rxjs/operators';

/**
 * Shared profile page.
 * Displays information of the logged user.
 */
@Component({
  selector: 'safe-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class SafeProfileComponent
  extends SafeUnsubscribeComponent
  implements OnInit
{
  /** Table data */
  dataSource = new MatTableDataSource<User>();
  /** Current user */
  public user: any;
  /** Form to edit the user */
  public userForm?: FormGroup;
  /** Displayed columns of table */
  public displayedColumnsApps = [
    'name',
    'role',
    'positionAttributes',
    'actions',
  ];

  /**
   * Shared profile page.
   * Displays information of the logged user.
   *
   * @param apollo Apollo client
   * @param snackBar Shared snackbar service
   * @param authService Shared authentication service
   * @param formBuilder Angular form builder
   * @param translate Translation service
   */
  constructor(
    private apollo: Apollo,
    private snackBar: SafeSnackBarService,
    private authService: SafeAuthService,
    private formBuilder: FormBuilder,
    public translate: TranslateService
  ) {
    super();
  }

  /**
   * Subscribes to authenticated user.
   * Creates user form.
   */
  ngOnInit(): void {
    this.authService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      if (user) {
        this.user = { ...user };
        this.userForm = this.formBuilder.group({
          firstName: [user.firstName, Validators.required],
          lastName: [user.lastName, Validators.required],
          username: [{ value: user.username, disabled: true }],
        });
      }
    });
  }

  /**
   * Submits new profile.
   */
  onSubmit(): void {
    const roles: any[] = [];
    this.user?.roles?.forEach((e: any) => {
      roles.push(e.id);
    });
    this.apollo
      .mutate<EditUserProfileMutationResponse>({
        mutation: EDIT_USER_PROFILE,
        variables: {
          profile: {
            firstName: this.userForm?.value.firstName,
            lastName: this.userForm?.value.lastName,
          },
        },
      })
      .subscribe((res) => {
        if (res.data) {
          this.snackBar.openSnackBar(
            this.translate.instant('pages.profile.notifications.updated')
          );
          this.user.name = res.data.editUserProfile.name;
        }
      });
  }

  /**
   * Selects a new favorite application.
   *
   * @param application new favorite application
   */
  onSelectFavorite(application: any): void {
    if (application) {
      const roles: any[] = [];
      this.user?.roles?.forEach((e: any) => {
        roles.push(e.id);
      });
      this.apollo
        .mutate<EditUserProfileMutationResponse>({
          mutation: EDIT_USER_PROFILE,
          variables: {
            profile: {
              favoriteApp: application.id,
            },
          },
        })
        .subscribe((res) => {
          if (res.data) {
            this.snackBar.openSnackBar(
              this.translate.instant('pages.profile.notifications.updated')
            );
            this.user.favoriteApp = res.data.editUserProfile.favoriteApp;
          }
        });
    }
  }
}