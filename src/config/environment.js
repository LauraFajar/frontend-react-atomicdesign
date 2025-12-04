const env = {
  api: { baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001' },
  ws:  { baseURL: process.env.REACT_APP_WS_URL  || 'ws://localhost:3001' },
  features: { enableWs: String(process.env.REACT_APP_ENABLE_WS).toLowerCase() === 'true' }
};

export default env;