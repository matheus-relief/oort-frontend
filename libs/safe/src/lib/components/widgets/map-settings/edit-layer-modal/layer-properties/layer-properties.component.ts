import { Component, Input, ViewChild, ViewContainerRef } from '@angular/core';
import { LayerFormT } from '../../map-forms';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';

/** Component for the general layer properties */
@Component({
  selector: 'safe-layer-properties',
  templateUrl: './layer-properties.component.html',
  styleUrls: ['./layer-properties.component.scss'],
})
export class LayerPropertiesComponent {
  @Input() form!: LayerFormT;
  @Input() currentZoom!: number | undefined;

  // Display of map
  @Input() currentMapContainerRef!: BehaviorSubject<ViewContainerRef | null>;
  @ViewChild('mapContainer', { read: ViewContainerRef })
  mapContainerRef!: ViewContainerRef;
  @Input() destroyTab$!: Subject<boolean>;

  ngAfterViewInit(): void {
    this.currentMapContainerRef
      .pipe(takeUntil(this.destroyTab$))
      .subscribe((viewContainerRef) => {
        if (viewContainerRef) {
          if (viewContainerRef !== this.mapContainerRef) {
            const view = viewContainerRef.detach();
            if (view) {
              this.mapContainerRef.insert(view);
              this.currentMapContainerRef.next(this.mapContainerRef);
            }
          }
        }
      });
  }
}
