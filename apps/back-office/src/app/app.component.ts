import { Component, OnInit } from '@angular/core';
import {
  GeofieldsListboxComponent,
  ApplicationDropdownComponent,
  AuthService,
  ReferenceDataDropdownComponent,
  ResourceAvailableFieldsComponent,
  ResourceCustomFiltersComponent,
  ResourceDropdownComponent,
  ResourceSelectTextComponent,
  TestServiceDropdownComponent,
} from '@oort-front/shared';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../environments/environment';

/**
 * Root component of back-office.
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  /** Static component declaration of survey custom components for the property grid editor in order to avoid removal on tree shake for production build */
  static declaration = [
    ApplicationDropdownComponent,
    GeofieldsListboxComponent,
    ReferenceDataDropdownComponent,
    ResourceAvailableFieldsComponent,
    ResourceCustomFiltersComponent,
    ResourceDropdownComponent,
    ResourceSelectTextComponent,
    TestServiceDropdownComponent,
  ];
  /** Application title */
  title = 'back-office';

  /**
   * Root component of back-office
   *
   * @param authService Shared authentication service
   * @param translate Angular translate service
   */
  constructor(
    private authService: AuthService,
    private translate: TranslateService
  ) {
    this.translate.addLangs(environment.availableLanguages);
    this.translate.setDefaultLang(environment.availableLanguages[0]);
  }

  /**
   * Configuration of the Authentication behavior
   */
  ngOnInit(): void {
    this.authService.initLoginSequence();
  }
}
