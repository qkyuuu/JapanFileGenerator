let activeElement = null;
let modalTargetElement = null;
let selectedBgColor = "#ffffff";
let selectedBannerComponent = null;
let newBannerImageURL = null;

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

const bgColorInput = document.getElementById("bgColor");

const paddingTopInput = document.getElementById("paddingTop");
const paddingRightInput = document.getElementById("paddingRight");
const paddingBottomInput = document.getElementById("paddingBottom");
const paddingLeftInput = document.getElementById("paddingLeft");

const marginTopInput = document.getElementById("marginTop");
const marginRightInput = document.getElementById("marginRight");
const marginBottomInput = document.getElementById("marginBottom");
const marginLeftInput = document.getElementById("marginLeft");

const alignmentSelect = document.getElementById("alignmentSelect");

const bannerImagePreview = document.getElementById("bannerImagePreview");

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

  // Enable the editor controls when a component is selected
  enableEditor();

  deleteBtn.disabled = false;
  moveUpBtn.disabled = false;
  moveDownBtn.disabled = false;
  resetBtn.disabled = false;
  applyBtn.disabled = false;

  updateEditor(el.dataset.component, el);
});
function disableEditor() {
  const editor = document.querySelector(".editor");

  // Show the overlay to disable interaction
  const overlay = editor.querySelector(".editor-overlay");
  if (overlay) {
    overlay.style.display = "flex"; // Show overlay to block interaction
  }

  // Disable editor container (just in case, but the overlay does most of the work)
  editor.style.pointerEvents = "none"; // Prevent interaction (but overlay should handle this)
  editor.style.opacity = "0.5"; // Dim the editor
}
function enableEditor() {
  const editor = document.querySelector(".editor");

  // Hide the overlay to re-enable interaction
  const overlay = editor.querySelector(".editor-overlay");
  if (overlay) {
    overlay.style.display = "none"; // Hide overlay to allow interaction
  }

  // Reset the editor appearance
  editor.style.pointerEvents = "auto"; // Allow interaction
  editor.style.opacity = "1"; // Reset opacity to normal
}

function resetEditorState() {
  editorDiv.innerHTML = ""; // Clear the editor content
  bgColorInput.value = "#ffffff"; // Reset the background color picker to the default
  paddingTopInput.value = 0;
  paddingRightInput.value = 0;
  paddingBottomInput.value = 0;
  paddingLeftInput.value = 0;

  marginTopInput.value = 0;
  marginRightInput.value = 0;
  marginBottomInput.value = 0;
  marginLeftInput.value = 0;
}

