require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { SlotBooking } = require('./models');

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '100kb' }));

// Wrap async handlers so errors reach the error middleware (Express 4)
const wrap = (router) => {
  router.stack.forEach((layer) => {
    if (layer.route) layer.route.stack.forEach((l) => {
      const fn = l.handle;
      if (fn.length <= 2) l.handle = (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
    });
  });
  return router;
};

app.use('/api/auth', wrap(require('./routes/auth')));
app.use('/api/slots', wrap(require('./routes/slots')));
app.use('/api/blood', wrap(require('./routes/blood')));
app.use('/api/donors', wrap(require('./routes/donors')));
app.use('/api/clubs', wrap(require('./routes/clubs')));
app.use('/api/scholarships', wrap(require('./routes/scholarships')));
app.use('/api', wrap(require('./routes/misc')));
app.use('/api/notifications', wrap(require('./routes/notifications')));
app.use('/api/chat', wrap(require('./routes/chat')));

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// Production: serve the built React app
const dist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error. Please try again.' });
});

const PORT = process.env.PORT || 5000;
connectDB()
  .then(() => SlotBooking.syncIndexes().catch((e) => console.error('Index sync warning:', e.message)))
  .then(() => app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`)))
  .catch((e) => {
    console.error('Could not connect to MongoDB. Is mongod running? ', e.message);
    process.exit(1);
  });
