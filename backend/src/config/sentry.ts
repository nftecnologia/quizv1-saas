import * as Sentry from '@sentry/node';
import { Express } from 'express';

export const initSentry = (app: Express) => {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      integrations: [
        // Enable tracing
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app }),
      ],
      // Performance Monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      // Release tracking
      release: process.env.npm_package_version || '1.0.0',
    });

    // The request handler must be the first middleware on the app
    app.use(Sentry.Handlers.requestHandler());
    
    // TracingHandler creates a trace for every incoming request
    app.use(Sentry.Handlers.tracingHandler());
  }
};

export const sentryErrorHandler = Sentry.Handlers.errorHandler;

export { Sentry };