import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { tracing } from './middleware/tracing.js';
import { idempotency } from './middleware/idempotency.js';
import shippingRoutes from './routes/shipping.routes.js';
import { errorHandler } from './common/error.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: true, credentials: true, exposedHeaders: ['x-trace-id'] }));
app.use(express.json());

app.use(tracing());
app.use(idempotency());

app.get('/v1/health', (_req, res) => res.json({ ok: true }));
app.use('/v1/shipping', shippingRoutes);

app.use(errorHandler);
export default app;
