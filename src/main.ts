import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { initializeQmsDashboardBeacon } from './app/qms-dashboard-beacon';

initializeQmsDashboardBeacon();
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
