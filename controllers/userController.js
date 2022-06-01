const db = require("../models/index.js");
const bcrypt = require("bcrypt");

// main model
const User = db.users;

// register user (with hashed password)
const register = async (req, res) => {
    const { password } = req.body;
    const hash = await bcrypt.hash(password, 12);
    const data = {
      email: req.body.email,
      name: req.body.name,
      zipCode: req.body.zipCode,
      city: req.body.city,
      phone: req.body.phone,
      password: hash,
      type: req.body.type ? req.body.type : "normal",
    };
    const user = await User.create(data);
    res.status(201).send(user);
    console.log(user);
}

// get all users
const getAllUsers = async (req, res) => {
    let users = await User.findAll({});
    res.status(200).send(users);
}

// get a single user
const getUser = async (req, res) => {
    let id = req.params.id;
    let user = await User.findOne({
        where: {
            id: id
        }
    });
    res.status(200).send(user);
}

// update a user
const updateUser = async (req, res) => {
    let id = req.params.id;
    const user = await User.update(req.body, {
        where: {
            id: id
        }
    });
    res.status(200).send(user)
}

// detele a user
const deleteUser = async (req, res) => {
    let id = req.params.id;
    await User.destroy({
        where: {
            id: id
        }
    })
    res.status(200).send(`User with id: ${id} is deleted.`);
}

module.exports = {
    register,
    getAllUsers,
    getUser,
    updateUser,
    deleteUser
}