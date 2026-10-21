(() => {
  const APPLICATIONS = '/myAccount/co-op/full/applications.htm';

  function banner(text, color = '#3b5bdb') {
    let el = document.getElementById('coop-tracker-banner');
    if (!el) {
      el = document.createElement('div');
      el.id = 'coop-tracker-banner';
      el.style.cssText =
        'position:fixed;top:16px;right:16px;z-index:2147483647;padding:12px 16px;border-radius:8px;' +
        'font:14px system-ui,sans-serif;color:#fff;box-shadow:0 4px 14px rgba(0,0,0,.3);max-width:360px';
      document.body.appendChild(el);
    }
    el.style.background = color;
    el.textContent = text;
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const findListUrl = () =>
    performance
      .getEntriesByType('resource')
      .map((e) => e.name)
      .reverse()
      .find((u) => u.includes('/applications.htm') && u.includes('action=') && u.includes('columns='));

  async function readApplications() {
    let listUrl = findListUrl();
    if (!listUrl) {
      for (let i = 0; i < 20 && !document.querySelector('a,button'); i++) await sleep(250);
      const view = [...document.querySelectorAll('a,button')].find((el) => el.textContent.trim() === 'View');
      if (view) view.click();
      for (let i = 0; i < 40 && !listUrl; i++) {
        await sleep(250);
        listUrl = findListUrl();
      }
    }
    if (!listUrl) throw new Error('Could not find your applications list');

    const items = [];
    for (let page = 1; page <= 50; page++) {
      const url = new URL(listUrl, location.origin);
      url.searchParams.set('page', page);
      const res = await fetch(url, { credentials: 'include', headers: { Accept: 'application/json' } });
      const body = await res.json();
      const data = body.data || [];
      items.push(...data);
      if (!data.length || items.length >= (body.totalResults || 0)) break;
    }
    return items;
  }

  chrome.runtime.sendMessage({ type: 'coop-is-sync-tab' }, async (isSyncTab) => {
    if (!isSyncTab) return;

    if (!location.pathname.startsWith('/myAccount')) {
      banner('Sign in to WaterlooWorks. Co-op Tracker syncs automatically after you sign in.');
      return;
    }
    if (location.pathname !== APPLICATIONS) {
      location.href = APPLICATIONS;
      return;
    }

    try {
      banner('Co-op Tracker: reading your applications…');
      const items = await readApplications();
      banner(`Co-op Tracker: synced ${items.length} applications ✓`, '#2f9e44');
      chrome.runtime.sendMessage({ type: 'coop-items', items });
    } catch (error) {
      banner(`Co-op Tracker: ${error.message}. Refresh this page to try again.`, '#e03131');
    }
  });
})();
