import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Application, User, WhoAuthService, WhoSnackBarService, WhoApplicationService, Permission, Permissions, ContentType } from '@who-ems/builder';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

  // === HEADER TITLE ===
  public title = '';
  public applications: Application[] = [];

  // === SUBSCRIPTIONS ===
  private authSubscription?: Subscription;
  public application: Application | null = null;
  private applicationSubscription?: Subscription;

  // === AVAILABLE ROUTES, DEPENDS ON USER ===
  private permissions: Permission[] = [];
  public navGroups: any[] = [];

  constructor(
    private authService: WhoAuthService,
    private applicationService: WhoApplicationService,
    private snackBar: WhoSnackBarService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.authSubscription = this.authService.user.subscribe((user: User | null) => {
      if (user) {
        const applications = user.applications || [];
        if (applications.length > 0) {
          this.applications = applications;
          this.applicationService.loadApplication(applications[0].id || '');
          this.permissions = user.permissions || [];
        } else {
          this.snackBar.openSnackBar('No access provided to the platform.', { error: true });
        }
      }
    });
    this.applicationSubscription = this.applicationService.application.subscribe((application: Application | null) => {
      if (application) {
        this.title = application.name || '';
        const adminNavItems: any[] = [];
        if (this.permissions.some(x => (x.type === Permissions.canSeeUsers && !x.global)
          || (x.type === Permissions.canManageApplications && x.global))) {
          adminNavItems.push({
            name: 'Users',
            path: './settings/users',
            icon: 'supervisor_account'
          });
        }
        if (this.permissions.some(x => (x.type === Permissions.canSeeRoles && !x.global)
          || (x.type === Permissions.canManageApplications && x.global))) {
          adminNavItems.push({
            name: 'Roles',
            path: './settings/roles',
            icon: 'admin_panel_settings'
          });
        }
        this.navGroups = [
          {
            name: 'Pages',
            navItems: application.pages?.filter(x => x.content).map(x => {
              return {
                name: x.name,
                path: `/${x.type}/${x.content}`,
                icon: this.getNavIcon(x.type || '')
              };
            })
          },
          {
            name: 'Administration',
            navItems: adminNavItems
          }
        ];
        if (!this.application || application.id !== this.application.id) {
          const [firstPage, ..._] = application.pages || [];
          if (firstPage) {
            this.router.navigate([`/${firstPage.type}/${firstPage.type === ContentType.form ? firstPage.id : firstPage.content}`]);
          } else {
            this.router.navigate([`/`]);
          }
        }
        this.application = application;
      } else {
        this.navGroups = [];
      }
    });
  }

  onOpenApplication(application: Application): void {
    this.applicationService.loadApplication(application.id || '');
  }

  private getNavIcon(type: string): string {
    switch (type) {
      case 'workflow':
        return 'linear_scale';
      case 'form':
        return 'description';
      default:
        return 'dashboard';
    }
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.applicationSubscription) {
      this.applicationSubscription.unsubscribe();
    }
  }

}