// -----------------------------
// UPDATE EDITOR CONTENT (with background color)
function updateEditor(type, element) {
  configureEditorPanels(type);
  document.querySelector(".editor-readonly").textContent =
    type.charAt(0).toUpperCase() + type.slice(1);

  // 1. Identify the target text element immediately
  let target;
  if (type === "headline") target = element.querySelector("h1");
  else if (type === "content") target = element.querySelector("p");
  else if (type === "cta") target = element.querySelector("a");
  else if (type === "banText") target = element;

  // 2. Sync Text Color & Content to Editor
  if (target) {
    const computedTextStyle = window.getComputedStyle(target);
    const currentColor = computedTextStyle.color;

    textColorInput.value = rgbToHex(currentColor);
    editorDiv.style.color = currentColor;
    editorDiv.innerHTML = target.innerHTML;
  } else {
    editorDiv.innerHTML = "";
    editorDiv.style.color = "inherit";
  }

  // 3. Sync background colors (Container vs. Element Fill)
  const bgColor = window.getComputedStyle(element).backgroundColor;
  const bgColorInput = document.getElementById("bgColor");
  const btnBgInput = document.getElementById("btnBgColor");

  // Sync main component background color
  if (bgColor === "rgba(0, 0, 0, 0)" || bgColor === "transparent") {
    bgColorInput.value = "#ffffff";
  } else {
    bgColorInput.value = rgbToHex(bgColor);
  }

  // NEW: Sync the specific "Fill Color" for CTA or Content
  if (type === "cta") {
    const buttonLink = element.querySelector("a");
    if (buttonLink) {
      btnBgInput.value = rgbToHex(
        window.getComputedStyle(buttonLink).backgroundColor
      );
    }
  } else if (type === "content") {
    // For content, the element fill is the same as the block background
    btnBgInput.value = rgbToHex(bgColor);
  }

  // 4. Sync Alignment
  const alignment = window.getComputedStyle(element).textAlign;
  updateAlignmentDropdown(alignment);

  // 5. Sync Spacing (Padding & Margin)
  const computedStyle = window.getComputedStyle(element);

  paddingTopInput.value = parseInt(computedStyle.paddingTop) || 0;
  paddingRightInput.value = parseInt(computedStyle.paddingRight) || 0;
  paddingBottomInput.value = parseInt(computedStyle.paddingBottom) || 0;
  paddingLeftInput.value = parseInt(computedStyle.paddingLeft) || 0;

  marginTopInput.value = parseInt(computedStyle.marginTop) || 0;
  marginRightInput.value = parseInt(computedStyle.marginRight) || 0;
  marginBottomInput.value = parseInt(computedStyle.marginBottom) || 0;
  marginLeftInput.value = parseInt(computedStyle.marginLeft) || 0;

  // 6. Handle Speaker Component Logic
  const speakerDivEditor = document.querySelector(
    ".edit-container .speaker-div"
  );
  if (type === "speaker") {
    speakerDivEditor.style.display = "flex";
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

    const ps = element.querySelectorAll(".speaker-details p");
    speakerNameInput.value = ps[0]?.textContent || "";
    speakerTitleInput.value = ps[1]?.textContent || "";
    speakerOtherInput.value = ps[2]?.textContent || "";

    const pageImg = element.querySelector(".speaker-info img");
    speakerEditorImg.src = pageImg?.src || "img/HeadshotPlaceholder.png";
  } else {
    if (speakerDivEditor) speakerDivEditor.style.display = "none";
  }

  // 7. Handle Banner Component Logic
  if (type === "banner") {
    selectedBannerComponent = element;
    const bannerImage = element.querySelector("img");
    if (bannerImage) {
      const bannerPreview = document.querySelector(
        ".editor-banner-image-preview"
      );
      if (bannerPreview) bannerPreview.src = bannerImage.src;
    }
  }
}

