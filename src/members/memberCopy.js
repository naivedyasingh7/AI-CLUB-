export const memberCopy = {
  board: "Board",
  lead: "Lead",
  coLead: "Co-lead",
  members: "Members",
  toBeAnnounced: "To be announced",
  noMembers: "No members listed yet.",
  branchYear: (branch, year) => {
    const parts = [branch, year].filter(Boolean);
    return parts.length ? parts.join(" · ") : "";
  },
  linkedin: (name) => `${name} on LinkedIn`,
  github: (name) => `${name} on GitHub`,
  external: "Opens in a new tab",
  details: "Details",
  collapse: "Collapse",
};
