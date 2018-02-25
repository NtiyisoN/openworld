function initGeometry () {
    // return two random orthogonal vectors (having each a given norm)
    // in a 6D space by using the Gram-Schmidt process
    var getOrthonormalVectors = function (norm) {

        var proj = function(v1, v2) {
            var dot = function(a,b) {
                return a.map(function(e,i) { return e*b[i]; })
                        .reduce(function(t,n) { return t+n; } );
            };
            var c = dot(v2, v1) / dot(v1, v1);
            return v1.map(function (e) { return c*e; });
        };

        var A = [0,0,0,0,0,0].map(function(e) { return Math.random() - 0.5; });
        var B = [0,0,0,0,0,0].map(function(e) { return Math.random() - 0.5; });

        var p = proj(A, B);
        B = B.map(function(e,i) { return e-p[i]; });

        var n = function(X) { // norm of the vector
            return Math.sqrt(X.map(function(e) { return e*e; })
                              .reduce(function(t,n) { return t+n; }));
        }

        var fa = norm / n(A);
        var fb = norm / n(B);

        return [
            A.map(function(e) { return e*fa; }),
            B.map(function(e) { return e*fb; })
            ];
    };

    // game stat (to be returned)
    var that = {};

    // current position
    that.currentCoords = new Array(6).fill(0.5);

    // two directional vectors
    var V = getOrthonormalVectors(1/32); // TODO: adjust
    that.vecX = V[0];
    that.vecY = V[1];

    // gravity centers of all 64 areas
    var dec2bin = function(n) { // convert integer in 0..63 to 6-binary-digits
        return [0,0,0,0,0,0].map(function(e,i) {
                return (Math.pow(2,i) & n) > 0;
            });
    };
    that.areaGravity = new Array(64).fill(0).map(function(e,i) {
                return dec2bin(i).map(function(n) {
                    return n + 0.5 + Math.random()*0.25 - 0.125;
                });
            });

    // weights of each array
    that.areaWeight = new Array(64).fill(0).map(function(e) {
                return 1 + Math.random()*0.25 - 0.125;
            });

    // get code number of the area of 'coords'
    // a Dijkstra Map is computed on the fly
    // (the Math.max on all dimensions of the vector
    // returns the "distance" on this map).
    // Each area has a specific weight.
    that.getArea = function (coords) {
        var r = 0;
        var dist = Infinity;
        var G = this.areaGravity;
        var W = this.areaWeight;
        for(var n=0; n<64;n++) {
            var m = coords.map(function(e,i)
                        { return e-G[n][i]; })
                  .map(function(e) { return Math.min(
                              Math.abs(e), Math.abs(2+e), Math.abs(e-2)); })
                  .reduce(function(a,b) { return Math.max(a,b); })
                  * W[n]; // TODO: more logical to divide?
            if(m<dist) { r = n; dist = m; };
        };
        return r;
    };

    // get code number of the area according to currentCoords + y*North + x*East
    that.getAreaRelative = function(x,y) {
        var vy = this.vecY;
        var vx = this.vecX;
        return this.getArea(
            this.currentCoords.map(function(e,i) {
                    return e + y*vy[i] + x*vx[i]; })
                              .map(function(e) {
                                  return e-2*Math.floor(e/2);
                              })
        );
    };

    that.getVectorRelative = function(x,y) {
        var vy = this.vecY;
        var vx = this.vecX;
        return this.currentCoords.map(function(e,i) {
                    return e + y*vy[i] + x*vx[i]; })
                              .map(function(e) {
                                  return e-2*Math.floor(e/2);
                              });
    };

    // Move
    that.move = function (x, y) {
        var vy = this.vecY;
        var vx = this.vecX;
        this.currentCoords =
            this.currentCoords.map(function(e,i) {
                    return e + y*vy[i] + x*vx[i]; })
                              .map(function(e) {
                                  return e-2*Math.floor(e/2);
                              });
    };

    // save / restore
    that.dumpState = function () {
        var G = this.areaGravity;
        var W = this.areaWeight;
        var C = this.currentCoords;
        var vy = this.vecY;
        var vx = this.vecX;
        return {
            areaGravity: G, areaWeight: W,
            currentCoords: C, vecY: vy, vecX: vx
        };
    };
    that.restoreState = function (S) {
        this.areaGravity = S.areaGravity;
        this.areaWeight = S.areaWeight;
        this.currentCoords = S.currentCoords;
        this.vecY = S.vecY;
        this.vecX = S.vecX;
    };

    return that;
};

