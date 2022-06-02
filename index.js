const express = require("express");
const cors = require("cors");
const app = express();


var corsOptions = {
  origin: "http://localhost:8080",
}
app.use(cors(corsOptions));

// read body data
app.use(express.json()); // to support JSON-encoded bodies
app.use(express.urlencoded({ extended: true })); // to support URL-encoded bodies

// routers
const router = require("./routes/userRouter.js");
app.use("/api/users", router);

// testing api
app.get("/", (req, res) => {
  res.send("hello from the api!");
});

// port
const PORT = process.env.PORT || 8081;

// server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});
