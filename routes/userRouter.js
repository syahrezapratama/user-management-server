require("dotenv").config();
const userController = require("../controllers/userController.js");
const router = require("express").Router();
const jwt = require("jsonwebtoken");
const db = require("../models/index.js");
const Joi = require("joi");
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
        limit: limit,
      };
    }
    try {
      results.results = await model.findAll({
        attributes: ["id", "email", "name", "zipCode","city","phone", "type", "refreshToken"],
        offset: startIndex,
        limit: limit,
      });
      res.paginatedResults = results;
      next();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
}

// validate user input
function validateUserInput(req, res, next) {
  const userSchema = Joi.object({
    email: Joi.string()
      .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } })
      .required(),
    name: Joi.string().alphanum().required(),
    zipCode: Joi.string().min(5).max(5).required(),
    city: Joi.string().alphanum().required(),
    phone: Joi.string().required(),
    password: Joi.string().min(8).required(),
    type: Joi.string(),
  });
  const { error } = userSchema.validate(req.body);
  if (error) {
    throw new Error(error);
  } else {
    next();
  }
}

// api routes
router.post("/register", validateUserInput, userController.register);

router.get("/users", paginatedResults(User), userController.getAllUsers);

router.get("/user/:id", userController.getUser);

router.put("/user/:id", userController.updateUser);

router.delete("/user/:id", userController.deleteUser);

router.post("/login", userController.loginUser);

router.post("/token", userController.checkRefreshToken);

router.delete("/logout", userController.logoutUser);

router.get("/search", userController.searchUsers);

module.exports = router;
