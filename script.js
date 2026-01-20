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

function updateEditor(type, element) {
  if (
    element.closest(".editor-sidebar") ||
    element.closest(".modal") ||
    element.classList.contains("color-picker")
  ) {
    return;
  }
  configureEditorPanels(type);
  activeElement = element;

  document.querySelector(".editor-readonly").textContent =
    type.charAt(0).toUpperCase() + type.slice(1);

  // --- 1. Identify style and text targets ---
  const targetForStyle =
    element.tagName === "TR" ? element.querySelector("td") : element;
  const style = window.getComputedStyle(targetForStyle);

  let textTarget;
  if (type === "headline") textTarget = element.querySelector("p");
  else if (type === "content") textTarget = element.querySelector("p");
  else if (type === "cta") textTarget = element.querySelector("a");
  else if (type === "banText") textTarget = element.querySelector("p");

  // --- 2. Text, Font Size, and Color Sync ---
  if (textTarget) {
    const inlineFontSize = textTarget.style.fontSize;
    const inlineColor = textTarget.style.color;

    if (fontSizeInput) {
      if (inlineFontSize) {
        fontSizeInput.value = parseInt(inlineFontSize);
      } else {
        const computedSize = parseFloat(
          window.getComputedStyle(textTarget).fontSize,
        );
        fontSizeInput.value = Math.round(computedSize * 0.75);
      }
    }

    if (textColorInput) {
      textColorInput.value = rgbToHex(
        inlineColor || window.getComputedStyle(textTarget).color,
      );
    }

    if (!textTarget.innerHTML.trim()) {
      editorDiv.innerHTML = "<p><br></p>";
    } else {
      editorDiv.innerHTML = textTarget.innerHTML;
    }
  } else {
    editorDiv.innerHTML = "";
  }

  // --- 3. ALIGNMENT SYNC (STRICTLY FROM TD ATTRIBUTE) ---
  const alignDropdown = document.getElementById("alignmentSelect");
  if (alignDropdown) {
    // We prioritize the 'align' attribute from the template's TD
    let currentAlign = targetForStyle.getAttribute("align") || "left";
    // Set the dropdown value
    alignDropdown.value = currentAlign.toLowerCase();

    // Visually align the sidebar text area to match
    editorDiv.style.textAlign = currentAlign.toLowerCase();
  }

  // --- 4. Background Color Logic ---
  let currentBg =
    targetForStyle.getAttribute("bgcolor") ||
    targetForStyle.style.backgroundColor;
  if (
    !currentBg ||
    currentBg === "transparent" ||
    currentBg === "rgba(0, 0, 0, 0)"
  ) {
    currentBg = style.backgroundColor;
  }
  bgColorInput.value = rgbToHex(currentBg);

  // --- 5. CTA Specific Color ---
  const btnBgInput = document.getElementById("btnBgColor");
  if (type === "cta") {
    const buttonTd = element.querySelector("table td[bgcolor]");
    if (buttonTd) btnBgInput.value = rgbToHex(buttonTd.getAttribute("bgcolor"));
  } else {
    if (btnBgInput) btnBgInput.value = bgColorInput.value;
  }

  // --- 6. Spacing logic ---
  const getVal = (el, prop) => parseInt(el.style[prop]) || 0;
  document.getElementById("paddingTop").value =
    getVal(targetForStyle, "paddingTop") || parseInt(style.paddingTop) || 0;
  document.getElementById("paddingRight").value =
    getVal(targetForStyle, "paddingRight") || parseInt(style.paddingRight) || 0;
  document.getElementById("paddingBottom").value =
    getVal(targetForStyle, "paddingBottom") ||
    parseInt(style.paddingBottom) ||
    0;
  document.getElementById("paddingLeft").value =
    getVal(targetForStyle, "paddingLeft") || parseInt(style.paddingLeft) || 0;

  if (element.tagName === "DIV") {
    document.getElementById("marginTop").value = getVal(element, "marginTop");
    document.getElementById("marginRight").value = getVal(
      element,
      "marginRight",
    );
    document.getElementById("marginBottom").value = getVal(
      element,
      "marginBottom",
    );
    document.getElementById("marginLeft").value = getVal(element, "marginLeft");
  } else {
    ["marginTop", "marginRight", "marginBottom", "marginLeft"].forEach((id) => {
      const input = document.getElementById(id);
      if (input) input.value = 0;
    });
  }

  // --- 7. Speaker Logic ---
  const speakerDivEditor = document.querySelector(
    ".edit-container .speaker-div",
  );
  if (type === "speaker" && speakerDivEditor) {
    speakerDivEditor.style.display = "flex";

    const inputs = speakerDivEditor.querySelectorAll("input");
    const ps = element.querySelectorAll("p");
    const pageImg = element.querySelector("img");
    const editorImg = speakerDivEditor.querySelector(".speaker-image img");

    // Use .trim() to kill the extra spaces coming from the HTML indentation
    if (ps[0] && inputs[0]) inputs[0].value = ps[0].textContent.trim();
    if (ps[1] && inputs[1]) inputs[1].value = ps[1].textContent.trim();
    if (ps[2] && inputs[2]) inputs[2].value = ps[2].textContent.trim();

    if (pageImg && editorImg) editorImg.src = pageImg.src;

    // This ensures the editor box doesn't look jagged
    editorDiv.style.textAlign = "left";
  }

  // --- 8. Banner Logic ---
  if (type === "banner") {
    const bannerImg = element.querySelector("img");
    const bannerImagePreview = document.getElementById("bannerImagePreview");
    bannerImagePreview.src = newBannerImageURL || bannerImg.src;
  }

  // --- 9. Sticky Note State ---
  const noteCheckbox = document.querySelector('label[for="addNote"] input');
  const noteInput = document.getElementById("noteFor");
  const existingNote = element.querySelector(".component-note");

  if (existingNote) {
    if (noteCheckbox) noteCheckbox.checked = true;
    if (noteInput) {
      noteInput.style.display = "block";
      noteInput.value = existingNote.textContent;
    }
  } else {
    if (noteCheckbox) noteCheckbox.checked = false;
    if (noteInput) {
      noteInput.style.display = "none";
      noteInput.value = "";
    }
  }
}

