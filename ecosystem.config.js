// =====================================================================
// CLINIQUE CENTRALE MÉDISAHEL MALI - PM2 PROCESS MANAGER CONFIGURATION
// FILE: ecosystem.config.js
// DESCRIPTION: Clustered Node.js orchestration config for PM2 on Ubuntu.
// AUTHOR: Adama SANGARÉ / IT Engineering MédiSahel Clinique
// DATE: 2026-06-17
// =====================================================================

module.exports = {
  apps: [
    {
      name: "medisahel-clinique-v2",
      script: "./dist/server.cjs",
      instances: 1, // Verrous de dossiers, SSE et anti brute-force sont en mémoire : un seul processus tant qu'ils ne sont pas externalisés (Redis)
      exec_mode: "fork",
      watch: false, // PM2 shouldn't watch production compiled assets in real time to avoid memory leak
      autorestart: true,
      max_memory_restart: "1G", // Restarts the container if memory leaks above 1GB
      env: {
        NODE_ENV: "production",
        PORT: 3000
      },
      env_file: ".env.production", // Automagically load the production environment variable parameters
      error_file: "./logs/pm2-err.log",
      out_file: "./logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      combine_logs: true
    }
  ]
};
