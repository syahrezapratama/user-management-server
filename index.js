const express = require("express");
const cors = require("cors");
const app = express();
const swaggerUI = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "User management API",
      version: "1.0.0",
      description: "A simple Express user management API"
    },
    servers: [
      {
        url: "http://localhost:8081/api"
      }
    ],
  },
  apis: ["./routes/*.js"],
}

const specs = swaggerJsDoc(swaggerOptions)

var corsOptions = {
  origin: "http://localhost:8080",
}
app.use(cors(corsOptions));

// read body data
app.use(express.json()); // to support JSON-encoded bodies
app.use(express.urlencoded({ extended: true })); // to support URL-encoded bodies

// routers
const router = require("./routes/index.js");
app.use("/api", router);
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs))
app.use((err, req, res, next) => {
  const { statusCode = 500 , message = "Something went wrong" } = err;
  console.log(statusCode, message);
  res.status(statusCode).send(message);
})

// port
const PORT = process.env.PORT || 8081;

// server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});
