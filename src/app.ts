import express, { urlencoded } from 'express';
import helmet from 'helmet';
import { Request, Response } from 'express';
import logger from '#config/logger.js';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from '#routes/auth.routes.js';
import usersRoutes from '#routes/users.routes.js';
import securityMiddleware from '#middleware/security.middleware.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  morgan('combined', {
    stream: { write: message => logger.info(message.trim()) },
  })
);

app.use(securityMiddleware);

app.get('/', (req: Request, res: Response) => {
  logger.info('Hello from acquisitions!');
  res.status(200).send('Hello from acquisitions!');
});

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'Ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/api', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Acquisition API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);

export default app;
