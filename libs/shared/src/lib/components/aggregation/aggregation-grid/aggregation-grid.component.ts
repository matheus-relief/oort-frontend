import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { GridDataResult, PageChangeEvent } from '@progress/kendo-angular-grid';
import { Apollo, QueryRef } from 'apollo-angular';
import {
  Aggregation,
  AggregationDataQueryResponse,
} from '../../../models/aggregation.model';
import { AggregationBuilderService } from '../../../services/aggregation-builder/aggregation-builder.service';
import { AggregationService } from '../../../services/aggregation/aggregation.service';
import { PAGER_SETTINGS } from './aggregation-grid.constants';
import { GET_RESOURCE } from './graphql/queries';
import { debounceTime, takeUntil } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { QueryBuilderService } from '../../../services/query-builder/query-builder.service';
import { GridService } from '../../../services/grid/grid.service';
import { ContextService } from '../../../services/context/context.service';
import { UnsubscribeComponent } from '../../utils/unsubscribe/unsubscribe.component';
import { ResourceQueryResponse } from '../../../models/resource.model';
import { SortDescriptor } from '@progress/kendo-data-query';
import { cloneDeep } from 'lodash';

/**
 * Shared aggregation grid component.
 */
@Component({
  selector: 'shared-aggregation-grid',
  templateUrl: './aggregation-grid.component.html',
  styleUrls: ['./aggregation-grid.component.scss'],
})
export class AggregationGridComponent
  extends UnsubscribeComponent
  implements OnInit, OnChanges
{
  /** Grid data */
  public gridData: GridDataResult = { data: [], total: 0 };
  /** Grid fields */
  public fields: any[] = [];
  /** Loading state */
  public loading = false;
  /** Loading settings state */
  public loadingSettings = false;
  /** Status */
  public status: {
    message?: string;
    error: boolean;
  } = {
    error: false,
  };
  /** Sort */
  public sort: SortDescriptor[] = [];
  /** Page size */
  public pageSize = 10;
  /** Skip */
  public skip = 0;
  /** Data query */
  private dataQuery!: QueryRef<AggregationDataQueryResponse>;
  /** Pager settings */
  public pagerSettings = PAGER_SETTINGS;
  /** Show filter */
  public showFilter = false;

  /** Resource id */
  @Input() resourceId!: string;
  /** Aggregation */
  @Input() aggregation!: Aggregation;
  /** Context filters to be used with dashboard filters */
  @Input() contextFilters: string | undefined;
  /** Version at to be used with dashboard filters */
  @Input() at: string | undefined;

  /** @returns The column menu */
  get columnMenu(): { columnChooser: boolean; filter: boolean } {
    return {
      columnChooser: false,
      filter: !this.showFilter,
    };
  }

  /** @returns current field used for sorting */
  get sortField(): string | null {
    return this.sort.length > 0 && this.sort[0].dir ? this.sort[0].field : null;
  }

  /** @returns current sorting order */
  get sortOrder(): string {
    return this.sort.length > 0 && this.sort[0].dir ? this.sort[0].dir : '';
  }

  /**
   * Shared aggregation grid component
   *
   * @param aggregationService Shared aggregation service
   * @param aggregationBuilderService Shared aggregation builder service
   * @param queryBuilder Shared query builder service
   * @param gridService Shared grid service
   * @param apollo Apollo service
   * @param translate Angular translate service
   * @param contextService Shared context service
   */
  constructor(
    private aggregationService: AggregationService,
    private aggregationBuilderService: AggregationBuilderService,
    private queryBuilder: QueryBuilderService,
    private gridService: GridService,
    private apollo: Apollo,
    private translate: TranslateService,
    private contextService: ContextService
  ) {
    super();
  }

  ngOnInit(): void {
    this.contextService.filter$
      .pipe(debounceTime(500), takeUntil(this.destroy$))
      .subscribe(() => {
        this.getAggregationData();
      });
    this.queryBuilder.isDoneLoading$.subscribe((doneLoading) => {
      if (doneLoading) {
        this.getAggregationFields();
      }
    });
  }

  ngOnChanges(): void {
    this.getAggregationData();
    this.getAggregationFields();
  }

  /**
   * Get aggregation data from aggregation id and resource id
   */
  private getAggregationData(): void {
    this.loading = true;
    this.dataQuery = this.aggregationService.aggregationDataWatchQuery(
      this.resourceId,
      this.aggregation.id as string,
      this.pageSize,
      this.skip,
      this.contextFilters
        ? this.contextService.injectContext(JSON.parse(this.contextFilters))
        : undefined,
      this.at ? this.contextService.atArgumentValue(this.at) : undefined
    );
    this.dataQuery.valueChanges.pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ data, loading }) => {
        this.updateValues(data, loading);
      },
      error: (err: any) => {
        this.loading = false;
        this.setErrorStatus(
          err,
          'components.widget.grid.errors.queryFetchFailed'
        );
      },
    });
  }

  /**
   * Set error status given error and translation key for the error message
   *
   * @param err error type
   * @param translationKey translation key used to build the error message
   */
  private setErrorStatus(err: any, translationKey: string) {
    this.status = {
      error: true,
      message: this.translate.instant(translationKey, {
        error:
          err.networkError?.error?.errors
            ?.map((x: any) => x.message)
            .join(', ') || err,
      }),
    };
  }

  /**
   * Get list of aggregation fields
   */
  private getAggregationFields(): void {
    this.loadingSettings = true;
    this.apollo
      .query<ResourceQueryResponse>({
        query: GET_RESOURCE,
        variables: {
          id: this.resourceId,
        },
      })
      .subscribe({
        next: ({ data }) => {
          const resource = data.resource;
          const fields = this.queryBuilder.getFields(resource.queryName || '');
          const selectedFields = this.aggregation.sourceFields
            .map((x: string) => {
              const field = fields.find((y) => x === y.name);
              if (!field) return null;
              if (field.type.kind !== 'SCALAR') {
                Object.assign(field, {
                  fields: this.queryBuilder.deconfineFields(
                    field.type,
                    new Set().add(resource.name).add(field.type.ofType?.name)
                  ),
                });
              }
              return field;
            })
            .filter((x: any) => x !== null);
          const aggregationFields = this.aggregationBuilderService.fieldsAfter(
            selectedFields,
            this.aggregation?.pipeline
          );
          this.fields = this.gridService.getFields(
            aggregationFields,
            null,
            null
          );
          this.loadingSettings = false;
          this.status = {
            error: false,
          };
        },
        error: (err: any) => {
          this.loadingSettings = false;
          this.setErrorStatus(
            err,
            'components.widget.grid.errors.metaQueryFetchFailed'
          );
        },
      });
  }

  /**
   * Detects sort events and update the items loaded.
   *
   * @param sort Sort event.
   */
  public onSortChange(sort: SortDescriptor[]): void {
    this.sort = sort;
    this.skip = 0;
    this.onPageChange({ skip: this.skip, take: this.pageSize });
  }

  /**
   * Detects pagination events and update the items loaded.
   *
   * @param event Page change event.
   */
  public onPageChange(event: PageChangeEvent): void {
    this.loading = true;
    this.skip = event.skip;
    this.pageSize = event.take;

    this.dataQuery
      .fetchMore({
        variables: {
          first: this.pageSize,
          skip: this.skip,
          sortField: this.sortField || undefined,
          sortOrder: this.sortOrder,
        },
      })
      .then((results) => this.updateValues(results.data, results.loading));
  }

  /**
   * Update aggregation data value
   *
   * @param data query response data
   * @param loading loading status
   */
  private updateValues(data: AggregationDataQueryResponse, loading: boolean) {
    this.gridData = {
      data: cloneDeep(data.recordsAggregation.items),
      total: data.recordsAggregation.totalCount,
    };
    this.loading = loading;
  }
}
