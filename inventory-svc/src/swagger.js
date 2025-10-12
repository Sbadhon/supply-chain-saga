import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';

const serviceName = process.env.SERVICE_NAME || 'inventory-svc';

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: serviceName,
      version: '1.0.0',
      description: 'Supply Chain Saga API',
    },
    servers: [{ url: '/' }],
  },

  apis: [
    'src/routes/**/*.js',
    'src/controllers/**/*.js',
  ],
};

export function mountSwagger(app) {
  const spec = swaggerJSDoc(options);
  app.get('/v1/openapi.json', (_req, res) => res.json(spec));
  app.use('/v1/docs', swaggerUi.serve, swaggerUi.setup(spec, {
    swaggerOptions: { persistAuthorization: true },
  }));
}
