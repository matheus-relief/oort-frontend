import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs';
import { TranslateModule } from '@ngx-translate/core';
import { SafeRolesComponent } from './roles.component';
import { SafeRoleListModule } from './components/role-list/role-list.module';
import { SafeGroupListModule } from './components/group-list/group-list.module';
import { SafeAddRoleComponent } from './components/add-role/add-role.component';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { SafeModalModule } from '../ui/modal/modal.module';
import { AbilityModule } from '@casl/angular';

/**
 * SafeRolesModule manages modules and components for the roles page
 */
@NgModule({
  declarations: [SafeRolesComponent, SafeAddRoleComponent],
  imports: [
    CommonModule,
    SafeRoleListModule,
    SafeGroupListModule,
    TranslateModule,
    MatTabsModule,
    MatDialogModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    SafeModalModule,
    AbilityModule,
  ],
  exports: [SafeRolesComponent],
})
export class SafeRolesModule {}
