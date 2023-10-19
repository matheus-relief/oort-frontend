import { AuthConfig } from 'angular-oauth2-oidc';
import { theme } from '../themes/default/default.dev';
import { sharedEnvironment } from './environment.shared';
import { Environment } from './environment.type';

/** Authentication configuration of the module. */
const authConfig: AuthConfig = {
  issuer:
    'https://login.microsoftonline.com/76d22fc8-2330-45cf-ab36-51074cf8f1e2/v2.0',
  redirectUri: 'https://emspoc.adapptlabs.com/',
  postLogoutRedirectUri: 'https://emspoc.adapptlabs.com/auth',
  clientId: 'db40357f-374e-476e-9ce8-5c9b3cbe475a',
  scope: 'openid profile email offline_access',
  responseType: 'code',
  showDebugInformation: true,
  strictDiscoveryDocumentValidation: false,
};

/** Environment configuration */
export const environment: Environment = {
  ...sharedEnvironment,
  production: true,
  apiUrl: 'https://emspoc.adapptlabs.com/api',
  subscriptionApiUrl: 'wss://emspoc.adapptlabs.com/api',
  frontOfficeUri: 'https://emspoc.adapptlabs.com/',
  backOfficeUri: 'https://emspoc.adapptlabs.com/backoffice/',
  availableLanguages: ['en'],
  authConfig,
  theme,
  // sentry: {
  //   environment: 'development',
  //   dns: 'https://da63b46285f94315b2d6f8e9c69d7c8c@o4505563078918144.ingest.sentry.io/4505563106312192',
  //   tracePropagationTargets: ['ems-safe-dev.who.int'],
  // },
};
