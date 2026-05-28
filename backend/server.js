const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const investmentRoutes = require('./routes/investmentRoutes');
const { startInvestmentCron } = require('./jobs/investmentCron');
const { ensureAdminExists } = require('./utils/adminInit');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => res.send('Oncolos API is running...'));
// Temporary: expose server outbound IP for whitelisting purposes
app.get('/my-ip', async (req, res) => {
  try {
    const https = require('https');
    https.get('https://api.ipify.org?format=json', r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => res.json({ server_ip: JSON.parse(d).ip }));
    });
  } catch(e) { res.json({ error: e.message }); }
});
app.use('/api/auth', authRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/investments', investmentRoutes);

// Database Connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/oncolos';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected...');
    await ensureAdminExists();
    startInvestmentCron();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.log(err));
