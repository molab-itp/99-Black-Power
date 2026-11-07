# prep

Builds `data/` from Wikipedia's
[100 Greatest African Americans](https://en.wikipedia.org/wiki/100_Greatest_African_Americans) list.

```sh
npm install
npm run build          # skips images already downloaded
npm run build:force    # re-downloads all images
```

Output:

- `data/people.json`: all entries, sorted by earliest date (birth year), with a link to the source list revision
- `data/people/<id>/info.json`: the same entry for one person
- `data/people/<id>/full.jpg`: image, max 1280px wide
- `data/people/<id>/thumb.jpg`: image, 256px wide

Each entry includes `articleUrl` (Wikipedia article) and `image.sourceUrl`
(Commons file page), plus `artist` and `license` for attribution.
Only freely licensed lead images are used. Entries without one have `image: null`.
