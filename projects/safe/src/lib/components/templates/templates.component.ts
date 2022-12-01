import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';

import { SafeEditTemplateComponent } from './components/edit-template/edit-template.component';
import { SafeConfirmModalComponent } from '../confirm-modal/confirm-modal.component';
import { TranslateService } from '@ngx-translate/core';
import { SafeApplicationService } from '../../services/application.service';
import { TemplateTypeEnum } from '../../models/template.model';

/**
 * A component to display the list of templates
 */
@Component({
  selector: 'safe-templates',
  templateUrl: './templates.component.html',
  styleUrls: ['./templates.component.scss'],
})
export class SafeTemplatesComponent implements OnInit {
  // === INPUT DATA ===
  public templates: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  @Input() applicationService!: SafeApplicationService;

  // === DISPLAYED COLUMNS ===
  public displayedColumns = ['name', 'type', 'actions'];

  loading = false;

  /**
   * Constructor of the templates component
   *
   * @param dialog The material dialog service
   * @param translate The translation service
   */
  constructor(public dialog: MatDialog, private translate: TranslateService) {}

  ngOnInit(): void {
    this.applicationService.application$.subscribe((value) => {
      this.templates.data = value?.templates || [];
    });
  }

  /**
   * Show a dialog to edit a template
   *
   * @param template The template to edit
   */
  editEmailTemplate(template: any): void {
    const dialogRef = this.dialog.open(SafeEditTemplateComponent, {
      data: template,
    });
    dialogRef.afterClosed().subscribe((value) => {
      if (value)
        this.applicationService.editTemplate({
          id: template.id,
          name: value.name,
          type: TemplateTypeEnum.EMAIL,
          content: {
            subject: value.subject,
            body: value.body,
          },
        });
    });
  }

  /**
   * Show a dialog to confirm the deletion of a template
   *
   * @param template The template id to be deleted
   */
  deleteTemplate(template: any): void {
    const dialogRef = this.dialog.open(SafeConfirmModalComponent, {
      data: {
        title: this.translate.instant('common.deleteObject', {
          name: this.translate.instant('common.template.one'),
        }),
        content: this.translate.instant(
          'components.templates.delete.confirmationMessage',
          {
            name: template.name,
          }
        ),
        confirmText: this.translate.instant('components.confirmModal.delete'),
        cancelText: this.translate.instant('components.confirmModal.cancel'),
        confirmColor: 'warn',
      },
    });
    dialogRef.afterClosed().subscribe((value) => {
      if (value) {
        this.applicationService.deleteTemplate(template.id);
      }
    });
  }

  /** Opens modal for adding a new email template */
  addEmailTemplate(): void {
    const dialogRef = this.dialog.open(SafeEditTemplateComponent, {
      data: {},
    });
    dialogRef.afterClosed().subscribe((value) => {
      if (value)
        this.applicationService.addTemplate({
          name: value.name,
          type: TemplateTypeEnum.EMAIL,
          content: {
            subject: value.subject,
            body: value.body,
          },
        });
    });
  }
}