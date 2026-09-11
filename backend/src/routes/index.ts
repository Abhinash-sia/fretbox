import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import academicRoutes from './academic.routes.js';
import hostelRoutes from './hostel.routes.js';
import facilityRoutes from './facility.routes.js';
import complaintRoutes from './complaint.routes.js';
import messRoutes from './mess.routes.js';
import gatePassRoutes from './gatePass.routes.js';
import gateEventRoutes from './gateEvent.routes.js';

const apiV1Router = Router();

// Mount feature routers under version 1
apiV1Router.use('/', healthRoutes);
apiV1Router.use('/auth', authRoutes);
apiV1Router.use('/academic', academicRoutes);
apiV1Router.use('/hostels', hostelRoutes);
apiV1Router.use('/facilities', facilityRoutes);
apiV1Router.use('/complaints', complaintRoutes);
apiV1Router.use('/mess', messRoutes);
apiV1Router.use('/gate-passes', gatePassRoutes);
apiV1Router.use('/gate-events', gateEventRoutes);

export default apiV1Router;
