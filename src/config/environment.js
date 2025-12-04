const config = {
  api: {
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
    timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) || 10000,
  },

  app: {
    environment: process.env.REACT_APP_ENVIRONMENT || 'development',
    name: process.env.REACT_APP_APP_NAME || 'AgroTIC Frontend',
    debug: process.env.REACT_APP_DEBUG === 'true',
    logLevel: process.env.REACT_APP_LOG_LEVEL || 'info',
  },

  // Configuración de archivos
  files: {
    maxSize: parseInt(process.env.REACT_APP_MAX_FILE_SIZE) || 5242880, // 5MB
    allowedTypes: (process.env.REACT_APP_ALLOWED_FILE_TYPES || 'jpg,jpeg,png,gif,webp').split(','),
  },

  // Helpers
  isDevelopment: () => config.app.environment === 'development',
  isProduction: () => config.app.environment === 'production',
  isDebug: () => config.app.debug,
};

export default config;