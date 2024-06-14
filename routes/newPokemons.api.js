const express = require("express");
const router = express.Router();
const fs = require("fs");
const validateSchema = require("../middleware/validateSchema");
const {
  pokemonSchema,
  pokemonIdParamsSchema,
  pokemonQuerySchema,
} = require("../schemas/pokemonSchema");

let pokemonNames = [];
let pokemonIds = [];

let db = fs.readFileSync("db.json", "utf-8");
db = JSON.parse(db);
let { data: pokemons, totalPokemons } = db;

pokemons.forEach((pokemon) => {
  if (!pokemonNames.includes(pokemon.name)) {
    pokemonNames.push(pokemon.name);
  }
});

pokemons.forEach((pokemon) => {
  if (!pokemonIds.includes(pokemon.id)) {
    pokemonIds.push(pokemon.id);
  }
});

/**
 * params: /
 * description: get pokemons
 * query:
 * method: get
 */

router.get(
  "/",
  validateSchema(pokemonQuerySchema, "query"),
  (req, res, next) => {
    try {
      const { page, limit, ...filterQuery } = req.validatedQuery;

      // const result = [];
      const { type, search: name } = filterQuery;

      //processing logic
      // number of items skip for selection
      let offset = (page - 1) * limit;

      // filter by type and name

      const result =
        !type && !name
          ? pokemons
          : pokemons.filter((pokemon) => {
              // const shouldInclude = name ? pokemon.name === name : true;
              // return type
              //   ? pokemon.types.include(type) && shouldInclude
              //   : shouldInclude;

              const isNameValid = name ? pokemon.name === name : true;
              const isTypeValid = type
                ? pokemon.types.includes(type) && isNameValid
                : isNameValid;
              return isTypeValid;
            });

      // // filter by type
      // if (type) {
      //   result = pokemons.filter((pokemon) =>
      //     pokemon.types.includes(type.toLowerCase())
      //   );
      // }
      // //filter by name
      // if (name) {
      //   result = pokemons.filter((pokemon) =>
      //     pokemon.name.toLowerCase().includes(name.toLowerCase())
      //   );
      // }
      // if no filter, return all pokemons
      // if (!type && !name) {
      //   result = pokemons;
      // }
      // return the result
      res.status(200).send({
        data: result.slice(offset, offset + limit),
        total: result.length,
      });
    } catch (error) {
      next(error);
    }
  }
);
/**
 * params: /pokemons/${id}
 * description: get pokemons by id
 * query: id
 * method: get
 */

router.get(
  "/:pokemonId",
  validateSchema(pokemonIdParamsSchema, "params"),
  (req, res, next) => {
    let pokemon = {};
    let previousPokemon = {};
    let nextPokemon = {};
    try {
      const { pokemonId } = req.validatedParams;
      if (!pokemonIds.includes(pokemonId)) {
        let idError = new Error(`This id ${pokemonId} does not exist`);
        idError.statusCode = 401;
        throw idError;
      }
      const pokemonIndex = pokemons.findIndex(
        (pokemon) => pokemon.id === pokemonId
      );
      pokemon = pokemons[pokemonIndex];
      if (pokemonIndex === 0) {
        previousPokemon = pokemons[pokemons.length - 1];
      } else {
        previousPokemon = pokemons[pokemonIndex - 1];
      }
      if (pokemonIndex === pokemons.length - 1) {
        nextPokemon = pokemons[0];
      } else {
        nextPokemon = pokemons[pokemonIndex + 1];
      }
      res.status(200).send({
        data: {
          pokemon,
          previousPokemon,
          nextPokemon,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * params: /
 * description: add pokemons
 * query:
 * method: post
 */
router.post("/", validateSchema(pokemonSchema), (req, res, next) => {
  try {
    const { id, name } = req.validatedBody;

    if (pokemonIds.includes(id) || pokemonNames.includes(name)) {
      let existedPokemonErr = new Error(
        `This id ${id} or name ${name} already exist- please provide unique id and name`
      );
      existedPokemonErr.statusCode = 401;
      throw existedPokemonErr;
    }

    pokemons.push(req.validatedBody);
    pokemonIds.push(id);
    pokemonNames.push(name);
    totalPokemons += 1;
    db = { data: pokemons, totalPokemons };
    fs.writeFileSync("db.json", JSON.stringify(db, null, 2));
    res
      .status(201)
      .send({ message: "Pokemon added successfully", data: req.validatedBody });
  } catch (error) {
    next(error);
  }
});

/**
 * params: /pokemons/${id}
 * description: update pokemons
 * query: id
 * method: put
 */

router.put(
  "/:pokemonId",
  validateSchema(pokemonIdParamsSchema, "params"),
  validateSchema(pokemonSchema),
  (req, res, next) => {
    try {
      const { pokemonId } = req.validatedParams;
      const { id, name } = req.validatedBody;
      if (!pokemonIds.includes(pokemonId)) {
        let idErr = new Error(`This id ${pokemonId} does not exist`);
        idErr.statusCode = 404;
        throw idErr;
      }
      if (!pokemonIds.includes(id) || !pokemonNames.includes(name)) {
        const inexistentError = new Error(
          `This id ${id} or name ${name} does not exist- please provide a valid id and name`
        );
        inexistentError.statusCode = 404;
        throw inexistentError;
      }
      const pokemonIndex = pokemons.findIndex(
        (pokemon) => pokemon.id === pokemonId
      );
      console.log(pokemons[pokemonIndex]);
      pokemons[pokemonIndex] = req.validatedBody;
      db = { data: pokemons, totalPokemons };
      fs.writeFileSync("db.json", JSON.stringify(db, null, 2));
      res.status(200).send({
        message: "Pokemon updated successfully",
        pokemon: req.validatedBody,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * params: /pokemons/${id}
 * description: delete pokemons
 * query: id
 * method: delete
 */

router.delete(
  "/:pokemonId",
  validateSchema(pokemonIdParamsSchema, "params"),
  (req, res, next) => {
    try {
      const { pokemonId } = req.validatedParams;
      if (!pokemonIds.includes(pokemonId)) {
        let idErr = new Error(`This id ${pokemonId} does not exist`);
        idErr.statusCode = 404;
        throw idErr;
      }
      const pokemonIndex = pokemons.findIndex(
        (pokemon) => pokemon.id === pokemonId
      );
      pokemons.splice(pokemonIndex, 1);
      totalPokemons -= 1;

      pokemonIds = pokemonIds.splice(pokemonIndex, 1);
      pokemonNames = pokemonNames.splice(pokemonIndex, 1);

      db = { data: pokemons, totalPokemons };
      fs.writeFileSync("db.json", JSON.stringify(db, null, 2));
      res.status(200).send({
        message: "Pokemon deleted successfully",
        data: pokemons,
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
