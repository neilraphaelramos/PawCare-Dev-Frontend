const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/server-api',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
    })
  );

  app.use(
    '/chat-socket.io',
    createProxyMiddleware({
      target: 'http://localhost:5001',
      ws: true,         
      changeOrigin: true,
    })
  );
};
