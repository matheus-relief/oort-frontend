import { Dialog } from '@angular/cdk/dialog';
import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { DashboardService } from '../../../services/dashboard/dashboard.service';
import { UnsubscribeComponent } from '../../utils/unsubscribe/unsubscribe.component';
import { takeUntil } from 'rxjs';
import { DomPortal } from '@angular/cdk/portal';
import { TabsComponent as UiTabsComponent } from '@oort-front/ui';

/**
 * Tabs widget component.
 */
@Component({
  selector: 'shared-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss'],
})
export class TabsComponent
  extends UnsubscribeComponent
  implements AfterViewInit
{
  /** Should display header */
  @Input() header = true;
  /** Widget settings */
  @Input() settings: any;
  /** Widget definition */
  @Input() widget: any;
  /** Editable widget */
  @Input() canUpdate = false;
  /** Widget edit event */
  @Output() edit: EventEmitter<any> = new EventEmitter();
  /** Header template reference */
  @ViewChild('headerTemplate') headerTemplate!: TemplateRef<any>;
  /** Reference to ui tab group */
  @ViewChild(UiTabsComponent)
  tabGroup?: UiTabsComponent;
  /** CDK portal. Allow to display part of the tab group element in another place */
  portal?: DomPortal;

  /**
   * Tabs widget component.
   *
   * @param dialog Dialog service
   * @param dashboardService Shared dashboard service
   */
  constructor(
    private dialog: Dialog,
    private dashboardService: DashboardService
  ) {
    super();
  }

  ngAfterViewInit(): void {
    /** Take part of the tab group element to display it in the header template */
    this.portal = new DomPortal(this.tabGroup?.tabList);
  }

  /**
   * Open settings
   */
  async openSettings(): Promise<void> {
    const { EditWidgetModalComponent } = await import(
      '../../widget-grid/edit-widget-modal/edit-widget-modal.component'
    );
    const dialogRef = this.dialog.open(EditWidgetModalComponent, {
      disableClose: true,
      data: {
        tile: this.widget,
        template: this.dashboardService.findSettingsTemplate(this.widget),
      },
    });
    dialogRef.closed.pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      if (res) {
        this.edit.emit({ type: 'data', id: this.widget.id, options: res });
      }
    });
  }
}
