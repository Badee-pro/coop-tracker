const TRACKERS = ['http://localhost:5173/', 'https://badee-pro.github.io/coop-tracker/'];
const WW = 'https://waterlooworks.uwaterloo.ca';

async function syncTabs() {
  const { syncTabs = {} } = await chrome.storage.session.get('syncTabs');
  return syncTabs;
}

async function saveSyncTabs(tabs) {
  await chrome.storage.session.set({ syncTabs: tabs });
}

chrome.tabs.onCreated.addListener(async (tab) => {
  if (!tab.openerTabId) return;
  const opener = await chrome.tabs.get(tab.openerTabId).catch(() => null);
  const target = tab.pendingUrl || tab.url || '';
  if (!TRACKERS.some((t) => opener?.url?.startsWith(t)) || (target && !target.startsWith(WW) && target !== 'about:blank')) return;
  const tabs = await syncTabs();
  tabs[tab.id] = tab.openerTabId;
  await saveSyncTabs(tabs);
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const tabs = await syncTabs();
  if (!(tabId in tabs)) return;
  const trackerTabId = tabs[tabId];
  delete tabs[tabId];
  await saveSyncTabs(tabs);
  chrome.tabs.sendMessage(trackerTabId, { type: 'coop-tab-closed' }).catch(() => {});
});

chrome.runtime.onMessage.addListener((message, sender, reply) => {
  const tabId = sender.tab?.id;

  if (message.type === 'coop-is-sync-tab') {
    syncTabs().then((tabs) => reply(tabId in tabs));
    return true;
  }

  if (message.type === 'coop-items') {
    syncTabs().then(async (tabs) => {
      const trackerTabId = tabs[tabId];
      if (trackerTabId === undefined) return reply(false);
      await chrome.tabs.sendMessage(trackerTabId, { type: 'coop-items', items: message.items });
      delete tabs[tabId];
      await saveSyncTabs(tabs);
      reply(true);
      chrome.tabs.update(trackerTabId, { active: true }).catch(() => {});
      setTimeout(() => chrome.tabs.remove(tabId).catch(() => {}), 800);
    });
    return true;
  }

  return false;
});
