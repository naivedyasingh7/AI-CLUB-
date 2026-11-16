# Manage the AI Club teams and board (Members section)

Edit **only `src/members/members.js`**. Put board portrait photos in **`src/members/photos/board/`**.
No other website file needs changing. Start from the latest approved website code.

## 1. Edit the team and board details

Open `src/members/members.js`.

The file contains two lists:
- `board`: Club executive leadership (shown in photo-first cards above the team stage).
- `teams`: Club technical and operational teams (shown in the pinned horizontal track).

### Board member fields
At the top of `src/members/members.js` there is a commented **BOARD TEMPLATE** block.

| Field | What to enter |
| --- | --- |
| `id` | Unique lowercase short name, e.g. `president`. Never reuse an id. |
| `name` | Person's name shown on the card. Use `(TBA)` until confirmed. |
| `designation` | Role shown under the name, e.g. `Club President`. |
| `photo` | Optional picture filename in `src/members/photos/board/`, e.g. `president.webp`. |
| `linkedin` | Optional, must start with `https://linkedin.com/`. |
| `github` | Optional, must start with `https://github.com/`. |
| `order` | Optional integer sorting priority (1, 2, ...). |
| `placeholder` | `true` = development preview; `false` = real entry. |

A board member who also leads a team can share the same `id`.

### Team fields
Each team is a block beginning with `{` and ending with `},` inside the `teams` list:

| Field | What to enter |
| --- | --- |
| `id` | A unique short name, such as `technical`. Never reuse an id. |
| `name` | The team name shown in the rail and panel. |
| `tagline` | A short line beneath the name. |
| `lead` | `{ id, name, role, placeholder }` for the team lead. Omit = "To be announced". |
| `coLead` | Same shape as `lead`. May be absent entirely. |
| `members` | A list of `{ id, name, role, ... }` shown below Lead/Co-lead. |
| `placeholder` | `true` = development preview; `false` = real team. |

### Team person fields (NO PHOTOS)
Team leads, co-leads and members do **NOT** have photos. Do NOT add a `photo` field.

| Field | What to enter |
| --- | --- |
| `id` | Unique within the club (unless `shared: true`). |
| `name` | Person's name. Use `(TBA)` placeholders until confirmed. |
| `role` | Role, e.g. `Member`, `Team Lead`. |
| `branch` | Optional, e.g. `CSE`. |
| `year` | Optional, e.g. `2nd year`. |
| `bio` | Optional short paragraph. |
| `linkedin` | Optional, must start with `https://linkedin.com/`. |
| `github` | Optional, must start with `https://github.com/`. |
| `placeholder` | Optional `true`/`false`. |
| `shared` | Optional `true` if this person genuinely belongs to multiple teams. |

Do not invent real names, bios or social links. Do not store phone numbers or
personal email addresses.

## 2. Add a board photo

- Board photos are **4:5 portrait (recommended 1000×1250px, WebP under 200KB)**. PNG/JPG also accepted.
- Use lowercase letters, numbers and hyphens: `president.webp`. No spaces or slashes.
- Upload it to `src/members/photos/board/` and set `photo: "president.webp"`.
- Missing or failed pictures fall back to an initial-letter avatar in the 4:5 frame automatically.

## 3. Check it locally

In the project folder, run:

```sh
npm run check:members
npm test
npm run build
npm run dev
```

`check:members` validates unique ids, required fields, URLs, and board photos, and flags any unexpected photo field on team members. The build runs it automatically.

## 4. Common problems and their fixes

| What you see | What to do |
| --- | --- |
| `id is duplicated` | Give the entry/person a different id. |
| Required field missing | Fill in `id`/`name`; designation (board); role (team). |
| `photo is not allowed for team members` | Remove the `photo` property from the team lead/member. |
| LinkedIn/GitHub rejected | Use `https://linkedin.com/...` or `https://github.com/...` only. |
| Board photo not found | Upload it to `src/members/photos/board/` and match the filename exactly. |
| Board photo wrong shape | Export a 4:5 portrait image (~1000×1250px). |
| Person shown twice across teams | Add `shared: true` if intentional, otherwise give a unique id. |
| Preview disappears in production | Expected once a real entry exists. Use `placeholder: false` for real entries. |

Placeholder behaviour: entries marked `placeholder: true` show in
development. In production they disappear once at least one real entry exists;
if every entry is a placeholder they remain so the section is never empty.
