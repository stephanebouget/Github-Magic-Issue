// Inject shared styles once
const sharedStyle = document.createElement("style");
sharedStyle.textContent = `
  @keyframes magic-spin {
    to { transform: rotate(360deg); }
  }
  @keyframes slideIn {
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  .magic-spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: magic-spin 0.7s linear infinite;
    vertical-align: middle;
  }
`;
document.head.appendChild(sharedStyle);

function showNotification(message, isError = false) {
  const notification = document.createElement("div");
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${isError ? "#f44336" : "#4CAF50"};
    color: white;
    padding: 12px 16px;
    border-radius: 4px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    z-index: 999999;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    animation: slideIn 0.3s ease-out;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transition = "opacity 0.3s";
    setTimeout(() => notification.remove(), 300);
  }, 2500);
}

function createMagicBtn(onClickHandler) {
  const btn = document.createElement("button");
  btn.innerText = "✨";
  btn.className = "magic-btn";
  btn.title = "Translate & Generate Title";
  btn.style.padding = "6px 10px";
  btn.style.cursor = "pointer";
  btn.style.borderRadius = "6px";
  btn.style.border = "1px solid #30363d";
  btn.style.background = "#21262d";
  btn.style.color = "white";
  btn.style.whiteSpace = "nowrap";
  btn.style.flexShrink = "0";
  btn.style.display = "inline-flex";
  btn.style.alignItems = "center";
  btn.style.justifyContent = "center";
  btn.style.minWidth = "36px";
  btn.onclick = onClickHandler;
  return btn;
}

