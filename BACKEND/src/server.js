import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 5000;

// Prisma connects automatically when the first query is made.
app.listen(PORT, () => {
    console.log(`🚀 Serene API running on port ${PORT}`);
});