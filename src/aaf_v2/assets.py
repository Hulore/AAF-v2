from __future__ import annotations

import json
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "data"
ASSET_MANIFEST = DATA_DIR / "asset-manifest.json"


@dataclass(frozen=True, slots=True)
class AssetManifest:
    damage_types: dict[str, Path]
    damage_type_aliases: dict[str, str]
    elements: dict[str, Path]
    upgraded_diamond: Path


@lru_cache(maxsize=1)
def load_asset_manifest() -> AssetManifest:
    data = json.loads(ASSET_MANIFEST.read_text(encoding="utf-8"))
    return AssetManifest(
        damage_types={
            normalize_key(key): DATA_DIR / value
            for key, value in data.get("damageTypes", {}).items()
        },
        damage_type_aliases={
            normalize_key(key): normalize_key(value)
            for key, value in data.get("damageTypeAliases", {}).items()
        },
        elements={
            normalize_key(key): DATA_DIR / value
            for key, value in data.get("elements", {}).items()
        },
        upgraded_diamond=DATA_DIR / data["upgradedDiamond"],
    )


def normalize_key(value: str | None) -> str:
    return (value or "").strip().lower()


def canonical_damage_type(value: str | None) -> str:
    manifest = load_asset_manifest()
    key = normalize_key(value)
    return manifest.damage_type_aliases.get(key, key)


def resolve_damage_type_asset(value: str | None) -> Path | None:
    key = canonical_damage_type(value)
    if key in {"", "none"}:
        return None
    return load_asset_manifest().damage_types.get(key)


def resolve_element_asset(value: str | None) -> Path | None:
    key = normalize_key(value)
    if key in {"", "none"}:
        return None
    return load_asset_manifest().elements.get(key)


def resolve_upgraded_diamond_asset() -> Path:
    return load_asset_manifest().upgraded_diamond


def supported_damage_types() -> set[str]:
    manifest = load_asset_manifest()
    return set(manifest.damage_types) | set(manifest.damage_type_aliases) | {"none"}


def supported_elements() -> set[str]:
    return set(load_asset_manifest().elements) | {"none"}

