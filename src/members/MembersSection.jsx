import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { teams } from "./index.js";
import { memberCopy } from "./memberCopy.js";
import "./members.css";

const MISSING = memberCopy.toBeAnnounced;

// First letter(s) of a name for the initial avatar. Punctuation is ignored so
// "Lead (TBA)" becomes "LT" and "Member (TBA)" becomes "MT".
const initials = (name) => {
  const parts = (name || "")
    .split(/\s+/)
    .map((w) => w.replace(/[^A-Za-z]/g, ""))
    .filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const ExternalIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
    dangerouslySetInnerHTML={{
      __html:
        '<path d="M18 13v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h6l12 12z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
    }}
  />
);

export default function MembersSection() {
  const [reduced, setReduced] = useState(() =>
    matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [openId, setOpenId] = useState(null);
  const [skipClick, setSkipClick] = useState(false);

  const tablistRef = useRef(null);
  const railRef = useRef(null);
  const panelRef = useRef(null);
  const tabRefs = useRef([]);
  const detailRefs = useRef({});
  const prevOpenRef = useRef(null);
  const dragRef = useRef({ active: false, x: 0, scrollLeft: 0, pointerId: 0 });

  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);

  useEffect(() => {
    if (!openId) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpenId(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openId]);

  useEffect(() => {
    if (reduced || !panelRef.current) return;
    gsap.fromTo(
      panelRef.current,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" },
    );
  }, [activeIndex, reduced]);

  useEffect(() => {
    const prev = prevOpenRef.current;
    if (prev && prev !== openId) {
      const el = detailRefs.current[prev];
      if (el)
        gsap.to(el, {
          maxHeight: 0,
          opacity: 0,
          duration: reduced ? 0 : 0.25,
          onComplete: () => {
            el.style.display = "none";
          },
        });
    }
    if (openId) {
      const el = detailRefs.current[openId];
      if (el) {
        el.style.display = "block";
        gsap.to(el, {
          maxHeight: Math.round(el.scrollHeight) + 24,
          opacity: 1,
          duration: reduced ? 0 : 0.35,
          ease: "power2.out",
        });
      }
    }
    prevOpenRef.current = openId;
  }, [openId, reduced]);

  const teamCount = teams.length;
  const team = teams[activeIndex] || null;
  const lastIndex = teamCount - 1;

  const selectTeam = (index) => {
    if (index < 0 || index >= teamCount) return;
    setOpenId(null);
    setActiveIndex(index);
    const el = tabRefs.current[index];
    if (el) {
      el.focus({ preventScroll: false });
      el.scrollIntoView({
        block: "nearest",
        inline: "center",
        behavior: reduced ? "auto" : "smooth",
      });
    }
  };

  const move = (delta) => selectTeam(activeIndex + delta);

  const onTabListKeyDown = (e) => {
    if (e.target.closest("[role=tab]") === null) return;
    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        move(1);
        break;
      case "ArrowLeft":
        e.preventDefault();
        move(-1);
        break;
      case "Home":
        e.preventDefault();
        selectTeam(0);
        break;
      case "End":
        e.preventDefault();
        selectTeam(lastIndex);
        break;
      default:
    }
  };

  const togglePerson = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };
  /* ---------- Rail drag (mouse) ---------- */

  const onDragStart = (e) => {
    if (e.button !== 0 || !railRef.current) return;
    dragRef.current.active = true;
    dragRef.current.pointerId = e.pointerId;
    dragRef.current.x = e.clientX;
    dragRef.current.scrollLeft = railRef.current.scrollLeft;
    setSkipClick(false);
    railRef.current.setPointerCapture(e.pointerId);
    window.addEventListener("pointermove", onDragMove);
    window.addEventListener("pointerup", onDragEnd);
  };

  const onDragMove = (e) => {
    if (!dragRef.current.active || !railRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    if (Math.abs(dx) > 6) setSkipClick(true);
    railRef.current.scrollLeft = dragRef.current.scrollLeft - dx;
  };

  const onDragEnd = () => {
    dragRef.current.active = false;
    if (railRef.current) {
      try {
        railRef.current.releasePointerCapture(dragRef.current.pointerId);
      } catch {}
    }
    window.removeEventListener("pointermove", onDragMove);
    window.removeEventListener("pointerup", onDragEnd);
  };

  /* ---------- Person rendering ---------- */

  const renderPerson = (person, isLead = false) => {
    const isOpen = openId === person.id;
    const photoUrl = person.photoSrc;
    const name = person.name || MISSING;
    const role = person.role || "";
    const by = memberCopy.branchYear(person.branch, person.year);

    return (
      <div
        key={person.id}
        className={`members-person ${isLead ? "members-lead-card" : ""}`}
      >
        <button
          className="members-person-trigger"
          aria-expanded={isOpen}
          aria-controls={`members-details-${person.id}`}
          id={`members-trigger-${person.id}`}
          onClick={() => {
            if (skipClick) return;
            togglePerson(person.id);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpenId(null);
          }}
        >
          <div className="members-person-photo-wrap">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt=""
                width={isLead ? 72 : 56}
                height={isLead ? 72 : 56}
                loading="lazy"
                decoding="async"
                onLoad={(ev) => {
                  ev.currentTarget
                    .closest(".members-person-photo-wrap")
                    .classList.add("loaded");
                }}
                onError={(ev) => {
                  ev.currentTarget
                    .closest(".members-person-photo-wrap")
                    .classList.add("loaded");
                }}
              />
            ) : null}
            <div className="members-person-avatar">{initials(name)}</div>
          </div>
          <div className="members-person-text">
            <div className="members-person-name">{name}</div>
            <div className="members-person-role">{role}</div>
          </div>
          <span className="members-person-more" aria-hidden="true">
            {isOpen ? "▲" : "▼"}
          </span>
        </button>

        <div
          ref={(el) => {
            detailRefs.current[person.id] = el;
          }}
          id={`members-details-${person.id}`}
        >
          {by && (
            <div className="members-detail-row">
              <span className="label">Branch · Year</span>
              <span className="value">{by}</span>
            </div>
          )}
          {person.bio && (
            <div className="members-detail-row">
              <span className="label">About</span>
              <span className="value bio">{person.bio}</span>
            </div>
          )}
          {(person.linkedin || person.github) && (
            <div className="members-detail-links">
              {person.linkedin && (
                <a
                  href={person.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={memberCopy.linkedin(name)}
                >
                  LinkedIn<ExternalIcon />
                </a>
              )}
              {person.github && (
                <a
                  href={person.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={memberCopy.github(name)}
                >
                  GitHub<ExternalIcon />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderGroup = (label, person, isLead) => {
    if (!person) return null;
    return (
      <div className="members-role-group">
        <span className="members-role-label">{label}</span>
        <div className={isLead ? "members-lead-row" : "members-people"}>
          {renderPerson(person, isLead)}
        </div>
      </div>
    );
  };

  /* ---------- Mount ---------- */

  if (teamCount === 0) {
    return (
      <section className="members-section">
        <p>{memberCopy.noMembers}</p>
      </section>
    );
  }

  return (
    <section className="members-section">
      <div className="members-rail-wrap">
        <div className="members-rail" ref={railRef} onPointerDown={onDragStart}>
          <nav
            role="tablist"
            aria-label="Teams"
            ref={tablistRef}
            onKeyDown={onTabListKeyDown}
          >
          {teams.map((team, index) => (
            <button
              key={team.id}
              role="tab"
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              id={`members-tab-${team.id}`}
              aria-controls={`members-panel-${team.id}`}
              aria-selected={index === activeIndex}
              tabIndex={index === activeIndex ? 0 : -1}
              className="members-tab"
              onClick={() => {
                if (skipClick) return;
                selectTeam(index);
              }}
            >
              {team.name}
            </button>
          ))}
        </nav>
        </div>
        <div className="members-nav">
          <button
            aria-label="Previous team"
            disabled={activeIndex <= 0}
            onClick={() => move(-1)}
          >
            ←
          </button>
          <span className="members-nav-count" aria-hidden="true">
            {activeIndex + 1} of {teamCount}
          </span>
          <button
            aria-label="Next team"
            disabled={activeIndex >= lastIndex}
            onClick={() => move(1)}
          >
            →
          </button>
        </div>
      </div>

      <div
        className="members-panel"
        ref={panelRef}
        role="tabpanel"
        aria-labelledby={`members-tab-${team.id}`}
      >
        {team ? (
          <>
            <h2 className="members-team-name" id={`members-panel-${team.id}`}>
              {team.name}
            </h2>
            {team.tagline && <p className="members-tagline">{team.tagline}</p>}
            <p className="members-count">
              {team.memberCount} member{team.memberCount !== 1 ? "s" : ""}
            </p>
            <hr className="members-divider" />
            {renderGroup(memberCopy.lead, team.lead, true)}
            {renderGroup(memberCopy.coLead, team.coLead, false)}
            <div className="members-role-group">
              <span className="members-role-label">{memberCopy.members}</span>
              <div className="members-people">
                {team.members.map((person) => renderPerson(person))}
              </div>
            </div>
            {(!team.lead && !team.coLead && team.members.length === 0) && (
              <p>{memberCopy.noMembers}</p>
            )}
          </>
        ) : (
          <p>{memberCopy.noMembers}</p>
        )}
      </div>
    </section>
  );
}

