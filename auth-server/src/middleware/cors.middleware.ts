import cors from 'cors';

/**
 * CORS Middleware configured specifically for our Angular Single Page App (:4200)
 * with support for httpOnly cookies and anti-CSRF custom headers.
 */
export const corsMiddleware = cors({
  origin: ['http://localhost:4200'],
  credentials: true, // Allows browser to receive and send httpOnly cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-XSRF-TOKEN'],
});
