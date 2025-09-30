import 'dotenv/config';
import app from './app.js';
import { bootstrapDb } from './db.js';

const port = process.env.PORT || 3004;

bootstrapDb()
  .then(() => {
    app.listen(port, () => console.log(`shipping-svc listening on :${port}`));
  })
  .catch((e) => {
    console.error('DB bootstrap failed:', e);
    process.exit(1);
  });
