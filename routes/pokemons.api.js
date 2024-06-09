const express = require("express");
const router = express.Router();
const fs = require("fs");
const Joi = require("joi");

const schema = Joi.object({
  name: Joi.string().required(),
  id: Joi.number().integer().required(),
  url: Joi.string().required(),
  types: Joi.array()
    .length(2)
    .items(Joi.string().required(), Joi.string().optional()),
  description: Joi.string(),
  height: Joi.number(),
  weight: Joi.number(),
  category: Joi.string(),
  ability: Joi.array().items(Joi.string()),
});

const pokemonIdParamsSchema = Joi.object({
  pokemonId: Joi.number().integer().min(1).required(),
});

let pokemonTypes = [];
let pokemonNames = [];
let pokemonIds = [];

let db = fs.readFileSync("db.json", "utf-8");
db = JSON.parse(db);
let { data: pokemons, totalPokemons } = db;

pokemons.forEach((pokemon) => {
  pokemon.types.forEach((type) => {
    if (!pokemonTypes.includes(type)) {
      pokemonTypes.push(type);
    }
  });
});

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

router.get("/", (req, res, next) => {
  //request input validation
  const allowedFilter = ["page", "limit", "type", "name"];
  try {
    let { page, limit, ...filterQuery } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    let result = [];

    const { type, search: name } = filterQuery;
    const newFilterQ = { type, name };

    //allow title,limit and page query string only
    const filterKeys = Object.keys(newFilterQ);
    filterKeys.forEach((key) => {
      if (!allowedFilter.includes(key)) {
        const exception = new Error(`Query ${key} is not allowed`);
        exception.statusCode = 401;
        throw exception;
      }
      if (!newFilterQ[key]) {
        delete newFilterQ[key];
      }
    });

    const newFilterKeys = Object.keys(newFilterQ);

    //processing logic
    // number of items skip for selection
    let offset = limit * (page - 1);
    //Read data from db.json then parse to JSobject

    if (Object.keys(newFilterQ).length) {
      //check if type of pokemon is not included
      if (newFilterQ.type && !pokemonTypes.includes(newFilterQ.type)) {
        const typeError = new Error(`Not include this type ${newFilterQ.type}`);
        typeError.statusCode = 401;
        throw typeError;
      } else {
        pokemons.forEach((pokemon) => {
          if (pokemon.types.includes(newFilterQ.type)) result.push(pokemon);
        });
      }
      //check if name of pokemon is not included
      if (newFilterQ.name && !pokemonNames.includes(newFilterQ.name)) {
        const nameError = new Error(`Not include this name ${newFilterQ.name}`);
        nameError.statusCode = 401;
        throw nameError;
      } else {
        pokemons.forEach((pokemon) => {
          if (pokemon.name.includes(newFilterQ.name)) result = [pokemon];
        });
      }
    } else {
      result = pokemons;
    }
    result = result.slice(offset, offset + limit);
    let responseData = { data: result };

    //send response
    res.status(200).send(responseData);
  } catch (error) {
    next(error);
  }
});

/**
 * params: /pokemons/${id}
 * description: get pokemons by id
 * query: id
 * method: get
 */

router.get("/:pokemonId", (req, res, next) => {
  // let pokemonIds = [];

  // let db = fs.readFileSync("db.json", "utf-8");

  // db = JSON.parse(db);

  // let { data: pokemons, totalPokemons } = db;
  // pokemons.forEach((pokemon) => {
  //   if (!pokemonIds.includes(pokemon.id)) {
  //     pokemonIds.push(pokemon.id);
  //   }
  // });
  // put input validation

  let pokemon = {};
  let previousPokemon = {};
  let nextPokemon = {};

  try {
    let { pokemonId } = req.params;

    const newPokemonId = Number(pokemonId); // Convert the id to a number

    // Check if id is a valid number
    if (isNaN(newPokemonId)) {
      let idError = new Error(`Invalid id ${pokemonId}`);
      idError.statusCode = 400;
      throw idError;
    }

    // Check if id exists
    if (!pokemonIds.includes(newPokemonId)) {
      let idError = new Error(`This id ${pokemonId} does not exist`);
      idError.statusCode = 401;
      throw idError;
    }
    // Find the current, previous, and next Pokémon
    // pokemon = pokemons.find((pokemon) => pokemon.id === newPokemonId);
    const pokemonIndex = pokemons.findIndex(
      (pokemon) => pokemon.id === newPokemonId
    );
    pokemon = pokemons[pokemonIndex];
    // //  previous Pokémon when pokemon index is 0
    if (pokemonIndex === 0) {
      previousPokemon = pokemons[pokemons.length - 1];
    } else {
      previousPokemon = pokemons[pokemonIndex - 1];
    }
    // next Pokémon when id is the last one
    if (pokemonIndex === pokemons.length - 1) {
      nextPokemon = pokemons[0];
    } else {
      nextPokemon = pokemons[pokemonIndex + 1];
    }

    // //  previous Pokémon when id is 1
    // if (newPokemonId === 1) {
    //   previousPokemon = pokemons[pokemons.length - 1];
    // } else {
    //   previousPokemon = pokemons.find(
    //     (pokemon) => pokemon.id === newPokemonId - 1
    //   );
    // }

    // // next Pokémon when id is the last one
    // if (newPokemonId === pokemons[pokemons.length - 1].id) {
    //   nextPokemon = pokemons[0];
    // } else {
    //   nextPokemon = pokemons.find(
    //     (pokemon) => pokemon.id === newPokemonId + 1
    //   );
    // }
    // let previousIndex =
    //   (newPokemonId - 1 + pokemons.length) % pokemons.length;
    // let nextIndex = (newPokemonId + 1) % pokemons.length;

    // let previousPokemon = pokemons[previousIndex];
    // let nextPokemon = pokemons[nextIndex];

    let responseData = {
      data: {
        pokemon,
        previousPokemon,
        nextPokemon,
      },
    };
    // Send response
    res.status(200).send(responseData);
  } catch (error) {
    next(error);
  }
});

