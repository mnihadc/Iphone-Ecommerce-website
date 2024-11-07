const express = require("express");
const dotenv = require("dotenv");

const app = express();
dotenv.config();

const port = process.env.PORT_NO;

// Middleware to parse JSON
app.use(express.json());

// Server listening on port
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
