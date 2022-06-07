require("dotenv").config();
const userController = require("../controllers/userController.js");
const router = require("express").Router();
const jwt = require("jsonwebtoken");
const db = require("../models/index.js");
const User = db.users;

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

// limits and pagination middleware
function paginatedResults(model) {
  return async (req, res, next) => {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const results = {};
    if (endIndex < (await model.count({}))) {
      results.next = {
        page: page + 1,
        limit: limit,
      };
    }
    if (startIndex > 0) {
        results.previous = {
            page: page - 1,
            limit: limit
        }
    }
    try {
        results.results = await model.findAll({
            offset: startIndex,
            limit: limit
        });
        res.paginatedResults = results;
        next()
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
  };
}

// api routes
router.post("/register", userController.register);

router.get("/users", paginatedResults(User), userController.getAllUsers);

router.get("/user/:id", userController.getUser);

router.put("/user/:id", userController.updateUser);

router.delete("/user/:id", userController.deleteUser);

router.post("/login", userController.loginUser);

router.post("/token", userController.checkRefreshToken);

router.delete("/logout", userController.logoutUser);

router.get("/search", userController.searchUsers);

module.exports = router;
