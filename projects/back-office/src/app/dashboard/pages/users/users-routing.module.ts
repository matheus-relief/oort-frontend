import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UsersComponent } from './users.component';

const routes: Routes = [
  {
    path: '',
    component: UsersComponent,
  },
  {
    path: 'advanced-settings',
    loadChildren: () =>
      import('../advanced-settings/advanced-settings.module').then(
        (m) => m.AdvancedSettingsModule
      ),
    data: {
      breadcrumb: {
        key: 'components.users.advancedSettings.title',
      },
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UsersRoutingModule {}