// -----------------------------
// DESELECT ON OUTSIDE CLICK (reset background color)
document.addEventListener("click", (e) => {
  // Determine if the click was inside the page content, editor, or modal
  const clickedInsidePage = e.target.closest(".oft-content");
  const clickedInsideEditor = e.target.closest(".editor");
  const clickedInsideModal = e.target.closest(".modal");
  const isInputOrButton =
    e.target.closest("input") ||
    e.target.closest("button") ||
    e.target.closest("select") ||
    e.target.closest("label");

  // Deselect the active element if clicked outside of these areas
  if (
    !clickedInsidePage &&
    !clickedInsideEditor &&
    !clickedInsideModal &&
    !isInputOrButton &&
    activeElement
  ) {
    // Remove the 'selected' class from the active element
    activeElement.classList.remove("selected");
    activeElement = null;
    const allSections = document.querySelectorAll(
      ".editor-section, #section-actions"
    );
    allSections.forEach((s) => (s.style.display = "none"));
    // Disable editor and controls
    disableEditor();

    // Clear active element-related controls
    resetEditorState();
    resetSpeakerEditor();

    // Optional: Clear the text editor content and reset background color picker
    editorDiv.innerHTML = "";
    bgColorInput.value = "#ffffff"; // Reset background color picker to default
    paddingTopInput.value = 0;
    paddingRightInput.value = 0;
    paddingBottomInput.value = 0;
    paddingLeftInput.value = 0;

    marginTopInput.value = 0;
    marginRightInput.value = 0;
    marginBottomInput.value = 0;
    marginLeftInput.value = 0;
    if (bannerImagePreview) {
      // Reset the image preview to the default placeholder
      bannerImagePreview.src = ""; // or any default image path you prefer
    }
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
  const sel = window.getSelection();
  const color = textColorInput.value;

  // 1. If there is a text selection inside the editorDiv
  if (
    sel.rangeCount > 0 &&
    !sel.isCollapsed &&
    isSelectionInside(sel, editorDiv)
  ) {
    restoreSelection();
    document.execCommand("foreColor", false, color);
    saveSelection();
  }
  // 2. If no selection (or just a cursor), apply color to the whole block
  else {
    editorDiv.style.color = color;
    // Optional: Force children to inherit or clear their specific colors
    // This ensures that the global color change is visible immediately
    const styledSpans = editorDiv.querySelectorAll('span[style*="color"]');
    styledSpans.forEach((span) => (span.style.color = ""));
  }
});

function isSelectionInside(selection, container) {
  if (selection.rangeCount === 0) return false;
  const node = selection.anchorNode;
  return container.contains(node);
}

fontSizeInput.addEventListener("input", applyFontSizeToSelection);

function applyFontSizeToSelection() {
  if (!savedSelection) return;
  restoreSelection();

  const size = fontSizeInput.value;
  const sel = window.getSelection();
  if (!sel.rangeCount || sel.isCollapsed) return;

  const range = sel.getRangeAt(0);

  // Check if the selection is entirely inside an existing span
  let parent = range.commonAncestorContainer;
  if (parent.nodeType === 3) parent = parent.parentNode;

  if (parent.tagName === "SPAN" && parent.parentElement === editorDiv) {
    // If it's already a span we control, just update the style
    parent.style.fontSize = `${size}px`;
  } else {
    // Otherwise, wrap it in a new span
    const span = document.createElement("span");
    span.style.fontSize = `${size}px`;
    span.appendChild(range.extractContents());
    range.insertNode(span);

    // Clean up: If we just wrapped a span in another span,
    // you could add logic here to flatten the DOM.
  }

  saveSelection();
}

function updateAlignmentDropdown(alignment) {
  if (alignment === "left") {
    alignmentSelect.value = "left";
  } else if (alignment === "center") {
    alignmentSelect.value = "center";
  } else if (alignment === "right") {
    alignmentSelect.value = "right";
  }
}

// Event listener for alignment dropdown change
alignmentSelect.addEventListener("change", () => {
  if (!activeElement) return;
  const selectedAlignment = alignmentSelect.value;
  activeElement.dataset.selectedAlignment = selectedAlignment;
});

// -----------------------------
// APPLY EDITING TO COMPONENT (with background color)
// 1. Added (e) here so the event object is available
applyBtn.addEventListener("click", (e) => {
  if (!activeElement) return;

  // 2. This now works correctly to prevent the "Deselect" bug
  e.stopPropagation();

  // --- 1. Apply Layout & Background Styles ---
  const bgColor = document.getElementById("bgColor").value;
  activeElement.style.backgroundColor = bgColor;

  activeElement.style.padding = `${paddingTopInput.value}px ${paddingRightInput.value}px ${paddingBottomInput.value}px ${paddingLeftInput.value}px`;
  activeElement.style.margin = `${marginTopInput.value}px ${marginRightInput.value}px ${marginBottomInput.value}px ${marginLeftInput.value}px`;

  const selectedAlignment = activeElement.dataset.selectedAlignment;
  if (selectedAlignment) {
    activeElement.style.textAlign = selectedAlignment;
  }

  // --- 2. Handle Content Logic ---
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
    let target;
    if (type === "headline") target = activeElement.querySelector("h1");
    else if (type === "content") target = activeElement.querySelector("p");
    else if (type === "cta") target = activeElement.querySelector("a");
    else if (type === "banText") target = activeElement;

    if (target) {
      target.innerHTML = editorDiv.innerHTML;
      target.style.color = editorDiv.style.color;
    }
  }

  // --- 3. Handle Banner Image ---
  if (newBannerImageURL && type === "banner") {
    const bannerImage = activeElement.querySelector("img");
    if (bannerImage) bannerImage.src = newBannerImageURL;
  }

  // --- 4. Handle Element Fill Color (Button or Content Block) ---
  const btnBgInput = document.getElementById("btnBgColor");
  if (btnBgInput) {
    const btnBgValue = btnBgInput.value;
    if (type === "cta") {
      const buttonLink = activeElement.querySelector("a");
      if (buttonLink) buttonLink.style.backgroundColor = btnBgValue;
    } else if (type === "content") {
      // NOTE: This targets the inner <p> for the background fill
      // so it doesn't conflict with the main container bgColor
      const contentPara = activeElement.querySelector("p");
      if (contentPara) contentPara.style.backgroundColor = btnBgValue;
    }
  }

  // 3. Keep the element visually selected after apply
  activeElement.classList.add("selected");

  const originalText = applyBtn.textContent;
  applyBtn.textContent = "Applied!";
  applyBtn.style.backgroundColor = "#28a745"; // Change to green briefly

  setTimeout(() => {
    applyBtn.textContent = originalText;
    applyBtn.style.backgroundColor = ""; // Reset to original CSS color
  }, 1000);
  autoSave();
});

