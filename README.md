# [99-Black-Power](https://github.com/molab-itp/99-Black-Power)

## Goals

- Create and track code for building a Black Power movement.

## Apps

| App | Folder |
| --- | --- |
| BabyBoat | [BabyBoat/](BabyBoat/) — web only, live at https://molab-itp.github.io/99-Black-Power/BabyBoat/web/ |
| BlackExplore | [BlackExplore/](BlackExplore/) — web version at https://molab-itp.github.io/99-Black-Power/BlackExplore/web/ |
| BubbleCanvas | [BubbleCanvas/](BubbleCanvas/) — web version at https://molab-itp.github.io/99-Black-Power/BubbleCanvas/web/ |
| FaceMeshMash | [FaceMeshMash/](FaceMeshMash/) — web version at https://molab-itp.github.io/99-Black-Power/FaceMeshMash/web/ |
| RandomShapes | [RandomShapes/](RandomShapes/) — web version at https://molab-itp.github.io/99-Black-Power/RandomShapes/web/ |
| Seismometer | [Seismometer/](Seismometer/) |
| 100 Greatest (web) | [Greatest100/](Greatest100/) — live at https://molab-itp.github.io/99-Black-Power/Greatest100/web/ |

## Other folders

- [index.html](index.html) — landing page for all web apps, live at https://molab-itp.github.io/99-Black-Power/
- [Greatest100/prep/](Greatest100/prep/) — Node.js app that builds `Greatest100/prep/data/people.json` and images
- [Greatest100/web/](Greatest100/web/) — web app (grid) that reads `Greatest100/prep/data/`
- [BabyBoat/web/](BabyBoat/web/) — The Baby and the Boat, a story Walter Thompson told, as an animated picture book (plain JS + canvas)
- [FaceMeshMash/web/](FaceMeshMash/web/) — browser version of FaceMeshMash using MediaPipe Face Landmarker
- [BlackExplore/web/](BlackExplore/web/) — browser version of BlackExplore (Timeline, Timer, Black Font 8, Black Banner)
- [RandomShapes/web/](RandomShapes/web/) — browser version of RandomShapes (Shape1–Shape5 tabs)
- [BubbleCanvas/web/](BubbleCanvas/web/) — browser version of BubbleCanvas (tilt or drag to paint a bubble trail)
- [.github/workflows/pages.yml](.github/workflows/pages.yml) — deploys every `<app>/web/` (plus `<app>/prep/data/`) and the landing page to GitHub Pages.
  To add a web version of another app, create `<App>/web/index.html` and add a card to `index.html`.
- [bin/publish.sh](bin/publish.sh) — commit, push, and fast-forward `main`
- [Log.md](Log.md) — prompt and response log