applyBtn.addEventListener("click", (e) => {
  if (!activeElement) return;
  e.stopPropagation();

  const type = activeElement.dataset.component;
  const targetForStyle =
    activeElement.tagName === "TR"
      ? activeElement.querySelector("td")
      : activeElement;

  // --- 1. APPLY LAYOUT & BACKGROUND STYLES ---
  const bgColor = document.getElementById("bgColor").value;
  targetForStyle.setAttribute("bgcolor", bgColor);
  targetForStyle.style.backgroundColor = bgColor;

  targetForStyle.style.paddingTop =
    document.getElementById("paddingTop").value + "px";
  targetForStyle.style.paddingRight =
    document.getElementById("paddingRight").value + "px";
  targetForStyle.style.paddingBottom =
    document.getElementById("paddingBottom").value + "px";
  targetForStyle.style.paddingLeft =
    document.getElementById("paddingLeft").value + "px";

  if (activeElement.tagName === "DIV") {
    activeElement.style.marginTop =
      document.getElementById("marginTop").value + "px";
    activeElement.style.marginBottom =
      document.getElementById("marginBottom").value + "px";
  }

  // --- 2. ALIGNMENT LOGIC (UPDATING TD ATTRIBUTE) ---
  const selectedAlign = document.getElementById("alignmentSelect").value;

  // Set the 'align' attribute on the TD (Main request)
  targetForStyle.setAttribute("align", selectedAlign);
  // Also set CSS for the browser preview
  targetForStyle.style.textAlign = selectedAlign;

  // Sync the sidebar editor visually
  editorDiv.style.textAlign = selectedAlign;

  if (type === "cta") {
    // Nested tables in email need the align attribute to move physically
    const innerTable = activeElement.querySelector("table");
    if (innerTable) {
      innerTable.setAttribute("align", selectedAlign);
      if (selectedAlign === "center") innerTable.style.margin = "0 auto";
      else if (selectedAlign === "right")
        innerTable.style.margin = "0 0 0 auto";
      else innerTable.style.margin = "0 auto 0 0";
    }
  } else if (type === "speaker") {
    // For speaker, we apply to the 3rd TD (the text container)
    const speakerTextTd = activeElement.querySelectorAll("td")[2];
    if (speakerTextTd) {
      speakerTextTd.setAttribute("align", selectedAlign);
      speakerTextTd.style.textAlign = selectedAlign;
    }
  }

  // --- 3. HANDLE CONTENT LOGIC ---
  if (type === "speaker") {
    const speakerDivEditor = document.querySelector(
      ".edit-container .speaker-div",
    );
    const ps = activeElement.querySelectorAll("p");
    const inputs = speakerDivEditor.querySelectorAll("input");
    const speakerEditorImg =
      speakerDivEditor.querySelector(".speaker-image img");
    const pageImg = activeElement.querySelector("img");
    if (ps[0]) ps[0].textContent = inputs[0].value;
    if (ps[1]) ps[1].textContent = inputs[1].value;
    if (ps[2]) ps[2].textContent = inputs[2].value;
    if (pageImg) pageImg.src = speakerEditorImg.src;

    // Force speaker text alignment
    ps.forEach((p) => (p.style.textAlign = selectedAlign));
  } else {
    let target;
    if (type === "headline") target = activeElement.querySelector("p");
    else if (type === "content") target = activeElement.querySelector("p");
    else if (type === "cta") target = activeElement.querySelector("a");
    else if (type === "banText") target = activeElement.querySelector("p");

    if (target) {
      target.innerHTML = editorDiv.innerHTML;

      // Ensure the text tag inside matches the alignment
      target.style.textAlign = selectedAlign;

      if (!editorDiv.innerHTML.includes('style="color')) {
        target.style.color = textColorInput.value;
      } else {
        target.style.color = "";
      }

      if (fontSizeInput) {
        target.style.fontSize = fontSizeInput.value + "pt";
      }
    }
  }

  // --- 4. HANDLE BANNER IMAGE ---
  if (newBannerImageURL && type === "banner") {
    const bannerImage = activeElement.querySelector("img");
    if (bannerImage) bannerImage.src = newBannerImageURL;
  }

  // --- 5. HANDLE CTA BUTTON SPECIFICS ---
  if (type === "cta") {
    const buttonTd = activeElement.querySelector("table td a")?.closest("td");
    const buttonLink = activeElement.querySelector("a");
    if (buttonTd) {
      const newBtnBg = document.getElementById("btnBgColor").value;
      buttonTd.setAttribute("bgcolor", newBtnBg);
      buttonTd.style.backgroundColor = newBtnBg;
    }
    if (buttonLink) {
      buttonLink.style.color = textColorInput.value;
    }
  }

  // --- 6. HANDLE NOTE LOGIC ---
  const noteCheckbox = document.querySelector('label[for="addNote"] input');
  const noteInput = document.getElementById("noteFor");
  let noteBubble = activeElement.querySelector(".component-note");
  if (noteCheckbox && noteCheckbox.checked && noteInput.value.trim() !== "") {
    if (!noteBubble) {
      noteBubble = document.createElement("div");
      noteBubble.className = "component-note";
      activeElement.style.position = "relative";
      activeElement.appendChild(noteBubble);
    }
    noteBubble.textContent = noteInput.value;
  } else if (noteBubble) {
    noteBubble.remove();
  }

  // --- 7. VISUAL FEEDBACK & SAVING ---
  const originalText = applyBtn.textContent;
  applyBtn.textContent = "Applied!";
  applyBtn.style.backgroundColor = "#28a745";
  setTimeout(() => {
    applyBtn.textContent = originalText;
    applyBtn.style.backgroundColor = "";
  }, 1000);

  autoSave();
});

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
      ".editor-section, #section-actions",
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
textColorInput.addEventListener("change", () => {
  const sel = window.getSelection();
  const color = textColorInput.value;

  // Force the browser to use <span> instead of <font>
  document.execCommand("styleWithCSS", false, true);

  if (
    sel.rangeCount > 0 &&
    !sel.isCollapsed &&
    isSelectionInside(sel, editorDiv)
  ) {
    restoreSelection();
    // Clean existing formatting in selection before applying new color
    document.execCommand("removeFormat", false, "foreColor");
    document.execCommand("foreColor", false, color);
    saveSelection();
  } else {
    // Apply to whole block
    editorDiv.style.color = color;
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

// RESET EDITOR CONTENT
// -----------------------------
resetBtn.addEventListener("click", () => {
  if (!activeElement) return;
  const type = activeElement.dataset.component;
  updateEditor(type, activeElement);

  // Visual feedback for the user
  const originalText = resetBtn.textContent;
  resetBtn.textContent = "Reset Done!";

  setTimeout(() => {
    resetBtn.textContent = originalText;
  }, 1000);
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

    if (cmd === "underline") {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        let parent = selection.anchorNode.parentElement;

        // Check if we are inside a link (<a>)
        const anchor = parent.closest("a");

        if (anchor) {
          // Toggle underline on the link manually
          if (anchor.style.textDecoration === "underline") {
            anchor.style.textDecoration = "none";
          } else {
            anchor.style.textDecoration = "underline";
          }
          return; // Skip the standard execCommand
        }
      }
    }

    // Default behavior for Bold, Italic, and normal text Underline
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
  document.execCommand("styleWithCSS", false, true);

  const sel = window.getSelection();
  if (!sel.rangeCount || sel.isCollapsed) return;

  // Instead of creating a span manually, use the browser command
  // but clean the formatting first to prevent "Russian Doll" spans
  document.execCommand("removeFormat", false, "foreColor");
  document.execCommand("foreColor", false, color);

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
    null,
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
  if (!rgb || rgb === "transparent") return "#ffffff";
  const vals = rgb.match(/\d+/g);
  if (!vals) return "#ffffff";
  return (
    "#" +
    vals
      .map((x) => {
        const hex = parseInt(x).toString(16);
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
  ".edit-container .speaker-div",
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
    ".edit-container .speaker-div",
  );

  if (!speakerDivEditor) return;

  const inputs = speakerDivEditor.querySelectorAll("input");
  inputs.forEach((input) => (input.value = ""));

  const img = speakerDivEditor.querySelector(".speaker-image img");
  if (img) img.src = "img/HeadshotPlaceholder.png";

  speakerDivEditor.style.display = "none";
}

// Toggle input visibility
document
  .querySelector('label[for="addNote"] input')
  .addEventListener("change", (e) => {
    const noteInput = document.getElementById("noteFor");
    noteInput.style.display = e.target.checked ? "block" : "none";

    if (!e.target.checked && selectedComponent) {
      const note = selectedComponent.querySelector(".component-note");
      if (note) note.remove();
    }
  });

// Update bubble text as user types
document.getElementById("noteFor").addEventListener("input", (e) => {
  if (!selectedComponent) return;

  let noteBubble = selectedComponent.querySelector(".component-note");

  if (!noteBubble) {
    noteBubble = document.createElement("div");
    noteBubble.className = "component-note";
    // Important: Ensure the parent has relative positioning to anchor the bubble
    selectedComponent.style.position = "relative";
    selectedComponent.appendChild(noteBubble);
  }

  noteBubble.textContent = e.target.value;

  // Remove if empty
  if (e.target.value.trim() === "") {
    noteBubble.remove();
  }
});
// AUTO SAVE
function autoSave() {
  const content = document.querySelector(".oft-content").innerHTML;
  localStorage.setItem("savedEmailTemplate", content);
}
const saveBtn = document.getElementById("saveBtn");

// Function to generate the clean HTML (Shared by Save and Preview)
function getCleanEmailHTML() {
  const emailArea = document.querySelector(".oft-content");
  const clone = emailArea.cloneNode(true);

  // Process Notes into Comments
  const notes = clone.querySelectorAll(".component-note");
  notes.forEach((note) => {
    const commentNode = document.createComment(
      ` Component Note: ${note.textContent.trim()} `,
    );
    note.parentNode.insertBefore(commentNode, note);
    note.remove();
  });

  // Cleanup Editor attributes
  const allElements = clone.querySelectorAll("*");
  allElements.forEach((el) => {
    el.classList.remove("selected", "selectable");
    el.removeAttribute("data-component");
    el.removeAttribute("data-selected-alignment");
    if (el.getAttribute("style") === "") el.removeAttribute("style");
  });

  // Return the full template string
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<meta content="width=device-width, initial-scale=1.0" name="viewport" />
<title>Email Preview</title>
<style type="text/css">
  @media screen and (max-width: 580px) {
    .resize_table_to_320 { width: 100% !important; height: auto; }
    .innertbl { width: 93% !important; height: auto; margin: 0 auto; }
    .mFont { font-size: 12pt !important; }
    .img_Rez { width: 100% !important; height: auto !important; display: block !important; }
    .drop { width: 100% !important; display: block !important; }
  }
</style>
</head>
<body style="margin:0; padding:0;" bgcolor="#e3e3e3">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation" bgcolor="#e3e3e3">
    <tr>
      <td align="center" valign="top">
        <table width="640" border="0" cellspacing="0" cellpadding="0" role="presentation" bgcolor="#FFFFFF" class="resize_table_to_320" style="margin: 0 auto; table-layout: fixed;">
          <tbody><tr><td align="center" valign="top">${clone.innerHTML}</td></tr></tbody>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// PREVIEW BUTTON EVENT
document.getElementById("previewBtn").addEventListener("click", () => {
  const html = getCleanEmailHTML();
  const previewWin = window.open("", "_blank");
  previewWin.document.open();
  previewWin.document.write(html);
  previewWin.document.close();
});

// Update your SAVE BUTTON to use the same function
saveBtn.addEventListener("click", () => {
  const finalHtml = getCleanEmailHTML();
  const blob = new Blob([finalHtml], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "email-template.html";
  a.click();
  URL.revokeObjectURL(url);
});

// PDF SAVE
// saveBtn.addEventListener("click", async () => {
//   const { jsPDF } = window.jspdf;
//   const emailArea = document.querySelector(".oft-content");

//   const clone = emailArea.cloneNode(true);

//   // Apply class to force the note under the component in PDF
//   clone.classList.add("pdf-export-mode");

//   const allElements = clone.querySelectorAll("*");
//   allElements.forEach((el) => {
//     el.classList.remove("selected", "selectable");
//     el.removeAttribute("data-component");
//   });

//   clone.style.width = "660px";
//   clone.style.position = "absolute";
//   clone.style.left = "-9999px";
//   document.body.appendChild(clone);

//   try {
//     const canvas = await html2canvas(clone, {
//       scale: 2,
//       useCORS: true,
//       logging: false,
//     });

//     const imgData = canvas.toDataURL("image/png");
//     const pdf = new jsPDF({
//       orientation: "portrait",
//       unit: "px",
//       format: [canvas.width, canvas.height],
//     });

//     pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
//     pdf.save("email-template.pdf");
//   } catch (error) {
//     console.error("PDF Generation failed:", error);
//   } finally {
//     document.body.removeChild(clone);
//   }
// });

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
  modalEditor.focus();
  if (savedModalSelection) restoreModalSelection();

  const selection = window.getSelection();
  if (selection.toString().length === 0) {
    alert("Please highlight the text you want to turn into a link first.");
    return;
  }

  let url = prompt("Enter the URL:", "https://");

  if (url && url.trim() !== "" && url !== "https://") {
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;

    // Create the link using standard command
    document.execCommand("createLink", false, url);

    // Only add target="_blank", do not touch color or text-decoration
    const links = modalEditor.getElementsByTagName("a");
    for (let link of links) {
      link.setAttribute("target", "_blank");
      link.setAttribute("style", "color:#0078D4");
    }

    saveModalSelection();
  }
});
// FORCING <BR> INSTEAD OF <DIV> OR <P> ON ENTER
function handleEditorEnter(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    document.execCommand("insertLineBreak");
  }
}

// FORCING PLAIN TEXT ONLY ON PASTE
function handlePaste(e) {
  e.preventDefault();
  // 1. Get ONLY the raw characters (Strips all those nested spans)
  const text = (e.originalEvent || e).clipboardData.getData("text/plain");

  // 2. Convert newlines to <br> so it stays in one block
  const cleanHtml = text.replace(/\r?\n/g, "<br>");

  // 3. Insert the clean text
  document.execCommand("insertHTML", false, cleanHtml);
}

// 3. Apply the listeners to both editors
editorDiv.addEventListener("keydown", handleEditorEnter);
editorDiv.addEventListener("paste", handlePaste);

modalEditor.addEventListener("keydown", handleEditorEnter);
modalEditor.addEventListener("paste", handlePaste);
