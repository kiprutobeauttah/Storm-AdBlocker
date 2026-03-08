function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function updateStats() {
  chrome.storage.local.get(['stats'], (result) => {
    const stats = result.stats || {
      adsBlocked: 0,
      trackersBlocked: 0,
      dataSaved: 0,
      sitesVisited: 0
    };
    
    document.getElementById('adsBlocked').textContent = stats.adsBlocked.toLocaleString();
    document.getElementById('trackersBlocked').textContent = stats.trackersBlocked.toLocaleString();
    document.getElementById('dataSaved').textContent = formatBytes(stats.dataSaved);
    document.getElementById('sitesVisited').textContent = stats.sitesVisited.toLocaleString();
  });
}

function getCurrentDomain() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      try {
        const url = new URL(tabs[0].url);
        document.getElementById('currentDomain').textContent = url.hostname;
      } catch (e) {
        document.getElementById('currentDomain').textContent = 'N/A';
      }
    }
  });
}

document.getElementById('enableToggle').addEventListener('change', (e) => {
  chrome.storage.local.set({ enabled: e.target.checked });
  chrome.runtime.sendMessage({ 
    action: 'toggleBlocking', 
    enabled: e.target.checked 
  });
});

document.getElementById('whitelistBtn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      try {
        const url = new URL(tabs[0].url);
        chrome.runtime.sendMessage({ 
          action: 'addToWhitelist', 
          domain: url.hostname 
        });
        alert(`${url.hostname} has been whitelisted`);
      } catch (e) {
        alert('Cannot whitelist this page');
      }
    }
  });
});

document.getElementById('resetStats').addEventListener('click', () => {
  if (confirm('Are you sure you want to reset all statistics?')) {
    chrome.storage.local.set({ 
      stats: {
        adsBlocked: 0,
        trackersBlocked: 0,
        dataSaved: 0,
        sitesVisited: 0
      }
    }, () => {
      updateStats();
    });
  }
});

document.getElementById('openSettings').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

document.getElementById('aboutLink').addEventListener('click', (e) => {
  e.preventDefault();
  alert('Storm AdBlocker v1.0.0\n\nCreated by Mr.Beauttah\nGitHub: github.com/kiprutobeauttah\nEmail: kiprutobeauttah@gmail.com\n\nApache License 2.0');
});

document.getElementById('supportLink').addEventListener('click', (e) => {
  e.preventDefault();
  window.open('mailto:kiprutobeauttah@gmail.com?subject=Storm AdBlocker Support');
});

document.getElementById('donateLink').addEventListener('click', (e) => {
  e.preventDefault();
  alert('Thank you for your support!\n\nContact: kiprutobeauttah@gmail.com');
});

chrome.storage.local.get(['enabled'], (result) => {
  document.getElementById('enableToggle').checked = result.enabled !== false;
});

updateStats();
getCurrentDomain();
setInterval(updateStats, 3000);
