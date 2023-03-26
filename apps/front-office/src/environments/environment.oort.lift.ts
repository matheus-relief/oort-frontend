import { AuthConfig } from 'angular-oauth2-oidc';
import { theme } from '../themes/oort/oort.prod';
import { sharedEnvironment } from './environment.shared';

/**
 * Authentification configuration
 */
const authConfig: AuthConfig = {
  issuer: 'https://id-lift.oortcloud.tech/auth/realms/oort',
  redirectUri: 'https://lift.oortcloud.tech/',
  postLogoutRedirectUri: 'https://lift.oortcloud.tech/auth/',
  clientId: 'oort-client',
  scope: 'openid profile email offline_access',
  responseType: 'code',
  showDebugInformation: true,
};

/**
 * Environment file for local development.
 */
export const environment = {
  ...sharedEnvironment,
  production: true,
  apiUrl: 'https://lift.oortcloud.tech/api',
  subscriptionApiUrl: 'wss://lift.oortcloud.tech/api',
  frontOfficeUri: 'https://lift.oortcloud.tech',
  backOfficeUri: 'https://lift.oortcloud.tech/admin/',
  availableLanguages: ['en', 'fr'],
  authConfig,
  esriApiKey: '',
  theme,
};