/**
 * Server Entry Point
 * Starts the HTTP server
 */

const app = require('./src/app');
const config = require('./src/config');

const PORT = config.port;

// Start server
const server = app.listen(PORT, () => {
  console.log('');
  console.log('🍪 ════════════════════════════════════════════════════════');
  console.log('');
  console.log('   Oreo CodePen - Personal UI Showcase Engine');
  console.log('');
  console.log(`   🌐 Server:     http://localhost:${PORT}`);
  console.log(`   🔐 Admin:      ${config.auth.username}`);
  console.log(`   🌍 Environment: ${config.nodeEnv}`);
  console.log('');
  console.log('🍪 ════════════════════════════════════════════════════════');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed.');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = server;
