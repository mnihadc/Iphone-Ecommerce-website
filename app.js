const express = require("express");
const dotenv = require("dotenv");
const path = require("path"); // Import path module
const exphbs = require("express-handlebars"); // Import express-handlebars
const homeRouter = require("./route/home.route");

const app = express();
dotenv.config();

// Get the port number from environment variables
const port = process.env.PORT_NO || 3000; // Default to 3000 if no port is specified

// Set Handlebars as the view engine and configure the layout folder
app.engine(
  "hbs",
  exphbs.engine({
    extname: "hbs",
    defaultLayout: "main", // Specifies the default layout template (main.hbs)
    layoutsDir: path.join(__dirname, "views/layouts"), // Path to the layouts folder
  })
);
app.set("view engine", "hbs");

// Middleware to serve static files (CSS, images, JS, etc.)
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public/user")));

// Middleware to handle JSON requests
app.use(express.json());

// Routes
app.use("/", homeRouter);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
