import { Apollo, QueryRef } from 'apollo-angular';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { Application, Channel, Form, Subscription } from '@safe/builder';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  GetRoutingKeysQueryResponse,
  GET_ROUTING_KEYS,
  GET_FORM_NAMES,
  GetFormsQueryResponse,
} from '../../graphql/queries';
import { map, startWith } from 'rxjs/operators';
import { MatLegacyAutocomplete as MatAutocomplete } from '@angular/material/legacy-autocomplete';
import get from 'lodash/get';

/** Items per query for pagination */
const ITEMS_PER_PAGE = 10;

/**
 * Subscription modal component
 */
@Component({
  selector: 'app-subscription-modal',
  templateUrl: './subscription-modal.component.html',
  styleUrls: ['./subscription-modal.component.scss'],
})
export class SubscriptionModalComponent implements OnInit {
  // === REACTIVE FORM ===
  subscriptionForm: UntypedFormGroup = new UntypedFormGroup({});

  // === DATA ===
  public formsQuery!: QueryRef<GetFormsQueryResponse>;

  // === DATA ===
  private applications = new BehaviorSubject<Application[]>([]);
  public filteredApplications$!: Observable<Application[]>;
  public applications$!: Observable<Application[]>;
  private applicationsQuery!: QueryRef<GetRoutingKeysQueryResponse>;
  private applicationsPageInfo = {
    endCursor: '',
    hasNextPage: true,
  };
  private applicationsLoading = true;

  @ViewChild('applicationSelect') applicationSelect?: MatAutocomplete;

  /** @returns subscription routing key */
  get routingKey(): string {
    return this.subscriptionForm.value.routingKey;
  }

  /**
   * Set subscription key
   */
  set routingKey(value: string) {
    this.subscriptionForm.controls.routingKey.setValue(value);
  }

  /** @returns default convert to form */
  get defaultForm(): Form | null {
    return get(this.data, 'subscription.convertTo', null);
  }

  /**
   * Subscription modal component
   *
   * @param formBuilder Angular form builder
   * @param dialogRef Material dialog ref
   * @param apollo Apollo service
   * @param data Injected dialog data
   * @param data.channels list of channels
   * @param data.subscription subscription
   */
  constructor(
    private formBuilder: UntypedFormBuilder,
    public dialogRef: MatDialogRef<SubscriptionModalComponent>,
    private apollo: Apollo,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      channels: Channel[];
      subscription?: Subscription;
    }
  ) {}

  ngOnInit(): void {
    this.subscriptionForm = this.formBuilder.group({
      routingKey: [
        this.data.subscription ? this.data.subscription.routingKey : '',
        Validators.required,
      ],
      title: [
        this.data.subscription ? this.data.subscription.title : '',
        Validators.required,
      ],
      convertTo: [
        this.data.subscription && this.data.subscription.convertTo
          ? this.data.subscription.convertTo.id
          : '',
      ],
      channel: [
        this.data.subscription && this.data.subscription.channel
          ? this.data.subscription.channel.id
          : '',
      ],
    });

    // Get applications and set pagination logic
    this.applicationsQuery =
      this.apollo.watchQuery<GetRoutingKeysQueryResponse>({
        query: GET_ROUTING_KEYS,
        variables: {
          first: ITEMS_PER_PAGE,
        },
      });

    // this.applications$ = this.applications.asObservable();
    this.applicationsQuery.valueChanges.subscribe(({ data, loading }) => {
      this.applications.next(
        data.applications.edges
          .map((x) => x.node)
          .filter((x) => (x.channels ? x.channels.length > 0 : false))
      );
      this.applicationsPageInfo = data.applications.pageInfo;
      this.applicationsLoading = loading;
      this.applications$ =
        this.subscriptionForm.controls.routingKey.valueChanges.pipe(
          startWith(''),
          map((value) => (typeof value === 'string' ? value : value.name)),
          map((x) => this.filter(x))
        );
    });

    this.formsQuery = this.apollo.watchQuery<GetFormsQueryResponse>({
      query: GET_FORM_NAMES,
      variables: {
        first: ITEMS_PER_PAGE,
        sortField: 'name',
      },
    });
  }

  /**
   * Filter list of applications
   *
   * @param value value to search with
   * @returns filtered list of applications.
   */
  private filter(value: string): Application[] {
    const filterValue = value.toLowerCase();
    const applications = this.applications.getValue();
    return applications
      ? applications.filter(
          (x) => x.name?.toLowerCase().indexOf(filterValue) === 0
        )
      : applications;
  }

  /** Close the modal without sending any data. */
  onClose(): void {
    this.dialogRef.close();
  }

  /**
   * Adds scroll listener to auto complete.
   */
  onOpenApplicationSelect(): void {
    if (this.applicationSelect) {
      const panel = this.applicationSelect.panel.nativeElement;
      if (panel) {
        panel.onscroll = (event: any) => this.loadOnScrollApplication(event);
      }
    }
  }

  /**
   * Fetches more applications on scroll.
   *
   * @param e scroll event.
   */
  private loadOnScrollApplication(e: any): void {
    if (
      e.target.scrollHeight - (e.target.clientHeight + e.target.scrollTop) <
      50
    ) {
      if (!this.applicationsLoading && this.applicationsPageInfo.hasNextPage) {
        this.applicationsLoading = true;
        this.applicationsQuery.fetchMore({
          variables: {
            first: ITEMS_PER_PAGE,
            afterCursor: this.applicationsPageInfo.endCursor,
          },
          // updateQuery: (prev, { fetchMoreResult }) => {
          //   if (!fetchMoreResult) {
          //     return prev;
          //   }
          //   return Object.assign({}, prev, {
          //     applications: {
          //       edges: [
          //         ...prev.applications.edges,
          //         ...fetchMoreResult.applications.edges,
          //       ],
          //       pageInfo: fetchMoreResult.applications.pageInfo,
          //       totalCount: fetchMoreResult.applications.totalCount,
          //     },
          //   });
          // },
        });
      }
    }
  }

  /**
   * Changes the query according to search text
   *
   * @param search Search text from the graphql select
   */
  onSearchChange(search: string): void {
    const variables = this.formsQuery.variables;
    this.formsQuery.refetch({
      ...variables,
      filter: {
        logic: 'and',
        filters: [
          {
            field: 'name',
            operator: 'contains',
            value: search,
          },
        ],
      },
    });
  }
}
