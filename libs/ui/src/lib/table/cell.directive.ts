import { CdkCell, CdkColumnDef } from '@angular/cdk/table';
import {
  AfterContentInit,
  Directive,
  ElementRef,
  Renderer2,
} from '@angular/core';

/**
 * Ui Cell Directive
 */
@Directive({
  selector: '[uiCell]',
})
export class CellDirective extends CdkCell implements AfterContentInit {
  /**
   * Ui Cell Directive
   *
   * @param columnDef column def associated with element
   * @param elRef Element linked to where the directive is used
   * @param renderer renderer2
   */
  constructor(
    private columnDef: CdkColumnDef,
    private elRef: ElementRef,
    private renderer: Renderer2
  ) {
    super(columnDef, elRef);
  }

  /** Cell classes */
  classes = [
    'whitespace-nowrap',
    'h-16',
    'pl-4',
    'pr-3',
    'text-sm',
    'text-gray-500',
    'text-ellipsis',
    'overflow-hidden',
  ];

  ngAfterContentInit(): void {
    // Adds a background color to all cells matching the row color
    this.elRef.nativeElement.style['background-color'] = 'inherit';

    const classList = [
      ...this.elRef.nativeElement.classList,
      ...this.classes,
    ].join(' ');
    this.renderer.setProperty(this.elRef.nativeElement, 'classList', classList);
  }
}
