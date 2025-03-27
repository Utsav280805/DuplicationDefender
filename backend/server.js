require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs').promises;

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const fileRoutes = require('./src/routes/fileRoutes');

const app = express();
const port = process.env.PORT || 5000;

// Create required directories if they don't exist
const createRequiredDirectories = async () => {
  const dirs = [
    path.join(__dirname, 'logs'),
    path.join(__dirname, 'uploads'),
    path.join(__dirname, 'uploads', 'temp')
  ];

  for (const dir of dirs) {
    try {
      await fs.access(dir);
      console.log(`Directory exists: ${dir}`);
    } catch {
      console.log(`Creating directory: ${dir}`);
      try {
        await fs.mkdir(dir, { recursive: true });
        console.log(`Directory created: ${dir}`);
      } catch (err) {
        console.error(`Failed to create directory: ${dir}`, err);
        throw err;
      }
    }
  }
};

// Initialize directories
createRequiredDirectories().catch(err => {
  console.error('Failed to create required directories:', err);
  process.exit(1);
});

// Middleware
app.use(morgan('dev')); // Logging
app.use(cors({
  origin: 'http://localhost:3001', // Frontend URL
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: `Route ${req.originalUrl} not found` 
  });
});

// MongoDB Connection
const connectDB = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect('mongodb://localhost:27017/duplication-defender', {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('Connected to MongoDB');
      return;
    } catch (err) {
      console.error(`MongoDB connection attempt ${i + 1} failed:`, err);
      if (i === retries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retrying
    }
  }
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.json({ 
    status: isDbConnected ? 'ok' : 'error',
    message: isDbConnected ? 'Server is running' : 'Database connection error',
    dbStatus: isDbConnected ? 'connected' : 'disconnected',
    dbName: mongoose.connection.db?.databaseName || 'not connected'
  });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();