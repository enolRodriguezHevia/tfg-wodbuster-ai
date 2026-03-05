const { defineConfig } = require("cypress");
require('dotenv').config();

module.exports = defineConfig({
  allowCypressEnv: false,

  e2e: {
    // URL base desde .env
    baseUrl: process.env.CYPRESS_BASE_URL || 'https://wodbuster-ai.online',
    
    // Timeout aumentado para operaciones con IA
    defaultCommandTimeout: 10000,
    requestTimeout: 30000,
    responseTimeout: 30000,
    
    // No fallar en códigos de estado 4xx/5xx (útil para WAF)
    // Cypress seguirá funcionando pero no fallará automáticamente
    // Puedes verificar manualmente el contenido de la página
    
    setupNodeEvents(on, config) {
      // implement node event listeners here
      return config;
    },
    
    // Variables de entorno para tests
    env: {
      // URL del backend API desde .env
      apiUrl: process.env.CYPRESS_API_URL || 'https://wodbuster-ai.online/api',
    },
  },
});
