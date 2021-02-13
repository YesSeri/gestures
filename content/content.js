'use strict';
(function () {
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
    // p1 is earlier value in time
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

  // I need to implement that if there is no config file, or if the config file is corrupt it needs to be redone in the service worker background script.
  function getConfig() {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(null, function (config) {
        resolve(config);
        // reject(defaultConfig);
      })
    })
  }

  async function init() {
    let config = await getConfig();
    addMouseListeners()

    function addOverlay() {
      const div = document.createElement("div");
      div.id = "mouseGestureOverlay"
      div.style.display = "none"
      document.body.appendChild(div)
    }
    addOverlay();


    function showOverlay() {
      const div = document.getElementById("mouseGestureOverlay")
      div.style.display = "block"
    }

    function hideOverlay() {
      const div = document.getElementById("mouseGestureOverlay")
      div.style.display = "none"
    }


    function repaintOverlay(prevDir, currentDir) {
      const div = document.getElementById("mouseGestureOverlay")
      const overlayHTML = getOverlayHTML(prevDir, currentDir)
      div.innerHTML = overlayHTML
    }

    function getOverlayHTML(prevDir, currentDir) {
      const prevArrow = getArrow(prevDir)
      const currentArrow = getArrow(currentDir)
      const command = getCommand(prevDir, currentDir)
      const commandHTML = `<p id="mouseGestureCommand"> ${command}</p>`
      if (prevArrow != "none") {
        return `${createArrowHTML(prevArrow)}${createArrowHTML(currentArrow)}${commandHTML}`
      } else {
        return `${createArrowHTML(currentArrow)}${commandHTML}`
      }
    }
    function createArrowHTML(arrow) {
      return `<p class="mouseGestureArrow">${arrow} </p>`
    }
    function getArrow(dir) {
      const arrows = {
        left: "&#x2190;",
        up: "&#x2191;",
        right: "&#x2192;",
        down: "&#x2193;"
      }
      switch (dir) {
        case "left":
          return arrows.left;
        case "up":
          return arrows.up;
        case "right":
          return arrows.right;
        case "down":
          return arrows.down;
        default:
          return "none"
      }
    }

    function getCommand(prevDir, currentDir) {
      if (prevDir = "none") {
        return config.directions[currentDir]
      }
      return config.directions[prevDir + currentDir]
    }

    function addMouseListeners() {
      let isPressed = false;
      let isMove = false;
      let pointArray = [];
      let prevDir = "none"
      let currentDir = "none"

      // Notices when mouse is clicked and starts taking time.
      document.addEventListener("mousedown", (e) => {
        if (e.button === 2) {
          isPressed = true;
        }
      })

      // When right mouse is released it calculates the average one or two movement directions.
      document.addEventListener("mouseup", (e) => {
        if (e.button === 2) {
          document.oncontextmenu = function (e) {
            if (isMove) {
              stopEvent(e)
              sendCommand(getCommand(prevDir, currentDir));
              pointArray = []
              prevDir = "none"
              currentDir = "none"
              isMove = false;
            };
          }
          hideOverlay();
          isPressed = false;
        }
      })

      // Registers movement
      document.addEventListener('mousemove', e => {
        if (isPressed === true) {
          const x = e.pageX;
          const y = e.pageY;
          pointArray.push(new Point(x, y))
          if (pointArray.length % 25 === 0) {
            showOverlay();
            currentDir = getDirection(pointArray.slice(-25))
            if (prevDir != currentDir) {
              repaintOverlay(prevDir, currentDir)
              prevDir = currentDir;
            }
            isMove = true;
          }
        }
      });

      // Stops the rightclick menu from showing up when doing mouse gesture
      function stopEvent(event) {
        if (event.preventDefault != undefined)
          event.preventDefault();
        if (event.stopPropagation != undefined)
          event.stopPropagation();
      }
    }
    function getDirection(pointArray) {
      let moveDirArray = []
      for (let i = 0; i < pointArray.length - 1; i++) {
        moveDirArray.push(Point.directionMoved(pointArray[i], pointArray[i + 1]))
      }
      return averageDirection(moveDirArray);
    }
    function averageDirection(array) {
      let counter = {}
      array.forEach(el => {
        counter[el] = (counter[el] || 0) + 1;
      });
      return Object.keys(counter).reduce((a, b) => counter[a] > counter[b] ? a : b);

    }

    // Send mouse move only if atleast the first one is a movement. 
    function sendCommand(command) {
      chrome.runtime.sendMessage({ command });
    }

    chrome.runtime.onMessage.addListener(
      async function (request, sender, sendResponse) {
        if (request.message === "updateSettings") {
          config = await getConfig();
        }
      }
    );
  }
  init()
})();