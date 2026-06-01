const app = require('./app');
const connectDB = require('./config/database');

const PORT = process.env.PORT || 5000;

// connect to mongo then start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 TaskFlow API running on port ${PORT}`);
    console.log(`📚 Swagger docs: http://localhost:${PORT}/api-docs`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });
}).catch(err => {
  console.error('Failed to connect to database:', err.message);
  process.exit(1);
});
