const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const dotenv = require('dotenv');

// Import routes
const urlScannerRoutes = require('./routes/urlScanner');
const threatIntelRoutes = require('./routes/threatIntel');
const emailBreachRoutes = require('./routes/emailBreach');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;



// Rate limiting
const rateLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.ip,
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
});

const rateLimiterMiddleware = async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.round(rejRes.msBeforeNext / 1000)
    });
  }
};

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration for production and development
const corsOrigins = [
  'http://localhost:5173', 
  'http://localhost:3000', 
  'chrome-extension://*',
  'https://cyberspace-frontend.onrender.com'
];

// Add environment-specific origins
if (process.env.CORS_ORIGIN) {
  corsOrigins.push(process.env.CORS_ORIGIN);
}

app.use(cors({
  origin: corsOrigins,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to all routes
app.use(rateLimiterMiddleware);



// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Routes
app.use('/api/v1/scan', urlScannerRoutes);
app.use('/api/v1/threat-intel', threatIntelRoutes);
app.use('/api/v1/breach', emailBreachRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(500).json({
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 CyberSpace Backend running on port ${PORT}`);
});

module.exports = app;
