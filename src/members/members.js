// AI Club team roster.
//
// Edit only this file. Put portrait photos in src/members/photos/ and reference
// them by filename only (for example `photo: "alice.webp"`). Do not invent real
// names, bios or social links; use "(TBA)" placeholders until details exist.
//
// Placeholder behaviour: teams and people marked `placeholder: true` show in
// development. In production they disappear once at least one real team exists;
// if every team is a placeholder they remain so the section is never empty.

/* TEMPLATE: copy this object into the teams array below, including the trailing comma.
{
  id: "technical",                 // REQUIRED: unique lowercase id; never reuse it.
  name: "Technical",               // REQUIRED: team name shown in the rail and panel.
  tagline: "Core models and research.", // Optional short line under the name.
  lead: {                          // Optional; omitted = "To be announced".
    id: "technical-lead",
    name: "Lead (TBA)",
    role: "Team Lead",
    placeholder: true,
  },
  coLead: {                        // Optional; may be absent entirely.
    id: "technical-co-lead",
    name: "Co-lead (TBA)",
    role: "Co-lead",
    placeholder: true,
  },
  members: [                       // Remaining members below Lead/Co-lead.
    {
      id: "technical-member-1",
      name: "Member (TBA)",
      role: "Member",
      photo: "member-1.webp",      // Optional filename from photos/; no paths.
      branch: "CSE",               // Optional.
      year: "2nd year",            // Optional.
      bio: "",                     // Optional short paragraph.
      linkedin: "",                // Optional https://linkedin.com/in/... only.
      github: "",                  // Optional https://github.com/... only.
      placeholder: true,
    },
  ],
  placeholder: false,              // Optional: true = development preview team.
},
*/

export const teams = [
  {
    id: "technical",
    name: "Technical",
    tagline: "Core models and research.",
    lead: {
      id: "technical-lead",
      name: "Lead (TBA)",
      role: "Team Lead",
      placeholder: true,
    },
    coLead: {
      id: "technical-co-lead",
      name: "Co-lead (TBA)",
      role: "Co-lead",
      placeholder: true,
    },
    members: [
      {
        id: "technical-member-1",
        name: "Member (TBA)",
        role: "Member",
        photo: "sample.png",
        placeholder: true,
      },
    ],
    placeholder: true,
  },
  {
    id: "web-development",
    name: "Web Development",
    tagline: "Sites, dashboards and club tooling.",
    lead: {
      id: "web-development-lead",
      name: "Lead (TBA)",
      role: "Team Lead",
      placeholder: true,
    },
    members: [
      {
        id: "web-development-member-1",
        name: "Member (TBA)",
        role: "Member",
        placeholder: true,
      },
    ],
    placeholder: true,
  },
  {
    id: "design",
    name: "Design",
    tagline: "Visual identity and prototypes.",
    lead: {
      id: "design-lead",
      name: "Lead (TBA)",
      role: "Team Lead",
      placeholder: true,
    },
    coLead: {
      id: "design-co-lead",
      name: "Co-lead (TBA)",
      role: "Co-lead",
      placeholder: true,
    },
    members: [],
    placeholder: true,
  },
  {
    id: "pr",
    name: "PR",
    tagline: "Outreach and communications.",
    lead: {
      id: "pr-lead",
      name: "Lead (TBA)",
      role: "Team Lead",
      placeholder: true,
    },
    members: [],
    placeholder: true,
  },
  {
    id: "event-management",
    name: "Event Management",
    tagline: "Meetups, workshops and demos.",
    lead: {
      id: "event-management-lead",
      name: "Lead (TBA)",
      role: "Team Lead",
      placeholder: true,
    },
    coLead: {
      id: "event-management-co-lead",
      name: "Co-lead (TBA)",
      role: "Co-lead",
      placeholder: true,
    },
    members: [
      {
        id: "event-management-member-1",
        name: "Member (TBA)",
        role: "Member",
        placeholder: true,
      },
      {
        id: "event-management-member-2",
        name: "Member (TBA)",
        role: "Member",
        placeholder: true,
      },
    ],
    placeholder: true,
  },
];
