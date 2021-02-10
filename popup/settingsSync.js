import { COMMANDS } from "../enum.js";
console.log(COMMANDS);
const defaultConfig = {
  up: COMMANDS.RELOAD,
  down: COMMANDS.BOOKMARK,
  left: COMMANDS.BACK,
  right: COMMANDS.FORWARD,
}
const storage = {
  get: function (key) {
    chrome.storage.sync.get(key, function (items) {
      console.log(items)
    });
  },
  getAll: function () {
    chrome.storage.sync.get(null, function (items) {
      console.log(items)
    });
  },
  set: (obj) => chrome.storage.sync.set(obj),
  isConfigInit: () => {
    chrome.storage.sync.get(null, function (items) {
      const allKeys = Object.keys(items);
      if (allKeys.length === 0) {
        storage.setDefaults()
        storage.setDropdown(items)
      } else {
        setDropdown()
      }
    });
  },
  setDefaults: () => {
    console.log("setting defaults");
    storage.set(defaultConfig)
  },
  clear: () => {
    chrome.storage.sync.clear(() => {
      console.log("Storage has been cleared");
    })
  },
  setDropdown: (items) => {
    console.log("set dropdown")
  },
  setDropdownDefault: () => {
    setDropdown(defaultConfig)
    console.log("set dropdown")
  }
}
storage.isConfigInit()