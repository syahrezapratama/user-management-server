require("dotenv").config();
const userController = require("../controllers/userController.js");
const router = require("express").Router();
const jwt = require("jsonwebtoken");
const db = require("../models/index.js");
const ExpressError = require("../utils/ExpressError.js");
const User = db.users;

/**
 * @swagger
 * components:
 *  schemas:
 *    User:
 *      type: object
 *      required:
 *        - email
 *        - name
 *        - zipCode
 *        - city
 *        - phone
 *        - password
 *      properties:
 *        id:
 *          type: integer
 *          description: The auto-generated id of the user
 *        email:
 *          type: string
 *          description: The email to the user's account
 *        name:
 *          type: string
 *          description: The full name of the user
 *        zipCode: 
 *          type: string
 *          description: The zip code of the user's residence
 *        city:
 *          type: string
 *          description: The city of the user's residence
 *        phone:
 *          type: string
 *          description: The phone number of the user
 *        password:
 *          type: string
 *          description: The password to the user's account
 *          writeOnly: true
 *      example:
 *        id: 6
 *        email: adamwest@test.com
 *        name: Adam West
 *        zipCode: "12345"
 *        city: Berlin
 *        phone: "01234567890"
 *        password: test1234
 */

/**
 * @swagger
 * tags:
 *  - name: Users
 *    description: Create, view, update, delete and search users
 *  - name: Auth
 *    description: Authenticate user account
 */

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
 * /users/register:
 *  post:
 *    summary: Create a new user
 *    tags: [Users]
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/User'
 *    responses:
 *      200:
 *        description: The user was successfully created
 *        content:
 *          application/json:
 *            schema: 
 *              type: object
 *      400:
 *        description: A user with the same e-mail is already registered
 *      500:
 *        description: Server error
 */
router.post("/users/register", userController.validateUserInput, userController.register);

/**
 * @swagger
 * /users:
 *  get:
 *    summary: Get the list of all users
 *    tags: [Users]
 *    parameters:
 *      - in: query
 *        name: page
 *        type: integer
 *        description: Page of the search results
 *      - in: query
 *        name: limit
 *        type: integer
 *        description: Limit of the search results in a page
 *    responses:
 *      200:
 *        description: The list of users
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                type: object

 */
router.get("/users", authenticateUser, userController.paginatedResults(User), userController.getAllUsers);

/**
 * @swagger
 * /users/{id}:
 *  get:
 *    summary: Get a user by id
 *    tags: [Users]
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
 * @swagger
 * /users/{id}:
 *  put:
 *    summary: Update a user by id
 *    tags: [Users]
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *        required: true
 *        description: The user id
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/User'
 *    responses:
 *      200:
 *        description: The user was updated
 *      404:
 *        description: The user was not found
 *      500:
 *        description: Server error
 */
router.put("/users/:id", authenticateUser, authenticateRole(), userController.validateInput, userController.updateUser);

/**
 * @swagger
 * /users/{id}:
 *  delete:
 *    summary: Delete a user by id
 *    tags: [Users]
 *    parameters: 
 *      - in: path
 *        name: id
 *        schema: 
 *          type: string
 *        required: true
 *        description: The user id
 *    responses:
 *      200:
 *        description: The user was deleted
 *      500: 
 *        description: Server error
 */
router.delete("/users/:id", authenticateUser, authenticateRole(), userController.deleteUser);

/**
 * @swagger
 * /auth/login:
 *  post:
 *    summary: Log a user in and send an access token
 *    tags: [Auth]
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              email:
 *                type: string
 *              password:
 *                type: string
 *            required:
 *              - email
 *              - password
 *    responses:
 *      401:
 *        description: User is not registered or verified yet, or wrong email or password
 *      200:
 *        description: Login was successful
 */
router.post("/auth/login", userController.loginUser);

/**
 * @swagger
 * /users/search:
 *  get:
 *    summary: Get users based on the search queries
 *    tags: [Users]
 *    parameters:
 *      - in: query
 *        name: email
 *        type: string
 *        description: The user's email
 *      - in: query
 *        name: name
 *        type: string
 *        description: The user's name
 *      - in: query
 *        name: zipCode
 *        description: The user's zip code
 *      - in: query
 *        name: city
 *        description: The user's city
 *      - in: query
 *        name: phone
 *        description: The user's phone number
 *    responses:
 *      200:
 *        description: Search results
 *        
 */
router.get("/users/search", authenticateUser, userController.searchUsers);

/**
 * @swagger
 * /auth/verify/{verificationToken}:
 *  get:
 *    summary: Verify a user account with the token
 *    tags: [Auth]
 *    parameters:
 *      - in: path
 *        name: verificationToken
 *        schema:
 *          type: string
 *        required: true
 *        description: the verification token
 *    responses:
 *      200:
 *        description: Account was verified
 *      404:
 *        description: User was not found
 */
router.get("/auth/verify/:verificationToken", userController.verifyEmail);

router.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found"))
})

module.exports = router;
