# openworld
a Javascript engine for tactical roguelike games on small touchscreen devices

The _openworld_ engine is intended to provide an easy way to write some tactical roguelike games on small touchscreen devices by relying on a very easy directional control system. Developpers may create a new game rather quickly by focusing on the content in a JSON-like file for "theming" the engine.

The "world" is a procedurally generated infinite world containing 64 different kinds of areas with an elaborated system of neighbourhood (relying on travelling inside a 6D hypercube). The player should encounter infinitely many times the 64 areas with various shapes and sizes.

Each cell of the world can contain an ostacle, an item or a monster (however a monster can stand in a cell containing an item), but items and monsters are not persistent and are randomly generated according to the type of the area. Thus there are 64 kinds of ostacles, 64 kinds of monsters and 64 kinds of items.

Writing a game is achieved by writing short callbacks functions in a JSON file describing various interactions between the current item and monsters or obstacles, as well as the behaviour of each kind of monsters, etc.

## Using the engine

Edit the `js/areas.js` file and customize it in order to "skin" your game. More complex interactions are allowed and will be explained later.
