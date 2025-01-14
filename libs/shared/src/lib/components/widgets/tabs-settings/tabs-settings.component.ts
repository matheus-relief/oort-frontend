import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { extendWidgetForm } from '../common/display-settings/extendWidgetForm';
import { createTabsWidgetFormGroup } from './tabs-settings.form';
import get from 'lodash/get';
import { UnsubscribeComponent } from '../../utils/unsubscribe/unsubscribe.component';
import { takeUntil } from 'rxjs';

/**
 * Settings of tabs widget.
 * Open in a modal.
 * todo: better types
 */
@Component({
  selector: 'shared-tabs-settings',
  templateUrl: './tabs-settings.component.html',
  styleUrls: ['./tabs-settings.component.scss'],
})
export class TabsSettingsComponent
  extends UnsubscribeComponent
  implements OnInit
{
  /** Widget definition */
  @Input() widget: any;
  /** Emit the applied change */
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() change: EventEmitter<any> = new EventEmitter();
  /** Widget form group */
  public widgetForm!: FormGroup;

  ngOnInit(): void {
    // Create form group, and extend it to get display settings ( such as borderless )
    this.widgetForm = extendWidgetForm(
      createTabsWidgetFormGroup(this.widget.id, this.widget.settings),
      get(this.widget, 'settings.widgetDisplay'),
      {
        usePadding: new FormControl(
          get<boolean>(this.widget.settings, 'widgetDisplay.usePadding', true)
        ),
      }
    );
    this.change.emit(this.widgetForm);
    this.widgetForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.widgetForm.markAsDirty({ onlySelf: true });
        this.change.emit(this.widgetForm);
      });
  }
}
