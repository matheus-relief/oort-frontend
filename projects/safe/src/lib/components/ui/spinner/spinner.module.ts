import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafeSpinnerComponent } from './spinner.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@NgModule({
  declarations: [
    SafeSpinnerComponent
  ],
  imports: [
    CommonModule,
    MatProgressSpinnerModule
  ],
  exports: [
    SafeSpinnerComponent
  ]
})
export class SafeSpinnerModule { }
