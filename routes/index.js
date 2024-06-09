var express = require("express");
var router = express.Router();
// const pokemonsRouter = require("./pokemons.api.js");
const pokemonsRouter = require("./newPokemons.api.js");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.status(200).send("welcome to pokemon land");
});
router.use("/pokemons", pokemonsRouter);

module.exports = router;
