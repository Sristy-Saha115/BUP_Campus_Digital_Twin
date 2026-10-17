const mongoose = require('mongoose');

module.exports = async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bup_digital_twin';
  await mongoose.connect(uri);
  console.log('MongoDB connected:', mongoose.connection.host + '/' + mongoose.connection.name);
};
