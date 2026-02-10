let [generateDungeonMap, interpretBit, DUNGEON_WIDTH, DUNGEON_HEIGHT] =
  (function () {
    var WIDTH = 32;
    var HEIGHT = 32;

    var MIN_WIDTH = 8;
    var MIN_HEIGHT = 8;
    var MIN_SIZE = 8;

    function generateBSP(x, z, w, h, c) {
      if (w > MIN_WIDTH && h > MIN_HEIGHT) {
        var xOrY = Math.floor(Math.random() * 2);
        var ratio = Math.random() * (0.7 - 0.3) + 0.3;
        if (xOrY === 0) {
          var childW = Math.floor(w * ratio);
          if (childW < MIN_WIDTH) {
            return {
              w: w,
              h: h,
              x: x,
              z: z,
              front: null,
              back: null,
            };
          }
          ////stroke(Math.random() * 127, Math.random() * 127, Math.random() * 127);
          //line(x + childW, z, x + childW, z + h);
          return {
            w: w,
            h: h,
            x: x,
            z: z,
            back: generateBSP(x, z, childW, h),
            front: generateBSP(x + childW, z, w - childW, h),
          };
        } else {
          var childH = Math.floor(h * ratio);
          if (childH < MIN_HEIGHT) {
            return {
              w: w,
              h: h,
              x: x,
              z: z,
              front: null,
              back: null,
            };
          }
          //stroke(Math.random() * 127, Math.random() * 127, Math.random() * 127);
          //line(x, z + childH, x + w, z + childH);
          return {
            w: w,
            h: h,
            x: x,
            z: z,
            back: generateBSP(x, z, w, childH),
            front: generateBSP(x, z + childH, w, h - childH),
          };
        }
      }
      return {
        w: w,
        h: h,
        x: x,
        z: z,
        front: null,
        back: null,
      };
    }
    function generateRooms(bsp) {
      if (bsp.front !== null && bsp.back !== null) {
        return {
          back: generateRooms(bsp.back),
          front: generateRooms(bsp.front),
        };
      }
      if (bsp.back === null && bsp.front === null) {
        var w = Math.floor(Math.random() * (bsp.w - MIN_SIZE)) + MIN_SIZE;
        var h = Math.floor(Math.random() * (bsp.h - MIN_SIZE)) + MIN_SIZE;
        var x = bsp.x + Math.floor(Math.random() * (bsp.w - w - 1)) + 1;
        var y = bsp.z + Math.floor(Math.random() * (bsp.h - h - 1)) + 1;
        //noStroke();
        //fill(0, 0, 0);
        //rect(x, y, w, h);
        return {
          x: x,
          y: y,
          w: w,
          h: h,
        };
      }
    }
    function rectangleOverlap(c1, s1, c2, s2) {
      if (c1 > c2 + s2 || c1 + s1 < c2) {
        return false;
      } else {
        return true;
      }
    }
    function generateDungeon(rooms) {
      if ("x" in rooms) {
        return [
          {
            x: rooms.x,
            y: rooms.y,
            w: rooms.w,
            h: rooms.h,
          },
        ];
      } else {
        var frontRooms = generateDungeon(rooms.front);
        var backRooms = generateDungeon(rooms.back);

        // x-axis overlap
        var potentialMatches = [];
        for (var i = 0; i < frontRooms.length; i++) {
          for (var j = 0; j < backRooms.length; j++) {
            if (
              rectangleOverlap(
                frontRooms[i].x,
                frontRooms[i].w,
                backRooms[j].x,
                backRooms[j].w,
              )
            ) {
              potentialMatches.push([i, j, "x"]);
            }
            if (
              rectangleOverlap(
                frontRooms[i].y,
                frontRooms[i].h,
                backRooms[j].y,
                backRooms[j].h,
              )
            ) {
              potentialMatches.push([i, j, "y"]);
            }
          }
        }

        if (potentialMatches.length === 0) {
          for (var i = 0; i < frontRooms.length; i++) {
            for (var j = 0; j < backRooms.length; j++) {
              potentialMatches.push([i, j, "n/a"]);
            }
          }
        }

        var bestMatch = [];
        var bestLength = Infinity;
        for (var i = 0; i < potentialMatches.length; i++) {
          var x1 = frontRooms[potentialMatches[i][0]].x;
          var y1 = frontRooms[potentialMatches[i][0]].y;
          var x2 = backRooms[potentialMatches[i][1]].x;
          var y2 = backRooms[potentialMatches[i][1]].y;
          var distSq = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
          if (distSq < bestLength) {
            bestMatch = potentialMatches[i];
            bestLength = distSq;
          }
        }
        var room1 = frontRooms[bestMatch[0]];
        var room2 = backRooms[bestMatch[1]];
        var x1 = frontRooms[bestMatch[0]].x;
        var y1 = frontRooms[bestMatch[0]].y;
        var x2 = backRooms[bestMatch[1]].x;
        var y2 = backRooms[bestMatch[1]].y;
        var w1 = frontRooms[bestMatch[0]].w;
        var h1 = frontRooms[bestMatch[0]].h;
        var w2 = backRooms[bestMatch[1]].w;
        var h2 = backRooms[bestMatch[1]].h;

        //stroke(255, 0, 0);
        //line(x1, y1, x2, y2);
        var x = 0;
        var y = 0;
        var w = 0;
        var h = 0;

        if (bestMatch[2] === "x") {
          var range1 = [x1, x1 + w1];
          var range2 = [x2, x2 + w2];

          var start = Math.max(range1[0], range2[0]);
          var end = Math.min(range1[1], range2[1]) - 4;

          var corridorX = Math.floor(Math.random() * (end - start) + start);
          var corridorY;
          var corridorH;
          if (y1 + h1 < y2) {
            // block 1 above block 2
            corridorY = y1 + h1;
            corridorH = y2 - (y1 + h1);
          } else if (y2 + h2 < y1) {
            // block 2 above block 1
            corridorY = y2 + h2;
            corridorH = y1 - (y2 + h2);
          }
          //fill(0, 0, 255);
          //noStroke();
          //rect(corridorX, corridorY, 4, corridorH);
          x = corridorX;
          y = corridorY;
          w = 4;
          h = corridorH;
        } else if (bestMatch[2] === "y") {
          var range1 = [y1, y1 + h1];
          var range2 = [y2, y2 + h2];

          var start = Math.max(range1[0], range2[0]);
          var end = Math.min(range1[1], range2[1]) - 4;

          var corridorY = Math.floor(Math.random() * (end - start) + start);
          var corridorX;
          var corridorW;
          if (x1 + w1 < x2) {
            // block 1 above block 2
            corridorX = x1 + w1;
            corridorW = x2 - (x1 + w1);
          } else if (x2 + w2 < x1) {
            // block 2 above block 1
            corridorX = x2 + w2;
            corridorW = x1 - (x2 + w2);
          }
          //fill(0, 255, 0);
          //noStroke();
          //rect(corridorX, corridorY, corridorW, 4);
          x = corridorX;
          y = corridorY;
          w = corridorW;
          h = 4;
        } else {
          //fill(255, 0, 0); /* AI CODE */
          var p1x = x1 + Math.floor(w1 / 2);
          var p1y = y1 + Math.floor(h1 / 2);
          var p2x = x2 + Math.floor(w2 / 2);
          var p2y = y2 + Math.floor(h2 / 2);

          // horizontal first
          var hx = Math.min(p1x, p2x);
          var hw = Math.abs(p2x - p1x) + 4;

          //rect(hx, p1y, hw, 4);

          // vertical second (overlap guaranteed)
          var vy = Math.min(p1y, p2y);
          var vh = Math.abs(p2y - p1y) + 4;

          //rect(p2x, vy, 4, vh); /* END AI CODE */

          return []
            .concat(frontRooms)
            .concat(backRooms)
            .concat([
              { x: hx, p1y: y, w: hw, h: 4 },
              { x: p2x, y: vy, w: 4, h: vh },
            ]);
        } // Ignore non-overlapping  rooms for now

        return []
          .concat(frontRooms)
          .concat(backRooms)
          .concat([{ x: x, y: y, w: w, h: h }]);
      }
    }
    function generateBitmap(rooms) {
      var bitmap = new Array(WIDTH * HEIGHT).fill(0);
      rooms.forEach(function (room) {
        var roomType = 100 * (Math.floor(Math.random() * 9) + 1);
        var roomHeight = (Math.floor(Math.random() * 5) + 4) * 10;
        var isWall = 0;
        var effect = (Math.floor(Math.random() * 4) + 1) * 1000;
        for (var i = room.x; i < room.x + room.w; i++) {
          for (var j = room.y; j < room.y + room.h; j++) {
            bitmap[j * WIDTH + i] = roomType + roomHeight + isWall + effect;
          }
        }
      });
      for (var i = 0; i < bitmap.length; i++) {
        if (bitmap[i] !== 0) {
          if (
            bitmap[i - 1] === 0 ||
            bitmap[i + 1] === 0 ||
            bitmap[i - WIDTH] === 0 ||
            bitmap[i + WIDTH] === 0 ||
            bitmap[i - 1 - WIDTH] === 0 ||
            bitmap[i + 1 - WIDTH] === 0 ||
            bitmap[i - 1 + WIDTH] === 0 ||
            bitmap[i + 1 + WIDTH] === 0 ||
            bitmap[i - 1] === undefined ||
            bitmap[i + 1] === undefined ||
            bitmap[i - WIDTH] === undefined ||
            bitmap[i + WIDTH] === undefined ||
            bitmap[i - 1 - WIDTH] === undefined ||
            bitmap[i + 1 - WIDTH] === undefined ||
            bitmap[i - 1 + WIDTH] === undefined ||
            bitmap[i + 1 + WIDTH] === undefined
          ) {
            bitmap[i] += 1;
          }
        }
      }

      return bitmap;
    }
    function interpretBit(bit) {
      return {
        type: Math.floor((bit % 1000) / 100),
        height: Math.floor((bit % 100) / 10),
        isWall: bit % 10,
        effect: Math.floor(bit / 1000),
      };
    }

    function generateDungeonMap() {
      return generateBitmap(
        generateDungeon(generateRooms(generateBSP(0, 0, WIDTH, HEIGHT))),
      );
    }

    return [generateDungeonMap, interpretBit, WIDTH, HEIGHT];
  })();
