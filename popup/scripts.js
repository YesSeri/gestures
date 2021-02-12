function getConfig() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(null, function (config) {
      resolve(config);
      reject(defaultConfig);
    })
  })
}

async function main() {
  const config = await getConfig();
  preConfig(config)
  setupSaveButton()
}
function preConfig(config) {
  const items = document.getElementsByClassName("item")
  for (const item of items) {
    for (const setting in config) {
      if (item.id === setting) {
        const select = item.querySelector("select")
        const configValue = item.querySelector(`option[value=${config[setting]}]`)
        configValue.textContent = "> " + configValue.textContent;
        select.value = config[setting]
      }
    }
  }
}
function setupSaveButton() {
  const button = document.getElementById("saveButton")
  button.addEventListener("click", (e) => {
    let newConfig = {};
    const items = document.getElementsByClassName("item");
    for (const item of items) {
      const configPair = getConfigValueFromItem(item);
      newConfig = { ...newConfig, ...configPair };
    }
    chrome.storage.sync.set(newConfig, () => {
      const saveMessage = document.querySelector(".hidden");
      chrome.runtime.reload()
    })
  })
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
  up: COMMANDS.CREATE,
  down: COMMANDS.CLOSE,
  left: COMMANDS.BACK,
  right: COMMANDS.FORWARD,
  downleft: COMMANDS.PREVTAB,
  downright: COMMANDS.NEXTTAB,
  upleft: COMMANDS.NONE,
  upright: COMMANDS.NONE,
  rightup: COMMANDS.NONE,
  rightdown: COMMANDS.NONE,
  leftup: COMMANDS.NONE,
  leftdown: COMMANDS.NONE,
};