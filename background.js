/*global chrome*/

// (function () {

const COMMANDS = {
  BACK: "back",
  BOOKMARK: "bookmark",
  CLOSE: "close",
  CREATE: "create",
  DUPLICATE: "duplicate",
  FORWARD: "forward",
  NEXTTAB: "nextTab",
  NONE: "none",
  RELOAD: "reload",
};


const storage = {
  activeConfig: {
  },
  defaultConfig: {
    up: COMMANDS.CREATE,
    down: COMMANDS.CLOSE,
    left: COMMANDS.BACK,
    right: COMMANDS.FORWARD,
    downleft: COMMANDS.DUPLICATE,
    downright: COMMANDS.NEXTTAB,
    upright: COMMANDS.NONE,
    upright: COMMANDS.NONE,
    rightup: COMMANDS.NONE,
    rightdown: COMMANDS.NONE,
    leftup: COMMANDS.NONE,
    leftdown: COMMANDS.NONE,
  },
  get: function (key) {
    chrome.storage.sync.get(key, function (items) {
    });
  },
  getAll: function () {
    chrome.storage.sync.get(null, function (items) {
      console.log(items)
    });
  },
  getConfig: function (cfg) {
    chrome.storage.sync.get(null, function (items) {
      storage.activeConfig = items;
    });
  },
  set: (obj) => chrome.storage.sync.set(obj),
  isConfigInit: () => {
    chrome.storage.sync.get(null, function (items) {
      const allKeys = Object.keys(items);
      if (allKeys.length === 0) {
        storage.setDefaults()
        console.log("settingdefault");
      } else {
        setDropdown()
      }
    });
  },
  setDefaults: () => {
    storage.set(storage.defaultConfig)
    storage.activeConfig = storage.defaultConfig
  },
  clear: () => {
    chrome.storage.sync.clear(() => {
      console.log("Storage has been cleared");
    })
  },
}
storage.getConfig();
console.log("config", storage.activeConfig);

chrome.runtime.onInstalled.addListener(function (details) {
  console.log(details)
  if (details.reason == "install") {
    storage.isConfigInit();
  } else if (details.reason == "update") {
    const thisVersion = chrome.runtime.getManifest().version;
    console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");
  }
});

let activeTab;
let tabsCurrentWindow;
let bookmarkBar;

chrome.bookmarks.getTree(function (bookmarks) {
  bookmarkBar = findBookmark(bookmarks);
});

function findBookmark(bookmarks) {
  for (bookmark of bookmarks) {
    if (bookmark.title === "Bookmarks bar") {
      return bookmark;
    }
    else if (bookmark.children) {
      return findBookmark(bookmark.children);
    }
  }
}

const commandFunctions = {
  bookmark: () => {
    chrome.bookmarks.create({ parentId: bookmarkBar.id, title: activeTab.title, url: activeTab.url }, () => {
    })
  },
  close: () => {
    if (activeTab.id) {
      chrome.tabs.remove(activeTab.id);
    } else {
      throw new Error("activeTabId has invalid value")
    }
  },
  create: () => {
    chrome.tabs.create();
  },
  duplicate: () => {
    chrome.tabs.duplicate(activeTab.id, () => { })
  },
  back: () => {
    chrome.tabs.goBack(activeTab.id, () => {
    })
  },
  forward: () => {
    chrome.tabs.goForward(activeTab.id, () => {
    })
  },
  prevTab: () => {
  },
  nextTab: () => {
  },
  none:()=> {
    console.log("nothing programmed for this direction")
  },
  reload: () => {
    chrome.tabs.reload(activeTab.id, () => {
    })
  }
}

function setCurrentTabUrl(callback) {
  var queryInfo = {
    active: true,
    currentWindow: true
  };
  chrome.tabs.query(queryInfo, function (tabs) {
    activeTab = tabs[0];
    console.log(activeTab)
  });
}

chrome.tabs.onActivated.addListener((activeInfo) => {
  setCurrentTabUrl()
});
chrome.tabs.onUpdated.addListener(function (activeInfo) {
  setCurrentTabUrl();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if(request === "getConfig") {
    sendResponse(storage.activeConfig)
  }
})

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    const { dirs } = request
    const fn = findDirFunctionInConfig(dirs)
    fn();
  });
// const setTabsCurrentWindow = async () => {
//   chrome.tabs.query({ currentWindow: true }, function (tabs) {
//     tabsCurrentWindow = tabs.map(function (tab) {
//       return tab;
//     });
//   });
// }
function findDirFunctionInConfig(dirs) {
  let configValue;
  console.log("active", storage.activeConfig);
  if (dirs[1] === "none") {
    configValue = dirs[0]
  } else {
    configValue = dirs[0] + dirs[1]
  }
  console.log("configValue", configValue);
  const commandName = storage.activeConfig[configValue];
  const command = commandFunctions[commandName]
  return command
}