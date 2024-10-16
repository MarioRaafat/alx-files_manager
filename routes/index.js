import {getStats, getStatus} from '../controllers/AppController.js';
import { APIError, errorResponse } from '../middlewares/error.js';

const injectRoutes = (server) => {
  server.get('/status', getStatus);
  server.get('/stats', getStats);


  server.all('*', (req, res, next) => {
    errorResponse(new APIError(404, `Cannot ${req.method} ${req.url}`), req, res, next);
  });
  server.use(errorResponse);
};

export default injectRoutes;
