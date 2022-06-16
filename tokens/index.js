require("dotenv").config();
const jwt = require("jsonwebtoken");

// create access token
const createAccessToken = authUser => {
    return jwt.sign(authUser, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "10m" });
};

module.exports = {
    createAccessToken,
}