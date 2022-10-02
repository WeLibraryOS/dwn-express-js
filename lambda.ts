import serverlessHttp from 'serverless-http';
import app from './source/index';

export const handler = serverlessHttp(app);
