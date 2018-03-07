window.data = { debug: true };

// Functions of general interest
// =============================

var hamming = [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4, 1, 2, 2, 3, 2,
               3, 3, 4, 2, 3, 3, 4, 3, 4, 4, 5, 1, 2, 2, 3, 2, 3, 3, 4, 2, 3,
               3, 4, 3, 4, 4, 5, 2, 3, 3, 4, 3, 4, 4, 5, 3, 4, 4, 5, 4, 5, 5,
               6];

function magicNumberMult(G, c) { // more chaotic
    return Math.floor(G.geometry.getVectorRelative(c.x,c.y)
                       .reduce(function(t,n) { return t*n; } ) * 65536);
}
function magicNumberAdd(G, c) { // more regular
    return Math.floor(G.geometry.getVectorRelative(c.x,c.y)
                       .reduce(function(t,n) { return t+n; } ) * 65536);
}

// Game-related functions
// ======================

function vegetation(dens, arr) {
    return function(G,c) {
        var o = magicNumberMult(G,c);
        if(o%dens) { return false; }
        return arr[o%arr.length];
    };
}
function buildings(dens, arr) {
    return function(G,c) {
        var o = magicNumberMult(G,c);
        if(o%dens) { return false; }
        return arr[o%arr.length];
    };
}

function createArea(n) {
    return (function(d) {
            switch(d) {
                case 0: // downtown
                    return {
                        symbol: "\u00b7", // middle point
                        color: "#066",
                        hamming: hamming[n],
                        obstacleFunc: buildings(4,[7,7,7,7,7,7,7,7,7,8,8])
                    };
                case 1: // urban areas (n° 1, 2, 4, 8, 16, 32) + car park
                    return {
                        symbol: "\u00b7", // middle point
                        color: "#066",
                        hamming: hamming[n],
                        obstacleFunc: buildings(8,[7,7,7,7,7,7,7,8,8])
                    };
                case 2: // country + last houses + one area full of water
                    return {
                        symbol: "\u00b7", // middle point
                        color: "#060",
                        hamming: hamming[n],
                        obstacleFunc: vegetation(14, [6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,5,5,5,5,5,5,5,5,5,5,3,3,3,3,3,7])
                    };
                case 3: // 
                    return {
                        symbol: "\u00b7", // middle point
                        color: "#060",
                        hamming: hamming[n],
                        obstacleFunc: vegetation(8,[0])
                    };
                case 4:
                    return {
                        symbol: "\u00b7", // middle point
                        color: "#050",
                        hamming: hamming[n],
                        obstacleFunc: function(G,c) {
                            return false; // TODO
                        }
                    };
                case 5:
                    return {
                        symbol: "\u00b7", // middle point
                        color: "#050",
                        hamming: hamming[n],
                        obstacleFunc: function(G,c) {
                            return false; // TODO
                        }
                    };
                case 6: // very deep forest
                    return {
                        symbol: "\u00b7", // middle point
                        color: "#040",
                        hamming: hamming[n],
                        obstacleFunc: function(G,c) {
                            var o = magicNumberMult(G,c);
                            if(o%2==1) { return false; }
                            // TODO: choose kind of tree and return the number
                            return 0;
                        }
                    };
            }
        })(hamming[n]);
}

window.data.areas = new Array(64).fill(0).map(function (e,i) {
    return createArea(i); });

// ad-hoc adjustments
// area n° 32 is a car park
window.data.areas[32].obstacleFunc = buildings(4, [8,8,8,8,8,8,8,8,8,8,8,8,8,8,6]);
// area n° 3 is a lake
window.data.areas[3].obstacleFunc = function(G,c) { return 9; }

window.data.obstacles = [
    // ¥, Y, џ, Ұ, ұ, ↑
    { // obstacle n° 0 (tree)
      symbol: "\u00a5", // ¥
      color: "#690",
      msg: "You cannot walk on this <span class='obstacleName'>tree</span>!"
    },
    { // obstacle n° 1 (tree)
      symbol: "Y", // Y
      color: "#690",
      msg: "You cannot walk on this <span class='obstacleName'>tree</span>!"
    },
    { // obstacle n° 2 (tree)
      symbol: "\u04b0", // Ұ
      color: "#690",
      msg: "You cannot walk on this <span class='obstacleName'>tree</span>!"
    },
    { // obstacle n° 3 (young tree)
      symbol: "\u04b1", // ұ
      color: "#690",
      msg: "You cannot walk on this <span class='obstacleName'>tree</span>!"
    },
    { // obstacle n° 4 (tree)
      symbol: "\u2191", // ↑
      color: "#690",
      msg: "You cannot walk on this <span class='obstacleName'>tree</span>!"
    },
    { // obstacle n° 5 (bush)
      symbol: "\u045f", // џ
      color: "#558000",
      msg: "You cannot walk on this <span class='obstacleName'>bush</span>!"
    },
    { // obstacle n° 6 (bush)
      symbol: "\u0448", // ш
      color: "#86b300",
      msg: "You cannot walk on this <span class='obstacleName'>bush</span>!"
    },
    { // obstacle n° 7 (house)
      symbol: "\u2302", // ⌂
      color: "#b3b3b3",
      msg: "You cannot walk enter this <span class='obstacleName'>house</span>!"
    },
    { // obstacle n° 8 (car)
      symbol: "=", // =
      color: "#930",
      msg: "You cannot walk on this <span class='obstacleName'>car</span>!"
    },
    { // obstacle n° 9 (water)
      symbol: "\u2248",
      color: "#09f",
      msg: "You cannot walk on <span class='areaName'>water</span>!"
    }
];
