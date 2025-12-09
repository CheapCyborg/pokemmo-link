// const fetch = require('node-fetch'); // Or native fetch in newer node

const mons = ["breloom", "metagross", "blissey", "gengar", "rotom", "parasect"];

async function check() {
  for (const mon of mons) {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${mon}`);
    const data = await res.json();
    console.log(`\n--- ${mon.toUpperCase()} ---`);
    data.abilities.forEach((a) => {
      console.log(`Slot ${a.slot}: ${a.ability.name} (Hidden: ${a.is_hidden})`);
    });
  }
}

check();
