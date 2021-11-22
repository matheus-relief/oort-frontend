import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafeChartComponent } from './chart.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SafeButtonModule } from '../../ui/button/button.module';
import { SafeDonutChartModule } from '../../ui/donut-chart/donut-chart.module';
import { SafePieChartModule } from '../../ui/pie-chart/pie-chart.module';
import { SafeLineChartModule } from '../../ui/line-chart/line-chart.module';
import {SafeBarChartModule} from '../../ui/bar-chart/bar-chart.module';

@NgModule({
  declarations: [SafeChartComponent],
    imports: [
        CommonModule,
        MatProgressSpinnerModule,
        SafeButtonModule,
        SafeDonutChartModule,
        SafePieChartModule,
        SafeLineChartModule,
        SafeBarChartModule
    ],
  exports: [SafeChartComponent]
})
export class SafeChartModule { }
