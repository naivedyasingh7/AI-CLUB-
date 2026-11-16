import { memberCopy } from "./memberCopy.js";

const MISSING = memberCopy.toBeAnnounced;
const LINKEDIN_HOST = "linkedin.com";
const GITHUB_HOST = "github.com";

// Team people do NOT have photos. Board photos are 4:5 portrait.
export const BOARD_PHOTO_SPEC = Object.freeze({
  width: 1000,
  height: 1250,
  maxBytes: 200 * 1024,
  aspectTolerance: 0.10,
});

const textOrFallback = (value) =>
  typeof value === "string" && value.trim() ? value : MISSING;

const urlOnHost = (value, host) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(host);
  } catch {
    return false;
  }
};

function checkPhotoDimensions(scope, name, meta, errors, warnings) {
  if (meta.invalid || !meta.width || !meta.height) {
    errors.push(`${scope}: "photo" "${name}" could not be read as an image.`);
    return;
  }
  const ratio = meta.width / meta.height;
  const target = BOARD_PHOTO_SPEC.width / BOARD_PHOTO_SPEC.height;
  if (Math.abs(ratio - target) > BOARD_PHOTO_SPEC.aspectTolerance) {
    errors.push(
      `${scope}: "photo" "${name}" is ${meta.width}×${meta.height}; use a 4:5 portrait image (~${BOARD_PHOTO_SPEC.width}×${BOARD_PHOTO_SPEC.height}px).`,
    );
  }
  if (meta.bytes > BOARD_PHOTO_SPEC.maxBytes) {
    warnings.push(
      `${scope}: "photo" "${name}" is larger than 200KB. Export a smaller WebP if possible.`,
    );
  }
}

export function validateMembers(teams = [], board = [], photos = {}) {
  const errors = [];
  const warnings = [];
  const teamIds = new Set();
  const boardIds = new Set();
  const personIds = new Map();

  if (!Array.isArray(teams)) {
    return { errors: ['members.js: "teams" must be a list of team entries.'], warnings };
  }
  if (!Array.isArray(board)) {
    return { errors: ['members.js: "board" must be a list of board entries.'], warnings };
  }

  const registerPerson = (scope, id, person) => {
    if (!person || typeof person !== "object") return;
    const personId = person.id;
    if (typeof personId !== "string" || !personId.trim()) return;
    const prev = personIds.get(personId);
    if (prev) {
      const mismatches = [];
      if (person.name && prev.name && prev.name !== person.name) mismatches.push("name");
      if (person.linkedin && prev.linkedin && prev.linkedin !== person.linkedin) mismatches.push("linkedin");
      if (person.github && prev.github && prev.github !== person.github) mismatches.push("github");
      if (mismatches.length) {
        errors.push(
          `${scope} "${id}" / ${personId}: "id" is shared with ${prev.scope} "${prev.id}" but ${mismatches.join(" and ")} differ. Use one person definition or a different id.`,
        );
      }
    } else {
      personIds.set(personId, {
        scope,
        id,
        name: person.name,
        linkedin: person.linkedin,
        github: person.github,
      });
    }
  };

  // Validate teams
  teams.forEach((team, index) => {
    const id = team?.id || `team ${index + 1}`;
    const error = (field, message) => errors.push(`${id}: "${field}" ${message}`);
    const personError = (personId, field, message) =>
      errors.push(`${id} / ${personId}: "${field}" ${message}`);

    if (!team || typeof team !== "object") {
      error("team", "must be an object.");
      return;
    }

    if (typeof team.id !== "string" || !team.id.trim())
      error("id", "is required. Give this team a unique name.");
    else if (teamIds.has(team.id))
      error("id", "is duplicated. Every team needs a different id.");
    teamIds.add(team.id);

    if (typeof team.name !== "string" || !team.name.trim())
      error("name", "is required. Give this team a name.");

    if (
      team.placeholder !== undefined &&
      team.placeholder !== true &&
      team.placeholder !== false
    )
      error("placeholder", "must be true or false.");

    const people = [
      { role: "lead", person: team.lead },
      { role: "coLead", person: team.coLead },
      ...(Array.isArray(team.members)
        ? team.members.map((person, i) => ({ role: `member[${i}]`, person }))
        : []),
    ];

    people.forEach(({ role, person }) => {
      if (!person) return;
      const personId = person?.id || role;
      if (typeof person !== "object") {
        personError(personId, role, "must be an object.");
        return;
      }
      if (typeof person.id !== "string" || !person.id.trim())
        personError(personId, "id", "is required.");
      else {
        const prev = personIds.get(person.id);
        if (prev && prev.scope === "team" && prev.id !== id && !person.shared) {
          personError(
            personId,
            "id",
            `is duplicated across teams (first used in ${prev.id}). Set shared: true if intentional.`,
          );
        }
      }

      if (typeof person.name !== "string" || !person.name.trim())
        personError(personId, "name", "is required.");
      if (typeof person.role !== "string" || !person.role.trim())
        personError(personId, "role", "is required.");

      if (person.photo !== undefined) {
        personError(
          personId,
          "photo",
          'is not allowed for team members. Team leads, co-leads and members do not have photos; remove the "photo" field.',
        );
      }

      if (person.linkedin != null && person.linkedin !== "" && !urlOnHost(person.linkedin, LINKEDIN_HOST))
        personError(personId, "linkedin", "must be an https://linkedin.com/ URL.");
      if (person.github != null && person.github !== "" && !urlOnHost(person.github, GITHUB_HOST))
        personError(personId, "github", "must be an https://github.com/ URL.");
      if (
        person.placeholder !== undefined &&
        person.placeholder !== true &&
        person.placeholder !== false
      )
        personError(personId, "placeholder", "must be true or false.");

      registerPerson("team", id, person);
    });
  });

  // Validate board
  board.forEach((entry, index) => {
    const id = entry?.id || `board ${index + 1}`;
    const error = (field, message) => errors.push(`board "${id}": "${field}" ${message}`);

    if (!entry || typeof entry !== "object") {
      errors.push(`board: entry ${index + 1} must be an object.`);
      return;
    }

    if (typeof entry.id !== "string" || !entry.id.trim())
      error("id", "is required. Give this board member a unique id.");
    else if (boardIds.has(entry.id))
      error("id", "is duplicated. Every board member needs a different id.");
    boardIds.add(entry.id);

    if (typeof entry.name !== "string" || !entry.name.trim())
      error("name", "is required. Give this board member a name.");

    if (typeof entry.designation !== "string" || !entry.designation.trim())
      error("designation", "is required. Give this board member a designation.");

    if (
      entry.placeholder !== undefined &&
      entry.placeholder !== true &&
      entry.placeholder !== false
    )
      error("placeholder", "must be true or false.");

    if (entry.order !== undefined && typeof entry.order !== "number")
      error("order", "must be a number.");

    if (entry.linkedin != null && entry.linkedin !== "" && !urlOnHost(entry.linkedin, LINKEDIN_HOST))
      error("linkedin", "must be an https://linkedin.com/ URL.");

    if (entry.github != null && entry.github !== "" && !urlOnHost(entry.github, GITHUB_HOST))
      error("github", "must be an https://github.com/ URL.");

    if (entry.photo != null && entry.photo !== "") {
      if (typeof entry.photo !== "string")
        error("photo", "must be a filename only.");
      else if (/[/\\]/.test(entry.photo))
        error("photo", "must be a filename only, not a path.");
      else {
        const meta = photos[entry.photo];
        if (!meta)
          errors.push(`board "${id}": "photo" "${entry.photo}" not found in photos/board/.`);
        else
          checkPhotoDimensions(`board "${id}"`, entry.photo, meta, errors, warnings);
      }
    }

    registerPerson("board", id, entry);
  });

  return { errors, warnings };
}

