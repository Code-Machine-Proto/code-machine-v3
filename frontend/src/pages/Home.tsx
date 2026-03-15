import { A } from "@solidjs/router";

const processors = [
  { id: "accumulator", name: "Accumulateur", description: "Processeur simple — 9 instructions, registre accumulateur unique" },
  { id: "accumulator-ma", name: "Accumulateur + MA", description: "Étendu — 20 instructions, adressage indirect via le registre MA" },
  { id: "polyrisc", name: "PolyRisc", description: "Processeur RISC — 32 registres, drapeaux, jeu d'instructions riche" },
];

export default function Home() {
  return (
    <div class="flex flex-col items-center justify-center h-screen gap-8">
      <h1 class="text-4xl font-bold text-main-300">CodeMachine</h1>
      <p class="text-main-500">Sélectionnez une architecture de processeur</p>
      <div class="flex gap-6">
        {processors.map((p) => (
          <A
            href={`/processor/${p.id}`}
            class="bg-main-900 border border-main-800 rounded-lg p-6 w-64 hover:border-accent transition-colors cursor-pointer"
          >
            <h2 class="text-xl font-semibold text-main-300 mb-2">{p.name}</h2>
            <p class="text-main-500 text-sm">{p.description}</p>
          </A>
        ))}
      </div>
    </div>
  );
}
