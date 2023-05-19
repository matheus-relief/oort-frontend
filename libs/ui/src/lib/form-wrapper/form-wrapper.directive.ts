import {
  AfterContentInit,
  ContentChildren,
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  QueryList,
  Renderer2,
} from '@angular/core';
import { SuffixDirective } from './suffix.directive';
import { PrefixDirective } from './prefix.directive';
import { Subject, startWith, takeUntil } from 'rxjs';

/**
 * UI Form Wrapper Directive
 */
@Directive({
  selector: '[uiFormFieldDirective]',
})
export class FormWrapperDirective implements AfterContentInit, OnDestroy {
  /**
   * Will the form field be wrapped ?
   */
  @Input() outline = false;

  // === GET THE ELEMENTS ON WHICH SUFFIX/PREFIX ARE APPLIED ===
  @ContentChildren(SuffixDirective)
  private allSuffixDirectives: QueryList<SuffixDirective> = new QueryList();
  @ContentChildren(PrefixDirective)
  private allPrefixDirectives: QueryList<PrefixDirective> = new QueryList();

  private currentInputElement!: HTMLInputElement;
  private currentLabelElement!: HTMLLabelElement;
  private beyondLabelContainer!: HTMLDivElement;

  // === LISTS OF CLASSES TO APPLY TO ELEMENTS ===
  private labelClasses = [
    'block',
    'text-sm',
    'font-medium',
    'leading-6',
    'text-gray-900',
  ] as const;

  private inputClassesNoOutline = [
    'bg-transparent',
    'block',
    'overflow-hidden',
    'border-0',
    'rounded-md',
    'w-full',
    'p-0',
    'text-gray-900',
    'placeholder:text-gray-400',
    'sm:text-sm',
    'sm:leading-6',
    'focus:ring-0',
    'focus:ring-inset',
  ] as const;

  private inputClassesOutline = [
    'bg-transparent',
    'block',
    'w-full',
    'border-0',
    'p-0',
    'bg-gray-50',
    'text-gray-900',
    'placeholder:text-gray-400',
    'focus:ring-0',
    'sm:text-sm',
    'sm:leading-6',
  ] as const;

  private beyondLabelGeneral = [
    'relative',
    'mt-0.5',
    'py-1.5',
    'px-2',
    'flex',
    'items-center',
    'w-full',
  ] as const;

  private beyondLabelNoOutline = [
    'focus-within:ring-2',
    'focus-within:ring-inset',
    'focus-within:ring-primary-600',
    'shadow-sm',
    'rounded-md',
    'border-0',
    'ring-1',
    'ring-inset',
    'ring-gray-300',
  ] as const;

  private beyondLabelOutline = [
    'bg-gray-50',
    'border-0',
    'border-b',
    'border-b-gray-300',
    'focus-within:border-b-2',
    'focus-within:border-b-primary-600',
  ] as const;
  private destroy$ = new Subject<void>();

  /**
   * Constructor including a ref to the element on which the directive is applied
   * and the renderer.
   *
   * @param renderer renderer
   * @param elementRef references to the element on which the directive is applied
   */
  constructor(private renderer: Renderer2, private elementRef: ElementRef) {}

  ngAfterContentInit() {
    // Get inner input and label elements
    this.currentInputElement =
      this.elementRef.nativeElement.querySelector('input');
    this.currentLabelElement =
      this.elementRef.nativeElement.querySelector('label');

    // Creating a wrapper to all that is not label and give it appropriate classes
    // depending of outline value
    this.beyondLabelContainer = this.renderer.createElement('div');
    for (const cl of this.beyondLabelGeneral) {
      this.renderer.addClass(this.beyondLabelContainer, cl);
    }
    if (!this.outline) {
      for (const cl of this.beyondLabelNoOutline) {
        this.renderer.addClass(this.beyondLabelContainer, cl);
      }
    } else {
      for (const cl of this.beyondLabelOutline) {
        this.renderer.addClass(this.beyondLabelContainer, cl);
      }
    }

    // Add related classes to input element
    if (!this.outline) {
      for (const cl of this.inputClassesNoOutline) {
        this.renderer.addClass(this.currentInputElement, cl);
      }
    } else {
      for (const cl of this.inputClassesOutline) {
        this.renderer.addClass(this.currentInputElement, cl);
      }
    }

    // Then add the input to our beyondLabel wrapper element
    this.renderer.appendChild(
      this.beyondLabelContainer,
      this.currentInputElement
    );

    if (this.currentLabelElement) {
      // Add related classes to label
      for (const cl of this.labelClasses) {
        this.renderer.addClass(this.currentLabelElement, cl);
      }
    }
    this.initializeDirectiveListeners();

    //Add beyond label as a child of elementRef
    this.renderer.appendChild(
      this.elementRef.nativeElement,
      this.beyondLabelContainer
    );
  }

  /**
   * Initialize any DOM change/add/removal of the elements with prefix and suffix directives
   */
  private initializeDirectiveListeners() {
    this.allPrefixDirectives.changes
      .pipe(startWith(this.allPrefixDirectives), takeUntil(this.destroy$))
      .subscribe({
        next: (prefixes: QueryList<PrefixDirective>) => {
          for (const prefix of prefixes) {
            const prefixRef = (prefix as any).elementRef.nativeElement;
            if (!this.beyondLabelContainer.contains(prefixRef)) {
              this.applyPrefixClasses(prefixRef);
              this.renderer.appendChild(this.beyondLabelContainer, prefixRef);
            }
          }
        },
      });
    this.allSuffixDirectives.changes
      .pipe(startWith(this.allSuffixDirectives), takeUntil(this.destroy$))
      .subscribe({
        next: (suffixes: QueryList<SuffixDirective>) => {
          for (const suffix of suffixes) {
            const suffixRef = (suffix as any).elementRef.nativeElement;
            if (!this.beyondLabelContainer.contains(suffixRef)) {
              this.applySuffixClasses(suffixRef);
              this.renderer.appendChild(this.beyondLabelContainer, suffixRef);
            }
          }
        },
      });
  }

  /**
   * Update prefix element with the needed classes
   *
   * @param prefixElement prefix directive element
   */
  private applyPrefixClasses(prefixElement: any) {
    this.renderer.addClass(prefixElement, 'order-first');
    this.renderer.addClass(prefixElement, 'pr-2');
  }

  /**
   * Update suffix element with the needed classes
   *
   * @param suffixElement suffix directive element
   */
  private applySuffixClasses(suffixElement: any) {
    this.renderer.addClass(suffixElement, 'order-last');
    this.renderer.addClass(suffixElement, 'pl-2');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
