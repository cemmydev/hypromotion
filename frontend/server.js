const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.FRONTEND_PORT || 8080;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API proxy to backend
const { createProxyMiddleware } = require('http-proxy-middleware');

app.use('/api', createProxyMiddleware({
  target: process.env.BACKEND_URL || 'http://localhost:3000',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api'
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(503).json({
      success: false,
      message: 'Backend service unavailable'
    });
  }
}));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'frontend',
    timestamp: new Date().toISOString()
  });
});

// Serve the main page
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
  console.log(`Backend URL: ${process.env.BACKEND_URL || 'http://localhost:3000'}`);
});

module.exports = app;

