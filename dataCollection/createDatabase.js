const csv = require("csvtojson");
const fs = require("fs");
require("dotenv").config();
const BASE_URL = process.env.REACT_APP_BACKEND_API;

// const schema = Joi.object({
//   description: Joi.string().required(),
//   height: Joi.number().integer().required(),
//   weight: Joi.number().integer().required(),
//   category: Joi.string().required(),
//   abilites: Joi.array().items(Joi.string().required(), Joi.string().optional()),
// });
const pokemonNames = [];

let db = fs.readFileSync("db.json", "utf-8");
db = JSON.parse(db);
let { data: pokemons, totalPokemons } = db;

pokemons.map((pokemon) => {
  if (!pokemonNames.includes(pokemon.name)) {
    pokemonNames.push(pokemon.name);
  }
});

const generatePokeDescription = async () => {
  const descriptionData = await csv().fromFile("./description.csv");
  // console.log("des", descriptionData);

  const newDescription = descriptionData.map((pokemon) => {
    const { name, desc: description } = pokemon;
    const newDescriptionData = { name, description };
    return newDescriptionData;
  });
  return newDescription;
};

// console.log("pokemonName", pokemonNames);

const generateFakeData = async () => {
  const newPokemonData = await csv().fromFile("./pokedex.csv");

  const newAddedData = newPokemonData.map((pokemons) => {
    const { pokemon_name, ability_1, height, weight, genus } = pokemons;

    const name = pokemon_name.toLowerCase();
    const ability = ability_1.toLowerCase();
    const category = genus.toLowerCase();

    const newAddedData = {
      name,
      ability,
      height,
      weight,
      category,
    };
    return newAddedData;
  });
  return newAddedData;
};
// generateFakeData();

const createDatabase = async () => {
  try {
    let pokemonData = await csv().fromFile("./pokemon.csv");

    // let data = fs.readFileSync("./db.json", "utf-8");
    let pokemonImages = fs.readdirSync("./images");

    // data = JSON.parse(data);

    pokemonData = pokemonData.map((pokemon, index) => {
      const id = index + 1;
      const pokemonFileName = `${id}.png`;
      const imageUrl = pokemonImages.includes(pokemonFileName)
        ? `${BASE_URL}/images/${pokemonFileName}`
        : null;

      const name = pokemon.Name.toLowerCase();
      const type1 = pokemon.Type1.toLowerCase();
      const type2 = pokemon.Type2.toLowerCase();
      const types = [type1, type2].filter(Boolean);
      return {
        id,
        name,
        types,
        url: imageUrl,
      };
    });

    const newPokemonData = pokemonData.filter(
      (pokemon) => pokemon.url !== null
    );

    const totalPokemons = newPokemonData.length;
    /////--------> generate description
    const newScript = await generatePokeDescription();
    const addDescriptionPokemons = newPokemonData.map((pokemon) => {
      const descriptionObj = newScript.find(
        (desc) => desc.name === pokemon.name
      );
      if (descriptionObj) {
        return { ...pokemon, description: descriptionObj.description };
      }
      return pokemon;
    });

    //take the description filtered by pokemonNames

    /////--------> generate ability,height,weight,category
    // take the ability,height,weight,category and filter by pokemonNames
    const newAddedData = await generateFakeData();
    const pokemons = addDescriptionPokemons.map((pokemon) => {
      const newAddedObj = newAddedData.find(
        (data) => data.name === pokemon.name
      );
      if (newAddedObj) {
        return {
          ...pokemon,
          ability: newAddedObj.ability,
          height: newAddedObj.height,
          weight: newAddedObj.weight,
          category: newAddedObj.category,
        };
      }
      return pokemon;
    });

    // console.log("pokemon", pokemons);

    let newData = { data: pokemons, totalPokemons };

    newData = JSON.stringify(newData);
    fs.writeFileSync("db.json", newData);
  } catch (error) {
    console.error("Error", error);
  }
};

createDatabase();
