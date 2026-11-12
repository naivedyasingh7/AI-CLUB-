# Manage the AI Club teams (Members section)

Edit **only `src/members/members.js`**. Put portrait photos in **`src/members/photos/`**.
No other website file needs changing. Start from the latest approved website code.

## 1. Edit the team details

Open `src/members/members.js`. Each team is a block beginning with `{` and ending
with `},` inside the `teams` list. Change the text between the quotation marks
beside the field you want. Keep the quotation marks, commas and braces.

At the top of the file there is a commented **TEMPLATE** block. Copy only the
block from `{` through `},`. Paste it as another entry inside the `teams` list,
just before the final `];`, and replace the example text.

Every team needs a unique `id` (for example `technical`) and a real public
`name`. All other fields are optional:

| Field | What to enter |
| --- | --- |
| `id` | A unique short name, such as `technical`. Never reuse an id. |
| `name` | The team name shown in the rail and panel. |
| `tagline` | A short line beneath the name. |
| `lead` | `{ id, name, role, placeholder }` for the team lead. Omit = "To be announced". |
| `coLead` | Same shape as `lead`. May be absent entirely. |
| `members` | A list of `{ id, name, role, ... }` shown below Lead/Co-lead. |
| `placeholder` | `true` = development preview; `false` = real team. |

### Person fields

| Field | What to enter |
| --- | --- |
| `id` | Unique within the club (unless `shared: true`). |
| `name` | Person's name. Use `(TBA)` placeholders until confirmed. |
| `role` | Role, e.g. `Member`, `Team Lead`. |
| `photo` | Only the picture's filename, e.g. `alice.webp`. No paths or imports. |
| `branch` | Optional, e.g. `CSE`. |
| `year` | Optional, e.g. `2nd year`. |
| `bio` | Optional short paragraph. |
| `linkedin` | Optional, must start with `https://linkedin.com/`. |
| `github` | Optional, must start with `https://github.com/`. |
| `placeholder` | Optional `true`/`false`. |
| `shared` | Optional `true` if this person genuinely belongs to multiple teams. |

Do not invent real names, bios or social links. Do not store phone numbers or
personal email addresses.

## 2. Add a photo

- Recommended: **square 1:1, at least 800×800, WebP under 150KB**. PNG/JPG also OK.
- Use lowercase letters, numbers and hyphens: `alice.webp`. No spaces or slashes.
- Upload it to `src/members/photos/` and set `photo: "alice.webp"`. Never write a
  folder path or website address.
- Missing or failed pictures fall back to an initials avatar automatically.

## 3. Check it locally

In the project folder, run `npm install` once, then:

```sh
npm run check:members
npm test
npm run build
npm run dev
```

`check:members` validates ids, required fields, links and photos, and names the
team id, person id and field for any problem. The build runs it automatically.

Open the address printed by Vite. Look for the Members section, open a team,
expand a person, and check the details and links. Stop the server with **Ctrl+C**.

## 4. Send it for review

With git: make a new branch, edit `src/members/members.js` (and upload any
photo), run the checks above, commit, push your branch and open a pull request.
Do not push to `main`.

Entirely on GitHub: create a branch → open `src/members/members.js` → pencil icon
→ edit or copy the template → Commit changes. On the same branch open
`src/members/photos/` → **Add file → Upload files** → upload the image → commit.
Choose **Compare & pull request**, review both, then **Create pull request**.
Ask a club lead to review the preview before merging.

## 5. Common problems and their fixes

| What you see | What to do |
| --- | --- |
| `id is duplicated` | Give the team/person a different id. |
| Required field missing | Fill in team `id`/`name`; person `id`/`name`/`role`. |
| LinkedIn/GitHub rejected | Use `https://linkedin.com/...` or `https://github.com/...` only. |
| Photo not found | Upload it to `src/members/photos/` and match the filename exactly. |
| Photo wrong shape | Export a square 1:1 image (at least 800×800). |
| Person shown twice across teams | Add `shared: true` if intentional, otherwise give a unique id. |
| Preview disappears in production | Expected once a real team exists. Use `placeholder: false` for real teams. |

Placeholder behaviour: teams/people marked `placeholder: true` show in
development. In production they disappear once at least one real team exists;
if every team is a placeholder they remain so the section is never empty.
