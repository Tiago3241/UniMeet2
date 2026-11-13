/**
 * Navigation shell (Landing header/footer + Dashboard desktop sidebar & mobile top/bottom bars),
 * shared current-user session state, Public Profile modal, and Safety Block/Report modal helpers.
 */
import { API, getFallbackToken, setFallbackToken } from "./api.js";
import { CONFIG } from "./config.js";
import { escapeHtml, getCookie, getInitials, openModal, qs, showToast } from "./utils.js";

export const NAV_ITEMS = [
  { id: "discover", label: "Discover", href: "discover.html", icon: "compass" },
  { id: "events", label: "Events", href: "events.html", icon: "calendar" },
  { id: "groups", label: "Groups", href: "groups.html", icon: "users" },
  { id: "matches", label: "Matches", href: "matches.html", icon: "heart" },
  { id: "messages", label: "Messages", href: "messages.html", icon: "message" },
  { id: "profile", label: "Profile", href: "profile.html", icon: "user" },
  { id: "settings", label: "Settings", href: "settings.html", icon: "settings" },
];

export const MOBILE_NAV_ITEMS = [
  { id: "discover", label: "Discover", href: "discover.html", icon: "compass" },
  { id: "events", label: "Events", href: "events.html", icon: "calendar" },
  { id: "groups", label: "Groups", href: "groups.html", icon: "users" },
  { id: "messages", label: "Messages", href: "messages.html", icon: "message" },
  { id: "profile", label: "Profile", href: "profile.html", icon: "user" },
];

const ICONS = {
  compass:
    '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>',
  calendar:
    '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  users:
    '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  heart:
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  message:
    '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  user:
    '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  settings:
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.79 1 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  plus:
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
};

let cachedUserPromise = null;

export async function getCurrentUser(forceRefresh = false) {
  if (!forceRefresh && !getCookie("unimeet_csrf_token") && !getFallbackToken()) {
    return null;
  }
  if (!cachedUserPromise || forceRefresh) {
    cachedUserPromise = API.me({ skipAuthRedirect: true }).catch(() => null);
  }
  return cachedUserPromise;
}

export async function requireAuthenticatedUser() {
  const user = await getCurrentUser(true);
  if (!user) {
    showToast("Please sign in to access this page.", "info");
    window.location.href = "login.html";
    return null;
  }
  return user;
}

export function renderHobbyTags(hobbies, maxVisible = 3) {
  if (!Array.isArray(hobbies) || !hobbies.length) return "";
  const shown = maxVisible > 0 ? hobbies.slice(0, maxVisible) : hobbies;
  const remaining = maxVisible > 0 ? Math.max(0, hobbies.length - maxVisible) : 0;
  const tagsHtml = shown
    .map((h) => `<span class="hobby-tag">${escapeHtml(h)}</span>`)
    .join("");
  const moreHtml = remaining > 0 ? `<span class="hobby-tag-more">+${remaining} more</span>` : "";
  return `${tagsHtml}${moreHtml}`;
}

export async function openPublicProfileModal(userIdOrObj) {
  let profile = typeof userIdOrObj === "object" ? userIdOrObj : null;
  if (typeof userIdOrObj === "number" || (profile && profile.id)) {
    const uid = typeof userIdOrObj === "number" ? userIdOrObj : profile.id;
    try {
      profile = await API.getUserProfile(uid);
    } catch {
      if (!profile) {
        showToast("Could not load public profile.", "error");
        return;
      }
    }
  }
  if (!profile) return;

  const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.username;
  const hobbiesHtml =
    Array.isArray(profile.hobbies) && profile.hobbies.length
      ? `
        <div style="margin-top:1rem;">
          <h3 style="margin-bottom:0.45rem;">Hobbies</h3>
          <div class="hobby-tag-list">${renderHobbyTags(profile.hobbies, 0)}</div>
        </div>
      `
      : "";

  const interestsText =
    Array.isArray(profile.interests) && profile.interests.length
      ? profile.interests.map((i) => i.name).join(" · ")
      : "No interests listed yet";

  openModal({
    title: `${fullName}'s Public Profile`,
    bodyHtml: `
      <div>
        <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem;">
          <div class="avatar-circle avatar-lg">${escapeHtml(getInitials(profile.first_name, profile.last_name))}</div>
          <div>
            <h2 style="margin-bottom:0.2rem;">${escapeHtml(fullName)}${profile.age ? `, ${profile.age}` : ""}</h2>
            <div class="muted-small">@${escapeHtml(profile.username)} · ${profile.is_verified ? "Verified student" : "Email account"}</div>
            <div class="muted-small">${escapeHtml(profile.university || "Open student community")}${profile.city ? ` · ${escapeHtml(profile.city)}` : ""}</div>
          </div>
        </div>
        ${
          profile.compatibility
            ? `
          <div style="padding:0.85rem 1rem;border-radius:var(--radius-md);background:var(--color-primary-tint);border:1px solid var(--color-border);margin-bottom:1rem;">
            <strong class="tabular-num" style="color:var(--color-primary);">${profile.compatibility.compatibility}% compatibility</strong>
            <p class="muted-small" style="margin-top:0.25rem;">${escapeHtml(profile.compatibility.explanation)}</p>
          </div>
        `
            : ""
        }
        <p>${escapeHtml(profile.bio || "Looking forward to concerts, films, and local campus outings.")}</p>
        ${hobbiesHtml}
        <div style="margin-top:1rem;">
          <h3 style="margin-bottom:0.35rem;">Interests</h3>
          <p class="muted-small">${escapeHtml(interestsText)}</p>
        </div>
      </div>
    `,
  });
}

