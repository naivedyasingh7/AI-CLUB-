# AI Club website

## Updating events: start here

An event update needs just two things:

1. Its details in **[src/events/events.js](src/events/events.js)**.
2. Its picture in **[src/events/posters/](src/events/posters/)**, if you have one.

The website uses those details to make the lanyard and its details panel. The
short version of these instructions is in [the event guide](src/events/README.md).

## Change an existing event

1. Open `src/events/events.js` and find the event's title. Each event is a block
   beginning with `{` and ending with `},` inside the `events` list.
2. Change the text **between the quotation marks** beside the field you want.
   For example, change `venue: "Seminar Hall",` to `venue: "Room 204",`.
3. Keep the event's `id` unchanged. It identifies that event even if its title changes.
4. Keep the quotation marks, commas and braces. Save the file and run the checks below.

To change the picture, upload the new picture into the posters folder, then put
its exact filename beside `poster`. Using a new filename makes the change easier
to review. Other events keep their own pictures.

## Add a new event

At the top of `src/events/events.js` there is a commented section labelled
**TEMPLATE**. Copy only the block from `{` through `},`. Paste it as another entry
inside the `events` list, just before the final `];`, and replace the example text.

Here is a filled-in example. These are sample details, not an event announcement:

```js
{
  id: "intro-to-llms",
  title: "Introduction to LLMs",
  start: "2026-12-12 10:00",
  end: "2026-12-12 12:00",
  tagline: "Build your first AI app.",
  venue: "Seminar Hall",
  group: "AI Club · VIT Bhopal",
  description: "A beginner-friendly workshop. Bring a laptop.",
  speakers: [{ name: "Club team", role: "Hosts" }],
  registerUrl: "https://example.com/register",
  poster: "intro-to-llms.webp",
  accent: "orange",
  placeholder: false,
},
```

### What each field means

Only **`id`, `title` and `start` are required** for a real event. Leave optional
fields out when their details are unknown; do not invent information to fill them.

| Field | What to enter |
| --- | --- |
| `id` | A unique short name, such as `intro-to-llms`. Give a new event a new id. |
| `title` | The event name people will see. |
| `start` | The confirmed date and start time in India, using the format below. |
| `end` | The finish date/time. If omitted, the website assumes **two hours** after the start. |
| `tagline` | A short sentence beneath the title. |
| `venue` | The room, building or online location. |
| `group` | The team or organisation running the event. |
| `description` | What the event is about and anything people should bring. |
| `speakers` | A list of speakers. Use `{ name: "Name", role: "Role" }` for each, with commas between them. |
| `registerUrl` | The full registration link, starting with `https://` or `http://`. |
| `poster` | Only the picture's filename, such as `intro-to-llms.webp`. |
| `accent` | Either `"orange"` or `"cyan"`, including the quotation marks. |
| `placeholder` | `false` for a real event; `true` for a development preview. Do not put quotes around true/false. |

Missing text shows **To be announced**. Missing registration keeps Register
disabled. Missing or failed pictures use the club logo and event title.

### Dates and times

Write **`YYYY-MM-DD HH:mm`**. All times mean **India time**, regardless of where
the visitor is. Use a 24-hour clock:

- `2026-12-12 09:30` means **12 December 2026 at 9:30am**.
- `2026-12-12 18:00` means **12 December 2026 at 6pm**.

The finish must not be before the start. Do not write words such as “tomorrow” or
“10am” in date fields. For a preview whose date is unknown, use **both**
`start: null` and `placeholder: true`.

The website calculates Live, Upcoming and Past and orders events on page load.
You do not need to add a status field or rearrange the list. Refresh a page left
open across an event boundary to update its order.

Previews are shown during local development. On the published site, previews are
hidden once a real event exists. If every entry is a preview, they remain visible
so the page is not empty. To turn a preview into a real announcement, enter its
confirmed start time and change `placeholder` to `false`.

## Add the event picture

1. Export a portrait picture at **820 × 1070 pixels**. **WebP under 250KB** is
   recommended; PNG, JPG, JPEG and SVG also work.
2. Keep important text at least **100px from the left/right edges** and **130px
   from the top/bottom**. The badge frame crops the outer edges.
3. Give it a simple lowercase filename using letters, numbers and hyphens, such
   as `intro-to-llms.webp`. Avoid spaces and uppercase extensions.
4. Put it in `src/events/posters/`.
5. Write `poster: "intro-to-llms.webp",` in that event's block. The filename must
   match exactly. Do not put a folder path or website address here.

If you do not have a picture, omit the `poster` line. Leave existing preview
pictures alone unless you are deliberately updating their event.

## Preview and check your changes

On a computer where Node.js and npm are installed, open a terminal in the project
folder. Run `npm install` once when setting up the project. Then run:

```sh
npm run check:events
npm run lint
npm test
npm run build
npm run dev
```

The first command checks the event details and pictures. A successful check says
**Event check passed**. The build also runs this check automatically.

Open the address printed by Vite and add `/events.html`, for example
`http://localhost:5173/events.html`. Look for your event, open its lanyard, and
check the title, date, picture, description and Register state. Stop the local
server with **Ctrl+C** when finished.

`?dummies=5` adds extra preview passes for local testing only. It does nothing in
a production build.

## Make the update entirely on GitHub

You can edit details and upload pictures without installing anything:

1. Open the repository on GitHub. Use the branch selector near the top to create
   a new branch for your update, such as `events/intro-to-llms`.
2. Open `src/events/events.js`, then click the **pencil** icon. Edit an existing
   event or copy the template to add one.
3. Click **Commit changes** or **Propose changes** and describe what you changed.
4. Stay on the **same branch**. Open `src/events/posters/`, select
   **Add file → Upload files**, upload the picture and commit it.
5. Choose **Compare & pull request** (or **Propose changes → Create pull request**).
   A pull request is simply a request for someone to check your update before it
   becomes part of the main website.
6. Check that the request includes the details file and your picture. Ask a club
   lead to review it and its preview. Do not commit directly to `main`.

If the repository has automated checks, wait for them to pass before asking for
the update to be merged. Button wording depends on your GitHub permissions.

## Common problems and their fixes

| What you see | What to do |
| --- | --- |
| An id is duplicated | Give the new event a different id. Do not reuse another event's id. |
| A required field is missing | Fill in `id`, `title` and the confirmed `start` time. |
| A date is invalid or end is before start | Use `YYYY-MM-DD HH:mm`; check the real date and 24-hour finish time. |
| A poster file was not found | Upload it to the posters folder and match its filename exactly. |
| A poster has the wrong shape | Export a portrait image at 820×1070px. Renaming a file does not resize it. |
| The accent is unknown | Use only `"orange"` or `"cyan"`. |
| The picture is larger than 250KB | Export a smaller WebP to help the page load faster. This is a warning, not a build-stopping error. |
| Quotes, commas or braces are mentioned | Compare your entry with the template; keep the punctuation around each field. |
| Your preview disappears in production | That is expected once a real event exists. Use a confirmed date and `placeholder: false` for a real announcement. |

The checker names the event id and field so you can find the problem. If you are
unsure about punctuation, ask a teammate to review your entry before publishing.
