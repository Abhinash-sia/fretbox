import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import academicRoutes from './academic.routes.js';

const apiV1Router = Router();

// Mount feature routers under version 1
apiV1Router.use('/', healthRoutes);
apiV1Router.use('/auth', authRoutes);
apiV1Router.use('/academic', academicRoutes);

export default apiV1Router;
