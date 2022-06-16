require("dotenv").config();
const jwt = require("jsonwebtoken");

// create access token
const createAccessToken = authUser => {
    return jwt.sign(authUser, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" });
};

// create refresh token
const createRefreshToken = authUser => {
    return jwt.sign(authUser, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "1d" });
};

module.exports = {
    createAccessToken,
    createRefreshToken
}