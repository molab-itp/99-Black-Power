# [99-Black-Power](https://github.com/molab-itp/99-Black-Power)

## Goals

- Create and track code for building a Black Power movement.

## Apps

| App | Folder |
| --- | --- |
| Black_Explore | [Black_Explore/](Black_Explore/) |
| BubbleCanvas | [BubbleCanvas/](BubbleCanvas/) |
| FaceMeshMash | [FaceMeshMash/](FaceMeshMash/) — web version at https://molab-itp.github.io/99-Black-Power/FaceMeshMash/web/ |
| RandomShapes | [RandomShapes/](RandomShapes/) |
| Seismometer | [Seismometer/](Seismometer/) |
| 100 Greatest (web) | [greatest-100/](greatest-100/) — live at https://molab-itp.github.io/99-Black-Power/greatest-100/web/ |

## Other folders

- [index.html](index.html) — landing page for all web apps, live at https://molab-itp.github.io/99-Black-Power/
- [greatest-100/prep/](greatest-100/prep/) — Node.js app that builds `greatest-100/prep/data/people.json` and images
- [greatest-100/web/](greatest-100/web/) — web app (grid) that reads `greatest-100/prep/data/`
- [FaceMeshMash/web/](FaceMeshMash/web/) — browser version of FaceMeshMash using MediaPipe Face Landmarker
- [.github/workflows/pages.yml](.github/workflows/pages.yml) — deploys every `<app>/web/` (plus `<app>/prep/data/`) and the landing page to GitHub Pages.
  To add a web version of another app, create `<App>/web/index.html` and add a card to `index.html`.
- [bin/publish.sh](bin/publish.sh) — commit, push, and fast-forward `main`
- [Log.md](Log.md) — prompt and response log