export function renderLandingHeader(user) {
  const header = qs("#site-header");
  if (!header) return;

  header.innerHTML = `
    <div class="top-bar container">
      <a href="index.html" class="brand-wordmark">
        <img src="assets/icons/unimeet-logo.svg" alt="" width="28" height="28">
        <span>UniMeet</span>
      </a>
      <nav class="top-bar-links" aria-label="Landing navigation">
        <a href="#how-it-works">How it works</a>
        <a href="#features">Features</a>
        <a href="#safety">Safety</a>
        <a href="events.html">Events</a>
      </nav>
      <div class="top-bar-action">
        ${
          user
            ? `<a href="discover.html" class="btn btn-primary">Open App</a>`
            : `<a href="events.html" class="btn btn-primary">Explore events</a>`
        }
      </div>
    </div>
  `;

  const footer = qs("#site-footer");
  if (footer) {
    footer.innerHTML = `
      <div class="container footer-inner">
        <div class="footer-brand">
          <a href="index.html" class="brand-wordmark">
            <img src="assets/icons/unimeet-logo.svg" alt="" width="24" height="24">
            <span>UniMeet</span>
          </a>
          <p class="muted-small" style="margin-top:0.4rem;">Built for students in Timisoara and beyond. Real outings with compatible people.</p>
        </div>
        <div class="footer-links">
          <a href="events.html">Browse events</a>
          <a href="discover.html">Discover</a>
          <a href="settings.html">Settings</a>
          <a href="login.html">Log in</a>
          <a href="register.html">Create account</a>
        </div>
      </div>
    `;
  }
}

export function renderDashboardShell(user) {
  const sidebar = qs("#app-sidebar");
  const bottomNav = qs("#mobile-bottom-nav");
  const activePage = document.body?.dataset?.page || "";

  if (sidebar) {
    const navLinks = NAV_ITEMS.map(
      (item) => `
      <a href="${item.href}" class="sidebar-link ${activePage === item.id ? "is-active" : ""}">
        ${ICONS[item.icon] || ""}
        <span>${item.label}</span>
      </a>
    `
    ).join("");

    const userCard = user
      ? `
      <div class="sidebar-user">
        <div class="avatar-circle">${escapeHtml(getInitials(user.first_name, user.last_name))}</div>
        <div class="sidebar-user-meta">
          <strong class="truncate">${escapeHtml(user.first_name)} ${escapeHtml(user.last_name)}</strong>
          <span class="muted-small truncate">${escapeHtml(user.university || user.city || `@${user.username}`)}</span>
        </div>
        <button type="button" class="btn-text-danger" id="logout-btn">Sign out</button>
      </div>
    `
      : `
      <div class="sidebar-user">
        <a href="login.html" class="btn btn-secondary btn-full">Sign in</a>
      </div>
    `;

    sidebar.innerHTML = `
      <div class="sidebar-inner">
        <a href="index.html" class="brand-wordmark">
          <img src="assets/icons/unimeet-logo.svg" alt="" width="28" height="28">
          <span>UniMeet</span>
        </a>
        <a href="create-event.html" class="btn btn-primary btn-full sidebar-cta">Create an outing</a>
        <nav class="sidebar-nav" aria-label="Dashboard sections">${navLinks}</nav>
        ${userCard}
      </div>
    `;

    const logoutBtn = qs("#logout-btn", sidebar);
    if (logoutBtn) {
      logoutBtn.addEventListener("click", handleLogout);
    }
  }

  // Mobile compact top bar with quick 44px links for Matches, Settings, and Create Outing
  const appMain = qs("#main-content");
  if (appMain && !qs(".mobile-top-bar")) {
    const pageTitle = document.title.split("—")[0].trim() || "UniMeet";
    const mobileHeader = document.createElement("header");
    mobileHeader.className = "mobile-top-bar";
    mobileHeader.innerHTML = `
      <div class="mobile-top-left">
        <a href="index.html" class="brand-wordmark" aria-label="UniMeet home">
          <img src="assets/icons/unimeet-logo.svg" alt="" width="24" height="24">
        </a>
        <span class="mobile-page-title truncate">${escapeHtml(pageTitle)}</span>
      </div>
      <div class="mobile-top-actions">
        <a href="matches.html" class="mobile-icon-link ${activePage === "matches" ? "is-active" : ""}" aria-label="Matches" title="Matches">
          ${ICONS.heart}
        </a>
        <a href="settings.html" class="mobile-icon-link ${activePage === "settings" ? "is-active" : ""}" aria-label="Settings" title="Settings">
          ${ICONS.settings}
        </a>
        <a href="create-event.html" class="mobile-icon-link ${activePage === "create-event" ? "is-active" : ""}" aria-label="Create outing" title="Create outing">
          ${ICONS.plus}
        </a>
      </div>
    `;
    appMain.prepend(mobileHeader);
  }

  if (bottomNav) {
    bottomNav.innerHTML = MOBILE_NAV_ITEMS.map(
      (item) => `
      <a href="${item.href}" class="bottom-nav-link ${activePage === item.id ? "is-active" : ""}">
        ${ICONS[item.icon] || ""}
        <span>${item.label}</span>
      </a>
    `
    ).join("");
  }
}

