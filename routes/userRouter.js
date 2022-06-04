require("dotenv").config();
const userController = require("../controllers/userController.js");
const router = require("express").Router();
const jwt = require("jsonwebtoken");

// authenticate token middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, user) => {
    if (error) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// api routes
router.post("/register", userController.register);

router.get("/users", userController.getAllUsers);

router.get("/user/:id", userController.getUser);

router.put("/user/:id", userController.updateUser);

router.delete("/user/:id", userController.deleteUser);

router.post("/login", userController.loginUser);

router.post("/token", userController.checkRefreshToken);

router.delete("/logout", userController.logoutUser);

router.get("/search", userController.searchUsers);

module.exports = router;