const bannerImageInput = document.getElementById("bannerImage");

bannerImageInput.addEventListener("change", function () {
  const file = bannerImageInput.files[0];
  const errorDisplay = document.querySelector(".error-msg"); // Add this span in your HTML
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.src = e.target.result;

    img.onload = function () {
      const isValid =
        img.width >= 640 &&
        img.width <= 660 &&
        img.height >= 100 &&
        img.height <= 284;

      if (isValid) {
        newBannerImageURL = img.src;
        applyBtn.disabled = false;
        bannerImagePreview.src = e.target.result;
        bannerImagePreview.classList.remove("preview-error");
        if (errorDisplay) errorDisplay.style.display = "none";
      } else {
        // Visual feedback instead of alert
        bannerImagePreview.classList.add("preview-error");
        if (errorDisplay) {
          errorDisplay.textContent = `Invalid size: ${img.width}x${img.height}px. Required: 640-660px width.`;
          errorDisplay.style.display = "block";
        }
        bannerImageInput.value = "";
        applyBtn.disabled = true;
      }
    };
  };
  reader.readAsDataURL(file);
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

  // Sync font size
  const fontSizePx = parseFloat(computed.fontSize);
  if (!isNaN(fontSizePx)) fontSizeInput.value = fontSizePx;

  // Sync text color
  textColorInput.value = rgbToHex(computed.color);

  // Sync padding values
  paddingTopInput.value = parseInt(computed.paddingTop) || 0;
  paddingRightInput.value = parseInt(computed.paddingRight) || 0;
  paddingBottomInput.value = parseInt(computed.paddingBottom) || 0;
  paddingLeftInput.value = parseInt(computed.paddingLeft) || 0;

  // Sync margin values
  marginTopInput.value = parseInt(computed.marginTop) || 0;
  marginRightInput.value = parseInt(computed.marginRight) || 0;
  marginBottomInput.value = parseInt(computed.marginBottom) || 0;
  marginLeftInput.value = parseInt(computed.marginLeft) || 0;
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
  // If the color is transparent or not set, return white
  if (!rgb || rgb === "transparent" || rgb === "rgba(0, 0, 0, 0)") {
    return "#ffffff";
  }

  const match = rgb.match(/\d+/g);
  if (!match) return "#ffffff"; // Fallback to white instead of black

  return (
    "#" +
    match
      .slice(0, 3)
      .map((v) => {
        const hex = Number(v).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
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
function resetSpeakerEditor() {
  const speakerDivEditor = document.querySelector(
    ".edit-container .speaker-div"
  );

  if (!speakerDivEditor) return;

  const inputs = speakerDivEditor.querySelectorAll("input");
  inputs.forEach((input) => (input.value = ""));

  const img = speakerDivEditor.querySelector(".speaker-image img");
  if (img) img.src = "img/HeadshotPlaceholder.png";

  speakerDivEditor.style.display = "none";
}
// AUTO SAVE
function autoSave() {
  const content = document.querySelector(".oft-content").innerHTML;
  localStorage.setItem("savedEmailTemplate", content);
}
const saveBtn = document.getElementById("saveBtn");

saveBtn.addEventListener("click", () => {
  // 1. Get the email content container
  const emailArea = document.querySelector(".oft-content");

  // 2. Clone it so we don't mess up the live editor view
  const clone = emailArea.cloneNode(true);

  // 3. Cleanup: Remove editor-only classes and attributes
  const allElements = clone.querySelectorAll("*");
  allElements.forEach((el) => {
    el.classList.remove("selected", "selectable");
    el.removeAttribute("data-component");
    el.removeAttribute("data-selected-alignment");
    // Optionally remove empty style attributes if they were added during editing
    if (el.getAttribute("style") === "") el.removeAttribute("style");
  });

  // 4. Create the full HTML structure
  const finalHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #f5f6f8; font-family: "Inter", sans-serif; }
    table { border-collapse: collapse; }
    /* Include any necessary base email client resets here */
  </style>
</head>
<body>
  <center>
    ${clone.innerHTML}
  </center>
</body>
</html>`;

  // 5. Trigger download
  const blob = new Blob([finalHtml], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "email-template.html";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});
function configureEditorPanels(type) {
  // Grab all section elements
  const sections = {
    description: document.getElementById("section-description"),
    textStyles: document.getElementById("section-text-styles"),
    alignment: document.getElementById("section-alignment"),
    spacing: document.getElementById("section-spacing"),
    banner: document.getElementById("section-banner-format"),
    speaker: document.getElementById("section-speaker-format"),
    actions: document.getElementById("section-actions"),
  };

  // NEW: Grab the specific label for the element fill color
  const btnColorLabel = document.getElementById("btnColorRow");

  // 1. Hide everything by default to "reset" the sidebar
  Object.values(sections).forEach((section) => {
    if (section) section.style.display = "none";
  });

  // 2. Always show the main Action buttons (Apply/Reset/Delete)
  if (sections.actions) sections.actions.style.display = "block";

  // 3. Define the visibility logic
  switch (type) {
    case "headline":
    case "content":
    case "cta":
    case "banText":
      // These show the full text-editing suite
      if (sections.description) sections.description.style.display = "block";
      if (sections.textStyles) sections.textStyles.style.display = "block";
      if (sections.alignment) sections.alignment.style.display = "block";
      if (sections.spacing) sections.spacing.style.display = "block";
      break;

    case "banner":
      if (sections.banner) sections.banner.style.display = "block";
      if (sections.spacing) sections.spacing.style.display = "block";
      break;

    case "speaker":
      if (sections.speaker) sections.speaker.style.display = "block";
      if (sections.spacing) sections.spacing.style.display = "block";
      break;

    default:
      if (sections.spacing) sections.spacing.style.display = "block";
      break;
  }

  // 4. Final Override: Specifically handle the CKEditor-style icon visibility
  // We check for its existence first to prevent errors
  if (btnColorLabel) {
    if (type === "cta") {
      btnColorLabel.style.display = "inline-block";
    } else {
      btnColorLabel.style.display = "none";
    }
  }
}
const addLinkBtn = document.getElementById("addLinkBtn");

addLinkBtn.addEventListener("click", () => {
  // 1. Ensure the modal editor is focused and selection is restored
  modalEditor.focus();
  if (savedModalSelection) {
    restoreModalSelection();
  }

  // 2. Check if the user has actually highlighted text
  const selection = window.getSelection();
  if (selection.toString().length === 0) {
    alert("Please highlight the text you want to turn into a link first.");
    return;
  }

  // 3. Ask for the URL
  let url = prompt("Enter the URL:", "https://");

  if (url && url.trim() !== "" && url !== "https://") {
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }

    document.execCommand("createLink", false, url);

    const selectionParent = selection.anchorNode.parentElement;
    if (selectionParent && selectionParent.tagName === "A") {
      selectionParent.setAttribute("target", "_blank");
      selectionParent.style.color = "#0066cc";
      selectionParent.style.textDecoration = "underline";
    } else {
      // Fallback: If anchorNode isn't direct, fix all links to be safe
      const links = modalEditor.getElementsByTagName("a");
      for (let link of links) {
        link.setAttribute("target", "_blank");
      }
    }

    // 6. Save the new state
    saveModalSelection();
  }
});
