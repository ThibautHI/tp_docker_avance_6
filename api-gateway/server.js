const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 8080;

// Service URLs from environment
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:8081';
const PRODUCTS_SERVICE_URL = process.env.PRODUCTS_SERVICE_URL || 'http://localhost:8082';
const ORDERS_SERVICE_URL = process.env.ORDERS_SERVICE_URL || 'http://localhost:8083';

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Logging
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Request counter middleware
app.use((req, res, next) => {
    global.requestCount = (global.requestCount || 0) + 1;
    next();
});

// Health check endpoint (before proxies, needs body parser)
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'api-gateway',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
    res.json({
        requests_total: global.requestCount || 0,
        uptime_seconds: process.uptime(),
        memory_usage: process.memoryUsage()
    });
});

// Service discovery endpoint
app.get('/api/services', (req, res) => {
    res.json({
        services: [
            { name: 'auth-service', url: AUTH_SERVICE_URL, status: 'configured' },
            { name: 'products-api', url: PRODUCTS_SERVICE_URL, status: 'configured' },
            { name: 'orders-api', url: ORDERS_SERVICE_URL, status: 'configured' }
        ]
    });
});

// Proxy configuration for Auth Service
app.use('/api/auth', createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/auth': '' },
    onProxyReq: (proxyReq, req, res) => {
        // Fix for body stream already consumed issue
        if (req.body && Object.keys(req.body).length > 0) {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
        }
    },
    onError: (err, req, res) => {
        console.error('Auth service proxy error:', err.message);
        res.status(503).json({ error: 'Auth service unavailable' });
    }
}));

// Proxy configuration for Products API
app.use('/api/products', createProxyMiddleware({
    target: PRODUCTS_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/products': '' },
    onProxyReq: (proxyReq, req, res) => {
        if (req.body && Object.keys(req.body).length > 0) {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
        }
    },
    onError: (err, req, res) => {
        console.error('Products service proxy error:', err.message);
        res.status(503).json({ error: 'Products service unavailable' });
    }
}));

// Proxy configuration for Orders API
app.use('/api/orders', createProxyMiddleware({
    target: ORDERS_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/orders': '' },
    onProxyReq: (proxyReq, req, res) => {
        if (req.body && Object.keys(req.body).length > 0) {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
        }
    },
    onError: (err, req, res) => {
        console.error('Orders service proxy error:', err.message);
        res.status(503).json({ error: 'Orders service unavailable' });
    }
}));

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        path: req.path,
        method: req.method
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Gateway error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`API Gateway running on port ${PORT}`);
    console.log(`Auth Service: ${AUTH_SERVICE_URL}`);
    console.log(`Products Service: ${PRODUCTS_SERVICE_URL}`);
    console.log(`Orders Service: ${ORDERS_SERVICE_URL}`);
});

module.exports = app;
