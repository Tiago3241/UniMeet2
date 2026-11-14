/**
 * Authentication screens logic: Login, Forgot Password, Password Reset & Registration validation,
 * password visibility toggle, and real /api/auth/* integration.
 */
import { API, setFallbackToken } from "./api.js";
import { escapeHtml, qs, qsa } from "./utils.js";

function showFeedback(message, type = "error") {
  const box = qs("#auth-feedback");
  if (!box) return;
  box.hidden = false;
  box.className = `form-alert form-alert-${type}`;
  box.textContent = message;
}

function clearFeedback() {
  const box = qs("#auth-feedback");
  if (box) {
    box.hidden = true;
    box.textContent = "";
  }
}

function wirePasswordToggles() {
  qsa("[data-toggle-pw]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = qs(`#${btn.dataset.togglePw}`);
      if (!target) return;
      const isHidden = target.type === "password";
      target.type = isHidden ? "text" : "password";
      btn.textContent = isHidden ? "Hide" : "Show";
      btn.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
    });
  });
}

function initLoginPage() {
  const loginForm = qs("#login-form");
  const forgotForm = qs("#forgot-form");
  const resetForm = qs("#reset-form");
  if (!loginForm) return;

  const heading = qs("#auth-heading");
  const subheading = qs("#auth-subheading");
  const demoBox = qs("#demo-credentials-box");
  const resetLinkBox = qs("#reset-link-box");

  let activeResetToken = "";

  const setView = (mode) => {
    clearFeedback();
    if (resetLinkBox) resetLinkBox.hidden = true;
    loginForm.hidden = mode !== "login";
    if (forgotForm) forgotForm.hidden = mode !== "forgot";
    if (resetForm) resetForm.hidden = mode !== "reset";
    if (demoBox) demoBox.hidden = mode !== "login";

    if (mode === "forgot") {
      if (heading) heading.textContent = "Reset your password";
      if (subheading) subheading.textContent = "Enter the email linked to your UniMeet account to receive a reset link.";
      qs("#forgot-email")?.focus();
    } else if (mode === "reset") {
      if (heading) heading.textContent = "Create a new password";
      if (subheading) subheading.textContent = "Choose a strong new password for your UniMeet account.";
      qs("#reset-new-password")?.focus();
    } else {
      if (heading) heading.textContent = "Sign in to UniMeet";
      if (subheading) subheading.textContent = "Use your email or username and password.";
    }
  };

  // Support direct link ?mode=reset&token=...
  const urlParams = new URLSearchParams(window.location.search);
  const paramToken = urlParams.get("token");
  if (urlParams.get("mode") === "reset" && paramToken) {
    activeResetToken = paramToken;
    setView("reset");
  }

  const demoBtn = qs("#fill-demo-btn");
  if (demoBtn) {
    demoBtn.addEventListener("click", () => {
      qs("#login-identifier").value = "elena.demo@unimeet.edu";
      qs("#login-password").value = "DemoUser123!";
      qs("#err-identifier").textContent = "";
      qs("#err-password").textContent = "";
      clearFeedback();
    });
  }

  qs("#open-forgot-btn")?.addEventListener("click", () => {
    const typedIdentifier = qs("#login-identifier")?.value.trim() || "";
    if (typedIdentifier.includes("@") && qs("#forgot-email")) {
      qs("#forgot-email").value = typedIdentifier;
    }
    setView("forgot");
  });

  qs("#back-to-login-from-forgot")?.addEventListener("click", () => setView("login"));
  qs("#back-to-login-from-reset")?.addEventListener("click", () => {
    activeResetToken = "";
    window.history.replaceState({}, "", "login.html");
    setView("login");
  });

  loginForm.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    clearFeedback();
    const identifier = qs("#login-identifier").value.trim();
    const password = qs("#login-password").value;
    qs("#err-identifier").textContent = "";
    qs("#err-password").textContent = "";

    let valid = true;
    if (!identifier) {
      qs("#err-identifier").textContent = "Please enter your email or username.";
      valid = false;
    }
    if (!password) {
      qs("#err-password").textContent = "Please enter your password.";
      valid = false;
    }
    if (!valid) return;

    const btn = qs("#login-submit-btn");
    btn.disabled = true;
    btn.textContent = "Signing in...";

    try {
      const res = await API.login({ identifier, password });
      if (res.access_token) setFallbackToken(res.access_token);
      showFeedback("Signed in! Redirecting to Discover...", "success");
      window.setTimeout(() => {
        window.location.href = "discover.html";
      }, 450);
    } catch (err) {
      showFeedback(err.message || "Login failed.", "error");
      btn.disabled = false;
      btn.textContent = "Sign in";
    }
  });

  if (forgotForm) {
    forgotForm.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      clearFeedback();
      if (resetLinkBox) resetLinkBox.hidden = true;
      const email = qs("#forgot-email").value.trim();
      const errEl = qs("#err-forgot-email");
      errEl.textContent = "";

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errEl.textContent = "Please enter a valid email address.";
        return;
      }

      const btn = qs("#forgot-submit-btn");
      btn.disabled = true;
      btn.textContent = "Sending...";

      try {
        const res = await API.forgotPassword(email);
        showFeedback(
          res.message || "If an account matches that email, a password reset link has been sent.",
          "success"
        );
        if (res.reset_token && resetLinkBox) {
          activeResetToken = res.reset_token;
          resetLinkBox.hidden = false;
          resetLinkBox.innerHTML = `
            <strong>Password reset link ready</strong>
            <span class="muted-small">Open the reset screen directly for <code>${escapeHtml(email)}</code>:</span>
            <button type="button" class="btn btn-primary btn-sm" id="proceed-to-reset-btn">Continue to reset password</button>
          `;
          qs("#proceed-to-reset-btn", resetLinkBox)?.addEventListener("click", () => {
            window.history.replaceState({}, "", `login.html?mode=reset&token=${encodeURIComponent(activeResetToken)}`);
            setView("reset");
          });
        }
      } catch (err) {
        showFeedback(err.message || "Could not process password reset request.", "error");
      } finally {
        btn.disabled = false;
        btn.textContent = "Send reset link";
      }
    });
  }

  if (resetForm) {
    const newPwInput = qs("#reset-new-password");
    const rLen = qs("#reset-rule-len");
    const rLetter = qs("#reset-rule-letter");
    const rDigit = qs("#reset-rule-digit");

    const checkResetRules = (pw) => {
      const hasLen = pw.length >= 8;
      const hasLetter = /[A-Za-z]/.test(pw);
      const hasDigit = /\d/.test(pw);
      rLen?.classList.toggle("is-met", hasLen);
      rLetter?.classList.toggle("is-met", hasLetter);
      rDigit?.classList.toggle("is-met", hasDigit);
      return hasLen && hasLetter && hasDigit;
    };

    newPwInput?.addEventListener("input", () => checkResetRules(newPwInput.value));

    resetForm.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      clearFeedback();
      qs("#err-reset-password").textContent = "";
      qs("#err-reset-confirm").textContent = "";

      const newPassword = newPwInput.value;
      const confirmPassword = qs("#reset-confirm-password").value;

      let valid = true;
      if (!checkResetRules(newPassword)) {
        qs("#err-reset-password").textContent = "Password must meet all requirements above.";
        valid = false;
      }
      if (newPassword !== confirmPassword) {
        qs("#err-reset-confirm").textContent = "Passwords do not match.";
        valid = false;
      }
      if (!activeResetToken) {
        showFeedback("Missing or invalid reset token. Please request a new reset link.", "error");
        return;
      }
      if (!valid) return;

      const btn = qs("#reset-submit-btn");
      btn.disabled = true;
      btn.textContent = "Updating...";

      try {
        const res = await API.resetPassword(activeResetToken, newPassword);
        activeResetToken = "";
        newPwInput.value = "";
        qs("#reset-confirm-password").value = "";
        window.history.replaceState({}, "", "login.html");
        setView("login");
        showFeedback(res.message || "Password updated. Please sign in with your new password.", "success");
      } catch (err) {
        showFeedback(err.message || "Could not reset password.", "error");
      } finally {
        btn.disabled = false;
        btn.textContent = "Update password";
      }
    });
  }
}

