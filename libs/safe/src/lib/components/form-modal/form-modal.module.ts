import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafeFormModalComponent } from './form-modal.component';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { SafeButtonModule } from '../ui/button/button.module';
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs';
import { SafeIconModule } from '../ui/icon/icon.module';
import { SafeRecordSummaryModule } from '../record-summary/record-summary.module';
import { SafeRecordHistoryModalModule } from '../record-history-modal/record-history-modal.module';
import { SafeFormActionsModule } from '../form-actions/form-actions.module';
import { TranslateModule } from '@ngx-translate/core';
import { SafeModalModule } from '../ui/modal/modal.module';

/**
 * SafeFormModalModule is a class used to manage all the modules and components
 * related to modals containing forms.
 */
@NgModule({
  declarations: [SafeFormModalComponent],
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    SafeButtonModule,
    SafeIconModule,
    SafeRecordHistoryModalModule,
    SafeRecordSummaryModule,
    SafeFormActionsModule,
    TranslateModule,
    SafeModalModule,
  ],
  exports: [SafeFormModalComponent],
})
export class SafeFormModalModule {}