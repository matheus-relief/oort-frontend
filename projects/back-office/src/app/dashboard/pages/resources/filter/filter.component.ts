import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss'],
})
export class FilterComponent implements OnInit {
  public form!: FormGroup;
  public search = new FormControl('');
  public show = false;
  @Output() filter = new EventEmitter<any>();
  @Input() loading = false;

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      name: [''],
      startDate: [null],
      endDate: [null],
    });
    this.form.valueChanges
      .pipe(debounceTime(1000), distinctUntilChanged())
      .subscribe((value) => {
        this.emitFilter(value);
      });
    // this way we can wait for 0.2s before sending an update
    this.search.valueChanges
      .pipe(debounceTime(1000), distinctUntilChanged())
      .subscribe((value) => {
        this.form.controls.name.setValue(value);
      });
  }

  /**
   * Emits the filter value, so the main component can get it.
   */
  private emitFilter(value: any): void {
    const filters: any[] = [];
    if (value.name) {
      filters.push({ field: 'name', operator: 'contains', value: value.name });
    }
    if (value.startDate) {
      filters.push({
        field: 'createdAt',
        operator: 'gte',
        value: value.startDate,
      });
    }
    if (value.endDate) {
      filters.push({
        field: 'createdAt',
        operator: 'lte',
        value: value.endDate,
      });
    }
    const filter = {
      logic: 'and',
      filters,
    };
    this.filter.emit(filter);
  }

  /**
   * Clears form.
   */
  clear(): void {
    this.form.reset();
    this.search.reset();
  }

  /**
   * Clears date range.
   */
  clearDateFilter(): void {
    this.form.setValue({ ...this.form.value, startDate: null, endDate: null });
  }
}
