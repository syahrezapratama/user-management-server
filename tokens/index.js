require("dotenv").config();
const jwt = require("jsonwebtoken");

const createToken = authUser => {
    return jwt.sign(authUser, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "10m" });
};

module.exports = {
    createToken,
}