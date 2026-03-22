# CodeMachine v3

Simulateur de processeurs pour le cours INF1600 à Polytechnique Montréal. Écrivez des programmes en assembleur et visualisez l'exécution du CPU cycle par cycle.

## Processeurs supportés

- **Accumulateur** — ISA simple, 9 instructions
- **Accumulateur + MA** — Étendu, 20 instructions avec adressage indirect
- **PolyRisc** — RISC à 32 registres avec drapeaux

## Technologies

- **Simulation :** Rust → WebAssembly
- **Frontend :** SolidJS + Tailwind CSS v4 + CodeMirror 6
- **Bureau :** Electron

## Développement

```bash
# Compiler le WASM
cd simulator && wasm-pack build --target web --dev

# Lancer le frontend
cd frontend && npm install && npm run dev
```

## Construction

```bash
cd simulator && wasm-pack build --target web --release
cd frontend && npm run build && npx electron-builder
```

## Contribuez

Pour contribuer au projet, respectez la nomenclature git :

Les commits suivent cette forme :

    <type>(<portée>): <Courte description>

Types :
- `feat` : Fonctionnalités supplémentaires ou ajouts
- `fix` : Correction de bugs
- `style` : Changement de formatage ou mise en page
- `refactor` : Réusinage du code
- `doc` : Documentation
- `test` : Modifications de tests
- `chore` : Maintenance ou dépendances
