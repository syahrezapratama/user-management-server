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

/**
 * @swagger
 * /register:
 *  post:
 *    summary: Create a new user
 *    responses:
 *      200:
 *        description: The user was successfully created
 *        content:
 *          application/json:
 *            schema: 
 *              type: object
 *      400:
 *        description: A user with the same e-mail is already registered
 */
router.post("/register", userController.validateUserInput, userController.register);

/**
 * @swagger
 * /users:
 *  get:
 *    summary: Get the list of all users
 *    responses:
 *      200:
 *        description: The list of users
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 */
router.get("/users", authenticateUser, userController.paginatedResults(User), userController.getAllUsers);

/**
 * @swagger
 * /user/{id}:
 *  get:
 *    summary: Get a user by id
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *        required: true
 *        description: The user id
 *    responses:
 *      200:
 *        description: The user object by id
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *      404:
 *        description: The user was not found
 */
router.get("/users/:id", authenticateUser, userController.getUser);

/**
 * /user/{id}:
 *  put:
 *    summary: Update a user by id
 *    parameters:
 *    - in: path
 *      name: id
 *      schema:
 *        type: string
 *      required: true
 *      description: The user id
 *    responses:
 * 
 */
router.put("/user/:id", authenticateUser, authenticateRole(), userController.validateInput, userController.updateUser);

router.delete("/user/:id", authenticateUser, authenticateRole(), userController.deleteUser);

router.post("/login", userController.loginUser);

router.get("/search", authenticateUser, userController.searchUsers);

router.get("/verify/:verificationToken", userController.verifyEmail);

router.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found"))
})

module.exports = router;
