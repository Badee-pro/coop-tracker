# Edge Add-ons submission: Co-op Tracker Sync

Build the package with `package-extension.ps1`, then upload `dist/coop-tracker-sync-<version>-store.zip`.

## Properties

- **Category:** Productivity
- **Privacy policy URL:** https://github.com/Badee-pro/coop-tracker/blob/main/PRIVACY.md
- **Website:** https://github.com/Badee-pro/coop-tracker
- **Support contact:** https://github.com/Badee-pro/coop-tracker/issues
- **Mature content:** No

## Store listing (English)

**Name:** Co-op Tracker Sync

**Short description (max 250 characters):**
Sync your WaterlooWorks co-op applications into Co-op Tracker with one click. Opens WaterlooWorks in a tab, reads your applications list, and closes the tab when done.

**Description:**
Co-op Tracker Sync connects Co-op Tracker to WaterlooWorks so you never retype your co-op applications.

How it works:
1. Click "Sync from WaterlooWorks" in Co-op Tracker.
2. WaterlooWorks opens in a new tab. Sign in if asked, using your browser's normal autofill.
3. The extension reads your applications list (titles, organizations, statuses, deadlines and more), hands it to Co-op Tracker, and closes the tab.

Your data only goes to the Co-op Tracker page in your own browser. The extension never sees your password, doesn't send data anywhere else, and has no analytics or ads.

Not affiliated with or endorsed by the University of Waterloo.

**Search terms:** waterlooworks, co-op, uwaterloo, applications, job tracker

**Assets needed:**
- Store logo: `docs/store-logo-300.png` (300×300)
- Screenshots: at least one, 1280×800 or 640×400 (Co-op Tracker table after a sync works well)

## Notes for certification (paste into "Notes for certification")

This extension only works together with Co-op Tracker, a self-hosted web app (currently served at http://localhost:5173). To test:
1. Run Co-op Tracker locally from https://github.com/Badee-pro/coop-tracker (see README).
2. Click "Sync from WaterlooWorks". A WaterlooWorks tab opens; a University of Waterloo account is required to sign in.
3. The extension reads the applications JSON that the WaterlooWorks applications page already loads, sends it to the Co-op Tracker tab via extension messaging, and closes the WaterlooWorks tab.

Permission justification:
- tabs: identify the WaterlooWorks tab opened by Co-op Tracker (via openerTabId) and close it after syncing.
- storage: session storage of the sync tab ID only.
- Host waterlooworks.uwaterloo.ca: read the signed-in user's own applications list in that tab.
- Host localhost:5173: deliver the list to the Co-op Tracker page.

No remote code, no data collection, no third-party requests.
