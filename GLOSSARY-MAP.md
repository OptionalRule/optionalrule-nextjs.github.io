# Glossary Map

## Contexts

- [Publishing](./src/lib/GLOSSARY.md): the Optional Rule blog — Posts, Pages, Tags, Search, and the site's Games/Tools structure
- [Star System Generator](./src/features/tools/star_system_generator/GLOSSARY.md): Tool that generates sci-fi star systems, their bodies, settlements, and narrative hooks
- [Torch Tracker](./src/features/tools/torch_tracker/GLOSSARY.md): Tool that tracks light sources burning down during TTRPG play
- [KCD2 Alchemy Scholar](./src/features/tools/kcd2_alchemy/GLOSSARY.md): Tool for browsing Kingdom Come: Deliverance 2 alchemy recipes
- [Asteroids](./src/features/games/asteroids/GLOSSARY.md): Game — a browser arcade space shooter

## Relationships

- **Publishing → Games/Tools**: Publishing hosts each sub-app at its own route and links to it from site navigation; it knows only the sub-app's name and address.
- **Games/Tools ↔ each other**: No shared language or code. Each sub-app is a self-contained context; a term in one (e.g. "turn", "level", "system") carries no meaning in another.
- **Games/Tools → Publishing**: Sub-apps depend on Publishing only for the site shell (layout, navigation, theme), never on Posts, Tags, or Search.
