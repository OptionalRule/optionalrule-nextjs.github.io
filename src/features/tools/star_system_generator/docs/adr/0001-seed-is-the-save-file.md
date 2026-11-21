# The seed is the save file

A generated system is never stored. It is fully determined by its seed plus generation options, and the shareable URL (`?seed=…` and option params) is the only way to persist or share one. We chose this over storing generated output because the site is static with no backend, and a link is the natural thing to drop into campaign notes (PRD: "the same seed and options produce the same system").

## Consequences

- Any change to generation logic, table contents, or table order silently changes what an existing shared link shows. Output is stamped with a generator version, but old versions are not reproducible. ADR-0002 adds the version to the link so that old versions can be reproduced.
- Where preserving old links matters, changes are made additively: e.g. the tone-split era pools keep the `balanced` pool byte-identical so balanced-tone seeds don't drift.
