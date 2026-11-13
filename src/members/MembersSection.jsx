import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitType from "split-type";
import { teams, board } from "./index.js";
import { memberCopy } from "./memberCopy.js";
import "./members.css";

const MISSING = memberCopy.toBeAnnounced;

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const initials = (name) => {
  const parts = (name || "")
    .split(/\s+/)
    .map((w) => w.replace(/[^A-Za-z]/g, ""))
    .filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const pad2 = (n) => String(n).padStart(2, "0");

/* ─── SVG Icons ──────────────────────────────────────────────────────────── */

const ExternalIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="12"
    height="12"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M18 13v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64c-.9 0-1.63.73-1.63 1.63s.73 1.63 1.63 1.63 1.63-.73 1.63-1.63-.73-1.63-1.63-1.63Z" />
  </svg>
);

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
    <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z" />
  </svg>
);

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function MembersSection() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === "undefined") return false;
    return matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const [openId, setOpenId] = useState(null);

  /* scroll / pin state */
  const activeIndexRef = useRef(0);
  const isPinnedRef = useRef(false);
  const triggerRef = useRef(null);

  /* DOM refs */
  const stageRef = useRef(null);
  const railContainerRef = useRef(null);
  const trackRef = useRef(null);
  const tablistRef = useRef(null);
  const tabRefs = useRef([]);
  const panelRef = useRef(null);
  const panelInnerRef = useRef(null);
  const detailRefs = useRef({});
  const prevOpenRef = useRef(null);

  /* leader name refs for SplitType reveal */
  const leadNameRef = useRef(null);
  const coLeadNameRef = useRef(null);
  const splitInstances = useRef([]);

  /* updateTabVisuals is set every render so GSAP onUpdate can call it without stale closure */
  const updateTabVisualsRef = useRef(null);

  const teamCount = teams.length;
  const lastIndex = Math.max(0, teamCount - 1);
  const team = teams[activeIndex] || null;

  /* ── reduced-motion listener ─────────────────────────────────────────── */
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);

  /* ── Escape closes disclosure ────────────────────────────────────────── */
  useEffect(() => {
    if (!openId) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpenId(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openId]);

  /* ── Disclosure animation ────────────────────────────────────────────── */
  useEffect(() => {
    const prev = prevOpenRef.current;
    if (prev && prev !== openId) {
      const el = detailRefs.current[prev];
      if (el) {
        gsap.to(el, {
          maxHeight: 0,
          opacity: 0,
          duration: reduced ? 0 : 0.25,
          onComplete: () => {
            el.style.display = "none";
          },
        });
      }
    }
    if (openId) {
      const el = detailRefs.current[openId];
      if (el) {
        el.style.display = "flex";
        gsap.fromTo(
          el,
          { maxHeight: 0, opacity: 0 },
          {
            maxHeight: Math.round(el.scrollHeight) + 32,
            opacity: 1,
            duration: reduced ? 0 : 0.35,
            ease: "power2.out",
          },
        );
      }
    }
    prevOpenRef.current = openId;
  }, [openId, reduced]);

  /* ── Tab scale/opacity gradient ────────────────────────────────────────── */
  const updateTabVisuals = (progress) => {
    tabRefs.current.forEach((tab, i) => {
      if (!tab) return;
      const dist = Math.abs(i - progress * Math.max(1, lastIndex));
      const t = Math.min(dist, 2.5) / 2.5;
      /* active: scale 1, opacity 1 — far: scale 0.58, opacity 0.22 */
      gsap.set(tab, {
        scale: 1 - 0.42 * t,
        opacity: 1 - 0.78 * t,
      });
    });
  };

  useEffect(() => {
    updateTabVisualsRef.current = updateTabVisuals;
  });

  /* ── Panel dropdown reveal + SplitType lead-name animation ──────────── */
  useEffect(() => {
    activeIndexRef.current = activeIndex;

    /* cleanup previous SplitType instances */
    splitInstances.current.forEach((s) => s?.revert());
    splitInstances.current = [];

    if (!reduced) {
      /* 1. Clip-path dropdown wipe on panel inner */
      if (panelInnerRef.current) {
        gsap.fromTo(
          panelInnerRef.current,
          { clipPath: "inset(0 0 100% 0 round 0px)", opacity: 0 },
          {
            clipPath: "inset(0 0 0% 0 round 0px)",
            opacity: 1,
            duration: 0.55,
            ease: "power3.out",
            overwrite: "auto",
          },
        );
      }

      /* 2. SplitType line-mask reveal for lead + co-lead names */
      [leadNameRef.current, coLeadNameRef.current]
        .filter(Boolean)
        .forEach((el, i) => {
          const split = new SplitType(el, { types: "chars" });
          splitInstances.current.push(split);
          gsap.fromTo(
            split.chars,
            { yPercent: 110 },
            {
              yPercent: 0,
              stagger: 0.022,
              duration: 0.65,
              delay: 0.1 + i * 0.08,
              ease: "power4.out",
              overwrite: "auto",
            },
          );
        });
    }

    /* Tab visuals (always, even with reduced motion — no transitions in CSS) */
    if (lastIndex > 0) {
      updateTabVisualsRef.current?.(activeIndex / lastIndex);
    } else {
      updateTabVisualsRef.current?.(0);
    }

    return () => {
      splitInstances.current.forEach((s) => s?.revert());
      splitInstances.current = [];
    };
  }, [activeIndex, reduced, lastIndex]);

  /* ── GSAP ScrollTrigger pinned horizontal scroll ─────────────────────── */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkShouldPin = () => {
      const isDesktop = window.innerWidth >= 768;
      const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      return isDesktop && !prefersReduced && teamCount > 1;
    };

    const ST = window.ScrollTrigger || ScrollTrigger;
    gsap.registerPlugin(ST);

    let st = null;

    const setupScrollTrigger = () => {
      if (st) {
        st.kill();
        st = null;
      }

      if (!stageRef.current || !trackRef.current || !railContainerRef.current) return;

      if (!checkShouldPin()) {
        isPinnedRef.current = false;
        triggerRef.current = null;
        if (trackRef.current) trackRef.current.style.transform = "";
        ST.refresh();
        if (window.ScrollTrigger && window.ScrollTrigger !== ST) window.ScrollTrigger.refresh();
        return;
      }

      isPinnedRef.current = true;

      const container = railContainerRef.current;
      const track = trackRef.current;
      const tabs = tabRefs.current.filter(Boolean);

      if (tabs.length < teamCount) return;

      const getTrackPositions = () => {
        const containerWidth = container.offsetWidth;
        const cx = containerWidth / 2;
        const firstTab = tabs[0];
        const lastTab = tabs[teamCount - 1];
        if (!firstTab || !lastTab) return { startX: 0, endX: 0 };
        const startX = cx - (firstTab.offsetLeft + firstTab.offsetWidth / 2);
        const endX = cx - (lastTab.offsetLeft + lastTab.offsetWidth / 2);
        return { startX, endX };
      };

      const { startX, endX } = getTrackPositions();
      const initialProgress = lastIndex > 0 ? activeIndexRef.current / lastIndex : 0;
      gsap.set(track, { x: startX + initialProgress * (endX - startX) });

      /* also apply initial tab visuals */
      updateTabVisualsRef.current?.(initialProgress);

      const scrollDistance = (teamCount - 1) * Math.max(500, Math.round(window.innerHeight * 0.75));

      st = ST.create({
        trigger: stageRef.current,
        pin: true,
        start: "top top",
        end: () => `+=${scrollDistance}`,
        scrub: 0.4,
        snap: {
          snapTo: 1 / (teamCount - 1),
          duration: { min: 0.15, max: 0.35 },
          delay: 0.05,
          ease: "power1.inOut",
        },
        onUpdate: (self) => {
          const { startX: sX, endX: eX } = getTrackPositions();
          const curX = sX + self.progress * (eX - sX);
          gsap.set(track, { x: curX });

          /* per-tab scale/opacity gradient */
          updateTabVisualsRef.current?.(self.progress);

          const idx = Math.min(lastIndex, Math.max(0, Math.round(self.progress * lastIndex)));
          if (idx !== activeIndexRef.current) {
            activeIndexRef.current = idx;
            setActiveIndex(idx);
          }
        },
        onRefresh: () => {
          const { startX: sX, endX: eX } = getTrackPositions();
          if (st) {
            const curX = sX + st.progress * (eX - sX);
            gsap.set(track, { x: curX });
            updateTabVisualsRef.current?.(st.progress);
          }
        },
      });

      triggerRef.current = st;

      ST.refresh();
      if (window.ScrollTrigger && window.ScrollTrigger !== ST) {
        window.ScrollTrigger.refresh();
      }
    };

    const timer = setTimeout(setupScrollTrigger, 120);

    const onResize = () => setupScrollTrigger();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      if (st) {
        st.kill();
        st = null;
      }
      triggerRef.current = null;
      isPinnedRef.current = false;
      ST.refresh();
      if (window.ScrollTrigger && window.ScrollTrigger !== ST) {
        window.ScrollTrigger.refresh();
      }
    };
  }, [teamCount, lastIndex, reduced]);

  /* ── Controls ─────────────────────────────────────────────────────────── */

  const selectTeam = (index, userInitiated = true) => {
    if (index < 0 || index >= teamCount) return;
    setOpenId(null);
    setActiveIndex(index);
    activeIndexRef.current = index;

    if (userInitiated) {
      if (isPinnedRef.current && triggerRef.current && lastIndex > 0) {
        const trigger = triggerRef.current;
        const progress = index / lastIndex;
        const targetY = trigger.start + progress * (trigger.end - trigger.start);
        window.scrollTo({ top: targetY, behavior: reduced ? "auto" : "smooth" });
      } else {
        const tabEl = tabRefs.current[index];
        if (tabEl) {
          tabEl.scrollIntoView({ block: "nearest", inline: "center", behavior: reduced ? "auto" : "smooth" });
        }
      }
    }

    const currentTab = tabRefs.current[index];
    if (currentTab) currentTab.focus({ preventScroll: true });
  };

  const move = (delta) => selectTeam(activeIndex + delta, true);

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
        selectTeam(0, true);
        break;
      case "End":
        e.preventDefault();
        selectTeam(lastIndex, true);
        break;
      default:
    }
  };

  const togglePerson = (id) => setOpenId((prev) => (prev === id ? null : id));

  /* ── Render helpers ───────────────────────────────────────────────────── */

  /* Board member card (Change 2: photos, no dropdown) */
  const renderBoardMember = (member) => {
    const photoUrl = member.photoSrc;
    const name = member.name || MISSING;
    const designation = member.designation || "";
    const altText = `${name} - ${designation}`;

    return (
      <div key={member.id} className="members-board-card">
        <div className="members-board-photo-wrap">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={altText}
              width={400}
              height={500}
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : null}
          <div className="members-board-avatar" aria-hidden="true">
            {initials(name)}
          </div>
        </div>
        <div className="members-board-info">
          <div className="members-board-name">{name}</div>
          <div className="members-board-designation">{designation}</div>
          {(member.linkedin || member.github) && (
            <div className="members-board-links">
              {member.linkedin && (
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={memberCopy.linkedin(name)}
                  className="members-board-link"
                >
                  <LinkedInIcon />
                </a>
              )}
              {member.github && (
                <a
                  href={member.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={memberCopy.github(name)}
                  className="members-board-link"
                >
                  <GitHubIcon />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  /* Detail rows shared between leader and directory items */
  const renderPersonDetails = (person) => {
    const name = person.name || MISSING;
    const by = memberCopy.branchYear(person.branch, person.year);
    return (
      <div
        ref={(el) => {
          detailRefs.current[person.id] = el;
        }}
        id={`members-details-${person.id}`}
        className="members-expanded"
        role="region"
        aria-labelledby={`members-trigger-${person.id}`}
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
              <a href={person.linkedin} target="_blank" rel="noopener noreferrer" aria-label={memberCopy.linkedin(name)}>
                LinkedIn <ExternalIcon />
              </a>
            )}
            {person.github && (
              <a href={person.github} target="_blank" rel="noopener noreferrer" aria-label={memberCopy.github(name)}>
                GitHub <ExternalIcon />
              </a>
            )}
          </div>
        )}
      </div>
    );
  };

  /* Leader block: large name with SplitType reveal, expandable details */
  const renderLeader = (person, roleLabel, isLead) => {
    if (!person) return null;
    const isOpen = openId === person.id;
    const name = person.name || MISSING;
    const by = memberCopy.branchYear(person.branch, person.year);
    const hasDetails = Boolean(by || person.bio || person.linkedin || person.github);

    return (
      <div className="members-leader" key={person.id}>
        <span className="members-leader-label">{roleLabel}</span>
        {hasDetails ? (
          <button
            type="button"
            id={`members-trigger-${person.id}`}
            className="members-leader-trigger"
            aria-expanded={isOpen}
            aria-controls={`members-details-${person.id}`}
            onClick={() => togglePerson(person.id)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpenId(null);
            }}
          >
            <span
              className="members-leader-name"
              ref={isLead ? leadNameRef : coLeadNameRef}
            >
              {name}
            </span>
            <span className="members-leader-chevron" aria-hidden="true">
              {isOpen ? "↑" : "↓"}
            </span>
          </button>
        ) : (
          <span
            className="members-leader-name"
            ref={isLead ? leadNameRef : coLeadNameRef}
          >
            {name}
          </span>
        )}
        {hasDetails && renderPersonDetails(person)}
      </div>
    );
  };

  /* Directory item: flat list row with right-side meta, expandable */
  const renderDirItem = (person) => {
    if (!person) return null;
    const isOpen = openId === person.id;
    const name = person.name || MISSING;
    const by = memberCopy.branchYear(person.branch, person.year);
    const hasDetails = Boolean(by || person.bio || person.linkedin || person.github);

    return (
      <div className="members-dir-item" key={person.id}>
        <button
          type="button"
          id={`members-trigger-${person.id}`}
          className="members-dir-trigger"
          aria-expanded={hasDetails ? isOpen : undefined}
          aria-controls={hasDetails ? `members-details-${person.id}` : undefined}
          disabled={!hasDetails}
          onClick={() => {
            if (!hasDetails) return;
            togglePerson(person.id);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpenId(null);
          }}
        >
          <span className="members-dir-name">{name}</span>
          {by && <span className="members-dir-meta">{by}</span>}
          {hasDetails && (
            <span className="members-dir-chevron" aria-hidden="true">
              {isOpen ? "↑" : "↓"}
            </span>
          )}
        </button>
        {hasDetails && renderPersonDetails(person)}
      </div>
    );
  };

  /* ── Empty guard ──────────────────────────────────────────────────────── */
  if (teamCount === 0 && (!board || board.length === 0)) {
    return (
      <section className="members-section">
        <p>{memberCopy.noMembers}</p>
      </section>
    );
  }

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <section className="members-section">

      {/* ── Board section (normal page flow) ─────────────────────────── */}
      {board && board.length > 0 && (
        <div className="members-board-section">
          <div className="members-board-header">
            <h2 className="members-board-title">{memberCopy.board}</h2>
            <p className="members-board-subtitle">Executive leadership</p>
          </div>
          <div className="members-board-grid">
            {board.map((member) => renderBoardMember(member))}
          </div>
        </div>
      )}

      {/* ── Pinned team stage ─────────────────────────────────────────── */}
      {teamCount > 0 && (
        <div className="members-stage" ref={stageRef}>

          {/* Stage header: counter + nav buttons — absolute top-right */}
          <div className="members-stage-header" aria-hidden="true">
            <span className="members-stage-counter">
              {pad2(activeIndex + 1)} / {pad2(teamCount)}
            </span>
            <button
              type="button"
              aria-label="Previous team"
              disabled={activeIndex <= 0}
              className="members-stage-nav-btn"
              onClick={() => move(-1)}
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Next team"
              disabled={activeIndex >= lastIndex}
              className="members-stage-nav-btn"
              onClick={() => move(1)}
            >
              →
            </button>
          </div>

          {/* Rail — overflow:hidden container, GSAP-translated track */}
          <div className="members-rail-outer" ref={railContainerRef}>
            <div className="members-rail-track" ref={trackRef}>
              <nav
                role="tablist"
                aria-label="Teams"
                ref={tablistRef}
                onKeyDown={onTabListKeyDown}
                className="members-tablist"
              >
                {teams.map((t, index) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    ref={(el) => { tabRefs.current[index] = el; }}
                    id={`members-tab-${t.id}`}
                    aria-controls={`members-panel-${t.id}`}
                    aria-selected={index === activeIndex}
                    tabIndex={index === activeIndex ? 0 : -1}
                    className="members-tab"
                    onClick={() => selectTeam(index, true)}
                  >
                    {t.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Thin rule between rail and panel */}
          <div className="members-panel-divider" aria-hidden="true" />

          {/* Panel — the dropdown reveal area */}
          <div
            className="members-panel"
            ref={panelRef}
            role="tabpanel"
            id={`members-panel-${team?.id}`}
            aria-labelledby={`members-tab-${team?.id}`}
          >
            <div className="members-panel-scroll">
              <div className="members-panel-inner" ref={panelInnerRef}>
                {team ? (
                  <>
                    {/* Leaders side-by-side */}
                    {(team.lead || team.coLead) && (
                      <div className="members-leaders">
                        {renderLeader(team.lead, memberCopy.lead, true)}
                        {renderLeader(team.coLead, memberCopy.coLead, false)}
                      </div>
                    )}

                    {/* Member directory */}
                    {team.members && team.members.length > 0 && (
                      <div className="members-directory">
                        <div className="members-dir-header">
                          {memberCopy.members} · {team.members.length}
                        </div>
                        <div className="members-dir-list">
                          {team.members.map((p) => renderDirItem(p))}
                        </div>
                      </div>
                    )}

                    {!team.lead && !team.coLead && (!team.members || !team.members.length) && (
                      <p className="members-empty">{memberCopy.noMembers}</p>
                    )}
                  </>
                ) : (
                  <p className="members-empty">{memberCopy.noMembers}</p>
                )}
              </div>
            </div>
          </div>

          {/* Progress dots */}
          <div className="members-progress" aria-hidden="true">
            {teams.map((t, i) => (
              <button
                key={t.id}
                type="button"
                className={`members-progress-dot${i === activeIndex ? " is-active" : ""}`}
                onClick={() => selectTeam(i, true)}
                tabIndex={-1}
                aria-label={`Go to team ${t.name}`}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