function initBoard(div) {
    var that = {};
    that.mainDiv = div;

    // Empty location where the "theme" can store datas
    that.module = {};

    that.alive = true;

    that.geometry = initGeometry();
    that.areas = areas;
    that.story = "";
    that.item = 64;
    that.character = {
      symbol: areas[64].monster.symbol,
      color: areas[64].monster.color,
      bold: areas[64].monster.bold
    };
    that.monsters = [];

    that.areaTurns = (new Array(areas.length)).fill(0);
    that.areaKills = (new Array(areas.length)).fill(0);
    that.areaItems = (new Array(areas.length)).fill(0);

    var boardHalfSize = 5; // TODO: adjust
    that.boardHalfSize = boardHalfSize;

    // delete all previous children
    while (div.hasChildNodes()) { div.removeChild(div.lastChild); }

    var board = [];
    for(var i=0;i<(2*boardHalfSize+1);i++) {
        board.push(new Array(2*boardHalfSize+1).fill(false));
    };
    for(var y=boardHalfSize; y>-(boardHalfSize+1);y--) {
        for(var x=-(boardHalfSize); x<(boardHalfSize+1);x++) {
            var c = document.createElement("span");
            c.setAttribute("id",
                    "boardCell-" + Math.abs(y).toString()
                                 + ("SNN")[1+Math.sign(y)]
                           + "-" + Math.abs(x).toString()
                                 + ("WEE")[1+Math.sign(x)] );
            c.className = "boardCell";
            c.textContent = "";
            div.appendChild(c);

            var cell = {};
            cell.x = x; cell.y = y; cell.DOM = c;

            if ((x==0)&&(y==0)) {
                // Standby
                c.onclick = function() { that.click(0,0); };
            } else {
                var at = Math.atan2(y,x);
                if(Math.abs(at) <= Math.PI/8) {
                    // EAST
                    c.onclick = function() { that.click(1,0); };
                } else if((at>Math.PI/8)&&(at<3*Math.PI/8)) {
                    // NE
                    c.onclick = function() { that.click(1,1); };
                } else if((at>=3*Math.PI/8)&&(at<=5*Math.PI/8)) {
                    // North
                    c.onclick = function() { that.click(0,1); };
                } else if((at>5*Math.PI/8)&&(at<7*Math.PI/8)) {
                    // NW
                    c.onclick = function() { that.click(-1,1); };
                } else if(Math.abs(at) >= 7*Math.PI/8) {
                    // West
                    c.onclick = function() { that.click(-1,0); };
                } else if((at>-7*Math.PI/8)&&(at<-5*Math.PI/8)) {
                    // SW
                    c.onclick = function() { that.click(-1,-1); };
                } else if((at>=-5*Math.PI/8)&&(at<=-3*Math.PI/8)) {
                    // South
                    c.onclick = function() { that.click(0,-1); };
                } else {
                    // SE
                    c.onclick = function() { that.click(1,-1); };
                }
            }

            cell.area = false;
            cell.monster = false;
            cell.item = false;
            cell.obstacle = false;

            c.style.fontWeight = "normal";

            cell.update = function (symbol, color, bold) {
                this.DOM.textContent = symbol;
                this.DOM.style.color = color;
                this.DOM.style.fontWeight = bold;
            };
            cell.refreshDisplay = function () {
                if((this.x==0)&&(this.y==0)) {
                    if(!(that.alive)) { this.item = false; }
                    if(this.item) {
                        this.update(that.character.symbol,
                                "#111", that.character.bold);
                        this.DOM.style.backgroundColor =
                             that.areas[this.area].item.color;
                    } else {
                        this.update(that.character.symbol,
                                that.character.color, that.character.bold);
                        this.DOM.style.backgroundColor = "initial";
                    }
                } else if (this.obstacle) {
                    this.update(that.areas[this.area].obstacle.symbol,
                             that.areas[this.area].obstacle.color,
                             that.areas[this.area].obstacle.bold);
                } else if (this.monster !== false) {
                    this.update(that.areas[this.monster].monster.symbol,
                             that.areas[this.monster].monster.color,
                             that.areas[this.monster].monster.bold);
                } else if (this.item) {
                    this.update(that.areas[this.area].item.symbol,
                             that.areas[this.area].item.color,
                             that.areas[this.area].item.bold);
                } else {
                    this.update(that.areas[this.area].symbol,
                             that.areas[this.area].color,
                             that.areas[this.area].bold);
                }
            };

            board[y+boardHalfSize][x+boardHalfSize] = cell;
        };
        if(y>-(boardHalfSize)) {
            div.appendChild(document.createElement("br"));
        };
    };

    if(areas[64].debug) {
    // delete all previous children
        div.appendChild(document.createElement("br"));
        var c = document.createElement("a");
        c.setAttribute("id","debugLink");
        c.setAttribute("href","#debugExt");
        c.innerHTML = "debug";
        div.appendChild(c);
        c = document.getElementById("debug");
        while (c.hasChildNodes()) { c.removeChild(c.lastChild); }
        for(it=0;it<65;it++) {
            var d = document.createElement("h1");
            var u = (it+64)%65;
            var us = "item n° " + u.toString();
            if(u==64) { us = "initial item"; }
            d.innerHTML = "With " + us;
            c.appendChild(d);
            d = document.createElement("table");
            c.appendChild(d);
            for(var i=0;i<8;i++) {
                var e = document.createElement("tr");
                d.appendChild(e);
                for(var j=0;j<8;j++) {
                    var f = document.createElement("td");
                    f.style.textAlign = "right";
                    e.appendChild(f);
                    var g = document.createElement("a");
                    g.setAttribute("href","#game");
                    var n = i*8+j;
                    g.innerHTML = (n).toString();
                    f.appendChild(g);
                    g.onclick = (function (m, u2, us2) {
                        return function () {
                            var l = m;
                            var s = [];
                            for(var k = 0; k < 6; k++) {
                                s.push(0.5 + l%2);
                                l >>= 1;
                            };
                            that.item = u2;
                            that.geometry.currentCoords = s;
                            that.recomputeBoard();
                            that.setStory("Loading area " + m.toString()
                                    + " with " + us2 + "\u2026");
                        };
                    })(n, u, us);
                }
            }

        }

        d = document.createElement("a");
        d.setAttribute("id","debugReturnLink");
        d.setAttribute("href","#game");
        d.innerHTML = "return to game";
        c.appendChild(d);
    }

    // TODO notification Toastr module
    toastr.options = {
      "closeButton": false,
      "debug": false,
      "newestOnTop": false,
      "progressBar": false,
      "positionClass": "toast-bottom-center",
      "preventDuplicates": true,
      "onclick": null,
      "showDuration": "300",
      "hideDuration": "1000",
      "timeOut": "5000",
      "extendedTimeOut": "1000",
      "showEasing": "swing",
      "hideEasing": "linear",
      "showMethod": "fadeIn",
      "hideMethod": "fadeOut"
    };
    toastr.remove();

    // Warning: (x,y) is the new position of the player (before
    // redrawing the map)!
    // Warning: reversed order in case a monster wants to self.destroy
    // (avoid potential bug in monster index)
    that.moveMonsters = function(x,y) {
        for(var i=this.monsters.length-1; i>=0; i--) {
            var c = this.monsters[i];
            var [nx,ny] = this.areas[c.monster].monster.move(this,c,x,y);
            if ((nx != c.x)||(ny != c.y)) {
                var c2 = this.getBoardCell(nx,ny);
                c2.monster = c.monster;
                c.monster = false;
                c2.refreshDisplay();
                c.refreshDisplay();
                this.monsters[i] = c2; // update this.monsters
            }
            // prevent being killed several times!
            if(!(this.alive)) { break; }
        }
    };

    that.restartGame = function (msg, restart) {
        this.getBoardCell(0,0).refreshDisplay();
        toastr.remove();
        toastr.info(msg
                     + "<br/><br/>"
                     + "<span onclick='$(\"#menu\").popup(\"open\");"
                     + " toastr.remove();"
                     + " setTimeout(newGame,500);'"
                     + " style=\"color: #cfc;\">"
                     + restart + "</span>",
                    "", {
                        timeOut: 0,
                        extendedTimeOut: 0,
                        tapToDismiss: false
                    });

    };

    that.destroyMonster = function(c) {
        var i = this.monsters.indexOf(c);
        this.monsters.splice(i,1);
        this.areaKills[c.monster]++;
        c.monster = false;
        c.refreshDisplay();
    };
            
    that.click = function(x,y) {
        if (this.alive) {
            this.story = "";
            if((x==0)&&(y==0)) {
                // standby + pickup item + itemStandby
                var c = this.getBoardCell(0,0);
                if (c.item) {
                    this.item = c.area;
                    c.item = false;
                    this.areaItems[c.area]++;
                    toastr.remove();
                    toastr.info(
                        "<span style='font-weight:"
                        + this.areas[this.item].item.bold
                        + "; color:"
                        + this.areas[this.item].item.color
                        + "; font-size: 125%;'>"
                        + this.areas[this.item].item.symbol
                        + "</span> "
                        + this.areas[this.item].item.name, "",
                        {positionClass: "toast-top-center"});
                    this.areas[this.item].item.funcPickUp();
                    c.refreshDisplay();
                } else {
                    this.areas[this.item].item.funcStandby(this);
                }
                this.areaTurns[c.area]++;
                this.moveMonsters(0,0);
                // TODO: apparitions possible d'un nouveau monstre au bord ???
            } else {
                // test obstacle + itemObstacle
                // test monster + itemMonster
                // test position menacée
                // test itemempty
                // move
                var c = this.getBoardCell(x,y);
                if (c.obstacle) {
                    if(!(this.areas[this.item].item.funcObstacle(this, c))) {
                        this.story += this.areas[c.area].obstacle.msg;
                    } else {
                        this.areaTurns[this.getBoardCell(0,0).area]++;
                        this.moveMonsters(0,0);
                    }
                } else if (c.monster !== false) {
                    if(!(this.areas[this.item].item.funcMonster(this, c))) {
                        if(!(this.story)) {
                          this.story += this.areas[c.area].monster.msg;
                        }
                    } else {
                        this.areaTurns[this.getBoardCell(0,0).area]++;
                        this.moveMonsters(0,0);
                    }
                } else if( (this.getBoardCell(x-1,y-1).monster !== false)
                        || (this.getBoardCell(x,y-1).monster !== false)
                        || (this.getBoardCell(x+1,y-1).monster !== false)
                        || (this.getBoardCell(x-1,y).monster !== false)
                        || (this.getBoardCell(x+1,y).monster !== false)
                        || (this.getBoardCell(x-1,y+1).monster !== false)
                        || (this.getBoardCell(x,y+1).monster !== false)
                        || (this.getBoardCell(x+1,y+1).monster !== false) ) {
                    var monsters = [];
                    if (this.getBoardCell(x-1,y-1).monster !== false)
                        { monsters.push(this.getBoardCell(x-1,y-1)); }
                    if (this.getBoardCell(x,y-1).monster !== false)
                        { monsters.push(this.getBoardCell(x,y-1)); }
                    if (this.getBoardCell(x+1,y-1).monster !== false)
                        { monsters.push(this.getBoardCell(x+1,y-1)); }
                    if (this.getBoardCell(x-1,y).monster !== false)
                        { monsters.push(this.getBoardCell(x-1,y)); }
                    if (this.getBoardCell(x+1,y).monster !== false)
                        { monsters.push(this.getBoardCell(x+1,y)); }
                    if (this.getBoardCell(x-1,y+1).monster !== false)
                        { monsters.push(this.getBoardCell(x-1,y+1)); }
                    if (this.getBoardCell(x,y+1).monster !== false)
                        { monsters.push(this.getBoardCell(x,y+1)); }
                    if (this.getBoardCell(x+1,y+1).monster !== false)
                        { monsters.push(this.getBoardCell(x+1,y+1)); }
                    if(!(this.areas[this.item]
                             .item.funcAttacked(this, c, monsters))) {
                        var i = Math.floor(Math.random()*(monsters.length));
                        this.story += this.areas[monsters[i].monster]
                                          .monster.msg;
                    } else {
                        this.areaTurns[this.getBoardCell(0,0).area]++;
                        this.moveMonsters(0,0);
                    }
                } else 
                    // Test first itemFuncEmpty
                    if(!(this.areas[this.item].item.funcEmpty(this, c))) {
                    // move Monsters
                    this.moveMonsters(x,y);
                    this.monsters = []; // refresh monster list below
                    // Move
                    this.geometry.move(x,y);
                    var idx, idy;
                    if(x >= 0) { idx = new Array(2*boardHalfSize+1)
                                    .fill().map(function(e,i) {
                                        return i-boardHalfSize; }); }
                    else       { idx = new Array(2*boardHalfSize+1)
                                    .fill().map(function(e,i) {
                                        return boardHalfSize-i; }); }
                    if(y >= 0) { idy = new Array(2*boardHalfSize+1)
                                    .fill().map(function(e,i) {
                                        return i-boardHalfSize; }); }
                    else       { idy = new Array(2*boardHalfSize+1)
                                    .fill().map(function(e,i) {
                                        return boardHalfSize-i; }); }
                    for(var i=0; i<2*boardHalfSize+1;i++) {
                        var myy = idy[i];
                        var oy = myy + y;
                        for(var j=0; j<2*boardHalfSize+1;j++) {
                            var myx = idx[j];
                            if((Math.abs(myy)==boardHalfSize) // hidden corners
                                 &&(Math.abs(myx)==boardHalfSize)) {
                                continue;
                            }
                            c = this.getBoardCell(myx,myy);
                            var ox = myx + x;
                            if((Math.abs(oy)>boardHalfSize) // border
                                || (Math.abs(ox)>boardHalfSize)
                                || ((Math.abs(oy)==boardHalfSize) // hidden corners
                                 &&(Math.abs(ox)==boardHalfSize))) {
                                // compute incoming cell
                                c.area = this.geometry.getAreaRelative(myx,myy);
                                if (this.computeObstacle(c, myx, myy)) {
                                    c.obstacle = true;
                                    c.monster = false;
                                    c.item = false;
                                } else {
                                    c.obstacle = false;
                                    if (Math.random()
                                        < this.areas[c.area]
                                            .monster.probability(this, c)) {
                                        c.monster = c.area;
                                    } else { c.monster = false; }
                                    if (Math.random()
                                        < this.areas[c.area]
                                            .item.probability(this, c)) {
                                        c.item = true;
                                    } else { c.item = false; }
                                }
                            } else { // normal case
                                var oc = this.getBoardCell(ox,oy);
                                c.area = oc.area;
                                c.obstacle = oc.obstacle;
                                c.item = oc.item;
                                c.monster = oc.monster;
                            }
                            if(c.monster !== false) { this.monsters.push(c); }
                            c.refreshDisplay();
                        }
                    }
                    c = this.getBoardCell(0,0);
                    if(this.areaTurns[c.area]==0) {
                        this.story += this.areas[c.area].desc;
                    }
                    this.areaTurns[c.area]++;
                    if(c.item) {
                        this.story += this.areas[c.area].item.msg + "<br/>";
                        this.story += this.areas[c.area].item.desc;
                    }
                } else { // itemFuncEmpty worked!
                    this.areaTurns[this.getBoardCell(0,0).area]++;
                    this.moveMonsters(0,0);
                }
            }
            // TODO shuffle monsters (priorité mouvement)
            this.setStory(this.story);
        };
    };

    that.setStory = function(msg) {
        if(msg) {
           toastr.remove();
           toastr["info"](msg);
        };
    };
    
    that.getBoardCell = function(x,y) {
        return board[y+boardHalfSize][x+boardHalfSize];
    };

    // c.area must be already computed
    // TODO: replace * by some XOR
    that.computeObstacle = function(c, x, y) {
        c.obstacle = (0 == (Math.floor(
            this.geometry.getVectorRelative(x,y) // coords
                .reduce(function(t,n) { return t*n; } )
                * 65536) % (this.areas[c.area].obstacle.frequency)));
        return c.obstacle;
    };

    that.recomputeBoard = function () {
        this.monsters = [];
        for(var y=boardHalfSize; y>-(boardHalfSize+1);y--) {
            for(var x=-(boardHalfSize); x<(boardHalfSize+1);x++) {
                var c = this.getBoardCell(x,y);
                if((Math.abs(y)==boardHalfSize) // hidden corners
                     &&(Math.abs(x)==boardHalfSize)) {
                    c.update("\u00A0","#000000", "normal");
                    continue;
                }
                c.area = this.geometry.getAreaRelative(x,y);
                c.item = false;
                c.monster = false;
                if((x!=0)||(y!=0)) {
                    if (this.computeObstacle(c, x, y)) {
                        c.obstacle = true;
                    } else {
                        c.obstacle = false;
                    }
                }
                c.refreshDisplay();
            };
        };
        this.story = "";
    };
    that.recomputeBoard();

    return that;
};
