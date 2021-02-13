(function () {
  function getConfig() {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(null, function (config) {
        resolve(config);
        reject(defaultConfig);
      })
    })
  }

  async function main() {
    let config = await getConfig();
    setupSelectOptions()
    setOptionsToCurrentSettings(config.directions)
    setupButtons()
  }
  function setOptionsToCurrentSettings(config) {
    const items = document.getElementsByClassName("item")

    for (const item of items) {
      const selectTag = item.querySelector("select")
      selectTag.childNodes.forEach(option => {
        option.textContent = option.value
      })
    }

    for (const item of items) {
      for (const setting in config) {
        if (item.id === setting) {
          const select = item.querySelector("select")
          const configValue = item.querySelector(`option[value=${config[setting]}]`)
          configValue.textContent = "> " + config[setting]
          select.value = config[setting]
        }
      }
    }

  }
  function setupSelectOptions() {
    const optionsDivTemplate = createOptionsDivTemplate();
    const leftPane = document.querySelector("#leftPane")
    const midLeftPane = document.querySelector("#midLeftPane")
    const midRightPane = document.querySelector("#midRightPane")
    const rightPane = document.querySelector("#rightPane")
    let i = 0;
    for (direction in defaultConfig.directions) {
      const newOptionsDiv = createNewOptionsDiv(optionsDivTemplate, direction)
      if (i < 4) {
        leftPane.appendChild(newOptionsDiv);
      }
      else if (i < 8) {
        midLeftPane.appendChild(newOptionsDiv);
      }
      else if (i < 12) {
        midRightPane.appendChild(newOptionsDiv)
      }
      else {
        rightPane.appendChild(newOptionsDiv)
      }
      i++;
    }
  }
  function createOptionsDivTemplate() {
    const divTemplate = document.createElement("div");
    divTemplate.classList.add("item")
    const pTag = document.createElement("p");
    const selectTab = document.createElement("select");
    for (const command of Object.values(COMMANDS)) {
      const option = document.createElement("option");
      option.value = command;
      option.innerText = command;
      selectTab.appendChild(option);
    }
    divTemplate.appendChild(pTag)
    divTemplate.appendChild(selectTab)
    return divTemplate;
  }
  function createNewOptionsDiv(templateDiv, dir) {
    let newOptionsDiv = templateDiv.cloneNode(true);
    newOptionsDiv.id = dir;
    newOptionsDiv.querySelector("p").textContent = dir.slice(0, 1).toUpperCase() + dir.slice(1);
    newOptionsDiv.querySelector("select").id = dir + "-dropdown"
    return newOptionsDiv;

  }

  function setupButtons() {
    const saveButton = document.getElementById("saveButton")
    saveButton.addEventListener("click", save)

    const restoreButton = document.getElementById("restoreButton")
    restoreButton.addEventListener("click", restoreDefaults)
  }
  function save() {
    let directions = {};
    const items = document.getElementsByClassName("item");
    for (const item of items) {
      const configPair = getConfigValueFromItem(item);
      directions = { ...directions, ...configPair };
    }
    config = {
      directions
    }
    saveShowMessage("saveMessage", config)
  }

  function restoreDefaults() {
    config = defaultConfig
    saveShowMessage("defaultMessage", config)
  }
  function saveShowMessage(messageId, config) {
    chrome.storage.sync.set(config, () => {
      const message = document.getElementById(messageId);
      message.classList.remove("hidden")
      setOptionsToCurrentSettings(config.directions)
      updateContentScriptConfig();
      setTimeout(() => {
        message.classList.add("hidden")
      }, 1000)
    })
  }
  function updateContentScriptConfig() {
    chrome.tabs.query({}, function (tabs) {
      console.log(tabs);
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { message: "updateSettings" });
      })
    });
  }
  function getConfigValueFromItem(item) {
    const key = item.id;
    const select = item.querySelector("select");
    const value = select.value;
    const configPair = {}
    configPair[key] = value;
    return configPair;
  }
  main();

  const COMMANDS = {
    BACK: "back",
    BOOKMARK: "bookmark",
    CLOSE: "close",
    CREATE: "create",
    DUPLICATE: "duplicate",
    FORWARD: "forward",
    PREVTAB: "prevTab",
    NEXTTAB: "nextTab",
    NONE: "none",
    RELOAD: "reload",
  };

  defaultConfig = {
    directions: {
      up: COMMANDS.CREATE,
      down: COMMANDS.CLOSE,
      left: COMMANDS.BACK,
      right: COMMANDS.FORWARD,
      updown: COMMANDS.FORWARD,
      downup: COMMANDS.FORWARD,
      rightleft: COMMANDS.FORWARD,
      leftright: COMMANDS.FORWARD,
      downleft: COMMANDS.PREVTAB,
      downright: COMMANDS.NEXTTAB,
      upleft: COMMANDS.RELOAD,
      upright: COMMANDS.NONE,
      rightup: COMMANDS.NONE,
      rightdown: COMMANDS.NONE,
      leftup: COMMANDS.NONE,
      leftdown: COMMANDS.NONE,
    },
    other: {
      sens: 110,
    }
  };
})();