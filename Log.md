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
