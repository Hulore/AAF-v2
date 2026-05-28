from __future__ import annotations

import json
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any

from .assets import DATA_DIR


DEFAULT_ICON_ELEMENT_LAYOUT = DATA_DIR / "layouts" / "icon-elements.damage-mana.json"
ICON_ELEMENT_LAYOUTS = {
    "damage-mana": DATA_DIR / "layouts" / "icon-elements.damage-mana.json",
    "multi-damage-mana": DATA_DIR / "layouts" / "icon-elements.multi-damage-mana.json",
    "mana": DATA_DIR / "layouts" / "icon-elements.mana.json",
}


@dataclass(frozen=True, slots=True)
class ElementLayout:
    id: str
    label: str
    x: float
    y: float
    width: float
    height: float
    rotation: float = 0
    visible: bool = True
    anchor: str = "center"
    gap_x: float = 0
    gap_y: float = 0
    direction: str = "left-to-right"

    @classmethod
    def from_dict(cls, element_id: str, data: dict[str, Any]) -> "ElementLayout":
        return cls(
            id=element_id,
            label=str(data.get("label") or element_id),
            x=float(data.get("x") or 0),
            y=float(data.get("y") or 0),
            width=float(data.get("width") or 0),
            height=float(data.get("height") or 0),
            rotation=float(data.get("rotation") or 0),
            visible=bool(data.get("visible", True)),
            anchor=str(data.get("anchor") or "center"),
            gap_x=float(data.get("gapX") or data.get("gap_x") or 0),
            gap_y=float(data.get("gapY") or data.get("gap_y") or 0),
            direction=str(data.get("direction") or "left-to-right"),
        )


@dataclass(frozen=True, slots=True)
class IconElementLayout:
    canvas_width: float
    canvas_height: float
    elements: dict[str, ElementLayout]


@lru_cache(maxsize=None)
def load_icon_element_layout(frame_type: str = "damage-mana") -> IconElementLayout:
    path = ICON_ELEMENT_LAYOUTS.get(frame_type, DEFAULT_ICON_ELEMENT_LAYOUT)
    data = json.loads(path.read_text(encoding="utf-8"))
    canvas = data.get("canvas") or {}
    elements = {
        element_id: ElementLayout.from_dict(element_id, item)
        for element_id, item in (data.get("elements") or {}).items()
    }
    return IconElementLayout(
        canvas_width=float(canvas.get("width") or 128),
        canvas_height=float(canvas.get("height") or 160),
        elements=elements,
    )
