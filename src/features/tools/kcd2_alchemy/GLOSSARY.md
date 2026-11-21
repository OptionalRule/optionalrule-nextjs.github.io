# KCD2 Alchemy Scholar

A reference for brewing in Kingdom Come: Deliverance 2. Players look up recipes by name, effect, or the ingredients they have, and see brewing steps that suit their current alchemy level.

## Language

### Recipes and potions

**Recipe**:
The full brewing procedure for one Potion: its Base Liquid, Ingredients with amounts, and Instructions.

**Potion**:
The brewed product a Recipe yields, with its Effects, Yield, and Base Value; each Potion has exactly one Recipe.

**Base Liquid**:
The liquid a Recipe starts from in the cauldron: Water, Wine, Spirits, or Oil.
_Avoid_: Liquid

**Ingredient**:
A named herb, animal part, or other material added to a Recipe on top of the Base Liquid.
_Avoid_: Item

**Ingredient Quantity**:
How many units of one Ingredient a Recipe calls for.

**Base Value**:
A Potion's standard trade price in groschen.
_Avoid_: Price

### Effects

**Effect**:
What a Potion does at one Effect Quality, written as free text.

**Effect Quality**:
The potency tier of a brewed Potion: Weak, Standard, Strong, or Henry's.
_Avoid_: Strength, superior

### Brewing

**Instructions**:
The ordered Steps that brew a Recipe, offered as Default Instructions and sometimes as Optimized Instructions.

**Step**:
One action in Instructions, such as grinding an Ingredient in the mortar, lowering the cauldron, or distilling into a phial.

**Default Instructions**:
The Steps any alchemist can follow, regardless of Alchemy Level.

**Optimized Instructions**:
A shorter or quicker set of Steps that needs a minimum Alchemy Level.
_Avoid_: Opt

**Minimum Level**:
The lowest Alchemy Level at which a Recipe's Optimized Instructions apply.
_Avoid_: Required level, min level

**Alchemy Level**:
The player character's skill rank in alchemy, from 0 to 20.
_Avoid_: Alchemy Skill, alchLvl

### Yield and perks

**Yield**:
How many Potions one brewing produces, which varies with the alchemy Perks held.
_Avoid_: Quantity, quantities

**Perk**:
An alchemy skill perk that raises Yield: Secret of Matter I, Secret of Matter II, or Secret of Secrets.

**Both Secrets**:
Having both Secret of Matter I and Secret of Matter II, which gives the highest standard Yield.

### Finding recipes

**Ingredient Filter**:
A chosen set of Ingredients used to narrow the Recipes shown.

**Match Mode**:
How the Ingredient Filter is applied: Any or Only.
_Avoid_: Ingredient mode, ingMode

**Any Match**:
A Recipe matches if it uses at least one of the filtered Ingredients.

**Only Match**:
A Recipe matches if every Ingredient it uses is among the filtered Ingredients, so nothing else is needed.
_Avoid_: All
