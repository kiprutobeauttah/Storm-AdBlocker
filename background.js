let stats = {
  adsBlocked: 0,
  trackersBlocked: 0,
  dataSaved: 0,
  sitesVisited: 0
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ stats, enabled: true, whitelist: [] });
  console.log('DataSaver AdBlocker installed');
});

chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((details) => {
  updateStats(details);
});

chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.frameId === 0) {
    chrome.storage.local.get(['stats'], (result) => {
      const stats = result.stats || { sitesVisited: 0 };
      stats.sitesVisited++;
      chrome.storage.local.set({ stats });
    });
  }
});

function updateStats(details) {
  chrome.storage.local.get(['stats'], (result) => {
    const stats = result.stats || {
      adsBlocked: 0,
      trackersBlocked: 0,
      dataSaved: 0,
      sitesVisited: 0
    };

    if (details.request.url.match(/ad|banner|popup|sponsor/i)) {
      stats.adsBlocked++;
      stats.dataSaved += estimateSize(details.request.url);
    } else if (details.request.url.match(/track|analytics|pixel|beacon/i)) {
      stats.trackersBlocked++;
      stats.dataSaved += estimateSize(details.request.url);
    }

    chrome.storage.local.set({ stats });
  });
}

function estimateSize(url) {
  if (url.match(/\.(jpg|jpeg|png|gif|webp)/i)) return 50;
  if (url.match(/\.(js)/i)) return 30;
  if (url.match(/\.(css)/i)) return 10;
  return 5;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getStats') {
    chrome.storage.local.get(['stats'], (result) => {
      sendResponse(result.stats);
    });
    return true;
  }
  
  if (request.action === 'resetStats') {
    stats = {
      adsBlocked: 0,
      trackersBlocked: 0,
      dataSaved: 0,
      sitesVisited: 0
    };
    chrome.storage.local.set({ stats });
    sendResponse({ success: true });
    return true;
  }
  
  if (request.action === 'toggleEnabled') {
    chrome.storage.local.get(['enabled'], (result) => {
      const newState = !result.enabled;
      chrome.storage.local.set({ enabled: newState });
      sendResponse({ enabled: newState });
    });
    return true;
  }
  
  if (request.action === 'addToWhitelist') {
    chrome.storage.local.get(['whitelist'], (result) => {
      const whitelist = result.whitelist || [];
      if (!whitelist.includes(request.domain)) {
        whitelist.push(request.domain);
        chrome.storage.local.set({ whitelist });
      }
      sendResponse({ success: true });
    });
    return true;
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    chrome.storage.local.get(['enabled', 'whitelist'], (result) => {
      const enabled = result.enabled !== false;
      const whitelist = result.whitelist || [];
      const domain = new URL(tab.url).hostname;
      
      if (!enabled || whitelist.includes(domain)) {
        chrome.action.setIcon({
          tabId: tabId,
          path: {
            16: 'icons/icon16-disabled.png',
            48: 'icons/icon48-disabled.png',
            128: 'icons/icon128-disabled.png'
          }
        });
      }
    });
  }
});
