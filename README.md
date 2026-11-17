# WORLDTIDE V1

A mobile-first, installable Progressive Web App concept. This is a single-device local edition.

## Features
- Create digital Seeds (Mystery, Nature, Artifact, Dream)
- Discover, search and filter Seeds
- Evolve a Seed by adding a contribution
- Save and unsave Seeds
- Evolution trail and activity feed
- Persistent browser storage using localStorage
- Offline app shell using a service worker
- Responsive layout for phones and desktop

## Run locally
You need Python 3 installed.

```bash
python -m http.server 8000
```

Open http://localhost:8000

For PWA installation, serve over HTTPS (or localhost). On Android, use the browser menu > Install app / Add to Home screen. On iPhone, open in Safari > Share > Add to Home Screen.

## Important V1 limits
- Data is stored only in the current browser/device.
- No accounts, cloud sync or multiplayer.
- No live GPS discovery, camera AR, payments or moderation backend.
- This is not yet an App Store / Google Play store package.

## Next production milestone
Add a hosted backend, user accounts, authorization, moderation/reporting, abuse prevention, location privacy controls and realtime collaboration before public launch.
