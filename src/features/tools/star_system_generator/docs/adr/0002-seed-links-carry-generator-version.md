# Seed Links carry the Generator Version

ADR-0001 makes the Seed Link the save file, but the link did not say which generation rules produced the system, so any output-changing fix silently rewrote every shared link. Seed Links now carry a `v` param holding the Generator Version, so a later generator can keep an older version's rules and reproduce old links exactly.

- A link without `v` means version 2: every link shared before `v` existed was made by version 2.
- An unsupported, future or malformed `v` falls back to the current version, with no error. The address is then rewritten with the version actually used, so re-sharing it reproduces what the viewer saw.
- Any edit to the Seed or Generation Options adopts the current version. Only an unchanged link stays pinned to an old one.
- Links to a Linked System or parent system carry the version of the system they came from. A generator that dispatches on version must stamp the version it actually ran into the Generated System.

## Considered Options

- **No version, keep changes additive** (the ADR-0001 practice): rejected, because some fixes (such as the narrative domain substring fix) change almost every system and cannot be made additive.
- **Reject unknown versions with an error page**: rejected, because a static site has no older build to send the reader to, and a slightly different system beats no system.
