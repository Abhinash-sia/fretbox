import { Router } from 'express';
import healthRoutes from '../modules/health/routes/health.routes.js';
import authRoutes from '../modules/auth/routes/auth.routes.js';
import academicRoutes from '../modules/academic/routes/academic.routes.js';
import hostelRoutes from '../modules/hostel/routes/hostel.routes.js';
import facilityRoutes from '../modules/hostel/routes/facility.routes.js';
import complaintRoutes from '../modules/complaints/routes/complaint.routes.js';
import messRoutes from '../modules/hostel/routes/mess.routes.js';
import gatePassRoutes from '../modules/gate-pass/routes/gatePass.routes.js';
import gateEventRoutes from '../modules/gate-pass/routes/gateEvent.routes.js';
import communicationRoutes from '../modules/communication/routes/communication.routes.js';
import analyticsRoutes from '../modules/analytics/routes/analytics.routes.js';
import faqRoutes from '../modules/ai/faq/routes/faq.routes.js';
import predictionRoutes from '../modules/predictions/routes/prediction.routes.js';

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
apiV1Router.use('/communication', communicationRoutes);
apiV1Router.use('/admin/analytics', analyticsRoutes);
apiV1Router.use('/admin/predictions', predictionRoutes);
apiV1Router.use('/faq', faqRoutes);

export default apiV1Router;
