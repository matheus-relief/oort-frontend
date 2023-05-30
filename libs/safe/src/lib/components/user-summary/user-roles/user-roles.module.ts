import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserRolesComponent } from './user-roles.component';
import { TranslateModule } from '@ngx-translate/core';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { UserBackRolesComponent } from './user-back-roles/user-back-roles.component';
import { UserAppRolesComponent } from './user-app-roles/user-app-roles.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserGroupsComponent } from './user-groups/user-groups.component';
import {
  GraphQLSelectModule,
  SelectMenuModule,
} from '@oort-front/ui';

/**
 * User summary roles module
 */
@NgModule({
  declarations: [
    UserRolesComponent,
    UserBackRolesComponent,
    UserAppRolesComponent,
    UserGroupsComponent,
  ],
  imports: [
    CommonModule,
    TranslateModule,
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    GraphQLSelectModule,
    SelectMenuModule,
  ],
  exports: [UserRolesComponent],
})
export class UserRolesModule {}
