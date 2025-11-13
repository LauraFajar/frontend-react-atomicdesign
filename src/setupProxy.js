const { createProxyMiddleware } = require('http-proxy-middleware')

module.exports = function (app) {
  // Proxy de archivos estáticos (imágenes)
  app.use(
    '/uploads',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
    })
  )

}