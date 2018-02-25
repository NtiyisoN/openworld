// worm effect : split worm 50% time
// unwalkable areas (water, lava)
// unwalkable + inapprochable (effluve) : 100% monstres statiques!
// métamorphoses monstres
// allié (golem)
areas = (function() {
    // Some generic functions for most frequent cases
    // ==============================================
    //
    var incScore = function (z) { return function(G) { G.score += z }; };
    //
    var deathPlayer = function(G, msg) {
        G.character.alive = false;
        G.character.color = "#666";
        G.restartGame(msg, "Restart the game");
    };
    // always move toward the target
    var monsterMoveBasic = function(G,c,tx,ty) {
        var dd = Math.max(Math.abs(c.x-tx), Math.abs(c.y-ty));
        var targets = [c];
        if(dd==1) {
            deathPlayer(G, G.story + G.areas[c.monster].monster.death);
        } else {
            var disp = G.emptyAround(c);
            for(var i=0;i<disp.length;i++) {
                var dd2 = Math.max(Math.abs(disp[i].x-tx), Math.abs(disp[i].y-ty));
                if (dd2<dd) { dd = dd2; targets = [disp[i]]; }
                else if(dd2==dd) { targets.push(disp[i]); }
            }
        }
        var t = targets[Math.floor(Math.random()*targets.length)];
        return [t.x, t.y];
    };
    // move toward the target but from time to time (probability z) an
    // "erratic" move is allowed; this allows the player to flee.
    var monsterMoveErratic = function(z) {
        return function(G,c,tx,ty) {
            var dd = Math.max(Math.abs(c.x-tx), Math.abs(c.y-ty));
            var targets = [c];
            if(dd==1) {
                deathPlayer(G, G.story + G.areas[c.monster].monster.death);
            } else {
                var disp = G.emptyAround(c);
                if(Math.random() < z) { targets = disp; }
                else {
                for(var i=0;i<disp.length;i++) {
                    var dd2 = Math.max(Math.abs(disp[i].x-tx), Math.abs(disp[i].y-ty));
                    if (dd2<dd) { dd = dd2; targets = [disp[i]]; }
                    else if(dd2==dd) { targets.push(disp[i]); }
                }
                }
            }
            var t = targets[Math.floor(Math.random()*targets.length)];
            return [t.x, t.y];
        };
    };
    // move toward the target but from time to time (probability z) an
    // "erratic" move is allowed; this allows the player to flee; furthermore
    // the monster doesn't leave areas with given numbers
    var monsterMoveErraticCoward = function(z, ar) {
        return function(G,c,tx,ty) {
            var dd = Math.max(Math.abs(c.x-tx), Math.abs(c.y-ty));
            var targets = [c];
            if(dd==1) {
                deathPlayer(G, G.story + G.areas[c.monster].monster.death);
            } else {
                var disp = G.emptyAround(c).filter(
                        function (e) { return ar.includes(e.area) });
                if(Math.random() < z) { targets = disp; }
                else {
                for(var i=0;i<disp.length;i++) {
                    var dd2 = Math.max(Math.abs(disp[i].x-tx), Math.abs(disp[i].y-ty));
                    if (dd2<dd) { dd = dd2; targets = [disp[i]]; }
                    else if(dd2==dd) { targets.push(disp[i]); }
                }
                }
            }
            var t = targets[Math.floor(Math.random()*targets.length)];
            return [t.x, t.y];
        };
    };
    // return function
    var basicProbability = function(p) {
        return function(G,c) {
            var t = Math.log(G.areaTurns[c.area] + 1); // [0..infty]
            t = 1/(1+t); // [0..1] (close to 1 at beginning)
            // console.log( (1-Math.pow(t,p)) );
            return (1-Math.pow(t,p));
        };
    };
    // ostacle probability
    var basicObstacleProbability = function (s) {
        return function (G, c) {
            return 0 == (Math.floor(
            G.geometry.getVectorRelative(c.x,c.y)
                .reduce(function(t,n) { return t*n; } )
                * 65536) % s);
        };
    };
  return [
  // area n° 0
    // very often contiguous: [1, 2, 4, 8, 16, 32]
    // often contiguous: [3, 5, 6, 9, 10, 12, 17, 18, 20, 24, 33, 34, 36, 40, 48]
    // sometimes contiguous: [7, 11, 13, 14, 19, 21, 22, 25, 26, 28, 35, 37, 38, 41, 42, 44, 49, 50, 52, 56]
    // seldom contiguous: [15, 23, 27, 29, 30, 39, 43, 45, 46, 51, 53, 54, 57, 58, 60]
    // very seldom contiguous: [31, 47, 55, 59, 61, 62]
    // probably never contiguous: [63]
  {
     symbol: "\u00b7", // middle dot
     color: "#690",
     desc: "You are wandering in a large <span class='areaName'>meadow</span>.",
     obstacle: {
       symbol: "\u00a5", // yen
       color: "#77b300",
       bold: "normal",
       msg: "You cannot walk on this <span class='obstacleName'>tree</span>!",
       elements: ["vegetal"],
       check: basicObstacleProbability(11)
     },
     monster: {
       symbol: "d",
       color: "#930",
       bold: "normal",
       msg: "The <span class='monsterName'>fox</span> would kill you!",
       kill: "You killed the <span class='monsterName'>fox</span>!",
       elements: ["mammal", "animal"],
       probability: basicProbability(0.005),
       move: monsterMoveErraticCoward(0.1, [0, 2]), // TODO
       death: "You were killed by a <span class='monsterName'>fox</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#c90",
       bold: "normal",
       name: "Sign of Earth",
       msg: "You found the <span class='itemName'>sign of Earth</span>!",
       desc: "Use it for killing some common creatures.",
       probability: function(G, c) { return 0.0025; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) {
         if(G.areas[c.monster].monster.elements.includes("mammal")) {
             G.destroyMonster(c);
             G.score += 1;
             G.displayScore();
             return true;
         } else { return false; }
     },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 1
    // very often contiguous: [0, 3, 5, 9, 17, 33]
    // often contiguous: [2, 4, 7, 8, 11, 13, 16, 19, 21, 25, 32, 35, 37, 41, 49]
    // sometimes contiguous: [6, 10, 12, 15, 18, 20, 23, 24, 27, 29, 34, 36, 39, 40, 43, 45, 48, 51, 53, 57]
    // seldom contiguous: [14, 22, 26, 28, 31, 38, 42, 44, 47, 50, 52, 55, 56, 59, 61]
    // very seldom contiguous: [30, 46, 54, 58, 60, 63]
    // probably never contiguous: [62]
  {
     symbol: "~",
     color: "#09f",
     desc: "You are walking on <span class='areaName'>water</span>.",
     obstacle: {
       symbol: "~",
       color: "#09f",
       bold: "normal",
       msg: "You cannot walk in the <span class='areaName'>water</span>!",
       elements: ["unwalkable"],
       check: basicObstacleProbability(1)
     },
     monster: {
       symbol: "~",
       color: "#09f",
       bold: "normal",
       msg: "",
       kill: "",
       elements: ["unwalkable"],
       probability: function(G, c) { return -1; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: ""
     },
     item: {
       symbol: "\u00a0",
       color: "#09f",
       bold: "normal",
       name: "",
       msg: "",
       desc: "",
       probability: function(G, c) { return -1; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 2
    // very often contiguous: [0, 3, 6, 10, 18, 34]
    // often contiguous: [1, 4, 7, 8, 11, 14, 16, 19, 22, 26, 32, 35, 38, 42, 50]
    // sometimes contiguous: [5, 9, 12, 15, 17, 20, 23, 24, 27, 30, 33, 36, 39, 40, 43, 46, 48, 51, 54, 58]
    // seldom contiguous: [13, 21, 25, 28, 31, 37, 41, 44, 47, 49, 52, 55, 56, 59, 62]
    // very seldom contiguous: [29, 45, 53, 57, 60, 63]
    // probably never contiguous: [61]
  {
     symbol: "\u00B7", // middle dot
     color: "#690",
     desc: "You are entering a <span class='areaName'>deep forest</span>. You can hear the sound of distant howlings.",
     obstacle: {
       symbol: "\u00a5", // yen
       color: "#690",
       bold: "normal",
       msg: "You cannot walk on this <span class='obstacleName'>tree</span>!",
       elements: ["vegetal"],
       check: basicObstacleProbability(2)
     },
     monster: {
       symbol: "d",
       color: "#c0c0c0",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: ["mammal", "animal"],
       probability: basicProbability(0.01),
       move: monsterMoveErraticCoward(-1, [0, 2, 5, 7]), // TODO
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#b38600",
       bold: "normal",
       name: "Sign of Darkness",
       msg: "You found the <span class='itemName'>sign of Darkness</span>!",
       desc: "Use it for killing various creatures.",
       probability: function(G, c) { return 0.0025; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) {
         if(G.areas[c.monster].monster.elements.includes("animal")) {
             G.destroyMonster(c);
             G.score += 1;
             G.displayScore();
             return true;
         } else { return false; }
     },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 3   TODO
    // very often contiguous: [1, 2, 7, 11, 19, 35]
    // often contiguous: [0, 5, 6, 9, 10, 15, 17, 18, 23, 27, 33, 34, 39, 43, 51]
    // sometimes contiguous: [4, 8, 13, 14, 16, 21, 22, 25, 26, 31, 32, 37, 38, 41, 42, 47, 49, 50, 55, 59]
    // seldom contiguous: [12, 20, 24, 29, 30, 36, 40, 45, 46, 48, 53, 54, 57, 58, 63]
    // very seldom contiguous: [28, 44, 52, 56, 61, 62]
    // probably never contiguous: [60]
  {
     symbol: "+",
     color: "#036",
     desc: "You are trying to walk in a large <span class='areaName'>puddle of standing water</span>.",
     obstacle: {
       symbol: "\u0448",
       color: "#00cc7a",
       bold: "normal",
       msg: "You cannot walk on this <span class='obstacleName'>bush</span>!",
       elements: ["vegetal"],
       check: basicObstacleProbability(20)
     },
     monster: {
       symbol: "s",
       color: "#008080",
       bold: "normal",
       msg: "The <span class='monsterName'>giant eel</span> would kill you!",
       kill: "You killed the <span class='monsterName'>giant eel</span>!",
       elements: ["animal", "fish", "snake"],
       probability: basicProbability(0.0065),
       move: monsterMoveErraticCoward(0.015, [3, 7]), // TODO
       death: "You were killed by a <span class='monsterName'>giant eel</span>!"
     },
     item: {
       symbol: "\u25ca",
       color: "#099",
       bold: "normal",
       name: "Sign of Deep Water",
       msg: "You found the <span class='itemName'>sign of Deep Water</span>!",
       desc: "Use it for TODO.", // TODO
       probability: function(G, c) { return 0.0025; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) {
         if(G.areas[c.monster].monster.elements.includes("animal")) {
             G.destroyMonster(c);
             G.score += 1;
             G.displayScore();
             return true;
         } else { return false; }
     },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 4
    // very often contiguous: [0, 5, 6, 12, 20, 36]
    // often contiguous: [1, 2, 7, 8, 13, 14, 16, 21, 22, 28, 32, 37, 38, 44, 52]
    // sometimes contiguous: [3, 9, 10, 15, 17, 18, 23, 24, 29, 30, 33, 34, 39, 40, 45, 46, 48, 53, 54, 60]
    // seldom contiguous: [11, 19, 25, 26, 31, 35, 41, 42, 47, 49, 50, 55, 56, 61, 62]
    // very seldom contiguous: [27, 43, 51, 57, 58, 63]
    // probably never contiguous: [59]
  {
     symbol: "\u00B7", // middle dot
     color: "#cc0",
     desc: "You are entering a large <span class='areaName'>desert</span>.",
     obstacle: {
       symbol: "\u25b2",
       color: "#cc0",
       bold: "normal",
       msg: "You cannot walk on this huge <span class='obstacleName'>rock</span>!",
       elements: ["mineral"],
       check: basicObstacleProbability(18)
     },
     monster: {
       symbol: "w",
       color: "#ffbf80",
       bold: "normal",
       msg: "The <span class='monsterName'>giant worm</span> would kill you!",
       kill: "You killed the <span class='monsterName'>giant worm</span>!",
       elements: ["animal", "worm"],
       probability: basicProbability(0.05),
         // TODO: ne s'écarte pas de son territoire
       move: monsterMoveErraticCoward(0.25, [4, 5]), // TODO
       death: "You were killed by a <span class='monsterName'>giant worm</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#ffbf00",
       bold: "normal",
       name: "Sign of Stone",
       msg: "You found the <span class='itemName'>sign of Stone</span>!",
       desc: "Use it for killing various creatures and break stones.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) {
         if(G.areas[c.monster].monster.elements.includes("animal")) {
             G.destroyMonster(c);
             G.score += 1;
             G.displayScore();
             return true;
         } else { return false; }
       },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) {
         if(G.areas[c.area].obstacle.elements.includes("mineral")) {
             c.obstacle = false;
             // TODO in some worlds, an item is found under the rock
             if(c.area == 5) { if (Math.random()<0.125) { c.item = true; } }
             c.refreshDisplay();
             return true;
         } else { return false; }
       }
     }
  },
  // area n° 5
    // very often contiguous: [1, 4, 7, 13, 21, 37]
    // often contiguous: [0, 3, 6, 9, 12, 15, 17, 20, 23, 29, 33, 36, 39, 45, 53]
    // sometimes contiguous: [2, 8, 11, 14, 16, 19, 22, 25, 28, 31, 32, 35, 38, 41, 44, 47, 49, 52, 55, 61]
    // seldom contiguous: [10, 18, 24, 27, 30, 34, 40, 43, 46, 48, 51, 54, 57, 60, 63]
    // very seldom contiguous: [26, 42, 50, 56, 59, 62]
    // probably never contiguous: [58]
  {
     symbol: "\u00b7",
     color: "#c00",
     desc: "You discovered a <span class='areaName'>rugged terrain</span>. You have the feeling that something is hidden somewhere.",
     obstacle: {
       symbol: "\u25b2",
       color: "#c00",
       bold: "normal",
       msg: "You cannot walk on this huge <span class='obstacleName'>rock</span>!",
       elements: ["mineral"],
       check: basicObstacleProbability(2)
     },
     monster: {
       symbol: "w",
       color: "#ff8000",
       bold: "normal",
       msg: "The <span class='monsterName'>giant worm</span> would kill you!",
       kill: "You killed the <span class='monsterName'>giant worm</span>!",
       elements: ["animal", "worm"],
       probability: basicProbability(0.05),
       move: monsterMoveErraticCoward(0.25, [4, 5]), // TODO
       death: "You were killed by a <span class='monsterName'>giant worm</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#f33",
       bold: "normal",
       name: "Sign of Fire",
       msg: "You found the <span class='itemName'>sign of Fire</span>!",
       desc: "Use it for killing wolves.", // TODO
       probability: function(G, c) { return -1; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) {
         if(G.areas[c.monster].monster.elements.includes("animal")) {
             G.destroyMonster(c);
             G.score += 1;
             G.displayScore();
             return true;
         } else { return false; }
     },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) {
         if(G.areas[c.area].obstacle.elements.includes("mineral")) {
             c.obstacle = false;
             // TODO in some worlds, an itme is found under the rock
             if(c.area == 5) { if (Math.random()<0.125) { c.item = true; } }
             c.refreshDisplay();
             return true;
         } else { return false; }
       }
     }
  },
  // area n° 6
    // very often contiguous: [2, 4, 7, 14, 22, 38]
    // often contiguous: [0, 3, 5, 10, 12, 15, 18, 20, 23, 30, 34, 36, 39, 46, 54]
    // sometimes contiguous: [1, 8, 11, 13, 16, 19, 21, 26, 28, 31, 32, 35, 37, 42, 44, 47, 50, 52, 55, 62]
    // seldom contiguous: [9, 17, 24, 27, 29, 33, 40, 43, 45, 48, 51, 53, 58, 60, 63]
    // very seldom contiguous: [25, 41, 49, 56, 59, 61]
    // probably never contiguous: [57]
  {
     symbol: "\u00b7", // TODO
     color: "#c66528",
     desc: "You are walking on <span class='areaName'>land n° 6</span>.",
     obstacle: {
       symbol: "Y",
       color: "#c66528",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: ["vegetal"],
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#c66528",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: ["mammal"],
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#c66528",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 7
    // very often contiguous: [3, 5, 6, 15, 23, 39]
    // often contiguous: [1, 2, 4, 11, 13, 14, 19, 21, 22, 31, 35, 37, 38, 47, 55]
    // sometimes contiguous: [0, 9, 10, 12, 17, 18, 20, 27, 29, 30, 33, 34, 36, 43, 45, 46, 51, 53, 54, 63]
    // seldom contiguous: [8, 16, 25, 26, 28, 32, 41, 42, 44, 49, 50, 52, 59, 61, 62]
    // very seldom contiguous: [24, 40, 48, 57, 58, 60]
    // probably never contiguous: [56]
  {
     symbol: "\u2237", // four dots
     color: "#806600",
     desc: "You are trying to walk forward in a <span class='areaName'>spongy marsh</span>.",
     obstacle: {
       symbol: "\u2248", // two waves
       color: "#884",
       bold: "normal",
       msg: "You cannot walk in this <span class='obstacleName'>swampy ditch</span>!",
       elements: ["water"],
       check: basicObstacleProbability(5)
     },
     monster: {
       symbol: "s",
       color: "#aa5",
       bold: "normal",
       msg: "The <span class='monsterName'>large snake</span> would kill you!",
       kill: "You killed the <span class='monsterName'>large snake</span>!",
       elements: ["animal", "snake"],
       probability: basicProbability(0.075),
       move: monsterMoveErraticCoward(-1, [2, 7]), // TODO
       death: "You were killed by a <span class='monsterName'>large snake</span>!"
     },
     item: {
       symbol: "\u25ca",
       color: "#86b300",
       bold: "normal",
       name: "Sign of Dark Water",
       msg: "You found the <span class='itemName'>sign of Dark Water</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.005; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 8
    // very often contiguous: [0, 9, 10, 12, 24, 40]
    // often contiguous: [1, 2, 4, 11, 13, 14, 16, 25, 26, 28, 32, 41, 42, 44, 56]
    // sometimes contiguous: [3, 5, 6, 15, 17, 18, 20, 27, 29, 30, 33, 34, 36, 43, 45, 46, 48, 57, 58, 60]
    // seldom contiguous: [7, 19, 21, 22, 31, 35, 37, 38, 47, 49, 50, 52, 59, 61, 62]
    // very seldom contiguous: [23, 39, 51, 53, 54, 63]
    // probably never contiguous: [55]
  {
     symbol: "\u00b7",
     color: "#70a49f",
     desc: "You are walking on <span class='areaName'>land n° 8</span>.",
     obstacle: {
       symbol: "Y",
       color: "#70a49f",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#70a49f",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#70a49f",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 9
    // very often contiguous: [1, 8, 11, 13, 25, 41]
    // often contiguous: [0, 3, 5, 10, 12, 15, 17, 24, 27, 29, 33, 40, 43, 45, 57]
    // sometimes contiguous: [2, 4, 7, 14, 16, 19, 21, 26, 28, 31, 32, 35, 37, 42, 44, 47, 49, 56, 59, 61]
    // seldom contiguous: [6, 18, 20, 23, 30, 34, 36, 39, 46, 48, 51, 53, 58, 60, 63]
    // very seldom contiguous: [22, 38, 50, 52, 55, 62]
    // probably never contiguous: [54]
  {
     symbol: "\u00b7",
     color: "#1b1809",
     desc: "You are walking on <span class='areaName'>land n° 9</span>.",
     obstacle: {
       symbol: "Y",
       color: "#1b1809",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#1b1809",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#1b1809",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 10
    // very often contiguous: [2, 8, 11, 14, 26, 42]
    // often contiguous: [0, 3, 6, 9, 12, 15, 18, 24, 27, 30, 34, 40, 43, 46, 58]
    // sometimes contiguous: [1, 4, 7, 13, 16, 19, 22, 25, 28, 31, 32, 35, 38, 41, 44, 47, 50, 56, 59, 62]
    // seldom contiguous: [5, 17, 20, 23, 29, 33, 36, 39, 45, 48, 51, 54, 57, 60, 63]
    // very seldom contiguous: [21, 37, 49, 52, 55, 61]
    // probably never contiguous: [53]
  {
     symbol: "\u00b7",
     color: "#49e4d4",
     desc: "You are walking on <span class='areaName'>land n° 10</span>.",
     obstacle: {
       symbol: "Y",
       color: "#49e4d4",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#49e4d4",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#49e4d4",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 11
    // very often contiguous: [3, 9, 10, 15, 27, 43]
    // often contiguous: [1, 2, 7, 8, 13, 14, 19, 25, 26, 31, 35, 41, 42, 47, 59]
    // sometimes contiguous: [0, 5, 6, 12, 17, 18, 23, 24, 29, 30, 33, 34, 39, 40, 45, 46, 51, 57, 58, 63]
    // seldom contiguous: [4, 16, 21, 22, 28, 32, 37, 38, 44, 49, 50, 55, 56, 61, 62]
    // very seldom contiguous: [20, 36, 48, 53, 54, 60]
    // probably never contiguous: [52]
  {
     symbol: "\u00b7",
     color: "#b5a73a",
     desc: "You are walking on <span class='areaName'>land n° 11</span>.",
     obstacle: {
       symbol: "Y",
       color: "#b5a73a",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#b5a73a",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#b5a73a",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 12
    // very often contiguous: [4, 8, 13, 14, 28, 44]
    // often contiguous: [0, 5, 6, 9, 10, 15, 20, 24, 29, 30, 36, 40, 45, 46, 60]
    // sometimes contiguous: [1, 2, 7, 11, 16, 21, 22, 25, 26, 31, 32, 37, 38, 41, 42, 47, 52, 56, 61, 62]
    // seldom contiguous: [3, 17, 18, 23, 27, 33, 34, 39, 43, 48, 53, 54, 57, 58, 63]
    // very seldom contiguous: [19, 35, 49, 50, 55, 59]
    // probably never contiguous: [51]
  {
     symbol: "\u00b7",
     color: "#d48248",
     desc: "You are walking on <span class='areaName'>land n° 12</span>.",
     obstacle: {
       symbol: "Y",
       color: "#d48248",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#d48248",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#d48248",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 13
    // very often contiguous: [5, 9, 12, 15, 29, 45]
    // often contiguous: [1, 4, 7, 8, 11, 14, 21, 25, 28, 31, 37, 41, 44, 47, 61]
    // sometimes contiguous: [0, 3, 6, 10, 17, 20, 23, 24, 27, 30, 33, 36, 39, 40, 43, 46, 53, 57, 60, 63]
    // seldom contiguous: [2, 16, 19, 22, 26, 32, 35, 38, 42, 49, 52, 55, 56, 59, 62]
    // very seldom contiguous: [18, 34, 48, 51, 54, 58]
    // probably never contiguous: [50]
  {
     symbol: "~",
     color: "#c00",
     desc: "You cannot walk on this <span class='areaName'>boiling lava</span>.",
     obstacle: {
       symbol: "\u2248",
       color: "#c00",
       bold: "normal",
       msg: "You cannot walk on this <span class='areaName'>boiling lava</span>!",
       elements: ["unwalkable"],
       check: basicObstacleProbability(1)
     },
     monster: {
       symbol: "",
       color: "#c00",
       bold: "normal",
       msg: "",
       kill: "",
       elements: ["unwalkable"],
       probability: function(G, c) { return -1; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: ""
     },
     item: {
       symbol: "",
       color: "#c00",
       bold: "normal",
       name: "",
       msg: "",
       desc: "",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 14
    // very often contiguous: [6, 10, 12, 15, 30, 46]
    // often contiguous: [2, 4, 7, 8, 11, 13, 22, 26, 28, 31, 38, 42, 44, 47, 62]
    // sometimes contiguous: [0, 3, 5, 9, 18, 20, 23, 24, 27, 29, 34, 36, 39, 40, 43, 45, 54, 58, 60, 63]
    // seldom contiguous: [1, 16, 19, 21, 25, 32, 35, 37, 41, 50, 52, 55, 56, 59, 61]
    // very seldom contiguous: [17, 33, 48, 51, 53, 57]
    // probably never contiguous: [49]
  {
     symbol: "\u00b7",
     color: "#3b7168",
     desc: "You are walking on <span class='areaName'>land n° 14</span>.",
     obstacle: {
       symbol: "Y",
       color: "#3b7168",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#3b7168",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#3b7168",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 15
    // very often contiguous: [7, 11, 13, 14, 31, 47]
    // often contiguous: [3, 5, 6, 9, 10, 12, 23, 27, 29, 30, 39, 43, 45, 46, 63]
    // sometimes contiguous: [1, 2, 4, 8, 19, 21, 22, 25, 26, 28, 35, 37, 38, 41, 42, 44, 55, 59, 61, 62]
    // seldom contiguous: [0, 17, 18, 20, 24, 33, 34, 36, 40, 51, 53, 54, 57, 58, 60]
    // very seldom contiguous: [16, 32, 49, 50, 52, 56]
    // probably never contiguous: [48]
  {
     symbol: "\u2248",
     color: "#606",
     desc: "The <span class='areaName'>poisoned vapors</span> would kill you</span>!",
     obstacle: {
       symbol: "\u2248",
       color: "#606",
       bold: "normal",
       msg: "The <span class='areaName'>poisoned vapors</span> would kill you!",
       elements: ["unwalkable"],
       check: basicObstacleProbability(0)
     },
     monster: {
       symbol: "\u2248", // two waves
       color: "#606",
       bold: "normal",
       msg: "The <span class='areaName'>poisoned vapors</span> would kill you!",
       kill: "",
       elements: ["unwalkable"],
       probability: function(G, c) { return 2; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by <span class='monsterName'>poisoned vapors</span>!"
     },
     item: {
       symbol: "\u2248",
       color: "#606",
       bold: "normal",
       name: "",
       msg: "",
       desc: "",
       probability: function(G, c) { return -1; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 16
    // very often contiguous: [0, 17, 18, 20, 24, 48]
    // often contiguous: [1, 2, 4, 8, 19, 21, 22, 25, 26, 28, 32, 49, 50, 52, 56]
    // sometimes contiguous: [3, 5, 6, 9, 10, 12, 23, 27, 29, 30, 33, 34, 36, 40, 51, 53, 54, 57, 58, 60]
    // seldom contiguous: [7, 11, 13, 14, 31, 35, 37, 38, 41, 42, 44, 55, 59, 61, 62]
    // very seldom contiguous: [15, 39, 43, 45, 46, 63]
    // probably never contiguous: [47]
  {
     symbol: "\u00b7",
     color: "#e6f646",
     desc: "You are walking on <span class='areaName'>land n° 16</span>.",
     obstacle: {
       symbol: "Y",
       color: "#e6f646",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#e6f646",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#e6f646",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 17
    // very often contiguous: [1, 16, 19, 21, 25, 49]
    // often contiguous: [0, 3, 5, 9, 18, 20, 23, 24, 27, 29, 33, 48, 51, 53, 57]
    // sometimes contiguous: [2, 4, 7, 8, 11, 13, 22, 26, 28, 31, 32, 35, 37, 41, 50, 52, 55, 56, 59, 61]
    // seldom contiguous: [6, 10, 12, 15, 30, 34, 36, 39, 40, 43, 45, 54, 58, 60, 63]
    // very seldom contiguous: [14, 38, 42, 44, 47, 62]
    // probably never contiguous: [46]
  {
     symbol: "\u00b7",
     color: "#ea34e1",
     desc: "You are walking on <span class='areaName'>land n° 17</span>.",
     obstacle: {
       symbol: "Y",
       color: "#ea34e1",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#ea34e1",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#ea34e1",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 18
    // very often contiguous: [2, 16, 19, 22, 26, 50]
    // often contiguous: [0, 3, 6, 10, 17, 20, 23, 24, 27, 30, 34, 48, 51, 54, 58]
    // sometimes contiguous: [1, 4, 7, 8, 11, 14, 21, 25, 28, 31, 32, 35, 38, 42, 49, 52, 55, 56, 59, 62]
    // seldom contiguous: [5, 9, 12, 15, 29, 33, 36, 39, 40, 43, 46, 53, 57, 60, 63]
    // very seldom contiguous: [13, 37, 41, 44, 47, 61]
    // probably never contiguous: [45]
  {
     symbol: "\u00b7",
     color: "#708e0e",
     desc: "You are walking on <span class='areaName'>land n° 18</span>.",
     obstacle: {
       symbol: "Y",
       color: "#708e0e",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#708e0e",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#708e0e",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 19
    // very often contiguous: [3, 17, 18, 23, 27, 51]
    // often contiguous: [1, 2, 7, 11, 16, 21, 22, 25, 26, 31, 35, 49, 50, 55, 59]
    // sometimes contiguous: [0, 5, 6, 9, 10, 15, 20, 24, 29, 30, 33, 34, 39, 43, 48, 53, 54, 57, 58, 63]
    // seldom contiguous: [4, 8, 13, 14, 28, 32, 37, 38, 41, 42, 47, 52, 56, 61, 62]
    // very seldom contiguous: [12, 36, 40, 45, 46, 60]
    // probably never contiguous: [44]
  {
     symbol: "\u00b7",
     color: "#4b1016",
     desc: "You are walking on <span class='areaName'>land n° 19</span>.",
     obstacle: {
       symbol: "Y",
       color: "#4b1016",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#4b1016",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#4b1016",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 20
    // very often contiguous: [4, 16, 21, 22, 28, 52]
    // often contiguous: [0, 5, 6, 12, 17, 18, 23, 24, 29, 30, 36, 48, 53, 54, 60]
    // sometimes contiguous: [1, 2, 7, 8, 13, 14, 19, 25, 26, 31, 32, 37, 38, 44, 49, 50, 55, 56, 61, 62]
    // seldom contiguous: [3, 9, 10, 15, 27, 33, 34, 39, 40, 45, 46, 51, 57, 58, 63]
    // very seldom contiguous: [11, 35, 41, 42, 47, 59]
    // probably never contiguous: [43]
  {
     symbol: "\u00b7",
     color: "#d6243e",
     desc: "You are walking on <span class='areaName'>land n° 20</span>.",
     obstacle: {
       symbol: "Y",
       color: "#d6243e",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#d6243e",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#d6243e",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 21
    // very often contiguous: [5, 17, 20, 23, 29, 53]
    // often contiguous: [1, 4, 7, 13, 16, 19, 22, 25, 28, 31, 37, 49, 52, 55, 61]
    // sometimes contiguous: [0, 3, 6, 9, 12, 15, 18, 24, 27, 30, 33, 36, 39, 45, 48, 51, 54, 57, 60, 63]
    // seldom contiguous: [2, 8, 11, 14, 26, 32, 35, 38, 41, 44, 47, 50, 56, 59, 62]
    // very seldom contiguous: [10, 34, 40, 43, 46, 58]
    // probably never contiguous: [42]
  {
     symbol: "\u00b7",
     color: "#81af81",
     desc: "You are walking on <span class='areaName'>land n° 21</span>.",
     obstacle: {
       symbol: "Y",
       color: "#81af81",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#81af81",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#81af81",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 22
    // very often contiguous: [6, 18, 20, 23, 30, 54]
    // often contiguous: [2, 4, 7, 14, 16, 19, 21, 26, 28, 31, 38, 50, 52, 55, 62]
    // sometimes contiguous: [0, 3, 5, 10, 12, 15, 17, 24, 27, 29, 34, 36, 39, 46, 48, 51, 53, 58, 60, 63]
    // seldom contiguous: [1, 8, 11, 13, 25, 32, 35, 37, 42, 44, 47, 49, 56, 59, 61]
    // very seldom contiguous: [9, 33, 40, 43, 45, 57]
    // probably never contiguous: [41]
  {
     symbol: "\u00b7",
     color: "#9b57e4",
     desc: "You are walking on <span class='areaName'>land n° 22</span>.",
     obstacle: {
       symbol: "Y",
       color: "#9b57e4",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#9b57e4",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#9b57e4",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 23
    // very often contiguous: [7, 19, 21, 22, 31, 55]
    // often contiguous: [3, 5, 6, 15, 17, 18, 20, 27, 29, 30, 39, 51, 53, 54, 63]
    // sometimes contiguous: [1, 2, 4, 11, 13, 14, 16, 25, 26, 28, 35, 37, 38, 47, 49, 50, 52, 59, 61, 62]
    // seldom contiguous: [0, 9, 10, 12, 24, 33, 34, 36, 43, 45, 46, 48, 57, 58, 60]
    // very seldom contiguous: [8, 32, 41, 42, 44, 56]
    // probably never contiguous: [40]
  {
     symbol: "\u00b7",
     color: "#382cfe",
     desc: "You are walking on <span class='areaName'>land n° 23</span>.",
     obstacle: {
       symbol: "Y",
       color: "#382cfe",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#382cfe",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#382cfe",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 24
    // very often contiguous: [8, 16, 25, 26, 28, 56]
    // often contiguous: [0, 9, 10, 12, 17, 18, 20, 27, 29, 30, 40, 48, 57, 58, 60]
    // sometimes contiguous: [1, 2, 4, 11, 13, 14, 19, 21, 22, 31, 32, 41, 42, 44, 49, 50, 52, 59, 61, 62]
    // seldom contiguous: [3, 5, 6, 15, 23, 33, 34, 36, 43, 45, 46, 51, 53, 54, 63]
    // very seldom contiguous: [7, 35, 37, 38, 47, 55]
    // probably never contiguous: [39]
  {
     symbol: "\u00b7",
     color: "#523a73",
     desc: "You are walking on <span class='areaName'>land n° 24</span>.",
     obstacle: {
       symbol: "Y",
       color: "#523a73",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#523a73",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#523a73",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 25
    // very often contiguous: [9, 17, 24, 27, 29, 57]
    // often contiguous: [1, 8, 11, 13, 16, 19, 21, 26, 28, 31, 41, 49, 56, 59, 61]
    // sometimes contiguous: [0, 3, 5, 10, 12, 15, 18, 20, 23, 30, 33, 40, 43, 45, 48, 51, 53, 58, 60, 63]
    // seldom contiguous: [2, 4, 7, 14, 22, 32, 35, 37, 42, 44, 47, 50, 52, 55, 62]
    // very seldom contiguous: [6, 34, 36, 39, 46, 54]
    // probably never contiguous: [38]
  {
     symbol: "\u00b7",
     color: "#fb4c43",
     desc: "You are walking on <span class='areaName'>land n° 25</span>.",
     obstacle: {
       symbol: "Y",
       color: "#fb4c43",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#fb4c43",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#fb4c43",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 26
    // very often contiguous: [10, 18, 24, 27, 30, 58]
    // often contiguous: [2, 8, 11, 14, 16, 19, 22, 25, 28, 31, 42, 50, 56, 59, 62]
    // sometimes contiguous: [0, 3, 6, 9, 12, 15, 17, 20, 23, 29, 34, 40, 43, 46, 48, 51, 54, 57, 60, 63]
    // seldom contiguous: [1, 4, 7, 13, 21, 32, 35, 38, 41, 44, 47, 49, 52, 55, 61]
    // very seldom contiguous: [5, 33, 36, 39, 45, 53]
    // probably never contiguous: [37]
  {
     symbol: "\u00b7",
     color: "#5eb8f2",
     desc: "You are walking on <span class='areaName'>land n° 26</span>.",
     obstacle: {
       symbol: "Y",
       color: "#5eb8f2",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#5eb8f2",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#5eb8f2",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 27
    // very often contiguous: [11, 19, 25, 26, 31, 59]
    // often contiguous: [3, 9, 10, 15, 17, 18, 23, 24, 29, 30, 43, 51, 57, 58, 63]
    // sometimes contiguous: [1, 2, 7, 8, 13, 14, 16, 21, 22, 28, 35, 41, 42, 47, 49, 50, 55, 56, 61, 62]
    // seldom contiguous: [0, 5, 6, 12, 20, 33, 34, 39, 40, 45, 46, 48, 53, 54, 60]
    // very seldom contiguous: [4, 32, 37, 38, 44, 52]
    // probably never contiguous: [36]
  {
     symbol: "\u00b7",
     color: "#463694",
     desc: "You are walking on <span class='areaName'>land n° 27</span>.",
     obstacle: {
       symbol: "Y",
       color: "#463694",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#463694",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#463694",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 28
    // very often contiguous: [12, 20, 24, 29, 30, 60]
    // often contiguous: [4, 8, 13, 14, 16, 21, 22, 25, 26, 31, 44, 52, 56, 61, 62]
    // sometimes contiguous: [0, 5, 6, 9, 10, 15, 17, 18, 23, 27, 36, 40, 45, 46, 48, 53, 54, 57, 58, 63]
    // seldom contiguous: [1, 2, 7, 11, 19, 32, 37, 38, 41, 42, 47, 49, 50, 55, 59]
    // very seldom contiguous: [3, 33, 34, 39, 43, 51]
    // probably never contiguous: [35]
  {
     symbol: "\u00b7",
     color: "#46235a",
     desc: "You are walking on <span class='areaName'>land n° 28</span>.",
     obstacle: {
       symbol: "Y",
       color: "#46235a",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#46235a",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#46235a",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 29
    // very often contiguous: [13, 21, 25, 28, 31, 61]
    // often contiguous: [5, 9, 12, 15, 17, 20, 23, 24, 27, 30, 45, 53, 57, 60, 63]
    // sometimes contiguous: [1, 4, 7, 8, 11, 14, 16, 19, 22, 26, 37, 41, 44, 47, 49, 52, 55, 56, 59, 62]
    // seldom contiguous: [0, 3, 6, 10, 18, 33, 36, 39, 40, 43, 46, 48, 51, 54, 58]
    // very seldom contiguous: [2, 32, 35, 38, 42, 50]
    // probably never contiguous: [34]
  {
     symbol: "\u00b7",
     color: "#f3ddd4",
     desc: "You are walking on <span class='areaName'>land n° 29</span>.",
     obstacle: {
       symbol: "Y",
       color: "#f3ddd4",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#f3ddd4",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#f3ddd4",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 30
    // very often contiguous: [14, 22, 26, 28, 31, 62]
    // often contiguous: [6, 10, 12, 15, 18, 20, 23, 24, 27, 29, 46, 54, 58, 60, 63]
    // sometimes contiguous: [2, 4, 7, 8, 11, 13, 16, 19, 21, 25, 38, 42, 44, 47, 50, 52, 55, 56, 59, 61]
    // seldom contiguous: [0, 3, 5, 9, 17, 34, 36, 39, 40, 43, 45, 48, 51, 53, 57]
    // very seldom contiguous: [1, 32, 35, 37, 41, 49]
    // probably never contiguous: [33]
  {
     symbol: "\u00b7",
     color: "#8b9c77",
     desc: "You are walking on <span class='areaName'>land n° 30</span>.",
     obstacle: {
       symbol: "Y",
       color: "#8b9c77",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#8b9c77",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#8b9c77",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 31
    // very often contiguous: [15, 23, 27, 29, 30, 63]
    // often contiguous: [7, 11, 13, 14, 19, 21, 22, 25, 26, 28, 47, 55, 59, 61, 62]
    // sometimes contiguous: [3, 5, 6, 9, 10, 12, 17, 18, 20, 24, 39, 43, 45, 46, 51, 53, 54, 57, 58, 60]
    // seldom contiguous: [1, 2, 4, 8, 16, 35, 37, 38, 41, 42, 44, 49, 50, 52, 56]
    // very seldom contiguous: [0, 33, 34, 36, 40, 48]
    // probably never contiguous: [32]
  {
     symbol: "\u00b7",
     color: "#b94976",
     desc: "You are walking on <span class='areaName'>land n° 31</span>.",
     obstacle: {
       symbol: "Y",
       color: "#b94976",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#b94976",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#b94976",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 32
    // very often contiguous: [0, 33, 34, 36, 40, 48]
    // often contiguous: [1, 2, 4, 8, 16, 35, 37, 38, 41, 42, 44, 49, 50, 52, 56]
    // sometimes contiguous: [3, 5, 6, 9, 10, 12, 17, 18, 20, 24, 39, 43, 45, 46, 51, 53, 54, 57, 58, 60]
    // seldom contiguous: [7, 11, 13, 14, 19, 21, 22, 25, 26, 28, 47, 55, 59, 61, 62]
    // very seldom contiguous: [15, 23, 27, 29, 30, 63]
    // probably never contiguous: [31]
  {
     symbol: "\u00b7",
     color: "#9b5e4c",
     desc: "You are walking on <span class='areaName'>land n° 32</span>.",
     obstacle: {
       symbol: "Y",
       color: "#9b5e4c",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#9b5e4c",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#9b5e4c",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 33
    // very often contiguous: [1, 32, 35, 37, 41, 49]
    // often contiguous: [0, 3, 5, 9, 17, 34, 36, 39, 40, 43, 45, 48, 51, 53, 57]
    // sometimes contiguous: [2, 4, 7, 8, 11, 13, 16, 19, 21, 25, 38, 42, 44, 47, 50, 52, 55, 56, 59, 61]
    // seldom contiguous: [6, 10, 12, 15, 18, 20, 23, 24, 27, 29, 46, 54, 58, 60, 63]
    // very seldom contiguous: [14, 22, 26, 28, 31, 62]
    // probably never contiguous: [30]
  {
     symbol: "\u00b7",
     color: "#a01528",
     desc: "You are walking on <span class='areaName'>land n° 33</span>.",
     obstacle: {
       symbol: "Y",
       color: "#a01528",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#a01528",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#a01528",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 34
    // very often contiguous: [2, 32, 35, 38, 42, 50]
    // often contiguous: [0, 3, 6, 10, 18, 33, 36, 39, 40, 43, 46, 48, 51, 54, 58]
    // sometimes contiguous: [1, 4, 7, 8, 11, 14, 16, 19, 22, 26, 37, 41, 44, 47, 49, 52, 55, 56, 59, 62]
    // seldom contiguous: [5, 9, 12, 15, 17, 20, 23, 24, 27, 30, 45, 53, 57, 60, 63]
    // very seldom contiguous: [13, 21, 25, 28, 31, 61]
    // probably never contiguous: [29]
  {
     symbol: "\u00b7",
     color: "#460418",
     desc: "You are walking on <span class='areaName'>land n° 34</span>.",
     obstacle: {
       symbol: "Y",
       color: "#460418",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#460418",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#460418",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 35
    // very often contiguous: [3, 33, 34, 39, 43, 51]
    // often contiguous: [1, 2, 7, 11, 19, 32, 37, 38, 41, 42, 47, 49, 50, 55, 59]
    // sometimes contiguous: [0, 5, 6, 9, 10, 15, 17, 18, 23, 27, 36, 40, 45, 46, 48, 53, 54, 57, 58, 63]
    // seldom contiguous: [4, 8, 13, 14, 16, 21, 22, 25, 26, 31, 44, 52, 56, 61, 62]
    // very seldom contiguous: [12, 20, 24, 29, 30, 60]
    // probably never contiguous: [28]
  {
     symbol: "\u00b7",
     color: "#4057e8",
     desc: "You are walking on <span class='areaName'>land n° 35</span>.",
     obstacle: {
       symbol: "Y",
       color: "#4057e8",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#4057e8",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#4057e8",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 36
    // very often contiguous: [4, 32, 37, 38, 44, 52]
    // often contiguous: [0, 5, 6, 12, 20, 33, 34, 39, 40, 45, 46, 48, 53, 54, 60]
    // sometimes contiguous: [1, 2, 7, 8, 13, 14, 16, 21, 22, 28, 35, 41, 42, 47, 49, 50, 55, 56, 61, 62]
    // seldom contiguous: [3, 9, 10, 15, 17, 18, 23, 24, 29, 30, 43, 51, 57, 58, 63]
    // very seldom contiguous: [11, 19, 25, 26, 31, 59]
    // probably never contiguous: [27]
  {
     symbol: "\u00b7",
     color: "#59ec11",
     desc: "You are walking on <span class='areaName'>land n° 36</span>.",
     obstacle: {
       symbol: "Y",
       color: "#59ec11",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#59ec11",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#59ec11",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 37
    // very often contiguous: [5, 33, 36, 39, 45, 53]
    // often contiguous: [1, 4, 7, 13, 21, 32, 35, 38, 41, 44, 47, 49, 52, 55, 61]
    // sometimes contiguous: [0, 3, 6, 9, 12, 15, 17, 20, 23, 29, 34, 40, 43, 46, 48, 51, 54, 57, 60, 63]
    // seldom contiguous: [2, 8, 11, 14, 16, 19, 22, 25, 28, 31, 42, 50, 56, 59, 62]
    // very seldom contiguous: [10, 18, 24, 27, 30, 58]
    // probably never contiguous: [26]
  {
     symbol: "\u00b7",
     color: "#a88d78",
     desc: "You are walking on <span class='areaName'>land n° 37</span>.",
     obstacle: {
       symbol: "Y",
       color: "#a88d78",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#a88d78",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#a88d78",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 38
    // very often contiguous: [6, 34, 36, 39, 46, 54]
    // often contiguous: [2, 4, 7, 14, 22, 32, 35, 37, 42, 44, 47, 50, 52, 55, 62]
    // sometimes contiguous: [0, 3, 5, 10, 12, 15, 18, 20, 23, 30, 33, 40, 43, 45, 48, 51, 53, 58, 60, 63]
    // seldom contiguous: [1, 8, 11, 13, 16, 19, 21, 26, 28, 31, 41, 49, 56, 59, 61]
    // very seldom contiguous: [9, 17, 24, 27, 29, 57]
    // probably never contiguous: [25]
  {
     symbol: "\u00b7",
     color: "#dedd83",
     desc: "You are walking on <span class='areaName'>land n° 38</span>.",
     obstacle: {
       symbol: "Y",
       color: "#dedd83",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#dedd83",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#dedd83",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 39
    // very often contiguous: [7, 35, 37, 38, 47, 55]
    // often contiguous: [3, 5, 6, 15, 23, 33, 34, 36, 43, 45, 46, 51, 53, 54, 63]
    // sometimes contiguous: [1, 2, 4, 11, 13, 14, 19, 21, 22, 31, 32, 41, 42, 44, 49, 50, 52, 59, 61, 62]
    // seldom contiguous: [0, 9, 10, 12, 17, 18, 20, 27, 29, 30, 40, 48, 57, 58, 60]
    // very seldom contiguous: [8, 16, 25, 26, 28, 56]
    // probably never contiguous: [24]
  {
     symbol: "\u00b7",
     color: "#bbd35a",
     desc: "You are walking on <span class='areaName'>land n° 39</span>.",
     obstacle: {
       symbol: "Y",
       color: "#bbd35a",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#bbd35a",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#bbd35a",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 40
    // very often contiguous: [8, 32, 41, 42, 44, 56]
    // often contiguous: [0, 9, 10, 12, 24, 33, 34, 36, 43, 45, 46, 48, 57, 58, 60]
    // sometimes contiguous: [1, 2, 4, 11, 13, 14, 16, 25, 26, 28, 35, 37, 38, 47, 49, 50, 52, 59, 61, 62]
    // seldom contiguous: [3, 5, 6, 15, 17, 18, 20, 27, 29, 30, 39, 51, 53, 54, 63]
    // very seldom contiguous: [7, 19, 21, 22, 31, 55]
    // probably never contiguous: [23]
  {
     symbol: "\u00b7",
     color: "#139bf8",
     desc: "You are walking on <span class='areaName'>land n° 40</span>.",
     obstacle: {
       symbol: "Y",
       color: "#139bf8",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#139bf8",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#139bf8",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 41
    // very often contiguous: [9, 33, 40, 43, 45, 57]
    // often contiguous: [1, 8, 11, 13, 25, 32, 35, 37, 42, 44, 47, 49, 56, 59, 61]
    // sometimes contiguous: [0, 3, 5, 10, 12, 15, 17, 24, 27, 29, 34, 36, 39, 46, 48, 51, 53, 58, 60, 63]
    // seldom contiguous: [2, 4, 7, 14, 16, 19, 21, 26, 28, 31, 38, 50, 52, 55, 62]
    // very seldom contiguous: [6, 18, 20, 23, 30, 54]
    // probably never contiguous: [22]
  {
     symbol: "\u00b7",
     color: "#fa98d7",
     desc: "You are walking on <span class='areaName'>land n° 41</span>.",
     obstacle: {
       symbol: "Y",
       color: "#fa98d7",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#fa98d7",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#fa98d7",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 42
    // very often contiguous: [10, 34, 40, 43, 46, 58]
    // often contiguous: [2, 8, 11, 14, 26, 32, 35, 38, 41, 44, 47, 50, 56, 59, 62]
    // sometimes contiguous: [0, 3, 6, 9, 12, 15, 18, 24, 27, 30, 33, 36, 39, 45, 48, 51, 54, 57, 60, 63]
    // seldom contiguous: [1, 4, 7, 13, 16, 19, 22, 25, 28, 31, 37, 49, 52, 55, 61]
    // very seldom contiguous: [5, 17, 20, 23, 29, 53]
    // probably never contiguous: [21]
  {
     symbol: "\u00b7",
     color: "#6ad52f",
     desc: "You are walking on <span class='areaName'>land n° 42</span>.",
     obstacle: {
       symbol: "Y",
       color: "#6ad52f",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#6ad52f",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#6ad52f",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 43
    // very often contiguous: [11, 35, 41, 42, 47, 59]
    // often contiguous: [3, 9, 10, 15, 27, 33, 34, 39, 40, 45, 46, 51, 57, 58, 63]
    // sometimes contiguous: [1, 2, 7, 8, 13, 14, 19, 25, 26, 31, 32, 37, 38, 44, 49, 50, 55, 56, 61, 62]
    // seldom contiguous: [0, 5, 6, 12, 17, 18, 23, 24, 29, 30, 36, 48, 53, 54, 60]
    // very seldom contiguous: [4, 16, 21, 22, 28, 52]
    // probably never contiguous: [20]
  {
     symbol: "\u00b7",
     color: "#dfa738",
     desc: "You are walking on <span class='areaName'>land n° 43</span>.",
     obstacle: {
       symbol: "Y",
       color: "#dfa738",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#dfa738",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#dfa738",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 44
    // very often contiguous: [12, 36, 40, 45, 46, 60]
    // often contiguous: [4, 8, 13, 14, 28, 32, 37, 38, 41, 42, 47, 52, 56, 61, 62]
    // sometimes contiguous: [0, 5, 6, 9, 10, 15, 20, 24, 29, 30, 33, 34, 39, 43, 48, 53, 54, 57, 58, 63]
    // seldom contiguous: [1, 2, 7, 11, 16, 21, 22, 25, 26, 31, 35, 49, 50, 55, 59]
    // very seldom contiguous: [3, 17, 18, 23, 27, 51]
    // probably never contiguous: [19]
  {
     symbol: "\u00b7",
     color: "#43ece9",
     desc: "You are walking on <span class='areaName'>land n° 44</span>.",
     obstacle: {
       symbol: "Y",
       color: "#43ece9",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#43ece9",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#43ece9",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 45
    // very often contiguous: [13, 37, 41, 44, 47, 61]
    // often contiguous: [5, 9, 12, 15, 29, 33, 36, 39, 40, 43, 46, 53, 57, 60, 63]
    // sometimes contiguous: [1, 4, 7, 8, 11, 14, 21, 25, 28, 31, 32, 35, 38, 42, 49, 52, 55, 56, 59, 62]
    // seldom contiguous: [0, 3, 6, 10, 17, 20, 23, 24, 27, 30, 34, 48, 51, 54, 58]
    // very seldom contiguous: [2, 16, 19, 22, 26, 50]
    // probably never contiguous: [18]
  {
     symbol: "\u00b7",
     color: "#f91ae5",
     desc: "You are walking on <span class='areaName'>land n° 45</span>.",
     obstacle: {
       symbol: "Y",
       color: "#f91ae5",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#f91ae5",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#f91ae5",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 46
    // very often contiguous: [14, 38, 42, 44, 47, 62]
    // often contiguous: [6, 10, 12, 15, 30, 34, 36, 39, 40, 43, 45, 54, 58, 60, 63]
    // sometimes contiguous: [2, 4, 7, 8, 11, 13, 22, 26, 28, 31, 32, 35, 37, 41, 50, 52, 55, 56, 59, 61]
    // seldom contiguous: [0, 3, 5, 9, 18, 20, 23, 24, 27, 29, 33, 48, 51, 53, 57]
    // very seldom contiguous: [1, 16, 19, 21, 25, 49]
    // probably never contiguous: [17]
  {
     symbol: "\u00b7",
     color: "#8712a4",
     desc: "You are walking on <span class='areaName'>land n° 46</span>.",
     obstacle: {
       symbol: "Y",
       color: "#8712a4",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#8712a4",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#8712a4",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 47
    // very often contiguous: [15, 39, 43, 45, 46, 63]
    // often contiguous: [7, 11, 13, 14, 31, 35, 37, 38, 41, 42, 44, 55, 59, 61, 62]
    // sometimes contiguous: [3, 5, 6, 9, 10, 12, 23, 27, 29, 30, 33, 34, 36, 40, 51, 53, 54, 57, 58, 60]
    // seldom contiguous: [1, 2, 4, 8, 19, 21, 22, 25, 26, 28, 32, 49, 50, 52, 56]
    // very seldom contiguous: [0, 17, 18, 20, 24, 48]
    // probably never contiguous: [16]
  {
     symbol: "\u00b7",
     color: "#239007",
     desc: "You are walking on <span class='areaName'>land n° 47</span>.",
     obstacle: {
       symbol: "Y",
       color: "#239007",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#239007",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#239007",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 48
    // very often contiguous: [16, 32, 49, 50, 52, 56]
    // often contiguous: [0, 17, 18, 20, 24, 33, 34, 36, 40, 51, 53, 54, 57, 58, 60]
    // sometimes contiguous: [1, 2, 4, 8, 19, 21, 22, 25, 26, 28, 35, 37, 38, 41, 42, 44, 55, 59, 61, 62]
    // seldom contiguous: [3, 5, 6, 9, 10, 12, 23, 27, 29, 30, 39, 43, 45, 46, 63]
    // very seldom contiguous: [7, 11, 13, 14, 31, 47]
    // probably never contiguous: [15]
  {
     symbol: "\u00b7",
     color: "#945abb",
     desc: "You are walking on <span class='areaName'>land n° 48</span>.",
     obstacle: {
       symbol: "Y",
       color: "#945abb",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#945abb",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#945abb",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 49
    // very often contiguous: [17, 33, 48, 51, 53, 57]
    // often contiguous: [1, 16, 19, 21, 25, 32, 35, 37, 41, 50, 52, 55, 56, 59, 61]
    // sometimes contiguous: [0, 3, 5, 9, 18, 20, 23, 24, 27, 29, 34, 36, 39, 40, 43, 45, 54, 58, 60, 63]
    // seldom contiguous: [2, 4, 7, 8, 11, 13, 22, 26, 28, 31, 38, 42, 44, 47, 62]
    // very seldom contiguous: [6, 10, 12, 15, 30, 46]
    // probably never contiguous: [14]
  {
     symbol: "\u00b7",
     color: "#d808e4",
     desc: "You are walking on <span class='areaName'>land n° 49</span>.",
     obstacle: {
       symbol: "Y",
       color: "#d808e4",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#d808e4",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#d808e4",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 50
    // very often contiguous: [18, 34, 48, 51, 54, 58]
    // often contiguous: [2, 16, 19, 22, 26, 32, 35, 38, 42, 49, 52, 55, 56, 59, 62]
    // sometimes contiguous: [0, 3, 6, 10, 17, 20, 23, 24, 27, 30, 33, 36, 39, 40, 43, 46, 53, 57, 60, 63]
    // seldom contiguous: [1, 4, 7, 8, 11, 14, 21, 25, 28, 31, 37, 41, 44, 47, 61]
    // very seldom contiguous: [5, 9, 12, 15, 29, 45]
    // probably never contiguous: [13]
  {
     symbol: "\u00b7",
     color: "#cdc151",
     desc: "You are walking on <span class='areaName'>land n° 50</span>.",
     obstacle: {
       symbol: "Y",
       color: "#cdc151",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#cdc151",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#cdc151",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 51
    // very often contiguous: [19, 35, 49, 50, 55, 59]
    // often contiguous: [3, 17, 18, 23, 27, 33, 34, 39, 43, 48, 53, 54, 57, 58, 63]
    // sometimes contiguous: [1, 2, 7, 11, 16, 21, 22, 25, 26, 31, 32, 37, 38, 41, 42, 47, 52, 56, 61, 62]
    // seldom contiguous: [0, 5, 6, 9, 10, 15, 20, 24, 29, 30, 36, 40, 45, 46, 60]
    // very seldom contiguous: [4, 8, 13, 14, 28, 44]
    // probably never contiguous: [12]
  {
     symbol: "\u00b7",
     color: "#0878b8",
     desc: "You are walking on <span class='areaName'>land n° 51</span>.",
     obstacle: {
       symbol: "Y",
       color: "#0878b8",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#0878b8",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#0878b8",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 52
    // very often contiguous: [20, 36, 48, 53, 54, 60]
    // often contiguous: [4, 16, 21, 22, 28, 32, 37, 38, 44, 49, 50, 55, 56, 61, 62]
    // sometimes contiguous: [0, 5, 6, 12, 17, 18, 23, 24, 29, 30, 33, 34, 39, 40, 45, 46, 51, 57, 58, 63]
    // seldom contiguous: [1, 2, 7, 8, 13, 14, 19, 25, 26, 31, 35, 41, 42, 47, 59]
    // very seldom contiguous: [3, 9, 10, 15, 27, 43]
    // probably never contiguous: [11]
  {
     symbol: "\u00b7",
     color: "#f3a09d",
     desc: "You are walking on <span class='areaName'>land n° 52</span>.",
     obstacle: {
       symbol: "Y",
       color: "#f3a09d",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#f3a09d",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#f3a09d",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 53
    // very often contiguous: [21, 37, 49, 52, 55, 61]
    // often contiguous: [5, 17, 20, 23, 29, 33, 36, 39, 45, 48, 51, 54, 57, 60, 63]
    // sometimes contiguous: [1, 4, 7, 13, 16, 19, 22, 25, 28, 31, 32, 35, 38, 41, 44, 47, 50, 56, 59, 62]
    // seldom contiguous: [0, 3, 6, 9, 12, 15, 18, 24, 27, 30, 34, 40, 43, 46, 58]
    // very seldom contiguous: [2, 8, 11, 14, 26, 42]
    // probably never contiguous: [10]
  {
     symbol: "\u00b7",
     color: "#8f099c",
     desc: "You are walking on <span class='areaName'>land n° 53</span>.",
     obstacle: {
       symbol: "Y",
       color: "#8f099c",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#8f099c",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#8f099c",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 54
    // very often contiguous: [22, 38, 50, 52, 55, 62]
    // often contiguous: [6, 18, 20, 23, 30, 34, 36, 39, 46, 48, 51, 53, 58, 60, 63]
    // sometimes contiguous: [2, 4, 7, 14, 16, 19, 21, 26, 28, 31, 32, 35, 37, 42, 44, 47, 49, 56, 59, 61]
    // seldom contiguous: [0, 3, 5, 10, 12, 15, 17, 24, 27, 29, 33, 40, 43, 45, 57]
    // very seldom contiguous: [1, 8, 11, 13, 25, 41]
    // probably never contiguous: [9]
  {
     symbol: "\u00b7",
     color: "#119fc7",
     desc: "You are walking on <span class='areaName'>land n° 54</span>.",
     obstacle: {
       symbol: "Y",
       color: "#119fc7",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#119fc7",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#119fc7",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 55
    // very often contiguous: [23, 39, 51, 53, 54, 63]
    // often contiguous: [7, 19, 21, 22, 31, 35, 37, 38, 47, 49, 50, 52, 59, 61, 62]
    // sometimes contiguous: [3, 5, 6, 15, 17, 18, 20, 27, 29, 30, 33, 34, 36, 43, 45, 46, 48, 57, 58, 60]
    // seldom contiguous: [1, 2, 4, 11, 13, 14, 16, 25, 26, 28, 32, 41, 42, 44, 56]
    // very seldom contiguous: [0, 9, 10, 12, 24, 40]
    // probably never contiguous: [8]
  {
     symbol: "\u00b7",
     color: "#7c6cee",
     desc: "You are walking on <span class='areaName'>land n° 55</span>.",
     obstacle: {
       symbol: "Y",
       color: "#7c6cee",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#7c6cee",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#7c6cee",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 56
    // very often contiguous: [24, 40, 48, 57, 58, 60]
    // often contiguous: [8, 16, 25, 26, 28, 32, 41, 42, 44, 49, 50, 52, 59, 61, 62]
    // sometimes contiguous: [0, 9, 10, 12, 17, 18, 20, 27, 29, 30, 33, 34, 36, 43, 45, 46, 51, 53, 54, 63]
    // seldom contiguous: [1, 2, 4, 11, 13, 14, 19, 21, 22, 31, 35, 37, 38, 47, 55]
    // very seldom contiguous: [3, 5, 6, 15, 23, 39]
    // probably never contiguous: [7]
  {
     symbol: "\u00b7",
     color: "#94f971",
     desc: "You are walking on <span class='areaName'>land n° 56</span>.",
     obstacle: {
       symbol: "Y",
       color: "#94f971",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#94f971",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#94f971",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 57
    // very often contiguous: [25, 41, 49, 56, 59, 61]
    // often contiguous: [9, 17, 24, 27, 29, 33, 40, 43, 45, 48, 51, 53, 58, 60, 63]
    // sometimes contiguous: [1, 8, 11, 13, 16, 19, 21, 26, 28, 31, 32, 35, 37, 42, 44, 47, 50, 52, 55, 62]
    // seldom contiguous: [0, 3, 5, 10, 12, 15, 18, 20, 23, 30, 34, 36, 39, 46, 54]
    // very seldom contiguous: [2, 4, 7, 14, 22, 38]
    // probably never contiguous: [6]
  {
     symbol: "\u00b7",
     color: "#fa29e0",
     desc: "You are walking on <span class='areaName'>land n° 57</span>.",
     obstacle: {
       symbol: "Y",
       color: "#fa29e0",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#fa29e0",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#fa29e0",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 58
    // very often contiguous: [26, 42, 50, 56, 59, 62]
    // often contiguous: [10, 18, 24, 27, 30, 34, 40, 43, 46, 48, 51, 54, 57, 60, 63]
    // sometimes contiguous: [2, 8, 11, 14, 16, 19, 22, 25, 28, 31, 32, 35, 38, 41, 44, 47, 49, 52, 55, 61]
    // seldom contiguous: [0, 3, 6, 9, 12, 15, 17, 20, 23, 29, 33, 36, 39, 45, 53]
    // very seldom contiguous: [1, 4, 7, 13, 21, 37]
    // probably never contiguous: [5]
  {
     symbol: "\u00b7",
     color: "#4ed50f",
     desc: "You are walking on <span class='areaName'>land n° 58</span>.",
     obstacle: {
       symbol: "Y",
       color: "#4ed50f",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#4ed50f",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#4ed50f",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 59
    // very often contiguous: [27, 43, 51, 57, 58, 63]
    // often contiguous: [11, 19, 25, 26, 31, 35, 41, 42, 47, 49, 50, 55, 56, 61, 62]
    // sometimes contiguous: [3, 9, 10, 15, 17, 18, 23, 24, 29, 30, 33, 34, 39, 40, 45, 46, 48, 53, 54, 60]
    // seldom contiguous: [1, 2, 7, 8, 13, 14, 16, 21, 22, 28, 32, 37, 38, 44, 52]
    // very seldom contiguous: [0, 5, 6, 12, 20, 36]
    // probably never contiguous: [4]
  {
     symbol: "\u00b7",
     color: "#6bbce0",
     desc: "You are walking on <span class='areaName'>land n° 59</span>.",
     obstacle: {
       symbol: "Y",
       color: "#6bbce0",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#6bbce0",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#6bbce0",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 60
    // very often contiguous: [28, 44, 52, 56, 61, 62]
    // often contiguous: [12, 20, 24, 29, 30, 36, 40, 45, 46, 48, 53, 54, 57, 58, 63]
    // sometimes contiguous: [4, 8, 13, 14, 16, 21, 22, 25, 26, 31, 32, 37, 38, 41, 42, 47, 49, 50, 55, 59]
    // seldom contiguous: [0, 5, 6, 9, 10, 15, 17, 18, 23, 27, 33, 34, 39, 43, 51]
    // very seldom contiguous: [1, 2, 7, 11, 19, 35]
    // probably never contiguous: [3]
  {
     symbol: "\u00b7",
     color: "#7e6ba3",
     desc: "You are walking on <span class='areaName'>land n° 60</span>.",
     obstacle: {
       symbol: "Y",
       color: "#7e6ba3",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#7e6ba3",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#7e6ba3",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 61
    // very often contiguous: [29, 45, 53, 57, 60, 63]
    // often contiguous: [13, 21, 25, 28, 31, 37, 41, 44, 47, 49, 52, 55, 56, 59, 62]
    // sometimes contiguous: [5, 9, 12, 15, 17, 20, 23, 24, 27, 30, 33, 36, 39, 40, 43, 46, 48, 51, 54, 58]
    // seldom contiguous: [1, 4, 7, 8, 11, 14, 16, 19, 22, 26, 32, 35, 38, 42, 50]
    // very seldom contiguous: [0, 3, 6, 10, 18, 34]
    // probably never contiguous: [2]
  {
     symbol: "\u00b7",
     color: "#b5e772",
     desc: "You are walking on <span class='areaName'>land n° 61</span>.",
     obstacle: {
       symbol: "Y",
       color: "#b5e772",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#b5e772",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#b5e772",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 62
    // very often contiguous: [30, 46, 54, 58, 60, 63]
    // often contiguous: [14, 22, 26, 28, 31, 38, 42, 44, 47, 50, 52, 55, 56, 59, 61]
    // sometimes contiguous: [6, 10, 12, 15, 18, 20, 23, 24, 27, 29, 34, 36, 39, 40, 43, 45, 48, 51, 53, 57]
    // seldom contiguous: [2, 4, 7, 8, 11, 13, 16, 19, 21, 25, 32, 35, 37, 41, 49]
    // very seldom contiguous: [0, 3, 5, 9, 17, 33]
    // probably never contiguous: [1]
  {
     symbol: "\u00b7",
     color: "#e292ed",
     desc: "You are walking on <span class='areaName'>land n° 62</span>.",
     obstacle: {
       symbol: "Y",
       color: "#e292ed",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#e292ed",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#e292ed",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  // area n° 63
    // very often contiguous: [31, 47, 55, 59, 61, 62]
    // often contiguous: [15, 23, 27, 29, 30, 39, 43, 45, 46, 51, 53, 54, 57, 58, 60]
    // sometimes contiguous: [7, 11, 13, 14, 19, 21, 22, 25, 26, 28, 35, 37, 38, 41, 42, 44, 49, 50, 52, 56]
    // seldom contiguous: [3, 5, 6, 9, 10, 12, 17, 18, 20, 24, 33, 34, 36, 40, 48]
    // very seldom contiguous: [1, 2, 4, 8, 16, 32]
    // probably never contiguous: [0]
  {
     symbol: "\u00b7",
     color: "#01329b",
     desc: "You are walking on <span class='areaName'>land n° 63</span>.",
     obstacle: {
       symbol: "Y",
       color: "#01329b",
       bold: "normal",
       msg: "You cannot walk on a <span class='obstacleName'>tree</span>!",
       elements: "vegetal",
       check: basicObstacleProbability(10)
     },
     monster: {
       symbol: "w",
       color: "#01329b",
       bold: "normal",
       msg: "The <span class='monsterName'>wolf</span> would kill you!",
       kill: "You killed the <span class='monsterName'>wolf</span>!",
       elements: "mammal",
       probability: function(G, c) { return 0.01; },
       move: function(G, c, tx, ty) { return [c.x, c.y]; },
       death: "You were killed by a <span class='monsterName'>wolf</span>!"
     },
     item: {
       symbol: "\u25c9",
       color: "#01329b",
       bold: "normal",
       name: "Sign of earth",
       msg: "You found the <span class='itemName'>sign of earth</span>!",
       desc: "Use it for killing wolves.",
       probability: function(G, c) { return 0.01; },
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) { return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  },
  { // special area 64 containing the initial item and other stuff
    // ===========================================================
     debug: true,
     monster: { // Main character of the game (player)
         symbol: "@",
         color:"#fff",
         bold: "bold"
     },
     item: {
       symbol: "\u00a0",
       color: "#ff0",
       bold: "normal",
       name: "",
       msg: "",
       desc: "",
       funcEmpty: function(G, c) { return false; },
       funcPickUp: incScore(5),
       funcMonster: function(G, c) {
       G.story += "You can not fight with <span class='itemName'>bare hands</span>!";
       return false; },
       funcStandby: function(G) { return false; },
       funcAttacked: function(G, c, cells) { return false; },
       funcObstacle: function(G, c) { return false; }
     }
  }
]; })();
