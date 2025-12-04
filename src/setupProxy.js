const { createProxyMiddleware } = require('http-proxy-middleware')

module.exports = function (app) {
  const target = 'http://localhost:3001'

  app.use(
    '/uploads',
    createProxyMiddleware({ target, changeOrigin: true })
  )

  app.use(
    '/auth',
    createProxyMiddleware({ target, changeOrigin: true })
  )

  app.use(
    '/usuarios',
    createProxyMiddleware({ target, changeOrigin: true })
  )

  app.use(
    '/sensores',
    createProxyMiddleware({ target, changeOrigin: true })
  )

  app.use(
    '/cultivos',
    createProxyMiddleware({ target, changeOrigin: true })
  )

  app.use(
    '/lotes',
    createProxyMiddleware({ target, changeOrigin: true })
  )

  app.use(
    '/lecturas',
    createProxyMiddleware({ target, changeOrigin: true })
  )

  app.use(
    '/recomendaciones',
    createProxyMiddleware({ target, changeOrigin: true })
  )
}
