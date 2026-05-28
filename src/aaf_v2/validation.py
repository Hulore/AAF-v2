from __future__ import annotations

from .models import AafIconRequest


VALID_VARIANTS = {"normal", "upgraded"}
VALID_FRAME_TYPES = {"mana", "damage-mana", "multi-damage-mana"}
VALID_DAMAGE_TYPES = {
    "physical",
    "heal",
    "physical-or-heal",
    "magic",
    "physical-magic",
    "magic-or-heal",
    "none",
}
VALID_GENERATOR_STATUSES = {"complete", "partial", "manual"}


def validate_request(request: AafIconRequest) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []

    for field_name in ("id", "versionId", "variant", "name", "classId", "frameType"):
        if not getattr(request, field_name):
            errors.append(f"Missing required field: {field_name}")

    if request.variant not in VALID_VARIANTS:
        errors.append(f"Unsupported variant: {request.variant}")
    if request.frameType not in VALID_FRAME_TYPES:
        errors.append(f"Unsupported frameType: {request.frameType}")
    if request.damageType not in VALID_DAMAGE_TYPES:
        warnings.append(f"Unknown damageType: {request.damageType}")
    if request.generatorStatus not in VALID_GENERATOR_STATUSES:
        errors.append(f"Unsupported generatorStatus: {request.generatorStatus}")

    if request.frameType in {"damage-mana", "multi-damage-mana"} and request.damage is None:
        warnings.append(f"{request.frameType} icon has no damage value")
    if request.manaCost is None:
        warnings.append("Icon has no manaCost value")
    if not request.mainSvgId and not request.mainSvgPath:
        warnings.append("Icon has no main SVG reference yet")

    return warnings, errors