function initRegisterPage() {
  const form = qs("#register-form");
  if (!form) return;

  const pwInput = qs("#reg-password");
  const ruleLen = qs("#rule-len");
  const ruleLetter = qs("#rule-letter");
  const ruleDigit = qs("#rule-digit");

  const checkPasswordRules = (pw) => {
    const hasLen = pw.length >= 8;
    const hasLetter = /[A-Za-z]/.test(pw);
    const hasDigit = /\d/.test(pw);
    ruleLen.classList.toggle("is-met", hasLen);
    ruleLetter.classList.toggle("is-met", hasLetter);
    ruleDigit.classList.toggle("is-met", hasDigit);
    return hasLen && hasLetter && hasDigit;
  };

  pwInput.addEventListener("input", () => checkPasswordRules(pwInput.value));

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    qsa(".field-error", form).forEach((el) => {
      el.textContent = "";
    });

    const firstName = qs("#reg-first-name").value.trim();
    const lastName = qs("#reg-last-name").value.trim();
    const username = qs("#reg-username").value.trim();
    const email = qs("#reg-email").value.trim();
    const university = qs("#reg-university").value.trim();
    const city = qs("#reg-city").value.trim();
    const password = pwInput.value;
    const confirm = qs("#reg-confirm").value;

    let valid = true;
    if (!firstName) {
      qs("#err-first-name").textContent = "First name is required.";
      valid = false;
    }
    if (!lastName) {
      qs("#err-last-name").textContent = "Last name is required.";
      valid = false;
    }
    if (!/^[A-Za-z0-9_.-]{3,50}$/.test(username)) {
      qs("#err-username").textContent = "Username must be 3–50 chars (letters, numbers, _, ., -).";
      valid = false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      qs("#err-email").textContent = "Please enter a valid email address.";
      valid = false;
    }
    if (!checkPasswordRules(password)) {
      qs("#err-password").textContent = "Password must meet all requirements above.";
      valid = false;
    }
    if (password !== confirm) {
      qs("#err-confirm").textContent = "Passwords do not match.";
      valid = false;
    }
    if (!valid) return;

    const btn = qs("#register-submit-btn");
    btn.disabled = true;
    btn.textContent = "Creating account...";

    try {
      const res = await API.register({
        first_name: firstName,
        last_name: lastName,
        username,
        email,
        university: university || null,
        city: city || null,
        password,
      });
      if (res.access_token) setFallbackToken(res.access_token);
      showFeedback("Account created! Taking you to your profile interests...", "success");
      window.setTimeout(() => {
        window.location.href = "profile.html";
      }, 600);
    } catch (err) {
      showFeedback(err.message || "Registration failed.", "error");
      btn.disabled = false;
      btn.textContent = "Create account";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  wirePasswordToggles();
  const page = document.body?.dataset?.page;
  if (page === "login") initLoginPage();
  if (page === "register") initRegisterPage();
});