export function prepareMembers(entries, { development = false } = {}) {
  const safeEntries = Array.isArray(entries) ? entries.filter((t) => t && typeof t === "object") : [];
  const hasReal = safeEntries.some((team) => team.placeholder !== true);

  return safeEntries
    .filter((team) => development || !hasReal || team.placeholder !== true)
    .map((team) => {
      const personOrFallback = (person, defaultRole) => {
        if (!person) return null;
        return {
          ...person,
          name: textOrFallback(person.name),
          role:
            typeof person.role === "string" && person.role.trim()
              ? person.role
              : (defaultRole || null),
          branch: typeof person.branch === "string" ? person.branch : null,
          year: typeof person.year === "string" ? person.year : null,
          bio: typeof person.bio === "string" ? person.bio : null,
          linkedin:
            person.linkedin && urlOnHost(person.linkedin, LINKEDIN_HOST)
              ? person.linkedin
              : null,
          github:
            person.github && urlOnHost(person.github, GITHUB_HOST)
              ? person.github
              : null,
          isPlaceholder: person.placeholder === true,
        };
      };

      const lead = team.lead
        ? personOrFallback(team.lead, memberCopy.lead)
        : { id: `${team.id}-lead-tba`, name: MISSING, role: null };
      const coLead = personOrFallback(team.coLead, memberCopy.coLead);
      const members = Array.isArray(team.members)
        ? team.members.map((m) => personOrFallback(m, memberCopy.members)).filter(Boolean)
        : [];

      return {
        ...team,
        name: textOrFallback(team.name),
        tagline: typeof team.tagline === "string" ? team.tagline : null,
        lead,
        coLead,
        members,
        memberCount: (team.lead ? 1 : 0) + (team.coLead ? 1 : 0) + (Array.isArray(team.members) ? team.members.length : 0),
        isPlaceholder: team.placeholder === true,
        development: team.placeholder === true,
      };
    });
}

export function prepareBoard(entries, { development = false, resolvePhoto = (name) => name } = {}) {
  const safeEntries = Array.isArray(entries) ? entries.filter((b) => b && typeof b === "object") : [];
  const hasReal = safeEntries.some((b) => b.placeholder !== true);

  return safeEntries
    .filter((b) => development || !hasReal || b.placeholder !== true)
    .sort((a, b) => {
      const orderA = typeof a.order === "number" ? a.order : Infinity;
      const orderB = typeof b.order === "number" ? b.order : Infinity;
      return orderA - orderB;
    })
    .map((member) => ({
      ...member,
      name: textOrFallback(member.name),
      designation: textOrFallback(member.designation),
      linkedin:
        member.linkedin && urlOnHost(member.linkedin, LINKEDIN_HOST)
          ? member.linkedin
          : null,
      github:
        member.github && urlOnHost(member.github, GITHUB_HOST)
          ? member.github
          : null,
      photo: member.photo || null,
      photoSrc: member.photo ? resolvePhoto(member.photo) : null,
      isPlaceholder: member.placeholder === true,
    }));
}
