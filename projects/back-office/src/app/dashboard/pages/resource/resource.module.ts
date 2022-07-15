import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResourceRoutingModule } from './resource-routing.module';
import { ResourceComponent } from './resource.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import {
  SafeAccessModule,
  SafeButtonModule,
  SafeLayoutModalModule,
  SafeDateModule,
} from '@safe/builder';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule } from '@angular/material/paginator';
import { TranslateModule } from '@ngx-translate/core';
import { OverlayModule } from '@angular/cdk/overlay';
import { UploadMenuModule } from '../../../components/upload-menu/upload-menu.module';
import { RecordsTabComponent } from './records-tab/records-tab.component';
import { FormsTabComponent } from './forms-tab/forms-tab.component';
import { LayoutsTabComponent } from './layouts-tab/layouts-tab.component';

@NgModule({
  declarations: [ResourceComponent, RecordsTabComponent, FormsTabComponent, LayoutsTabComponent],
  imports: [
    CommonModule,
    ResourceRoutingModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatTableModule,
    MatIconModule,
    MatMenuModule,
    MatChipsModule,
    SafeAccessModule,
    SafeButtonModule,
    MatTooltipModule,
    MatPaginatorModule,
    TranslateModule,
    SafeLayoutModalModule,
    OverlayModule,
    UploadMenuModule,
    SafeDateModule,
  ],
  exports: [ResourceComponent],
})
export class ResourceModule {}
