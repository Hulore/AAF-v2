# AAF v2

API-first Active Abilities Frame renderer for HuloreMewgenics V2.

AAF v2 receives a machine-readable active ability icon request and returns either an SVG string for preview or writes the generated SVG to a requested output path.

## Goals

- Render active ability icons from data, not by manually editing final SVG files.
- Support versioned active ability data: `active ability -> game version -> normal/upgraded variant`.
- Provide stable CLI and Python APIs for the V2 site/editor adapter.
- Keep the renderer independent from the full website data model.

## CLI

```powershell
python -m aaf_v2 preview fixtures/example.damage-mana.json
python -m aaf_v2 generate fixtures/example.damage-mana.json output/example.svg
```

Both commands print an `AafIconResult` JSON object.

## Current State

This repository starts with the V2 API shell and validation layer. The first real milestone is to port the proven AAF v1 frame rendering into `src/aaf_v2/renderer.py`, then fill the missing icon elements as explicit layout/assets rules.

The new V2 asset data lives in `data/` and is indexed by `data/asset-manifest.json`:

- `Dmg Type/`: physical, heal, magic, combo, contextual, contextualspell.
- `Elemental Type/`: earth, electric, explosion, fire, grass, gravity, holy, ice, music, shadow, water, wind.
- `Upgraded_diamond/`: upgraded diamond overlay.

See [docs/icon-completeness-plan.md](docs/icon-completeness-plan.md).
