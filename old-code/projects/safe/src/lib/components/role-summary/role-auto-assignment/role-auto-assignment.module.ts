import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoleAutoAssignmentComponent } from './role-auto-assignment.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { SafeButtonModule } from '../../ui/button/button.module';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { SafeSkeletonTableModule } from '../../skeleton/skeleton-table/skeleton-table.module';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { EditRoleAutoAssignmentModalModule } from './edit-role-auto-assignment-modal/edit-role-auto-assignment-modal.module';

/**
 * Component for Auto assignment of role
 */
@NgModule({
  declarations: [RoleAutoAssignmentComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    SafeButtonModule,
    MatTableModule,
    SafeSkeletonTableModule,
    MatTooltipModule,
    EditRoleAutoAssignmentModalModule,
  ],
  exports: [RoleAutoAssignmentComponent],
})
export class RoleAutoAssignmentModule {}