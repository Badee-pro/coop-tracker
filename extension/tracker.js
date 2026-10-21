document.documentElement.dataset.coopSyncExtension = chrome.runtime.getManifest().version;

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'coop-items') {
    window.postMessage({ type: 'coop-applications', items: message.items }, window.location.origin);
  } else if (message.type === 'coop-tab-closed') {
    window.postMessage({ type: 'coop-tab-closed' }, window.location.origin);
  }
});
