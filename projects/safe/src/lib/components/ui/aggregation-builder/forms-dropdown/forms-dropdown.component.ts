import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  ViewChild,
  DoCheck,
  ElementRef,
} from '@angular/core';
import { AbstractControl, FormControl } from '@angular/forms';
import { MatAutocomplete } from '@angular/material/autocomplete';
import { Observable } from 'rxjs';
import { Form } from '../../../../models/form.model';

@Component({
  selector: 'safe-forms-dropdown',
  templateUrl: './forms-dropdown.component.html',
  styleUrls: ['./forms-dropdown.component.scss'],
})
export class SafeFormsDropdownComponent implements OnInit, DoCheck {
  // === DATA ===
  @Input() public forms$!: Observable<Form[]>;
  private currentForms: Form[] = [];
  public filteredForms: Form[] = [];
  private loading = false;

  // === REACTIVE FORM ===
  @Input() sourceControl!: AbstractControl;
  private sourceFilter = '';

  // === SCROLL DETECTION ===
  @ViewChild('auto') autocomplete?: MatAutocomplete;
  private initializeScrollListener = false;
  private panel?: ElementRef;
  @Output() scrolled = new EventEmitter<boolean>();

  // === FILTER ===
  @Output() filter = new EventEmitter<string>();

  constructor() {}

  ngOnInit(): void {
    this.sourceFilter =
      this.sourceControl.value && this.sourceControl.value.name
        ? this.sourceControl.value.name
        : '';
    this.forms$.subscribe((forms) => {
      this.currentForms = forms;
      this.filteredForms = this.filterForms(this.sourceFilter);
      this.loading = false;
    });
    this.sourceControl.valueChanges.subscribe((value: any) => {
      if (typeof value === 'string') {
        this.sourceFilter = value;
        this.filter.emit(value);
        this.filteredForms = this.filterForms(value);
      } else {
        console.log('VALUE', value);
      }
    });
  }

  get sourceFormControl(): FormControl {
    return this.sourceControl as FormControl;
  }

  /**
   * Filter forms by name using passed parameters.
   *
   * @param value string used to filter.
   */
  private filterForms(value: string): Form[] {
    return this.currentForms.filter((form) =>
      form.name?.toLowerCase().includes(value.toLowerCase())
    );
  }

  /**
   * Display function necessary for the autocomplete in order to display selected choice.
   *
   * @param form Form to display.
   */
  public displayName(form: any): string {
    console.log('FORM', form);
    return form && form.name ? form.name : '';
  }

  /**
   * Trigger add scroll listener to autocomplete.
   *
   * @param e open autocomplete event.
   */
  public onOpen(e: void) {
    this.initializeScrollListener = true;
  }

  /**
   * Remove scroll listener to autocomplete.
   *
   * @param e close autocomplete event.
   */
  public onClose(e: void) {
    if (this.panel) {
      this.panel.nativeElement.removeEventListener('scroll', (event: any) =>
        this.scrollListener(event)
      );
    }
    this.loading = false;
  }

  /**
   * Needs to use a DoCheck directive in order to access the autocomplete panel
   * because it is not yet initialized in the opened event.
   */
  ngDoCheck() {
    if (this.initializeScrollListener) {
      const panel = this.autocomplete?.panel;
      if (panel) {
        this.panel = panel;
        this.panel.nativeElement.addEventListener('scroll', (event: any) =>
          this.scrollListener(event)
        );
        this.initializeScrollListener = false;
      }
    }
  }

  /**
   * Scroll listener to emit when more forms are needed to load.
   */
  private scrollListener(event: any): void {
    if (
      !this.loading &&
      event.target.scrollHeight -
        (event.target.clientHeight + event.target.scrollTop) <
        50
    ) {
      this.loading = true;
      this.scrolled.emit(true);
      console.log('scrolled');
    }
  }
}
