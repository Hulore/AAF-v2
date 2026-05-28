from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal


Variant = Literal["normal", "upgraded"]
GeneratorStatus = Literal["complete", "partial", "manual"]


@dataclass(slots=True)
class AafIconOptions:
    width: int = 128
    height: int = 160
    transparent: bool = True

    @classmethod
    def from_dict(cls, data: dict[str, Any] | None) -> "AafIconOptions":
        if not data:
            return cls()
        return cls(
            width=int(data.get("width") or 128),
            height=int(data.get("height") or 160),
            transparent=bool(data.get("transparent", True)),
        )


@dataclass(slots=True)
class AafIconRequest:
    id: str
    versionId: str
    variant: Variant
    name: str
    classId: str
    abilityType: str
    frameType: str
    damageType: str
    element: str
    damage: int | str | None = None
    manaCost: int | str | None = None
    mainSvgId: str | None = None
    mainSvgPath: str | None = None
    topIconType: str | None = None
    topIconSvgId: str | None = None
    classColor: str | None = None
    layoutId: str | None = None
    generatorStatus: GeneratorStatus = "partial"
    options: AafIconOptions = field(default_factory=AafIconOptions)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "AafIconRequest":
        return cls(
            id=str(data.get("id") or ""),
            versionId=str(data.get("versionId") or ""),
            variant=data.get("variant") or "normal",
            name=str(data.get("name") or ""),
            classId=str(data.get("classId") or ""),
            abilityType=str(data.get("abilityType") or ""),
            frameType=str(data.get("frameType") or ""),
            damageType=str(data.get("damageType") or ""),
            element=str(data.get("element") or "none"),
            damage=data.get("damage"),
            manaCost=data.get("manaCost"),
            mainSvgId=nullable_str(data.get("mainSvgId")),
            mainSvgPath=nullable_str(data.get("mainSvgPath")),
            topIconType=nullable_str(data.get("topIconType")),
            topIconSvgId=nullable_str(data.get("topIconSvgId")),
            classColor=nullable_str(data.get("classColor")),
            layoutId=nullable_str(data.get("layoutId")),
            generatorStatus=data.get("generatorStatus") or "partial",
            options=AafIconOptions.from_dict(data.get("options")),
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "versionId": self.versionId,
            "variant": self.variant,
            "name": self.name,
            "classId": self.classId,
            "abilityType": self.abilityType,
            "frameType": self.frameType,
            "damageType": self.damageType,
            "element": self.element,
            "damage": self.damage,
            "manaCost": self.manaCost,
            "mainSvgId": self.mainSvgId,
            "mainSvgPath": self.mainSvgPath,
            "topIconType": self.topIconType,
            "topIconSvgId": self.topIconSvgId,
            "classColor": self.classColor,
            "layoutId": self.layoutId,
            "generatorStatus": self.generatorStatus,
            "options": {
                "width": self.options.width,
                "height": self.options.height,
                "transparent": self.options.transparent,
            },
        }


@dataclass(slots=True)
class AafIconResult:
    ok: bool
    svg: str | None = None
    outputPath: str | None = None
    warnings: list[str] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        data: dict[str, Any] = {
            "ok": self.ok,
            "warnings": self.warnings,
            "errors": self.errors,
        }
        if self.svg is not None:
            data["svg"] = self.svg
        if self.outputPath is not None:
            data["outputPath"] = self.outputPath
        return data


def nullable_str(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value)
    return text if text else None

