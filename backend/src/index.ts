import './config/env';
import express from 'express';
import cors from 'cors';
import { Prisma } from '@prisma/client';
import { apiRouter } from './routes';
import { runWithAuth } from './middlewares/auth';
import { sendError } from './middlewares/error';

// Keep money values as tagged decimals so the frontend can restore Decimal.
(Prisma.Decimal.prototype as unknown as { toJSON: () => { __decimal: string } }).toJSON = function toJSON() {
  return { __decimal: this.toString() };
};

const app = express();
const port = Number(process.env.PORT || 4000);
const origins = (process.env.FRONTEND_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: origins,
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));

app.use((req, _res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  runWithAuth(token, () => next());
});

app.use('/api', apiRouter);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[api]', error);
  if (res.headersSent) return;
  sendError(res, error);
});

app.listen(port, () => {
  console.log(`Chivon API listening on http://localhost:${port}`);
});
