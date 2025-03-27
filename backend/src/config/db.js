const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('MongoDB connection string (MONGODB_URI) is not defined in environment variables');
    process.exit(1);
  }

  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4,
    retryWrites: true
  };

  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      console.log(`Attempting to connect to MongoDB (attempt ${retryCount + 1}/${maxRetries})...`);
      await mongoose.connect(process.env.MONGODB_URI, options);
      console.log('MongoDB Connected Successfully');

      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB connection lost');
      });

      // Handle application termination
      process.on('SIGINT', async () => {
        try {
          await mongoose.connection.close();
          console.log('MongoDB connection closed through app termination');
          process.exit(0);
        } catch (err) {
          console.error('Error closing MongoDB connection:', err);
          process.exit(1);
        }
      });

      // If we reach here, connection was successful
      return;

    } catch (error) {
      console.error(`MongoDB Connection Error (attempt ${retryCount + 1}/${maxRetries}):`, error);
      retryCount++;
      
      if (retryCount === maxRetries) {
        console.error('Failed to connect to MongoDB after maximum retries');
        process.exit(1);
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
};

module.exports = connectDB;
