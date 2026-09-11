import { pinoHttp } from 'pino-http';
import { IncomingMessage, ServerResponse } from 'http';
import { logger } from '../config/logger.js';

export const loggerMiddleware = pinoHttp({
  logger,
  customLogLevel(_req: IncomingMessage, res: ServerResponse, err?: Error) {
    if (res.statusCode >= 500 || err) {
      return 'error';
    }
    if (res.statusCode >= 400) {
      return 'warn';
    }
    return 'info';
  },
  serializers: {
    req(req: IncomingMessage & { id?: string | number; query?: unknown; params?: unknown }) {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
        query: req.query,
        params: req.params,
        headers: {
          host: req.headers.host,
          'user-agent': req.headers['user-agent'],
          'content-type': req.headers['content-type'],
        },
      };
    },
    res(res: ServerResponse) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
});