async function handleLogout() {
  try {
    await API.logout();
  } catch {
    // Clear local state regardless
  }
  setFallbackToken("");
  showToast("Signed out.", "success");
  window.location.href = "login.html";
}

export function openSafetyModal(targetUser, onBlocked) {
  const fullName = `${targetUser.first_name || ""} ${targetUser.last_name || ""}`.trim() || targetUser.username;
  const reasonsOptions = CONFIG.REPORT_REASONS.map(
    (r) => `<option value="${escapeHtml(r.value)}">${escapeHtml(r.label)}</option>`
  ).join("");

  openModal({
    title: `Safety options for ${fullName}`,
    bodyHtml: `
      <div class="safety-modal-stack">
        <div class="safety-tips-box">
          <h3>Safe meeting reminders</h3>
          <p style="margin-bottom:0;">Always choose public campus or city-center venues for a first meetup, let a friend know where you are going, and keep chats inside UniMeet until you feel comfortable.</p>
        </div>

        <form id="safety-report-form" class="stack-form">
          <h3>Report ${escapeHtml(fullName)}</h3>
          <div class="field">
            <label for="report-reason">Reason</label>
            <select id="report-reason" required>${reasonsOptions}</select>
          </div>
          <div class="field">
            <label for="report-desc">Details (optional)</label>
            <textarea id="report-desc" rows="3" maxlength="1500" placeholder="Describe what happened so moderators can review..."></textarea>
          </div>
          <button type="submit" class="btn btn-secondary">Submit report</button>
        </form>

        <div class="divider-line"></div>

        <div class="safety-block-zone">
          <h3>Block ${escapeHtml(fullName)}</h3>
          <p class="muted-small" style="margin-bottom:0.75rem;">Blocking hides you from each other across discovery, groups, solo posts, and messaging. You can manage blocked accounts later in Profile.</p>
          <button type="button" class="btn btn-danger" id="confirm-block-btn">Block user</button>
        </div>
      </div>
    `,
    onMount: (root, close) => {
      qs("#safety-report-form", root).addEventListener("submit", async (ev) => {
        ev.preventDefault();
        const reason = qs("#report-reason", root).value;
        const description = qs("#report-desc", root).value.trim();
        try {
          await API.reportUser({
            reported_user_id: targetUser.id,
            reason,
            description: description || null,
          });
          showToast("Report submitted for moderation review.", "success");
          close();
        } catch (err) {
          showToast(err.message, "error");
        }
      });

      const blockBtn = qs("#confirm-block-btn", root);
      blockBtn.addEventListener("click", async () => {
        if (blockBtn.dataset.armed !== "true") {
          blockBtn.dataset.armed = "true";
          blockBtn.textContent = `Confirm block ${fullName}`;
          return;
        }
        try {
          await API.blockUser(targetUser.id);
          showToast(`${fullName} has been blocked.`, "success");
          close();
          if (typeof onBlocked === "function") onBlocked(targetUser.id);
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    },
  });
}

export async function initNavigation() {
  const page = document.body?.dataset?.page || "";
  if (page === "landing") {
    const user = await getCurrentUser();
    renderLandingHeader(user);
    return;
  }
  if (page === "login" || page === "register") {
    return;
  }
  const user = await getCurrentUser();
  renderDashboardShell(user);
}

document.addEventListener("DOMContentLoaded", initNavigation);
