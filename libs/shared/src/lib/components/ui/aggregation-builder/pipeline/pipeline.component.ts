import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormArray } from '@angular/forms';
import { AggregationBuilderService } from '../../../../services/aggregation-builder/aggregation-builder.service';
import { Observable } from 'rxjs';
import { PipelineStage } from './pipeline-stage.enum';
import { addStage } from '../aggregation-builder-forms';
import { combineLatestWith } from 'rxjs/operators';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { UnsubscribeComponent } from '../../../utils/unsubscribe/unsubscribe.component';
import { takeUntil, distinctUntilChanged } from 'rxjs/operators';
import { isEqual } from 'lodash';

/**
 * Aggregation pipeline component.
 */
@Component({
  selector: 'shared-pipeline',
  templateUrl: './pipeline.component.html',
  styleUrls: ['./pipeline.component.scss'],
})
export class PipelineComponent extends UnsubscribeComponent implements OnInit {
  /** Public variable for stage type. */
  public stageType = PipelineStage;
  /** Array to hold the list of stages. */
  public stageList: string[] = Object.values(PipelineStage);
  /** Input decorator for fields$. */
  @Input() public fields$!: Observable<any[]>;
  /** Input decorator for metaFields$. */
  @Input() public metaFields$!: Observable<any[]>;
  /** Input decorator for filterFields$. */
  @Input() public filterFields$!: Observable<any[]>;
  /** Array to hold the filter fields. */
  public filterFields: any[] = [];

  /** Array to hold the meta fields. */
  public metaFields: any[] = [];
  /** Array to hold the initial fields. */
  public initialFields: any[] = [];
  /** Array to hold the fields per stage. */
  public fieldsPerStage: any[] = [];
  /** Enabled drag behavior, needed to set the drag on run time so cdkDragHandle directive works in the table */
  public dragEnabled = false;
  /** Input decorator for pipelineForm. */
  @Input() pipelineForm!: UntypedFormArray;

  /**
   * Aggregation pipeline component.
   *
   * @param aggregationBuilder Shared aggregation builder
   */
  constructor(private aggregationBuilder: AggregationBuilderService) {
    super();
  }

  ngOnInit(): void {
    this.fields$
      .pipe(
        combineLatestWith(this.metaFields$, this.filterFields$),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: ([fields, metaFields, filterFields]) => {
          this.initialFields = [...fields];
          this.metaFields = metaFields;
          this.filterFields = filterFields;
          this.fieldsPerStage = [];
          this.updateFieldsPerStage(this.pipelineForm.value);
        },
      });

    this.pipelineForm.valueChanges
      .pipe(distinctUntilChanged(isEqual), takeUntil(this.destroy$))
      .subscribe((pipeline: any[]) => {
        this.updateFieldsPerStage(pipeline);
      });
  }

  /**
   * Updates fields for the stage.
   *
   * @param pipeline list of pipeline stages.
   */
  private updateFieldsPerStage(pipeline: any[]): void {
    for (let index = 0; index < pipeline.length; index++) {
      if (pipeline[index].type === PipelineStage.FILTER) {
        this.fieldsPerStage[index] = this.aggregationBuilder.fieldsAfter(
          this.initialFields.map((field: any) => ({
            ...field,
            ...(this.filterFields.find(
              (filterField: any) => filterField.name === field.name
            ) ?? {}),
          })),
          pipeline.slice(0, index)
        );
      } else {
        this.fieldsPerStage[index] = this.aggregationBuilder.fieldsAfter(
          this.initialFields,
          pipeline.slice(0, index)
        );
        if (pipeline[index]?.type === PipelineStage.SORT) {
          this.fieldsPerStage[index] = this.fieldsPerStage[index].filter(
            (field: any) => field.type.kind === 'SCALAR'
          );
        }
      }
    }
  }

  /**
   * Adds a stage to the aggregation pipeline.
   *
   * @param type type of stage
   */
  public addStage(type: string) {
    this.pipelineForm.push(addStage({ type }));
  }

  /**
   * Deletes a stage at specified index.
   *
   * @param index index of stage to remove in pipeline.
   */
  public deleteStage(index: number) {
    this.pipelineForm.removeAt(index);
  }

  /**
   * Moves an element in array.
   *
   * @param event positions to move.
   */
  drop(event: CdkDragDrop<string[]>) {
    const temp = this.pipelineForm.at(event.previousIndex);

    this.pipelineForm.removeAt(event.previousIndex);
    this.pipelineForm.insert(event.currentIndex, temp);
  }
}
