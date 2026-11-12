# Add an AI Club event

Edit **only `src/events/events.js`**. Put pictures in **`src/events/posters/`**.
No other website file needs changing. Start from the latest approved website code.

For a fuller explanation with a field-by-field table and instructions for changing
an existing event, read [the main README](../../README.md).

To update an existing event, find its title, change the relevant text inside the
quotes, and keep its `id`. To replace its picture, upload the new file and change
only that event's `poster` filename. Keep the surrounding commas and braces.

### 1. Add the details

Copy the commented TEMPLATE object at the top of `events.js` into the `events`
list, before its final `];`. Keep the comma after the object. Give every event a
different `id` (for example `intro-to-llms`) and its real public `title`.

`start` is required: **`2026-12-12 10:00`** means 12 December 2026 at 10am **India
time**, regardless of the visitor's country. Use a 24-hour clock. `end` is optional;
without it the event lasts **120 minutes**. Dates must be real confirmed dates.
For an undated preview only, use `start: null` together with `placeholder: true`.

All other fields are optional: `tagline` is a short subtitle; `venue` is the place;
`group` is the organiser; `description` explains the event; `speakers` is a list of
`{ name: "...", role: "..." }`; `registerUrl` is the full `https://...` registration
link; `poster` is just the image filename; `accent` is `orange` or `cyan`.
Unknown text shows “To be announced”. Missing registration keeps Register disabled.

Do not add a status or arrange events manually: the page calculates Live, Upcoming
and Past on load, then puts live events first, upcoming events soonest first, and
past events newest first. Previews are visible in development. In production they
disappear once at least one real event exists; if all entries are previews, they
remain so the archive is not empty.

### 2. Add the picture

- Recommended: **820×1070px**, portrait (**82:107** ratio), **WebP under 250KB**.
  PNG/JPG/JPEG/SVG also work. Existing preview SVGs are retained unchanged.
- Keep important text **100px away from each side** and **130px from top/bottom**.
  The existing badge face is **1.64×2.14** units; its 0.85 UV scale removes 7.5%
  from each image edge. These safe margins include extra room for the frame.
- Use lowercase letters, numbers and hyphens: `intro-to-llms.webp`. No spaces,
  slashes or uppercase extensions. Upload it to `src/events/posters/` and set
  `poster: "intro-to-llms.webp"`. Never write paths or imports.
- Missing/failed artwork uses the club's existing logo plus the event title.
  Leave the existing preview files alone; the fallback reuses the club logo asset.

### 3. Check it locally

In the project folder, run `npm install` once, then:

```sh
npm run check:events
npm test
npm run build
npm run dev
```

Open the Events page (`/events.html`) at the address printed by Vite. Your title
and picture should appear on a pass; open it and check the details and Register
state. “Event check passed” and a successful build mean the data checks passed.
The build always runs the event check first. `?dummies=5` is for development only.

### 4. Send it for review

With git: make a new branch, edit the details/upload the image, run the checks,
commit the two files, push your branch and open a pull request. Do not push to main.

Entirely on GitHub: create/select a new branch → open `src/events/events.js` →
pencil icon → copy/edit the template → Commit changes/Propose changes. On the same
branch open `src/events/posters/` → **Add file → Upload files** → upload the image
and commit it. Choose **Propose changes / Compare & pull request**, review both
files, then **Create pull request**. Ask a club lead to review the preview before
merging. Button wording depends on your repository permissions.

### 5. Common errors

| Message | Fix |
| --- | --- |
| `id is duplicated` / required field | Choose a unique id; fill id, title and start. |
| Invalid date / end before start | Use `YYYY-MM-DD HH:mm`, India time; check the real date and finish time. |
| Poster file not found | Match the filename exactly and upload it to `src/events/posters/`. |
| Unknown accent | Use only `orange` or `cyan`, with quotes. |
| Poster wrong shape | Export 820×1070px; keep text inside the safe margins. |

Syntax errors usually mean a missing quote, comma or closing brace. Compare with
the template. The checker names the event id and field to help you find the entry.
