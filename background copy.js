/*global chrome*/

// (function () {

// Names of the commands. Used like an enum, so I don't mispell things.


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
// Gives a message on installing or updating
chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason == "install") {
    chrome.storage.sync.set(defaultConfig)
    const thisVersion = chrome.runtime.getManifest().version;
    console.log("Installed " + thisVersion + "!");
  } else if (details.reason == "update") {
    const thisVersion = chrome.runtime.getManifest().version;
    console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");
  }
});
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

function initSettings() {
  chrome.storage.sync.get(null, function (config) {
    initMain(config)
  })
}

initSettings();

function initMain(activeConfig) {

  let activeTab;
  let bookmarkBar;
  chrome.bookmarks.getTree(function (bookmarks) {
    bookmarkBar = findBookmarkBar(bookmarks);
  });

  function findBookmarkBar(bookmarks) {
    for (bookmark of bookmarks) {
      if (bookmark.title === "Bookmarks bar") {
        return bookmark;
      }
      else if (bookmark.children) {
        return findBookmarkBar(bookmark.children);
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
      chrome.tabs.create({ active: true }, () => { console.log("Created Tab") });
    },
    duplicate: () => {
      chrome.tabs.duplicate(activeTab.id, () => { console.log("Tab has been duplicated. "); })
    },
    back: () => {
      chrome.tabs.goBack(activeTab.id, () => {
      })
    },
    forward: () => {
      chrome.tabs.goForward(activeTab.id, () => {
      })
    },
    prevTab: async () => {
      const tabs = await getCurrentTabs()
      for (let i = 0; i < tabs.length; i++) {
        if (tabs[i].id === activeTab.id) {
          const prevTab = i === 0 ? tabs.pop() : tabs[i - 1];
          chrome.tabs.update(prevTab.id, { active: true, highlighted: true });
        }
      }
    },
    nextTab: async () => {
      const tabs = await getCurrentTabs()
      for (let i = 0; i < tabs.length; i++) {
        if (tabs[i].id === activeTab.id) {
          const nextTab = i === tabs.length ? tabs.shift() : tabs[i + 1];
          chrome.tabs.update(nextTab.id, { active: true, highlighted: true });
        }
      }
    },
    none: () => {
      console.log("Nothing programmed for this direction")
    },
    reload: () => {
      chrome.tabs.reload(activeTab.id, () => {
        console.log("Page refreshed!")
      })
    }
  }

  function getActiveTab() {
    return new Promise(resolve => {
      const queryInfo = {
        active: true,
        currentWindow: true
      };
      chrome.tabs.query(queryInfo, (tabs) => {
        resolve(tabs[0])
      });
    })

  }
  function getCurrentTabs() {
    return new Promise(resolve => {
      const queryInfo = {
        currentWindow: true
      };
      chrome.tabs.query(queryInfo, (tabs) => {
        resolve(tabs)
      });
    })
  }

  chrome.tabs.onActivated.addListener(async (activeInfo) => {
    activeTab = await getActiveTab()
  });
  // chrome.tabs.onUpdated.addListener(function (activeInfo) {
  // });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const { dirs } = request
    const fn = findDirFunctionInConfig(dirs)
    fn();
  });

  function findDirFunctionInConfig(dirs) {
    let configValue;
    if (dirs[1] === "none") {
      configValue = dirs[0]
    } else {
      configValue = dirs[0] + dirs[1]
    }
    const commandName = activeConfig.directions[configValue];
    const command = commandFunctions[commandName]
    return command
  }
}