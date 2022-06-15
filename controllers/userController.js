require("dotenv").config();
const db = require("../models/index.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { createAccessToken, createRefreshToken } = require("../tokens/index.js");
const { Op } = require("sequelize");
const Joi = require("joi");
const catchAsync = require("../utils/catchAsync.js");
const ExpressError = require("../utils/ExpressError.js");

// main model
const User = db.users;

// register
const register = catchAsync(async (req, res, next) => {
  const userData = {
    ...req.body,
    type: req.body.type ? req.body.type : "normal",
  };
  const userExist = await User.findOne({ where: { email: userData.email } });
  if (userExist) {
    const warning =
      "Ein Nutzer mit dem eingegebenen Email ist bereits angemeldet.";
    res.status(400).send({ message: warning });
    return;
  } 
  try {
    const user = await User.create(userData);
    res.status(201).send(user);
  } catch (error) {
    console.log(error);
    res.status(400).send({
      message: "Bitte prüfen und korrigieren Sie ihre Daten.",
    });
    return;
  }
  // else {
  //   try {
  //     const user = await User.create(userData);
  //     res.status(201).send(user);
  //   } catch (error) {
  //     console.log(error);
  //     res.status(400).send({
  //       message: "Bitte prüfen und korrigieren Sie ihre Daten.",
  //     });
  //     return;
  //   }
  // }
});

// get all users (with pagination)
const getAllUsers = async (req, res) => {
  res.status(200).send(res.paginatedResults);
};

// get a single user
const getUser = async (req, res) => {
  let id = req.params.id;
  let user = await User.findOne({
    where: {
      id: id,
    },
    attributes: [
      "id",
      "email",
      "name",
      "zipCode",
      "city",
      "phone",
      "type",
      "refreshToken",
    ],
  });
  res.status(200).send(user);
};

// update a user
const updateUser = async (req, res) => {
  const id = req.params.id;
  const newPassword = req.body.password;
  try {
    if (newPassword) {
      await User.update(
        { password: newPassword },
        {
          where: {
            id: id,
          },
          individualHooks: true,
        }
      );
    }
    const user = await User.update(
      {
        email: req.body.email,
        name: req.body.name,
        zipCode: req.body.zipCode,
        city: req.body.city,
        phone: req.body.phone,
      },
      {
        where: {
          id: id,
        },
        // individualHooks: true,
      }
    );
    res.status(200).send(user);
  } catch (error) {
    console.log(error);
    res.status(500).send("Failed to update");
  }
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
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(401).send({ message: "Incorrect email or password." });
      return;
    }
    const authUser = { email: user.email };
    const accessToken = createAccessToken(authUser);
    await res
      .status(200)
      .send({ id: user.id, email: user.email, name: user.name, accessToken: accessToken });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Something went wrong, try again later."});
  }
};

const checkRefreshToken = async (req, res) => {
  const refreshToken = req.body.token;
  if (refreshToken == null) return res.sendStatus(401);
  const refreshTokenInDB = await User.findOne({
    where: {
      refreshToken: refreshToken,
    },
  });
  if (!refreshTokenInDB) return res.sendStatus(403);
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, user) => {
    if (error) return res.sendStatus(403);
    const accessToken = createAccessToken({ email: user.email });
    res.json({ accessToken: accessToken });
  });
};

const logoutUser = async (req, res) => {
  // delete refresh token from database
  const { token } = req.body;
  await User.update(
    { refreshToken: null },
    {
      where: {
        refreshToken: token,
      },
    }
  );
  res.sendStatus(204);
};

// search for users
const searchUsers = async (req, res) => {
  const { email, name, zipCode, city, phone } = req.query;
  console.log(email, name, zipCode, city, phone);
  const columns = ["email", "name", "zipCode", "city", "phone"];
  const queries = [email, name, zipCode, city, phone];
  let arr = [];
  for (let i = 0; i < columns.length; i++) {
    let column = columns[i];
    if (queries[i]) {
      arr.push({
        [column]: {
          [Op.substring]: queries[i],
        },
      });
    }
  }
  console.log(arr);
  const users = await User.findAll({
    where: {
      [Op.and]: arr,
    },
  });
  res.status(200).send(users);
};

// limits and pagination
const paginatedResults = (model) => {
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
const validateUserInput = (req, res, next) => {
  const userSchema = Joi.object({
    email: Joi.string()
      .email({ minDomainSegments: 2, tlds: { allow: ["com", "net", "de"] } })
      .required(),
    name: Joi.string().alphanum().required(),
    zipCode: Joi.string().min(5).max(5).required(),
    city: Joi.string().required(),
    phone: Joi.string().required(),
    password: Joi.string().min(8).required(),
    type: Joi.string(),
  });
  const { error } = userSchema.validate(req.body);
  if (error) {
    // console.log(error.details.map(item => item.message).join(','));
    const msg = error.details[0];
    console.log(msg);
    // throw new ExpressError(400, msg);
    // throw new Error(msg);
    res.status(400).send(msg);
    return
  } else {
    next();
  }
}

module.exports = {
  register,
  getAllUsers,
  paginatedResults,
  getUser,
  updateUser,
  deleteUser,
  loginUser,
  checkRefreshToken,
  logoutUser,
  searchUsers,
  validateUserInput
};
