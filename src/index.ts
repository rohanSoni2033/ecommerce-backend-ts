import app from './app.js';
import { connectDB } from './database/db.js';
const PORT = 3000;
import 'dotenv/config';
const environment = 'development';

try {
  await connectDB();
  app.listen(PORT, () => {
    console.log(
      `🚀 server is running at ${PORT} in ${environment} environment`
    );
  });
} catch (err) {
  console.log(err);
}
