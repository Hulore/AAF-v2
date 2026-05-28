# Architecture

AAF v2 is a small rendering boundary between HuloreMewgenics V2 data and SVG assets.

```txt
V2 active ability data -> V2 adapter -> AafIconRequest -> AAF v2 -> AafIconResult
```

## Responsibilities

AAF v2 owns:

- validating icon-specific input
- resolving frame/layout choices
- rendering SVG
- returning warnings/errors
- optionally writing an output SVG path supplied by the caller

AAF v2 does not own:

- the full website data model
- version merging
- choosing the current game version
- rich text parsing
- deciding where the website stores final assets

## Milestones

1. API shell and CLI.
2. AAF v1 renderer port.
3. Fixture-based icon audit.
4. Missing visual elements.
5. V2 adapter integration.

