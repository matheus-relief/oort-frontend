import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { divisionForm } from '../../map-forms';

/** Interface of dialog data of the component */
interface DialogData {
  value: any;
  fields: any[];
  query: any;
}

/**
 * Single clorophlet configuration component.
 */
@Component({
  selector: 'safe-map-clorophlet-division',
  templateUrl: './map-clorophlet-division.component.html',
  styleUrls: ['./map-clorophlet-division.component.scss'],
})
export class MapClorophletDivisionComponent implements OnInit {
  public form!: UntypedFormGroup;

  public fields: any[] = [];
  public query: any;

  /**
   * Single clorophlet configuration component.
   *
   * @param data dialog data
   */
  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {
    this.form = divisionForm(data.value);
    this.fields = data.fields;
    this.query = data.query;
  }

  ngOnInit(): void {}
}