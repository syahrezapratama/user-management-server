const express = require("express");
const cors = require("cors");
const app = express();

// middleware
var corsOptions = {
  origin: "http://localhost:8080",
}
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
  console.log(`Listening on port ${PORT}...`);
});
