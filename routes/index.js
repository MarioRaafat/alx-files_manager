import {getStats, getStatus} from '../controllers/AppController.js';
import { getMe, postNew } from '../controllers/UsersController.js';
import { getConnect, getDisconnect } from '../controllers/AuthController.js';
import { postUpload, getShow, getIndex, putPublish, putUnpublish, getFile } from '../controllers/FilesController.js';
import { APIError, errorResponse } from '../middlewares/error.js';
import { Authenticate, xTokenAuthenticate } from '../middlewares/authMiddleware.js';

const injectRoutes = (server) => {
    server.get('/status', getStatus);
    server.get('/stats', getStats);

    server.post('/users', postNew);
    server.get('/users/me', xTokenAuthenticate, getMe);

    server.get('/connect', Authenticate, getConnect);
    server.get('/disconnect', xTokenAuthenticate, getDisconnect);

    server.post('/files', xTokenAuthenticate, postUpload);
    server.get('/files/:id', xTokenAuthenticate, getShow);
    server.get('/files', xTokenAuthenticate, getIndex);
    server.put('/files/:id/publish', xTokenAuthenticate, putPublish);
    server.put('/files/:id/unpublish', xTokenAuthenticate, putUnpublish);
    server.get('/files/:id/data', getFile);

    server.all('*', (req, res, next) => {
        errorResponse(new APIError(404, `Cannot ${req.method} ${req.url}`), req, res, next);
    });
    server.use(errorResponse);
};

export default injectRoutes;
