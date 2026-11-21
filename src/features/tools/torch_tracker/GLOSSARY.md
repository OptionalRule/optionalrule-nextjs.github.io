# Torch Tracker

A referee's tool for tracking every light source the party has burning in a Shadowdark session, measured in real time against one shared countdown. It answers "how long until the dungeon goes dark?" at a glance.

## Language

### Catalog

**Catalog**:
The fixed set of Light Source Templates a referee can add to the table.
_Avoid_: Catalog bar

**Light Source Template**:
A named kind of light (Torch, Lantern, Light Spell, Campfire) with its default Burn Duration, Bright Radius, and flavour.
_Avoid_: Catalog entry, archetype

**Source Type**:
The physical nature of a light: torch, lantern, spell, or fire.

**Category**:
The broad origin of a light: mundane, magical, or environmental, determined by its Source Type.

**Bright Radius**:
The distance in feet within which a light gives bright light.

**Mishap Note**:
A short rules reminder about how a light can fail or cause trouble, such as spilled oil or broken concentration.

### Lights in play

**Active Light**:
One specific light the party has in play, created from a Light Source Template and tracked on its own, whether Lit or Paused.
_Avoid_: Instance, light instance, active source, card

**Roster**:
All Active Lights currently in play.
_Avoid_: Active sources

**Lit**:
The state of an Active Light that is burning and consuming its Remaining Time.
_Avoid_: Active (as a state)

**Paused**:
The state of an Active Light that is set aside without burning, keeping its Remaining Time until it is Lit again.
_Avoid_: Inactive, extinguished

**Burn Duration**:
The total time a light burns from fresh, in minutes.
_Avoid_: Base duration

**Remaining Time**:
How much of an Active Light's Burn Duration is left.

**Elapsed Time**:
How much of an Active Light's Burn Duration has been spent while Lit.
_Avoid_: Time active, burn time

**Burn Out**:
The moment an Active Light's Remaining Time reaches zero and it leaves the Roster.
_Avoid_: Expire, extinguish

### Shared time

**Central Timer**:
The single shared countdown for the whole session, started from the first Active Light added; when it reaches zero, every Active Light Burns Out at once.
_Avoid_: Global timer, shared timer, shared clock

**Clock**:
Whether time is currently flowing for the table: running or stopped.
_Avoid_: Game clock

**Turn**:
One in-world exploration turn: ten minutes, the standard TTRPG unit for tracking light and time underground.

**Round**:
One minute of in-world time; ten Rounds make a Turn.

**Skip**:
A manual jump forward of one Round applied to the Central Timer and every Lit light.
_Avoid_: Advance, fast-forward

**Reset All**:
Returning every Active Light to its full Burn Duration and restarting the Central Timer.
