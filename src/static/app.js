document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const activitySignupForm = document.getElementById("activity-signup-form");
  const loginForm = document.getElementById("login-form");
  const authSignupForm = document.getElementById("auth-signup-form");
  const messageDiv = document.getElementById("message");
  const authMessageDiv = document.getElementById("auth-message");
  const authView = document.getElementById("auth-view");
  const appView = document.getElementById("app-view");
  const logoutButton = document.getElementById("logout-btn");

  function showMessage(element, text, type) {
    element.textContent = text;
    element.className = `message ${type}`;
    element.classList.remove("hidden");

    setTimeout(() => {
      element.classList.add("hidden");
    }, 5000);
  }

  function getLoggedInEmail() {
    return localStorage.getItem("student-email");
  }

  function setLoggedInEmail(email) {
    localStorage.setItem("student-email", email);
  }

  function clearLoggedInEmail() {
    localStorage.removeItem("student-email");
  }

  function renderAuthView() {
    const email = getLoggedInEmail();
    if (email) {
      authView.classList.add("hidden");
      appView.classList.remove("hidden");
      document.getElementById("email").value = email;
      fetchActivities();
    } else {
      authView.classList.remove("hidden");
      appView.classList.add("hidden");
      authMessageDiv.classList.add("hidden");
    }
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(messageDiv, result.message, "success");
        fetchActivities();
      } else {
        showMessage(messageDiv, result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage(messageDiv, "Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();

    try {
      const response = await fetch("/students/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (response.ok) {
        setLoggedInEmail(email);
        loginForm.reset();
        renderAuthView();
      } else {
        showMessage(authMessageDiv, result.detail || "Login failed.", "error");
      }
    } catch (error) {
      showMessage(authMessageDiv, "Failed to log in. Please try again.", "error");
      console.error("Error logging in:", error);
    }
  });

  authSignupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = {
      name: document.getElementById("signup-name").value.trim(),
      email: document.getElementById("signup-email").value.trim(),
      password: document.getElementById("signup-password").value.trim()
    };

    try {
      const response = await fetch("/students/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        authSignupForm.reset();
        showMessage(authMessageDiv, result.message, "success");
      } else {
        showMessage(authMessageDiv, result.detail || "Sign up failed.", "error");
      }
    } catch (error) {
      showMessage(authMessageDiv, "Failed to create account. Please try again.", "error");
      console.error("Error creating account:", error);
    }
  });

  activitySignupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = getLoggedInEmail();
    const activity = document.getElementById("activity").value;

    if (!email) {
      renderAuthView();
      return;
    }

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(messageDiv, result.message, "success");
        activitySignupForm.reset();
        fetchActivities();
      } else {
        showMessage(messageDiv, result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage(messageDiv, "Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  logoutButton.addEventListener("click", () => {
    clearLoggedInEmail();
    activitySignupForm.reset();
    renderAuthView();
  });

  renderAuthView();
});
