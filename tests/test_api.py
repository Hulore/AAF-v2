from pathlib import Path

from aaf_v2 import AafIconRequest, generate_active_icon, preview_active_icon


def test_preview_returns_svg() -> None:
    request = AafIconRequest.from_dict(
        {
            "id": "BloodMagic",
            "versionId": "1.1",
            "variant": "normal",
            "name": "Blood Magic",
            "classId": "butcher",
            "abilityType": "magic",
            "frameType": "damage-mana",
            "damageType": "physical",
            "element": "none",
            "damage": 5,
            "manaCost": 0,
            "mainSvgId": "975",
        }
    )

    result = preview_active_icon(request)

    assert result.ok
    assert result.svg is not None
    assert "<svg" in result.svg


def test_generate_writes_svg(tmp_path: Path) -> None:
    request = AafIconRequest.from_dict(
        {
            "id": "Regurge",
            "versionId": "1.1",
            "variant": "upgraded",
            "name": "Regurge",
            "classId": "butcher",
            "abilityType": "magic",
            "frameType": "mana",
            "damageType": "none",
            "element": "none",
            "manaCost": 2,
            "mainSvgId": "1258",
        }
    )
    output = tmp_path / "regurge.svg"

    result = generate_active_icon(request, output)

    assert result.ok
    assert output.exists()


def test_preview_embeds_damage_element_and_upgrade_assets() -> None:
    request = AafIconRequest.from_dict(
        {
            "id": "FireCombo",
            "versionId": "1.1",
            "variant": "upgraded",
            "name": "Fire Combo",
            "classId": "mage",
            "abilityType": "magic",
            "frameType": "damage-mana",
            "damageType": "physical-magic",
            "element": "fire",
            "damage": "1x10",
            "manaCost": 4,
            "mainSvgId": "756",
        }
    )

    result = preview_active_icon(request)

    assert result.ok
    assert result.svg is not None
    assert 'id="damage-type-icon"' in result.svg
    assert 'id="element-icon"' in result.svg
    assert 'id="upgraded-diamond"' in result.svg
