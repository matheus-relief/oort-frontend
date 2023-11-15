import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  Application,
  ApplicationService,
  UnsubscribeComponent,
} from '@oort-front/shared';
import { takeUntil } from 'rxjs/operators';

/**
 * Role summary page
 */
@Component({
  selector: 'oort-app-role-summary',
  templateUrl: './role-summary.component.html',
  styleUrls: ['./role-summary.component.scss'],
})
export class RoleSummaryComponent
  extends UnsubscribeComponent
  implements OnInit
{
  public id = '';
  public application!: Application;

  /**
   * Role summary page
   *
   * @param route Angular current route
   * @param applicationService Shared application service
   */
  constructor(
    private route: ActivatedRoute,
    public applicationService: ApplicationService
  ) {
    super();
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((val: any) => {
      this.id = val.id;
    });
    this.applicationService.application$
      .pipe(takeUntil(this.destroy$))
      .subscribe((application: Application | null) => {
        if (application) {
          this.application = application;
        }
      });
  }
}
