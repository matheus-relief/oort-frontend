import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddPageRoutingModule } from './add-page-routing.module';
import { AddPageComponent } from './add-page.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatRippleModule } from '@angular/material/core';
import {
  SafeButtonModule,
  SafeContentChoiceModule,
  SafeFormsDropdownModule,
} from '@oort-front/safe';
import { TranslateModule } from '@ngx-translate/core';
import { AbilityModule } from '@casl/angular';
import { DividerModule, ButtonModule } from '@oort-front/ui';

/**
 * Add page module.
 */
@NgModule({
  declarations: [AddPageComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDialogModule,
    AddPageRoutingModule,
    MatRippleModule,
    SafeButtonModule,
    SafeContentChoiceModule,
    TranslateModule,
    SafeFormsDropdownModule,
    DividerModule,
    AbilityModule,
    ButtonModule,
  ],
})
export class AddPageModule {}