/**
 * params: /pokemons
 * description: create new pokemon with name,id,types or URL
 * query:
 * method: post
 * body: name, id, types, imageUrl
 */
router.post("/", (req, res, next) => {
  try {
    const { error, value } = schema.validate(req.body);
    const { id, name, types } = value;
    // using joi validator and setting schema on top to
    //check “Missing required data.” (name, id, types or URL)
    // check Pokémon can only have one or two types.” (if the types's length is greater than 2)
    // trhow error if happen
    if (error) {
      error.statusCode = 404;
      throw error;
    }
    //check if type is correct
    types.forEach((type) => {
      if (!pokemonTypes.includes(type)) {
        const typeError = new Error("This type does not exist");
        typeError.statusCode = 404;
        throw typeError;
      }
    });

    //check if id,name is already exists (added pokemon is existed) => throw err
    if (pokemonIds.includes(id) || pokemonNames.includes(name)) {
      const existedPokemonError = new Error(
        `this pokemon already exists- Please provide a unique name and id`
      );
      existedPokemonError.statusCode = 404;
      throw existedPokemonError;
    }
    pokemons.push(value);
    pokemonIds.push(id);
    pokemonNames.push(name);
    totalPokemons += 1;

    db = { data: pokemons, totalPokemons };
    db = JSON.stringify(db, null, 2);
    fs.writeFileSync("db.json", db);
    console.log("first", db);
    res
      .status(200)
      .send({ message: "Pokemon created successfully.", pokemon: value });
  } catch (error) {
    next(error);
  }
});

/**
 * params: /pokemons/${id}
 * description: update pokemon by id
 * query:
 * method: put
 * body: name, id, types, imageUrl
 */

router.put("/:pokemonId", (req, res, next) => {
  try {
    const { error, value } = schema.validate(req.body);
    const { id, name, types } = value;
    // const { pokemonId } = req.params;

    const {
      error: idErr,
      value: { pokemonId },
    } = pokemonIdParamsSchema.validate(req.params);

    // using joi validator and setting schema on top to
    //check “Missing required data.” (name, id, types or URL)
    // check Pokémon can only have one or two types.” (if the types's length is greater than 2)
    // trhow error if happen
    if (error) {
      error.statusCode = 404;
      throw error;
    }
    if (idErr) {
      idErr.statusCode = 404;
      throw idErr;
    }
    //check the param is correct

    // Check if id exists
    if (!pokemonIds.includes(pokemonId)) {
      let idError = new Error(`This id ${pokemonId} does not exist`);
      idError.statusCode = 404;
      throw idError;
    }

    //check if type is correct
    types.forEach((type) => {
      if (!pokemonTypes.includes(type)) {
        const typeError = new Error("This type does not exist");
        typeError.statusCode = 404;
        throw typeError;
      }
    });

    //check if id,name is matched with database  => throw err
    if (!pokemonIds.includes(id) || !pokemonNames.includes(name)) {
      const existedPokemonError = new Error(
        `this pokemon is not existed- Please provide a right name and id`
      );
      existedPokemonError.statusCode = 404;
      throw existedPokemonError;
    }

    //put processing logic
    const pokemonIndex = pokemons.findIndex(
      (pokemon) => pokemon.id === newPokemonId
    );

    pokemons[pokemonIndex] = value;

    db = { data: pokemons, totalPokemons };
    db = JSON.stringify(db);
    fs.writeFileSync("db.json", db);
    res
      .status(200)
      .send({ message: "Pokemon created successfully.", pokemon: value });
  } catch (error) {
    next(error);
  }
});

/**
 * params: /pokemons/${id}
 * description: delete pokemon by id
 * query:
 * method: delete
 */
router.delete("/:pokemonId", (req, res, next) => {
  const { pokemonId } = req.params;
  //check the param is correct
  const newPokemonId = Number(pokemonId); // Convert the id to a number

  // Check if id is a valid number
  if (isNaN(newPokemonId)) {
    let idError = new Error(`Invalid id ${pokemonId}`);
    idError.statusCode = 400;
    throw idError;
  }
  // Check if id exists
  if (!pokemonIds.includes(newPokemonId)) {
    let idError = new Error(`This id ${pokemonId} does not exist`);
    idError.statusCode = 401;
    throw idError;
  }
  //put processing logic
  const pokemonIndex = pokemons.findIndex(
    (pokemon) => pokemon.id === newPokemonId
  );
  pokemons.splice(pokemonIndex, 1);
  totalPokemons -= 1;
  db = { data: pokemons, totalPokemons };
  fs.writeFileSync("db.json", JSON.stringify(db));
  res.status(200).send("Deleted successfully");
});

module.exports = router;
