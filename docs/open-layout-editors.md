# Как открывать layout editors

Редакторы нужно открывать через локальный HTTP-сервер. Не открывай HTML-файлы двойным кликом из проводника: страницы `file://` не могут нормально загрузить JSON, SVG и шрифты через `fetch()`.

## Запуск сервера

Открой PowerShell в корне проекта:

```powershell
cd "H:\Mewgenics Projects\AAF-v2"
python -m http.server 8791 --bind 127.0.0.1
```

Окно PowerShell должно оставаться открытым, пока ты работаешь в редакторах.

## Ссылки на редакторы

Открывай в браузере:

- Damage + mana frame: http://127.0.0.1:8791/tools/v2_damage_mana_layout_editor.html
- Multi-damage + mana frame: http://127.0.0.1:8791/tools/v2_multi_damage_mana_layout_editor.html
- Mana-only frame: http://127.0.0.1:8791/tools/v2_mana_layout_editor.html

## Если порт 8791 занят

Можно запустить сервер на другом порту:

```powershell
python -m http.server 8792 --bind 127.0.0.1
```

Тогда в ссылках нужно заменить `8791` на `8792`.

## Где лежат layout JSON

Каждый редактор загружает отдельный JSON:

- `tools/v2_damage_mana_layout_editor.html` -> `data/layouts/icon-elements.damage-mana.json`
- `tools/v2_multi_damage_mana_layout_editor.html` -> `data/layouts/icon-elements.multi-damage-mana.json`
- `tools/v2_mana_layout_editor.html` -> `data/layouts/icon-elements.mana.json`

Сейчас редактор не пишет JSON-файл напрямую. Кнопка `Export JSON` обновляет textarea текущими настройками layout; этот JSON должен попасть в соответствующий файл из списка выше.

## Что настраивают редакторы

- `damage_type_icon`: положение и размер левой иконки типа урона/хила.
- `element_icon`: положение первой elemental icon, общий размер elemental icons и расстояние между несколькими elemental icons.
- `upgraded_diamond`: положение и размер diamond-иконки для улучшенных способностей.

Elemental icons всегда расставляются слева направо от якоря первой иконки.
