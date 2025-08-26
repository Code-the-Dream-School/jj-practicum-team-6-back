const { PORT = 8000 } = process.env;
const { connectDB } = require('../src/db/index.js');
const app = require('./app');

const listener = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`Server is listening on port ${PORT}...`));
  } catch (error) {
    console.error(error);
  }
};

listener();