async function generateFromContent(
  btn,
  titleInput,
  descInput,
  isEditMode = false,
) {
  let content = "";

  if (isEditMode) {
    // In edit mode, get content from the issue body viewer
    const issueBody = document.querySelector(
      '[data-testid="issue-body-viewer"]',
    );
    if (issueBody) {
      const textContent = issueBody.textContent;
      content = textContent.trim();
    }
  } else {
    // In create mode, use description if available
    content = descInput ? descInput.value : titleInput.value;
  }

  if (!content.trim()) {
    showNotification("No content to translate", true);
    return;
  }

  btn.innerHTML = '<span class="magic-spinner"></span>';
  btn.disabled = true;

  try {
    const res = await chrome.runtime.sendMessage({
      type: "TRANSLATE_AND_GENERATE_TITLE",
      content,
    });

    if (res?.error) {
      showNotification(`Error: ${res.error}`, true);
    } else if (res?.title) {
      titleInput.value = res.title;
      titleInput.dispatchEvent(new Event("input", { bubbles: true }));
      // Only update description in create mode
      if (!isEditMode && res.translatedContent && descInput) {
        descInput.value = res.translatedContent;
        descInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
      showNotification("✅ Title generated!");
    } else {
      showNotification("No title received", true);
    }
  } catch (err) {
    showNotification(`Error: ${err.message}`, true);
  }

  btn.innerText = "✨";
  btn.disabled = false;
}

// Inject button on new issue form (/issues/new)
function injectButton() {
  const titleInput = document.querySelector('input[aria-label="Add a title"]');
  const descInput = document.querySelector(
    'textarea[aria-label="Markdown value"]',
  );

  if (!titleInput || !descInput) return;

  const wrapper = titleInput.closest(
    ".CreateIssueFormTitle-module__subcontainer__JTymL",
  );
  if (!wrapper) return;

  if (wrapper.querySelector(".magic-btn")) return;

  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "row";
  wrapper.style.alignItems = "center";
  wrapper.style.gap = "8px";
  wrapper.style.width = "100%";
  wrapper.style.minWidth = "0";

  // Force dynamic container to take full space
  const dynamicContainer = titleInput.closest('[class*="InlineAutocomplete"]');
  if (dynamicContainer) {
    dynamicContainer.style.setProperty("flex", "1 1 auto", "important");
    dynamicContainer.style.setProperty("width", "auto", "important");
    dynamicContainer.style.setProperty("minWidth", "0", "important");
  }

  titleInput.style.setProperty("flex", "unset", "important");
  titleInput.style.setProperty("minWidth", "0", "important");

  const btn = createMagicBtn(() =>
    generateFromContent(btn, titleInput, descInput),
  );
  wrapper.appendChild(btn);
}

// Inject button in issue edit mode (/issues/1, clicking Edit)
function injectEditButton() {
  const titleInput = document.querySelector(
    'input[data-testid="issue-title-input"]',
  );
  if (!titleInput) return;

  const container = titleInput.closest('[class*="HeaderEditorContainer"]');
  if (!container) return;

  if (container.querySelector(".magic-btn")) return;

  const cancelBtn = Array.from(container.querySelectorAll("button")).find(
    (b) => b.textContent.trim() === "Cancel",
  );
  if (!cancelBtn) return;

  const btn = createMagicBtn(() =>
    generateFromContent(btn, titleInput, null, true),
  );
  cancelBtn.parentElement.insertBefore(btn, cancelBtn);
}

// Inject button on GitLab new issue form
function injectGitlabNewIssueButton() {
  const titleInput = document.querySelector(
    'input[data-testid="work-item-title-input"]',
  );
  const descInput = document.querySelector(
    'textarea[data-testid="markdown-editor-form-field"][aria-label="Description"]',
  );

  if (!titleInput || !descInput) return;

  const titleWrapper = titleInput.parentElement;
  if (!titleWrapper) return;

  // Avoid duplicate - check the title group parent
  const titleGroup = titleInput.closest('[data-testid="title-input"]');
  if (!titleGroup || titleGroup.querySelector(".magic-btn")) return;

  // Wrap input + button in a flex row
  titleWrapper.style.display = "flex";
  titleWrapper.style.flexDirection = "row";
  titleWrapper.style.alignItems = "center";
  titleWrapper.style.gap = "8px";

  titleInput.style.setProperty("flex", "1 1 auto", "important");
  titleInput.style.setProperty("minWidth", "0", "important");

  const btn = createMagicBtn(() =>
    generateFromContent(btn, titleInput, descInput),
  );
  titleWrapper.appendChild(btn);
}

// Inject button on GitLab edit issue (description form Cancel button)
function injectGitlabEditButton() {
  const titleInput = document.querySelector(
    'input[data-testid="work-item-title-input"]',
  );
  if (!titleInput) return;

  const titleWrapper = titleInput.parentElement;
  if (!titleWrapper || titleWrapper.querySelector(".magic-btn")) return;

  const descTextarea = document.querySelector("#work-item-description");

  const btn = createMagicBtn(() => {
    const content = descTextarea?.value || titleInput.value;
    if (!content.trim()) {
      showNotification("No content to translate", true);
      return;
    }
    generateFromContentRaw(btn, titleInput, content);
  });

  // Style wrapper as flex row so input and button sit side by side
  titleWrapper.style.display = "flex";
  titleWrapper.style.flexDirection = "row";
  titleWrapper.style.alignItems = "center";
  titleWrapper.style.gap = "8px";

  titleInput.style.setProperty("flex", "1 1 auto", "important");
  titleInput.style.setProperty("minWidth", "0", "important");

  // Insert right after the input
  titleInput.insertAdjacentElement("afterend", btn);
}

// Helper: generate title from raw content string (no descInput update)
async function generateFromContentRaw(btn, titleInput, content) {
  btn.innerHTML = '<span class="magic-spinner"></span>';
  btn.disabled = true;

  try {
    const res = await chrome.runtime.sendMessage({
      type: "TRANSLATE_AND_GENERATE_TITLE",
      content,
    });

    if (res?.error) {
      showNotification(`Error: ${res.error}`, true);
    } else if (res?.title) {
      titleInput.value = res.title;
      titleInput.dispatchEvent(new Event("input", { bubbles: true }));
      showNotification("✅ Title generated!");
    } else {
      showNotification("No title received", true);
    }
  } catch (err) {
    showNotification(`Error: ${err.message}`, true);
  }

  btn.innerText = "✨";
  btn.disabled = false;
}

// Watch for DOM changes (handles both new issue form and edit mode)
const observer = new MutationObserver(() => {
  injectButton();
  injectEditButton();
  injectGitlabNewIssueButton();
  injectGitlabEditButton();
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// Handle GitHub client-side navigation (Turbo Drive)
document.addEventListener("turbo:load", () => {
  document.querySelectorAll(".magic-btn").forEach((el) => el.remove());
  injectButton();
  injectEditButton();
  injectGitlabNewIssueButton();
  injectGitlabEditButton();
});

// Initial injection
injectButton();
injectGitlabNewIssueButton();
injectGitlabEditButton();
