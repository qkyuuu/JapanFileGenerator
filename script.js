let activeElement = null;
let modalTargetElement = null;

const deleteBtn = document.getElementById("deleteComponentBtn");
const moveUpBtn = document.getElementById("moveUpBtn");
const moveDownBtn = document.getElementById("moveDownBtn");
const resetBtn = document.getElementById("resetBtn");
const applyBtn = document.getElementById("applyBtn");

const editorDiv = document.querySelector(".editor-textarea"); // contenteditable div
const textColorInput = document.getElementById("textColor");
const fontSizeInput = document.getElementById("fontSize");

const openModalBtn = document.getElementById("openDescModal");
const descModal = document.getElementById("descModal");
const closeModalBtn = document.getElementById("closeDescModal");
const cancelModalBtn = document.getElementById("cancelDescModal");
const saveModalBtn = document.getElementById("saveDescModal");

const mainEditor = document.getElementById("descriptionEditor");
const modalEditor = document.getElementById("modalDescEditor");

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

  const speakerDivEditor = document.querySelector(
    ".edit-container .speaker-div"
  );
  const speakerNameInput = speakerDivEditor.querySelector(
    "input:nth-of-type(1)"
  );
  const speakerTitleInput = speakerDivEditor.querySelector(
    "input:nth-of-type(2)"
  );
  const speakerOtherInput = speakerDivEditor.querySelector(
    "input:nth-of-type(3)"
  );
  const speakerEditorImg = speakerDivEditor.querySelector(".speaker-image img");

  if (type === "speaker") {
    // Show the speaker editor
    speakerDivEditor.style.display = "flex";

    // Populate inputs from page-area
    const ps = element.querySelectorAll(".speaker-details p");
    speakerNameInput.value = ps[0]?.textContent || "";
    speakerTitleInput.value = ps[1]?.textContent || "";
    speakerOtherInput.value = ps[2]?.textContent || "";

    // Populate editor image preview
    const pageImg = element.querySelector(".speaker-info img");
    speakerEditorImg.src = pageImg?.src || "img/HeadshotPlaceholder.png";
  } else {
    speakerDivEditor.style.display = "none";

    // Existing editor content logic for text/CTA
    let target;
    if (type === "headline") target = element.querySelector("h1");
    else if (type === "content") target = element.querySelector("p");
    else if (type === "cta") target = element.querySelector("a");

    editorDiv.innerHTML = target ? target.innerHTML : "";
  }
}

// -----------------------------
// DESELECT ON OUTSIDE CLICK
// -----------------------------
document.addEventListener("click", (e) => {
  const clickedInsidePage = e.target.closest(".oft-content");
  const clickedInsideEditor = e.target.closest(".editor");
  const clickedInsideModal = e.target.closest(".modal");

  if (
    !clickedInsidePage &&
    !clickedInsideEditor &&
    !clickedInsideModal &&
    activeElement
  ) {
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
// TEXT COLOR & SIZE HANDLERS (MAIN EDITOR)
// -----------------------------
textColorInput.addEventListener("input", () => {
  if (!savedSelection) return;
  restoreSelection();
  document.execCommand("foreColor", false, textColorInput.value);
  saveSelection();
});

fontSizeInput.addEventListener("input", applyFontSizeToSelection);

function applyFontSizeToSelection() {
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

  sel.removeAllRanges();
  const newRange = document.createRange();
  newRange.selectNodeContents(span);
  sel.addRange(newRange);
  saveSelection();
}

// -----------------------------
// APPLY EDITING TO COMPONENT
// -----------------------------
applyBtn.addEventListener("click", () => {
  if (!activeElement) return;

  const type = activeElement.dataset.component;

  if (type === "speaker") {
    const ps = activeElement.querySelectorAll(".speaker-details p");
    const pageImg = activeElement.querySelector(".speaker-info img");

    const speakerDivEditor = document.querySelector(
      ".edit-container .speaker-div"
    );
    const speakerNameInput = speakerDivEditor.querySelector(
      "input:nth-of-type(1)"
    );
    const speakerTitleInput = speakerDivEditor.querySelector(
      "input:nth-of-type(2)"
    );
    const speakerOtherInput = speakerDivEditor.querySelector(
      "input:nth-of-type(3)"
    );
    const speakerEditorImg =
      speakerDivEditor.querySelector(".speaker-image img");

    if (ps[0]) ps[0].textContent = speakerNameInput.value;
    if (ps[1]) ps[1].textContent = speakerTitleInput.value;
    if (ps[2]) ps[2].textContent = speakerOtherInput.value;
    if (pageImg) pageImg.src = speakerEditorImg.src;
  } else {
    // Other component types
    let target;
    if (type === "headline") target = activeElement.querySelector("h1");
    else if (type === "content") target = activeElement.querySelector("p");
    else if (type === "cta") target = activeElement.querySelector("a");

    if (target) target.innerHTML = editorDiv.innerHTML;
  }
});

// -----------------------------
// RESET EDITOR CONTENT
// -----------------------------
resetBtn.addEventListener("click", () => {
  if (!activeElement) return;
  updateEditor(activeElement.dataset.component, activeElement);
});

// -----------------------------
// MODAL HANDLING
// -----------------------------
openModalBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  modalTargetElement = activeElement;
  if (!modalTargetElement) return;

  modalEditor.innerHTML = editorDiv.innerHTML;
  syncModalControlsFromEditor();

  descModal.style.display = "flex";
  document.body.style.overflow = "hidden";
});

function closeModal() {
  descModal.style.display = "none";
  document.body.style.overflow = "";

  if (modalTargetElement) {
    activeElement = modalTargetElement;
    activeElement.classList.add("selected");
  }
}

closeModalBtn.addEventListener("click", closeModal);
cancelModalBtn.addEventListener("click", closeModal);

saveModalBtn.addEventListener("click", () => {
  editorDiv.innerHTML = modalEditor.innerHTML;

  if (modalTargetElement) {
    if (activeElement) activeElement.classList.remove("selected");
    activeElement = modalTargetElement;
    activeElement.classList.add("selected");

    deleteBtn.disabled = false;
    moveUpBtn.disabled = false;
    moveDownBtn.disabled = false;
    resetBtn.disabled = false;
    applyBtn.disabled = false;
  }

  syncEditorStylesFromEditor();
  syncModalControlsFromEditor();
  closeModal();
});

// -----------------------------
// MODAL TOOLBAR BUTTONS
// -----------------------------
document.querySelectorAll(".modal-toolbar button[data-cmd]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const cmd = btn.getAttribute("data-cmd");
    modalEditor.focus();
    document.execCommand(cmd, false, null);
  });
});

