import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import shippingRoutes from './routes/shipping.routes.js';
import { errorHandler } from './common/error.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/v1/health', (_req, res) => res.json({ ok: true }));
app.use('/v1/shipping', shippingRoutes);
app.use(errorHandler);

export default app;
