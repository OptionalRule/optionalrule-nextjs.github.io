# Asteroids

An original arcade shooter: the player pilots a ship through drifting asteroid fields, breaking rocks apart and fending off saucers, across a run of levels that get harder.

## Language

### The run

**Game**:
One run from the first Level until the player's last Life is lost.

**Level**:
One asteroid field to clear; the run advances to the next Level when no asteroids remain.

**Asteroid Field**:
The set of Large Asteroids that opens a Level, starting at four and growing by one per Level up to twelve.
_Avoid_: Base field, asteroid count

**Level Transition**:
The short pause between Levels that announces the next Level, the Level Bonus, and any Extra Life.
_Avoid_: Loading, level loading

**Game Over**:
The end of a Game, reached when the last Life is lost.

### Ship

**Ship**:
The player's craft, which rotates, thrusts, and fires Player Bullets.
_Avoid_: Player

**Life**:
One Ship the player may still lose; a Game starts with three.

**Thrust**:
Acceleration of the Ship in the direction it faces.

**Respawn**:
The Ship's return to the centre of the screen after a short delay when a Life is lost and Lives remain.

**Invulnerability**:
A short window after Respawn in which nothing can destroy the Ship.

**Wrap**:
Leaving one edge of the playfield and reappearing at the opposite edge.

### Hazards

**Asteroid**:
A drifting rock that destroys the Ship on contact and breaks apart when shot.
_Avoid_: Rock

**Asteroid Size**:
An Asteroid's tier: Large, Medium, or Small; smaller Asteroids are worth more points.

**Split**:
The breaking of a shot Large or Medium Asteroid into Fragments of the next smaller size; a shot Small Asteroid is destroyed outright.

**Fragment**:
A smaller Asteroid produced by a Split: two Medium from a Large, three Small from a Medium.

**Saucer**:
A hostile craft that crosses the screen from Level 2 onward and fires Saucer Bullets at the Ship; only one is on screen at a time.
_Avoid_: Alien saucer, UFO, enemy

**Saucer Size**:
A Saucer's tier: Large (slower, less accurate, fewer points) or Small (faster, more accurate, more points).

**Saucer Exit**:
A Saucer leaving the far side of the screen without being destroyed.

### Bullets

**Bullet**:
A short-lived shot that destroys Asteroids and Saucers it hits.
_Avoid_: Projectile, laser

**Player Bullet**:
A Bullet fired by the Ship.

**Saucer Bullet**:
A Bullet fired by a Saucer and aimed at the Ship.

### Scoring

**Score**:
The points earned so far in the current Game.

**Level Bonus**:
Points awarded on clearing a Level, equal to the cleared Level's number times 100.
_Avoid_: Level completion bonus

**Extra Life**:
An additional Life earned for each 10,000 points of Score.

**Pending Extra Life**:
An Extra Life that has been earned but not yet granted; it is granted when the current Level is cleared.

**High Score**:
The best Score reached across all Games on this device.
