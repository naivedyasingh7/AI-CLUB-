import { memberCopy } from "./memberCopy.js";

const MISSING = memberCopy.toBeAnnounced;
const LINKEDIN_HOST = "linkedin.com";
const GITHUB_HOST = "github.com";

// Accept roughly square images (within 25% of 1:1).
export const PHOTO_SPEC = Object.freeze({
  maxBytes: 150 * 1024,
  aspectTolerance: 0.25,
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

function checkPhotoDimensions(teamId, role, name, meta, errors, warnings) {
  const prefix = `${teamId} / ${role}`;
  if (meta.invalid || !meta.width || !meta.height) {
    errors.push(`${prefix}: "photo" "${name}" could not be read as an image.`);
    return;
  }
  const ratio = meta.width / meta.height;
  if (Math.abs(ratio - 1) > PHOTO_SPEC.aspectTolerance) {
    errors.push(
      `${prefix}: "photo" "${name}" is ${meta.width}×${meta.height}; use a square 1:1 image.`,
    );
  }
  if (meta.bytes > PHOTO_SPEC.maxBytes) {
    warnings.push(
      `${prefix}: "photo" "${name}" is larger than 150KB. Export a smaller WebP if possible.`,
    );
  }
}

export function validateMembers(entries, photos = {}) {
  const errors = [];
  const warnings = [];
  const teamIds = new Set();
  const personIds = new Map(); // person id -> team id (unless shared)

  if (!Array.isArray(entries)) {
    return {
      errors: ['members.js: "teams" must be a list of team entries.'],
      warnings,
    };
  }

  entries.forEach((team, index) => {
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
      else if (
        personIds.has(person.id) &&
        !person.shared
      )
        personError(
          personId,
          "id",
          `is duplicated across teams (first used in ${personIds.get(person.id)}). Set shared: true if intentional.`,
        );
      if (person.id) personIds.set(person.id, id);
      if (typeof person.name !== "string" || !person.name.trim())
        personError(personId, "name", "is required.");
      if (typeof person.role !== "string" || !person.role.trim())
        personError(personId, "role", "is required.");
      if (person.photo != null && typeof person.photo !== "string")
        personError(personId, "photo", "must be a filename only.");
      if (person.photo && /[/\\]/.test(person.photo))
        personError(personId, "photo", "must be a filename only, not a path.");
      if (person.linkedin != null && !urlOnHost(person.linkedin, LINKEDIN_HOST))
        personError(personId, "linkedin", "must be an https://linkedin.com/ URL.");
      if (person.github != null && !urlOnHost(person.github, GITHUB_HOST))
        personError(personId, "github", "must be an https://github.com/ URL.");
      if (
        person.placeholder !== undefined &&
        person.placeholder !== true &&
        person.placeholder !== false
      )
        personError(personId, "placeholder", "must be true or false.");
    });

    if (team.lead && team.lead.photo) {
      const meta = photos[team.lead.photo];
      if (!meta)
        errors.push(
          `${id} / lead: "photo" "${team.lead.photo}" not found in photos/.`,
        );
      else
        checkPhotoDimensions(id, "lead", team.lead.photo, meta, errors, warnings);
    }
    if (team.coLead && team.coLead.photo) {
      const meta = photos[team.coLead.photo];
      if (!meta)
        errors.push(
          `${id} / coLead: "photo" "${team.coLead.photo}" not found in photos/.`,
        );
      else
        checkPhotoDimensions(id, "coLead", team.coLead.photo, meta, errors, warnings);
    }
    (team.members || []).forEach((person, i) => {
      if (person.photo) {
        const meta = photos[person.photo];
        if (!meta)
          errors.push(
            `${id} / member[${i}]: "photo" "${person.photo}" not found in photos/.`,
          );
        else
          checkPhotoDimensions(id, `member[${i}]`, person.photo, meta, errors, warnings);
      }
    });
  });

  return { errors, warnings };
}

export function prepareMembers(entries, { development = false, resolvePhoto = (name) => name } = {}) {
  const safeEntries = Array.isArray(entries) ? entries.filter((t) => t && typeof t === "object") : [];
  const hasReal = safeEntries.some((team) => team.placeholder !== true);

  return safeEntries
    .filter((team) => development || !hasReal || team.placeholder !== true)
    .map((team) => {
      const personOrFallback = (person) => {
        if (!person) return null;
        return {
          ...person,
          name: textOrFallback(person.name),
          role:
            typeof person.role === "string" && person.role.trim()
              ? person.role
              : null,
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
          photo: person.photo || null,
          photoSrc: person.photo ? resolvePhoto(person.photo) : null,
          isPlaceholder: person.placeholder === true,
        };
      };

      const lead = personOrFallback(team.lead) || { name: MISSING, role: null };
      const coLead = personOrFallback(team.coLead) || null;
      const members = Array.isArray(team.members)
        ? team.members.map(personOrFallback).filter(Boolean)
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

