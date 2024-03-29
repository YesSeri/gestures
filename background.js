/*global chrome*/

(function async() {

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
    COPYURL: "copyUrl",
    SEARCHSELECTED: "searchSelected",
  };
  const translation = {
    back: "Back",
    bookmark: "Bookmark",
    close: "Close",
    create: "Create",
    duplicate: "Duplicate",
    forward: "Forward",
    prevTab: "Prev Tab",
    nextTab: "Next Tab",
    none: "None",
    reload: "Refresh",
    copyUrl: "Copy Tab Url",
    searchSelected: "Search Marked",
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

  const defaultConfig = {
    directions: {
      up: COMMANDS.COPYURL,
      down: COMMANDS.SEARCHSELECTED,
      left: COMMANDS.BACK,
      right: COMMANDS.FORWARD,
      updown: COMMANDS.DUPLICATE,
      downup: COMMANDS.RELOAD,
      rightleft: COMMANDS.PREVTAB,
      leftright: COMMANDS.NEXTTAB,
      downleft: COMMANDS.NONE,
      downright: COMMANDS.NONE,
      upleft: COMMANDS.NONE,
      upright: COMMANDS.NONE,
      rightup: COMMANDS.NONE,
      rightdown: COMMANDS.NONE,
      leftup: COMMANDS.NONE,
      leftdown: COMMANDS.NONE,
    },
  };

  // chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  //   console.log("response");
  //   if (request.message === "getDefaultConfig") {
  //     sendResponse({ defaultConfig });
  //   }
  // });

  initMain()
  function initMain() {
    let allTabs = {}

    let closedTabs = [];

    function getBookmarksBar() {
      return new Promise((resolve, reject) => {
        chrome.bookmarks.getTree(function (bookmarks) {
          const bookmarkBar = findBookmarkBar(bookmarks);
          resolve(bookmarkBar)
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
        });
      })
    }

    const commandFunctions = {
      bookmark: async () => {
        const bookmarkBar = await getBookmarksBar();
        const activeTab = await getActiveTab();
        chrome.bookmarks.create({ parentId: bookmarkBar.id, title: activeTab.title, url: activeTab.url }, () => {
        })
      },
      close: async () => {
        const activeTab = await getActiveTab();
        chrome.tabs.remove(activeTab.id);
      },
      create: () => {
        chrome.tabs.create({ active: true }, () => { console.log("Created Tab") });
      },
      duplicate: async () => {
        const activeTab = await getActiveTab();
        chrome.tabs.duplicate(activeTab.id, () => { console.log("Tab has been duplicated. "); })
      },
      back: async () => {
        const activeTab = await getActiveTab();
        chrome.tabs.goBack(activeTab.id, () => {
        })
      },
      forward: async () => {
        const activeTab = await getActiveTab();
        chrome.tabs.goForward(activeTab.id, () => {
        })
      },
      openClosedTab: async () => {

      },
      copyCurrentUrl: () => {
        console.log("HEY")

      },
      prevTab: async () => {
        const tabs = await getCurrentTabs()
        const activeTab = await getActiveTab();
        for (let i = 0; i < tabs.length; i++) {
          if (tabs[i].id === activeTab.id) {
            const prevTab = i === 0 ? tabs.pop() : tabs[i - 1];
            chrome.tabs.update(prevTab.id, { active: true, highlighted: true });
          }
        }
      },
      nextTab: async () => {
        const tabs = await getCurrentTabs()
        const activeTab = await getActiveTab();
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
      reload: async () => {
        const activeTab = await getActiveTab();
        chrome.tabs.reload(activeTab.id, () => {
          console.log("Page refreshed!")
        })
      },
      searchSelected: () => {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          chrome.tabs.sendMessage(tabs[0].id, { message: "getSelectedText" }, function (response) {
            chrome.search.query({ disposition: "NEW_TAB", text: response.selectedText }, () => {
              console.log("search has been made");
            })
          });
        });

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

    chrome.tabs.onUpdated.addListener(async () => {
      allTabs = await getAllTabs()
    })

    chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
      for (const tab of allTabs) {
        if (tab.id === tabId) {
          console.log(tab.id, tabId);
          closedTabs.push(tab)
        }
      }
    })

    async function getAllTabs() {
      return new Promise((resolve, reject) => {
        chrome.tabs.query({}, tabs => {
          resolve(tabs)
        })
      })
    }


    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      // I get a string with the name of the command, and invoke the correct function in the commandFunctions object
      if (request.message === "sendCommand") {
        const { command } = request;
        commandFunctions[command]();
      }
      // The popup script requests the default config from here, so we always have one source of truth.
      if (request.message === "getDefaultConfig") {
        sendResponse({ defaultConfig });
      }
      if (request.message === "getCommands") {
        sendResponse({ commands: COMMANDS });
      }
      if (request.message === "getTranslation") {
        sendResponse({ translation });
      }

    });
  }
})();