import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard.component';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import { SafeWidgetGridModule } from '@safe/builder';

/** Dashboard module. */
@NgModule({
  declarations: [DashboardComponent],
  imports: [CommonModule, MatProgressSpinnerModule, SafeWidgetGridModule],
  exports: [DashboardComponent],
})
export class DashboardModule {}