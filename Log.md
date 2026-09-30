Log.md

2026-09-29 12:02:31

## 2026-09-29 12:13 EDT — prep: 100 Greatest African Americans data

Approximate time cost: ~10 min (about 12:01–12:06 build and run, plus this log entry)

### Prompt

```
create a folder named prep and in it write a node js app
to parse https://en.wikipedia.org/wiki/100_Greatest_African_Americans
into json with folder for related image for each person
sort the entries by earlies date in the listing
create thumb and full size image
include source url for articles
```

### Response

Built a Node.js app in `prep/` and ran it: all 100 entries parsed, 96 with images.

- Run: `cd prep && npm install && npm run build` (`npm run build:force` re-downloads images)
- `prep/build.js`: fetches the list's wikitext through the MediaWiki API, parses the
  `(YYYY–YYYY)`, `(born YYYY)` and `({{circa|YYYY}}–YYYY)` date forms, looks up each
  article and its lead image, and uses `sharp` to write the images
- `prep/data/people.json`: all entries sorted by birth year (Crispus Attucks 1723 →
  Tiger Woods 1975), plus the list's URL and the exact revision parsed
- `prep/data/people/<id>/`: `full.jpg` (max 1280px wide), `thumb.jpg` (256px wide), `info.json`
- Each entry: name, born/died, circa flag, original alphabetical position, description,
  summary, `articleUrl`, and image `sourceUrl` (Commons page), original file, artist, license

Notes:

- 4 entries have `image: null`. David Walker, Kenneth B. Clark and John Henrik Clarke have
  no lead image. August Wilson's is fair use (non-free), so it's skipped.
- Kenneth B. Clark redirects to the joint article "Kenneth and Mamie Clark".
- `prep/.gitignore` ignores `node_modules/`. `data/` (~27 MB) is not ignored.

### Prompt

```
append this chat to Log.md with date and time stamp
with approximate time cost
```

### Response

Appended this entry.

## 2026-09-29 12:43 EDT — web: GitHub Pages hosting and grid app

Approximate time cost: ~10 min (plan ~3 min, build and local test ~5 min, plus this log entry)

### Prompt

```
Plan: dont build anything yet.
Give alternatives to build a web app
to browser the 100 in prep/data/people.json
to be hosted on github pages
suggest minimal frameworks
and support deploy of multipe web apps from this repo
```

### Response

Plan only; nothing built.

- Hosting options:
  - A. GitHub Actions: apps in `web/<app>/`; the workflow copies `web/` and `prep/data/`
    into `_site/` with the same paths, so apps fetch `../../prep/data/people.json` both
    locally and deployed. The Xcode project isn't published. An app can have its own build
    step later.
  - B. Deploy from the branch root with `.nojekyll`: no CI, but publishes the whole repo.
  - C. Deploy from `/docs`: data would have to be copied in, since Pages doesn't follow
    symlinks. The weakest option.
- Frameworks, from lightest: vanilla JS, Alpine.js, Preact + htm, Lit, p5.js (all without a
  build step), then Vite + Svelte and Eleventy (with a build step).
- Recommended: Option A, and a vanilla or Alpine grid app first.

### Prompt

```
Go with Hosting Option A, first app in vanilla js, ok for urls to include /web/,
show image credits in detail view
```

### Response

Built these files (not committed):

- `.github/workflows/pages.yml`: puts `web/` and `prep/data/` into `_site/`. It runs when
  those folders change on `main`, or by hand. If an app has a `package.json`, it builds it
  and publishes its `dist/` instead. The site root redirects to `web/`.
- `web/index.html`: landing page that links to each app
- `web/grid/` (`index.html`, `style.css`, `app.js`):
  - thumbnail grid sorted by birth year or name, with search by name or description
  - detail view (`<dialog>`) with the full image, summary, Wikipedia link, and image credit
    (file, artist, license link, credit)
  - a shareable link for each person (`#<id>`); prev/next follow the current filter
  - an initials placeholder for the 4 people without an image
  - colours are the plum `#1e131d` and orange `#fba414` from the README notes

Tested: `node --check` passed. A copy of the site assembled locally returned HTTP 200 for the
pages, data and images. I didn't open it in a browser, and the workflow hasn't run yet.

To deploy: set Settings → Pages → Source to "GitHub Actions", then merge into `main`. The app
will be at https://molab-itp.github.io/99-Black-Power/web/grid/

Local dev: run `npx serve .` from the repo root, then open `/web/grid/`.

### Prompt

```
append this chat to Log.md with date and time stamp
with approximate time cost
```

### Response

Appended this entry.

## 2026-09-30 17:54 EDT — BubbleLevel: bubble trail as a PNG image layer

Approximate time cost: ~10 min (plan, revised plan, implementation and simulator build)

### Prompt

```
in BubbleLevel/BubbleLevel.swift
produce a plan to add to canvas
a draw layer that is saved and loaded from local storage
via load save button
```

```
modify plan to have the write the bubble trail to an image layer that is saved as a png
```

```
implement and document changes in Log.md
```

### Response

Changed `BubbleLevel/BubbleLevel.swift`: the bubble trail now builds up in a bitmap image
layer that can be saved to and loaded from a PNG file.

- `trailImage: UIImage?` is the image layer, shown with `Image(uiImage:)` under the live `Canvas`
- `data` is now a buffer of pending points. The `Canvas` draws them live, and every
  `flushCount` (100) points `flushTrail()` draws them into `trailImage` with
  `UIGraphicsImageRenderer` (display scale, transparent background) and empties the buffer.
  This replaces the 1000-point `maxData` cap, so the trail can grow without limit.
- Save / Load / Clear buttons (`.bordered`) below the level:
  - Save runs `flushTrail()`, then writes `trailImage.pngData()` to
    `Documents/bubble-trail.png`
  - Load reads the PNG with `UIImage(data:scale: displayScale)`, so a @3x file still maps
    to the 300-point level
  - Clear empties the buffer and the image
- The bubble and crosshair now draw on top of the trail layers. Before, the trail covered
  the bubble.
- Removed the unused `myOnUpdate()`. Moved the level into its own `level` view and added
  a `dotRect(_:)` helper that the Canvas and the flush share.

Tested: `xcodebuild` for the iOS Simulator succeeded. I haven't run it on a device, so
Save → Clear → Load and loading after relaunch are untested.

Notes:

- The PNG has only the black dots on a transparent background, not the gray circle or
  the crosshair.
- The file is in the app's Documents folder. To see it in the Files app, add
  `UIFileSharingEnabled` and `LSSupportsOpeningDocumentsInPlace` to Info.plist.
- The trail isn't loaded automatically at launch. Tap Load.
- The button row makes the view taller. `LevelView`'s `.padding(.top, 80)` may need reducing.
