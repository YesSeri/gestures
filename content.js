'use strict';
// (function () {

const composeKey = "z"
let isClickedDown
let isPressed = false;
let pointArray = [];
let moveDirArray = []

class Point {
  constructor(x, y) {
    this.x = x
    this.y = y
  }
  static deltaY(y1, y2) {
    return y1 - y2;
  }
  static deltaX(x1, x2) {
    return x1 - x2
  }
  // p1 is earler value in time
  static directionMoved(p1, p2) {
    let dx = this.deltaX(p1.x, p2.x)
    let dy = this.deltaX(p1.y, p2.y)
    // This means we moved horizontally
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontally right
      if (dx < 0) {
        return "right"
      }
      return "left"
    }
    else if (dy < 0) {
      return "down"
    }
    return "up"
  }
}

let t0;
document.addEventListener("mousedown", (e) => {
  if (e.button === 2) {
    t0 = performance.now();
    isPressed = true;
  }
})
document.addEventListener("mouseup", (e) => {
  if (e.button === 2) {
    const t1 = performance.now();
    const time = t1 - t0;
    document.oncontextmenu = function (e) {
      if (time > 140) {
        stopEvent(e)
        isPressed = false;
        for (let i = 0; i < pointArray.length - 1; i++) {
          moveDirArray.push(Point.directionMoved(pointArray[i], pointArray[i + 1]))
        }
        const moveMade = averageMovement(moveDirArray)
        sendMove(moveMade)
        moveDirArray = []
        pointArray = []
      };
    }
  }
})

function stopEvent(event) {
  if (event.preventDefault != undefined)
    event.preventDefault();
  if (event.stopPropagation != undefined)
    event.stopPropagation();
}


document.addEventListener('mousemove', e => {
  if (isPressed === true) {
    const x = e.pageX;
    const y = e.pageY;
    pointArray.push(new Point(x, y))
  }
});

function averageMovement(arr) {
  arr.slice(2);
  let newArr = []
  let tempArr = []
  for (let i = 1; i < arr.length; i++) {
    tempArr = [...tempArr, arr[i]]
    if (i % 10 === 0) {
      newArr = [...newArr, [...tempArr]]
      tempArr = [];
    }
  }
  let directions = newArr.map(subArr => {
    return averageOfTenDirections(subArr);
  })
  let dir1 = directions[0];
  let dir2;
  for (const dir of directions) {
    if (dir != dir1) {
      dir2 = dir;
    }
  }
  if (dir1 === undefined) {
    return ["none", "none"]
  }
  if (dir2 === undefined) {
    return [dir1, "none"]
  }
  return [dir1, dir2]
}
function averageOfTenDirections(arr) {
  let result = {
    up: 0,
    down: 0,
    right: 0,
    left: 0,
  };
  for (const dir of arr) {
    if (dir == "down") {
      result.down += 1;
    }
    else if (dir == "up") {
      result.up += 1;
    }
    else if (dir == "right") {
      result.right += 1;
    }
    else if (dir == "left") {
      result.left += 1;
    }
  }
  let highest = 0;
  let highestDir = "";
  for (const dir in result) {
    const temp = result[dir]
    if (temp > highest) {
      highestDir = dir;
      highest = temp;
    }
  }
  return highestDir;
}

// Send mouse move only if atleast the first one is a movement. 
function sendMove(dirs) {
  if (dirs[0] === "none" || !dirs) {
    return
  }
  chrome.runtime.sendMessage({ dirs });
}
document.addEventListener('keydown', e => {
  if (e.key === "z") {
    sendMove(["none", "none"])
  }
  if (e.key === "x") {
    sendMove(["right", "none"])
  }
})
// })();