const modalFontSizeInput = document.getElementById("fontSizeInput");
const modalColorPicker = document.getElementById("fontColorPicker");

// -----------------------------
// MODAL SELECTION PRESERVATION
// -----------------------------
let savedModalSelection = null;

function saveModalSelection() {
  const sel = window.getSelection();
  if (sel.rangeCount > 0) {
    savedModalSelection = sel.getRangeAt(0).cloneRange();
  }
}

function restoreModalSelection() {
  if (!savedModalSelection) return;
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(savedModalSelection);
}

modalEditor.addEventListener("mouseup", saveModalSelection);
modalEditor.addEventListener("keyup", saveModalSelection);
modalEditor.addEventListener("focus", saveModalSelection);

// -----------------------------
// APPLY FONT SIZE IN MODAL
// -----------------------------
modalFontSizeInput.addEventListener("input", applyModalFontSize);
modalFontSizeInput.addEventListener("change", applyModalFontSize);

function applyModalFontSize() {
  if (!savedModalSelection) return;
  restoreModalSelection();

  const size = modalFontSizeInput.value;
  const sel = window.getSelection();
  if (!sel.rangeCount) return;

  const range = sel.getRangeAt(0);
  if (range.collapsed) return;

  const span = document.createElement("span");
  span.style.fontSize = `${size}px`;
  span.appendChild(range.extractContents());
  range.insertNode(span);

  sel.removeAllRanges();
  const newRange = document.createRange();
  newRange.selectNodeContents(span);
  sel.addRange(newRange);

  saveModalSelection();
  syncModalControlsFromEditor();
}

// -----------------------------
// APPLY FONT COLOR IN MODAL
// -----------------------------
modalColorPicker.addEventListener("input", (e) => {
  const color = e.target.value;
  if (!color) return;

  restoreModalSelection();
  const sel = window.getSelection();
  if (!sel.rangeCount) return;

  const range = sel.getRangeAt(0);
  if (range.collapsed) return;

  const span = document.createElement("span");
  span.style.color = color;
  span.appendChild(range.extractContents());
  range.insertNode(span);

  sel.removeAllRanges();
  const newRange = document.createRange();
  newRange.selectNodeContents(span);
  sel.addRange(newRange);

  saveModalSelection();
  syncModalControlsFromEditor();
});

// -----------------------------
// SYNC STYLES BETWEEN EDITOR & INPUTS
// -----------------------------
function syncEditorStylesFromEditor() {
  const sel = window.getSelection();
  if (!sel.rangeCount) return;

  let node = sel.anchorNode;
  if (!node) return;
  if (node.nodeType === 3) node = node.parentElement;

  const computed = window.getComputedStyle(node);

  const fontSizePx = parseFloat(computed.fontSize);
  if (!isNaN(fontSizePx)) fontSizeInput.value = fontSizePx;

  textColorInput.value = rgbToHex(computed.color);
}

function syncModalControlsFromEditor() {
  const el = editorDiv;
  if (!el) return;

  const node = getFirstStyledNode(el);
  if (!node) return;

  const computed = window.getComputedStyle(node);
  const fontSizePx = parseFloat(computed.fontSize);
  if (!isNaN(fontSizePx)) modalFontSizeInput.value = fontSizePx;

  modalColorPicker.value = rgbToHex(computed.color);
}

function getFirstStyledNode(container) {
  if (!container) return null;

  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
    null
  );

  let node = walker.nextNode();
  while (node) {
    if (node.nodeType === 3 && node.parentElement) return node.parentElement;
    if (node.nodeType === 1) return node;
    node = walker.nextNode();
  }
  return null;
}

function rgbToHex(rgb) {
  const match = rgb.match(/\d+/g);
  if (!match) return "#000000";
  return (
    "#" +
    match
      .slice(0, 3)
      .map((v) => Number(v).toString(16).padStart(2, "0"))
      .join("")
  );
}

editorDiv.addEventListener("mouseup", syncEditorStylesFromEditor);
editorDiv.addEventListener("keyup", syncEditorStylesFromEditor);

// -----------------------------
// SPEAKER IMAGE UPLOAD & INPUTS
// (All updates go to editor preview only)
// -----------------------------
const speakerImageInput = document.getElementById("speakerImage");
const speakerDivEditorPreview = document.querySelector(
  ".edit-container .speaker-div"
);

// Inputs are already handled via temp editor preview above
speakerImageInput.addEventListener("change", (e) => {
  if (!activeElement || activeElement.dataset.component !== "speaker") return;
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    const editorImgEl =
      speakerDivEditorPreview.querySelector(".speaker-image img");
    editorImgEl.src = ev.target.result;
  };
  reader.readAsDataURL(file);
});
