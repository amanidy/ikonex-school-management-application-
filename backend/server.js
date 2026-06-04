
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// I enabled CORS so the API can be accessed from different frontends
app.use(cors());

// parsed incoming JSON requests automatically
app.use(express.json());

// the route modules keep the codebase organized by feature
app.use('/api/streams', require('./routes/streams'));
app.use('/api/students', require('./routes/students'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/scores', require('./routes/scores'));

// I simple health check endpoint for uptime monitoring or quick API test
app.get('/', (req, res) => res.json({ message: ' School Management  API running' }));

// the environment variable for flexibility fallback to 3000 for local dev
const PORT = process.env.PORT || 3000;


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
