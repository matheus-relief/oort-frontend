import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  HostBinding,
  OnInit,
  OnDestroy,
  Inject,
  TemplateRef,
  ElementRef,
  Optional,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { ChartComponent } from '../widgets/chart/chart.component';
import { EditorComponent } from '../widgets/editor/editor.component';
import { GridWidgetComponent } from '../widgets/grid/grid.component';
import { MapWidgetComponent } from '../widgets/map/map.component';
import { SummaryCardComponent } from '../widgets/summary-card/summary-card.component';
import { v4 as uuidv4 } from 'uuid';
import get from 'lodash/get';
import { RestService } from '../../services/rest/rest.service';
import { DOCUMENT } from '@angular/common';
import { ShadowDomService } from '@oort-front/ui';
import { GridsterComponent, GridsterItemComponent } from 'angular-gridster2';

/** Component for the widgets */
@Component({
  selector: 'shared-widget',
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.scss'],
})
export class WidgetComponent implements OnInit, OnDestroy, OnChanges {
  /** Current widget definition */
  @Input() widget: any;
  /** Is widget in fullscreen mode */
  @Input() header = true;
  /** Can user update widget */
  @Input() canUpdate = false;
  /** Template to display on the left of widget header */
  @Input() headerLeftTemplate?: TemplateRef<any>;
  /** Template to display on the right of widget header */
  @Input() headerRightTemplate?: TemplateRef<any>;
  /** Is fullscreen mode activated */
  @Input() fullscreen = false;
  /** Edit widget event emitter */
  @Output() edit: EventEmitter<any> = new EventEmitter();
  /** Change step workflow event emitter */
  @Output() changeStep: EventEmitter<number> = new EventEmitter();
  /** Id of the ticket. Visible in the dom */
  @HostBinding()
  id = `widget-${uuidv4()}`;
  /** Reference to widget inner component */
  @ViewChild('widgetContent')
  widgetContentComponent!:
    | ChartComponent
    | GridWidgetComponent
    | MapWidgetComponent
    | EditorComponent
    | SummaryCardComponent;
  /** Html element containing widget custom style */
  private customStyle?: HTMLStyleElement;
  /** Previous position of the widget ( cols / x )  */
  private previousPosition?: { cols: number; x: number };
  /** Expanded state of the widget */
  public expanded = false;

  /** @returns would component block navigation */
  get canDeactivate() {
    if (this.widgetContentComponent instanceof GridWidgetComponent) {
      return this.widgetContentComponent.canDeactivate;
    } else {
      return true;
    }
  }

  /** @returns should widget show header, based on widget settings */
  get showHeader() {
    return get(this.widget, 'settings.widgetDisplay.showHeader') ?? true;
  }

  /** @returns should widget show border, based on widget settings */
  get showBorder() {
    return get(this.widget, 'settings.widgetDisplay.showBorder') ?? true;
  }

  /** @returns is widget expandable */
  get expandable() {
    return get(this.widget, 'settings.widgetDisplay.expandable') ?? false;
  }

  /** @returns should show expand button, based on widget state & grid state */
  get showExpand() {
    return (
      this.expandable &&
      !this.canUpdate &&
      !this.fullscreen &&
      !this.grid.mobile &&
      (this.widget.cols < this.grid.columns || this.expanded)
    );
  }

  /** @returns should widget use padding, based on widget settings */
  get usePadding() {
    return get(this.widget, 'settings.widgetDisplay.usePadding') ?? true;
  }

  /**
   * Widget component
   *
   * @param restService Shared rest service
   * @param document document
   * @param elementRef reference to element
   * @param shadowDomService shadow dom service to handle the current host of the component
   * @param grid Reference to parent gridster
   * @param gridItem Reference to parent gridster item
   */
  constructor(
    private restService: RestService,
    @Inject(DOCUMENT) private document: Document,
    public elementRef: ElementRef,
    private shadowDomService: ShadowDomService,
    @Optional() private grid: GridsterComponent,
    @Optional() private gridItem: GridsterItemComponent
  ) {}

  ngOnInit(): void {
    // Get style from widget definition
    const style = get(this.widget, 'settings.widgetDisplay.style') || '';
    if (style) {
      const scss = `#${this.id} {
        ${style}
      }`;
      // Compile to css ( we store style as scss )
      this.restService
        .post('style/scss-to-css', { scss }, { responseType: 'text' })
        .subscribe((css) => {
          this.customStyle = this.document.createElement('style');
          this.customStyle.appendChild(this.document.createTextNode(css));
          if (this.shadowDomService.isShadowRoot) {
            // Add it to shadow root
            this.shadowDomService.currentHost.appendChild(this.customStyle);
          } else {
            // Add to head of document
            const head = this.document.getElementsByTagName('head')[0];
            head.appendChild(this.customStyle);
          }
        });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['canUpdate']) {
      // Reset size of the widget to default one, if admin enters edit mode
      if (changes['canUpdate'].previousValue === false && this.expanded) {
        this.onResize();
      }
    }
  }

  ngOnDestroy(): void {
    if (this.customStyle) {
      const parentNode = this.customStyle.parentNode;
      parentNode?.removeChild(this.customStyle);
    }
  }

  /** Resize widget, by button click. */
  onResize() {
    if (this.grid.options.api?.resize && this.grid.options.api.optionsChanged) {
      if (this.expanded) {
        // Revert widget size
        this.widget.layerIndex = 0;
        this.widget.cols = this.previousPosition?.cols;
        this.widget.x = this.previousPosition?.x;
        this.gridItem.updateOptions();
        this.grid.options.api.resize();
        this.expanded = false;
      } else {
        // Expand the widget
        this.previousPosition = {
          cols: this.widget.cols,
          x: this.widget.x,
        };
        this.widget.layerIndex = 1;
        this.widget.cols = this.grid.options.maxCols;
        this.widget.x = 0;
        this.gridItem.bringToFront(100);
        this.gridItem.updateOptions();
        this.grid.options.api.resize();
        this.expanded = true;
      }
    }
  }
}
