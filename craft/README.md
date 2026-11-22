# Happy birthday, Noorie.

A single-page birthday card. Plain HTML, CSS and JavaScript — no build step, no dependencies.

## 1. Add the music

Drop your track into **`assets/song.mp3`** (that exact filename).

It plays the moment someone presses **“Press to open”** on the cover — browsers block autoplay before a tap, so that press is the thing that starts it. It plays through **once** and stops on its own; it does not loop. The little record button in the corner can pause it, or start it again if she wants another listen.

Use an `.mp3`. If you'd rather use `.m4a` or `.ogg`, change the `src` on the `<audio>` tag near the bottom of `index.html`.

## 2. Add the photos

Drop six photos into **`assets/photos/`** named:

```
01.jpg  02.jpg  03.jpg  04.jpg  05.jpg  06.jpg
```

Any of them may be `.png` / `.webp` instead — just update the matching `src` in section `02` of `index.html`. Until a file exists, that slot shows a coloured block with its number, so nothing looks broken.

Photos are cropped to a 4:5 portrait frame, so tall shots work best. Edit the captions in the same block.

## 3. Edit the words

- Her name: the `<h1>`, the card, and the colophon line in `index.html`.
- The five lines in section `01` and the letter in section `03` — plain text, edit in place.
- Colours: `:root` at the top of `styles.css` — `--c1` vermilion, `--c2` marigold, `--c3` teal, `--c4` plum.

## Publish on GitHub Pages

```bash
git remote add origin https://github.com/<your-username>/birthday.git
git branch -M main
git push -u origin main
```

Then **Settings → Pages → Source: Deploy from a branch → Branch: `main`, folder `/ (root)` → Save.** It goes live at `https://<your-username>.github.io/birthday/`.

GitHub Pages serves files up to 100 MB each, but keep photos under ~1 MB so the page opens quickly on a phone. `.nojekyll` is included, so it all works from the `/birthday/` subpath as-is.
