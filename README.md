# PSC Simulator / League Site V1.0

This is the first front-end shell for the Bogus Boys Golf League website.

## Included

- Mobile-friendly single-page league site
- Attendance table
- Pairings display
- Weekly result cards
- Combined / Flight A / Flight B standings tabs
- Handicaps and quota table
- Statistics cards
- Google Apps Script starter API
- Demo data so the site works immediately

## Files

- `index.html` — main website
- `css/styles.css` — site design
- `js/config.js` — connection settings
- `js/app.js` — front-end data and rendering
- `google-apps-script.gs` — starter API for the current Google Sheet

## First test

1. Upload the files to a new GitHub repository.
2. Turn on GitHub Pages.
3. Open the published website.
4. Leave `useLiveData: false` in `js/config.js` until the Google Sheet API is ready.

## Connecting the existing Google Sheet

After deploying the Apps Script as a web app, update `js/config.js`:

```javascript
window.LEAGUE_CONFIG = {
  useLiveData: true,
  appsScriptUrl: "YOUR_DEPLOYED_APPS_SCRIPT_WEB_APP_URL",
  endpoints: {
    attendance: "attendance",
    pairings: "pairings",
    standings: "standings",
    handicaps: "handicaps",
    stats: "stats",
    latestResults: "latestResults",
    nextEvent: "nextEvent"
  }
};
```

The Apps Script ranges are placeholders. They must be matched to the exact columns and ranges in the working Bogus Boys spreadsheet before turning on live data.
