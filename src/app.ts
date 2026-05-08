import express, { urlencoded } from 'express';
import helmet from 'helmet';
import { Request, Response } from 'express';
import logger from '#config/logger.js';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';

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

app.get('/', (req: Request, res: Response) => {
  logger.info('Hello from acquisitions!');
  res.status(200).send('Hello from acquisitions!');
});

export default app;
