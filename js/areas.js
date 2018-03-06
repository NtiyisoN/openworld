window.data = {};

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

function createArea(n) {
    return (function(d) {
            switch(d) {
                case 0: // downtown
                    return {
                        symbol: "\u00b7", // middle point
                        color: "#0059b3",
                        desc: "This is <span class='areaName'>downtown area</span>.",
                        hamming: hamming[n],
                        obstacleFunc: function(G,c) {
                            var o = magicNumberAdd(G,c);
                            if(o%4 != 0) { return false; }
                            if(o%11 > 8) { return 8; }
                            return 7;
                        }
                    };
                case 1: // urban areas (n° 1, 2, 4, 8, 16, 32) + car park
                    return {
                        symbol: "\u00b7", // middle point
                        color: "#444",
                        hamming: hamming[n],
                        obstacleFunc: function(G,c) {
                            return false; // TODO
                        }
                    };
                case 2: // country + last houses + one area full of water
                    return {
                        symbol: "\u00b7", // middle point
                        color: "#444",
                        hamming: hamming[n],
                        obstacleFunc: function(G,c) {
                            return false; // TODO
                        }
                    };
                case 3: // 
                    return {
                        symbol: "\u00b7", // middle point
                        color: "#444",
                        hamming: hamming[n],
                        obstacleFunc: function(G,c) {
                            return false; // TODO
                        }
                    };
                case 4:
                    return {
                        symbol: "\u00b7", // middle point
                        color: "#444",
                        hamming: hamming[n],
                        obstacleFunc: function(G,c) {
                            return false; // TODO
                        }
                    };
                case 5:
                    return {
                        symbol: "\u00b7", // middle point
                        color: "#444",
                        hamming: hamming[n],
                        obstacleFunc: function(G,c) {
                            return false; // TODO
                        }
                    };
                case 6: // very deep forest
                    return {
                        symbol: "\u00b7", // middle point
                        color: "#444",
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
      color: "#690",
      msg: "You cannot walk on this <span class='obstacleName'>bush</span>!"
    },
    { // obstacle n° 6 (bush)
      symbol: "\u0448", // ш
      color: "#690",
      msg: "You cannot walk on this <span class='obstacleName'>bush</span>!"
    },
    { // obstacle n° 7 (house)
      symbol: "\u2302", // ⌂
      color: "#b3b300",
      msg: "You cannot walk enter this <span class='obstacleName'>house</span>!"
    },
    { // obstacle n° 8 (car)
      symbol: "#", // #
      color: "#cc0052",
      msg: "You cannot walk on this <span class='obstacleName'>car</span>!"
    },
    { // obstacle n° 9 (water)
      symbol: "~", // TODO: vs 2248 ≈
      color: "#09f",
      msg: "You cannot walk on <span class='areaName'>water</span>!"
    }
];
