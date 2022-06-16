require("dotenv").config();
const userController = require("../controllers/userController.js");
const router = require("express").Router();
const jwt = require("jsonwebtoken");
const db = require("../models/index.js");
const ExpressError = require("../utils/ExpressError.js");
const User = db.users;


// authenticate user middleware
function authenticateUser(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, user) => {
    if (error) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// authenticate user role (type)
function authenticateRole() {
  return (req, res, next) => {
    if (req.user.id != req.params.id && req.user.type !== "admin") {
      res.status(401);
      return res.send({ message: "Not Allowed."});
    }
    next();
  }
}

// api routes
router.post("/register", userController.validateUserInput, userController.register);

router.get("/users", authenticateUser, userController.paginatedResults(User), userController.getAllUsers);

router.get("/user/:id", authenticateUser, userController.getUser);

router.put("/user/:id", authenticateUser, authenticateRole(), userController.updateUser);

router.delete("/user/:id", authenticateUser, authenticateRole(), userController.deleteUser);

router.post("/login", userController.loginUser);

router.get("/search", authenticateUser, userController.searchUsers);

router.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found"))
})

module.exports = router;
