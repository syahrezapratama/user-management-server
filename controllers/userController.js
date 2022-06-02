require("dotenv").config();
const db = require("../models/index.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// main model
const User = db.users;

// register user (with hashed password)
const register = async (req, res) => {
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
  console.log(user);
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
  const user = await User.findOne({
    where: {
      email: email,
    },
  });
  try {
    const validPassword = await bcrypt.compare(password, user.password);
    if (validPassword) {
      const authUser = { email: user.email };
      const accessToken = jwt.sign(authUser, process.env.ACCESS_TOKEN_SECRET);
      res.json({ accessToken: accessToken });
    //   res.status(200).send("User is logged in.");
    } else {
      res.send("Try again.");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send();
  }
};

module.exports = {
  register,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  loginUser,
};
