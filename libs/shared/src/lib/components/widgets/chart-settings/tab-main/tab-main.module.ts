import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabMainComponent } from './tab-main.component';
import { TextFieldModule } from '@angular/cdk/text-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  DividerModule,
  ExpansionPanelModule,
  SelectMenuModule,
} from '@oort-front/ui';
import { IconModule } from '@oort-front/ui';
import { TabsModule } from '@oort-front/ui';
import { TranslateModule } from '@ngx-translate/core';
import { PaletteControlModule } from '../../../controls/palette-control/palette-control.module';
import { QueryBuilderModule } from '../../../query-builder/query-builder.module';
import { AggregationBuilderModule } from '../../../ui/aggregation-builder/aggregation-builder.module';
import { GridModule } from '../../../ui/core-grid/grid/grid.module';
import { ChartModule } from '../../chart/chart.module';
import { SeriesMappingModule } from '../../../ui/aggregation-builder/series-mapping/series-mapping.module';
import { ButtonModule, FormWrapperModule, TooltipModule } from '@oort-front/ui';
import {
  ReferenceDataSelectComponent,
  ResourceSelectComponent,
} from '../../../controls/public-api';

/**
 * Main tab of chart settings modal.
 */
@NgModule({
  declarations: [TabMainComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FormWrapperModule,
    IconModule,
    TextFieldModule,
    QueryBuilderModule,
    ChartModule,
    TabsModule,
    ExpansionPanelModule,
    TranslateModule,
    AggregationBuilderModule,
    GridModule,
    PaletteControlModule,
    SeriesMappingModule,
    ButtonModule,
    SelectMenuModule,
    TooltipModule,
    ResourceSelectComponent,
    ReferenceDataSelectComponent,
    DividerModule,
  ],
  exports: [TabMainComponent],
})
export class TabMainModule {}
