const Joi = require("joi");
const fs = require("fs");

let pokemonTypes = [];

let db = fs.readFileSync("db.json", "utf-8");
db = JSON.parse(db);
let { data: pokemons } = db;

pokemons.forEach((pokemon) => {
  pokemon.types.forEach((type) => {
    if (!pokemonTypes.includes(type)) {
      pokemonTypes.push(type);
    }
  });
});

const pokemonSchema = Joi.object({
  name: Joi.string().required(),
  id: Joi.number().integer().required(),
  url: Joi.string().required(),
  types: Joi.array()
    .length(2)
    .items(
      Joi.string()
        .valid(...pokemonTypes)
        .required(),
      Joi.string()
        .valid(...pokemonTypes)
        .optional()
    ),
  description: Joi.string(),
  height: Joi.number(),
  weight: Joi.number(),
  category: Joi.string(),
  ability: Joi.array().items(Joi.string()),
});

const pokemonIdParamsSchema = Joi.object({
  pokemonId: Joi.number().integer().min(1).required(),
});

const pokemonQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(10),
  type: Joi.string()
    .valid(...pokemonTypes)
    .optional(),
  search: Joi.string().optional(),
});

module.exports = { pokemonSchema, pokemonIdParamsSchema, pokemonQuerySchema };
