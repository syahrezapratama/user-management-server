require("dotenv").config();
const db = require("../models/index.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { createAccessToken, createRefreshToken } = require("../tokens/index.js");
const { Op } = require("sequelize");

// main model
const User = db.users;

// register user (with hashed password)
const register = async (req, res) => {
  // check if a user with the same email already exist
  const userExist = await User.findOne({
    where: {
      email: req.body.email
    }
  });
  try {
    if (userExist) {
      res.send("User with the same e-mail is already registered.");
      throw new Error("User already exist.");
    } else {
      const data = {
        email: req.body.email,
        name: req.body.name,
        zipCode: req.body.zipCode,
        city: req.body.city,
        phone: req.body.phone,
        password: req.body.password,
        type: req.body.type ? req.body.type : "normal",
      };
      const user = await User.create(data);
      res.status(201).send(user);
    }
  } catch (error) {
    console.log(error);
  }
};

// get all users
const getAllUsers = async (req, res) => {
  let users = await User.findAll({});
  res.status(200).send(users);
};

// get a single user
const getUser = async (req, res) => {
  let id = req.params.id;
  let user = await User.findOne({
    where: {
      id: id,
    },
  });
  res.status(200).send(user);
};

// update a user
const updateUser = async (req, res) => {
  let id = req.params.id;
  const user = await User.update(req.body, {
    where: {
      id: id,
    },
  });
  res.status(200).send(user);
};

// detele a user
const deleteUser = async (req, res) => {
  let id = req.params.id;
  await User.destroy({
    where: {
      id: id,
    },
  });
  res.status(200).send(`User with id: ${id} is deleted.`);
};

// login a user
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  // find user with the email
  const user = await User.findOne({
    where: {
      email: email,
    },
  });
  try {
    // compare hashed password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.send("Try again.");
    }
    const authUser = { email: user.email };
    // create refresh and access token
    const accessToken = createAccessToken(authUser);
    const refreshToken = createRefreshToken(authUser);
    // put refresh token in the database
    await User.update({ refreshToken: refreshToken }, {
      where: {
        email: user.email
      }
    });
    await res.json({ accessToken: accessToken, refreshToken: refreshToken });
    // res.status(200).send("User is logged in.");
  } catch (error) {
    console.log(error);
    res.status(500).send();
  }
};

const checkRefreshToken = async (req, res) => {
  const refreshToken = req.body.token;
  if (refreshToken == null) return res.sendStatus(401);
  const refreshTokenInDB = await User.findOne({
    where: {
      refreshToken: refreshToken
    }
  })
  if (!refreshTokenInDB) return res.sendStatus(403);
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, user) => {
    if (error) return res.sendStatus(403);
    const accessToken = createAccessToken({ email: user.email });
    res.json({ accessToken: accessToken });
  }) 
};

const logoutUser = async (req, res) => {
  // delete refresh token from database
  const { token } = req.body;
  await User.update({ refreshToken: null }, {
    where: {
      refreshToken: token
    }
  });
  res.sendStatus(204);
};

// search for users
const searchUsers = async (req, res) => {
  const { email, name, zipCode, city, phone } = req.query;
  const users = await User.findAll({
    where: {
      [Op.and]: [
        { email: email},
        { name: name },
        { zipCode: zipCode },
        { city: city },
        { phone: phone }
      ]
    }
  });
  res.status(200).send(users);
}

module.exports = {
  register,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  loginUser,
  checkRefreshToken,
  logoutUser,
  searchUsers
};
