async function test() {
  const speciesId = 479;
  const formIndex = 2; // Expecting Wash

  console.log(`Fetching species ${speciesId}...`);
  const res = await fetch(
    `https://pokeapi.co/api/v2/pokemon-species/${speciesId}`
  );
  if (!res.ok) {
    console.error("Failed to fetch species");
    return;
  }
  const data = await res.json();
  console.log("Varieties length:", data.varieties.length);

  data.varieties.forEach((v, i) => {
    console.log(`[${i}] ${v.pokemon.name} (is_default: ${v.is_default})`);
  });

  const variety = data.varieties[formIndex];
  console.log(`\nSelected index ${formIndex}:`, variety?.pokemon?.name);
}

test();
