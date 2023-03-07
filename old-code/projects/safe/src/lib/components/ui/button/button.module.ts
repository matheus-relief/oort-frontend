import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafeButtonComponent } from './button.component';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { SafeSpinnerModule } from '../spinner/spinner.module';
import { SafeIconModule } from '../icon/icon.module';

/**
 * Button component module.
 */
@NgModule({
  declarations: [SafeButtonComponent],
  imports: [CommonModule, MatButtonModule, SafeSpinnerModule, SafeIconModule],
  exports: [SafeButtonComponent],
})
export class SafeButtonModule {}