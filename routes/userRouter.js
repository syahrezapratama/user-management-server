const userController = require("../controllers/userController.js");
const router = require("express").Router();

// api routes
router.post("/register", userController.register);

router.get("/allUsers", userController.getAllUsers);

router.get("/:id", userController.getUser);

router.put("/:id", userController.updateUser);

router.delete("/:id", userController.deleteUser);

module.exports = router;