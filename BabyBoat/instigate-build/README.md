# BabyBoat → Instigate

Builds [BabyBoat/web](../web/) as an [Instigate](https://www.instigate.ai) story.

- `story.json` lists, for each scene, the frame to capture (`scene`, `t` seconds) and the caption text tiles that follow it.
- `build.mjs` renders each frame in headless Chrome (`../web/index.html?t=N#scene`, 1920×1080 JPEG), uploads it, and builds the story.
- `build-state.json` records the story id and share link. When you run the build again, it swaps the story's tiles in place, so the link stays the same.

```sh
npm install                     # once (playwright-core; uses installed Google Chrome)
node build.mjs --render-only    # just write frames/
node build.mjs                  # render + upload + create/update story
node build.mjs --new            # make a separate new story
node build.mjs --visibility public   # private | shared (link only) | public (listed)
```

The API key goes in `INSTIGATE_KEY`, read from the environment or from `./.env`. `.env` is gitignored. The key must be a write key, made at https://www.instigate.ai/app/developers.
API docs: https://www.instigate.ai/docs/building-stories/
