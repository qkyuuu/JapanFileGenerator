let activeElement = null;

const deleteBtn = document.getElementById("deleteComponentBtn");
const moveUpBtn = document.getElementById("moveUpBtn");
const moveDownBtn = document.getElementById("moveDownBtn");
const resetBtn = document.getElementById("resetBtn");
const applyBtn = document.getElementById("applyBtn");

const editorDiv = document.querySelector(".editor-textarea"); // contenteditable div
const textColorInput = document.getElementById("textColor");
const fontSizeInput = document.getElementById("fontSize");

// -----------------------------
// SELECTION PRESERVATION
// -----------------------------
let savedSelection = null;

function saveSelection() {
  const sel = window.getSelection();
  if (sel.rangeCount > 0) {
    savedSelection = sel.getRangeAt(0).cloneRange();
  }
}

function restoreSelection() {
  if (!savedSelection) return;
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(savedSelection);
}

// Save selection when user selects text
editorDiv.addEventListener("mouseup", saveSelection);
editorDiv.addEventListener("keyup", saveSelection);
editorDiv.addEventListener("focus", saveSelection);

// -----------------------------
// SELECTION (SINGLE SOURCE)
// -----------------------------
document.querySelector(".oft-content").addEventListener("click", (e) => {
  const el = e.target.closest(".selectable");
  if (!el) return;
  if (e.target.tagName === "A") e.preventDefault();
  e.stopPropagation();

  if (activeElement) activeElement.classList.remove("selected");
  activeElement = el;
  el.classList.add("selected");

  deleteBtn.disabled = false;
  moveUpBtn.disabled = false;
  moveDownBtn.disabled = false;
  resetBtn.disabled = false;
  applyBtn.disabled = false;

  updateEditor(el.dataset.component, el);
});

// -----------------------------
// UPDATE EDITOR CONTENT
// -----------------------------
function updateEditor(type, element) {
  document.querySelector(".editor-readonly").textContent =
    type.charAt(0).toUpperCase() + type.slice(1);

  let target;
  if (type === "headline") target = element.querySelector("h1");
  else if (type === "content") target = element.querySelector("p");
  else if (type === "cta") target = element.querySelector("a");

  if (target) editorDiv.innerHTML = target.innerHTML;
  else editorDiv.innerHTML = "";

  // Reset selection
  savedSelection = null;
}

// -----------------------------
// DESELECT ON OUTSIDE CLICK
// -----------------------------
document.addEventListener("click", (e) => {
  const clickedInsidePage = e.target.closest(".oft-content");
  const clickedInsideEditor = e.target.closest(".editor");

  if (!clickedInsidePage && !clickedInsideEditor && activeElement) {
    activeElement.classList.remove("selected");
    activeElement = null;

    deleteBtn.disabled = true;
    moveUpBtn.disabled = true;
    moveDownBtn.disabled = true;
    resetBtn.disabled = true;
    applyBtn.disabled = true;
  }
});

// -----------------------------
// ADD COMPONENT FROM SIDEBAR
// -----------------------------
const addButtons = document.querySelectorAll(".add-component");
const footerRow = document.getElementById("footerRow");

addButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const templateId = btn.dataset.template;
    addComponentToEmail(templateId);
  });
});

function addComponentToEmail(templateId) {
  const template = document.getElementById(templateId);
  if (!template) return;
  const clone = template.content.cloneNode(true);
  footerRow.parentNode.insertBefore(clone, footerRow);
}

// -----------------------------
// DELETE COMPONENT
// -----------------------------
deleteBtn.addEventListener("click", () => {
  if (!activeElement) return;
  const row = activeElement.closest("tr");
  if (row) row.remove();
  activeElement = null;
  deleteBtn.disabled = true;
  moveUpBtn.disabled = true;
  moveDownBtn.disabled = true;
});

// -----------------------------
// MOVE UP/DOWN
// -----------------------------
moveUpBtn.addEventListener("click", () => {
  if (!activeElement) return;
  const row = activeElement.closest("tr");
  const prevRow = row.previousElementSibling;
  if (!prevRow || prevRow.id === "headerRow") return;
  row.parentNode.insertBefore(row, prevRow);
});

moveDownBtn.addEventListener("click", () => {
  if (!activeElement) return;
  const row = activeElement.closest("tr");
  const nextRow = row.nextElementSibling;
  if (!nextRow || nextRow.id === "footerRow") return;
  row.parentNode.insertBefore(nextRow, row);
});

// -----------------------------
// TEXT COLOR & SIZE HANDLERS
// -----------------------------
textColorInput.addEventListener("input", () => {
  if (!savedSelection) return;
  restoreSelection();
  document.execCommand("foreColor", false, textColorInput.value);
  saveSelection();
});

fontSizeInput.addEventListener("input", () => {
  if (!savedSelection) return;
  restoreSelection();

  const size = fontSizeInput.value;
  const sel = window.getSelection();
  if (!sel.rangeCount) return;

  const range = sel.getRangeAt(0);
  if (range.collapsed) return;

  const span = document.createElement("span");
  span.style.fontSize = `${size}px`;
  span.appendChild(range.extractContents());
  range.insertNode(span);

  // Reselect the newly inserted span
  sel.removeAllRanges();
  const newRange = document.createRange();
  newRange.selectNodeContents(span);
  sel.addRange(newRange);
  saveSelection();
});

// -----------------------------
// APPLY EDITING
// -----------------------------
applyBtn.addEventListener("click", () => {
  if (!activeElement) return;

  const type = activeElement.dataset.component;
  const content = editorDiv.innerHTML; // KEEP inline styles

  let target;
  if (type === "headline") target = activeElement.querySelector("h1");
  else if (type === "content") target = activeElement.querySelector("p");
  else if (type === "cta") target = activeElement.querySelector("a");

  if (target) {
    target.innerHTML = content;
  }
});

// -----------------------------
// RESET EDITOR
// -----------------------------
resetBtn.addEventListener("click", () => {
  if (!activeElement) return;
  updateEditor(activeElement.dataset.component, activeElement);
});
