const express = require("express");
const dotenv = require("dotenv");

const app = express();
dotenv.config();

const port = process.env.PORT_NO;

// Build in middleware
app.use(express.json());

// Server listening on port
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
