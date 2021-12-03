import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Application, NOTIFICATIONS, SafeApplicationService, SafeConfirmModalComponent, SafeSnackBarService } from '@safe/builder';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-application-toolbar',
  templateUrl: './application-toolbar.component.html',
  styleUrls: ['./application-toolbar.component.scss']
})
export class ApplicationToolbarComponent implements OnInit, OnDestroy {

  // === APPLICATION ===
  public application: Application | null = null;
  private applicationSubscription?: Subscription;
  public locked: boolean  | undefined = undefined;
  public lockedByUser: boolean | undefined = undefined;
  public canPublish = false;
  public user: any;

  constructor(
    private applicationService: SafeApplicationService,
    private router: Router,
    public dialog: MatDialog,
    private snackBar: SafeSnackBarService
  ) { }

  ngOnInit(): void {
    this.applicationSubscription = this.applicationService.application.subscribe((application: Application | null) => {
      this.application = application;
      this.locked = this.application?.locked;
      this.lockedByUser = this.application?.lockedByUser;
      this.canPublish = !!this.application && this.application.pages ? this.application.pages.length > 0 : false;
    });
  }

  /**
   * Closes the application, go back to the back-office dashboard.
   */
  onClose(): void {
    this.router.navigate(['/applications']);
  }

  /**
   * Unlocks the application, and controls edition.
   */
  onUnlock(): void {
    const dialogRef = this.dialog.open(SafeConfirmModalComponent, {
      data: {
        title: 'Unlock edition',
        content: `Do you want to unlock ${this.application?.name}'s edition ?`,
        confirmText: 'Confirm',
        confirmColor: 'primary'
      }
    });
    dialogRef.afterClosed().subscribe(value => {
      this.applicationService.lockApplication();
    });
  }

  /**
   * Confirms publication of application, and makes it active.
   */
  onPublish(): void {
    if (this.locked && !this.lockedByUser) {
      this.snackBar.openSnackBar(NOTIFICATIONS.objectIsLocked(this.application?.name));
    } else {
      const dialogRef = this.dialog.open(SafeConfirmModalComponent, {
        data: {
          title: `Publish application`,
          content: `Do you confirm the publication of ${this.application?.name} ?`,
          confirmText: 'Confirm',
          confirmColor: 'primary'
        }
      });
      dialogRef.afterClosed().subscribe(value => {
        if (value) {
          this.applicationService.publish();
        }
      });
    }
  }

  /**
   * Removes all the subscriptions.
   */
  ngOnDestroy(): void {
    if (this.applicationSubscription) {
      this.applicationSubscription.unsubscribe();
    }
  }
}
