import { Apollo, QueryRef } from 'apollo-angular';
import { Component, Inject, OnInit } from '@angular/core';
import {
  UntypedFormGroup,
  UntypedFormBuilder,
  Validators,
} from '@angular/forms';
import {
  MatLegacyDialogRef as MatDialogRef,
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
} from '@angular/material/legacy-dialog';

import { GetRolesQueryResponse, GET_ROLES } from '../../graphql/queries';
import { Role } from '@safe/builder';

/**
 * Chose role component, to preview application with selected role.
 */
@Component({
  selector: 'app-chose-role',
  templateUrl: './chose-role.component.html',
  styleUrls: ['./chose-role.component.scss'],
})
export class ChoseRoleComponent implements OnInit {
  // === DATA ===
  public roles: Role[] = [];
  public loading = true;

  // === REACTIVE FORM ===
  roleForm: UntypedFormGroup = new UntypedFormGroup({});

  // === ROLES QUERY ===
  public rolesQuery!: QueryRef<GetRolesQueryResponse>;
  /**
   * Chose role component, to preview application with selected role.
   *
   * @param formBuilder Angular form builder
   * @param dialogRef Material dialog ref
   * @param apollo Angular service
   * @param data Injected modal data
   * @param data.application application id
   */
  constructor(
    private formBuilder: UntypedFormBuilder,
    public dialogRef: MatDialogRef<ChoseRoleComponent>,
    private apollo: Apollo,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      application: string;
    }
  ) {}

  ngOnInit(): void {
    this.rolesQuery = this.apollo.watchQuery<GetRolesQueryResponse>({
      query: GET_ROLES,
      variables: {
        application: this.data.application,
      },
    });

    this.rolesQuery.valueChanges.subscribe(({ loading }) => {
      this.loading = loading;
    });
    this.roleForm = this.formBuilder.group({
      role: [null, Validators.required],
    });
  }

  /** Close the modal without sending any data. */
  onClose(): void {
    this.dialogRef.close();
  }
}