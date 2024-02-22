let modalIsOpen = false;
let originalFocus = null;

function mountSwitcherModal() {
	// Create the modal overlay
	const overlay = document.createElement("div");
	overlay.id = "switcher-modal-overlay";
	overlay.setAttribute(
		"style",
		`
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: transparent;
      z-index: 10000;
      justify-content: center;
      align-items: center;
      display: none;
      color-scheme: auto;
    `
	);

	// Create the iframe to load index.html
	const iframe = document.createElement("iframe");
	iframe.id = "switcher-modal";
	iframe.src = chrome.runtime.getURL("index.html");
	iframe.style.width = "100%";
	iframe.style.height = "100%";
	iframe.style.border = "none";
	iframe.setAttribute("allowTransparency", "true");
	iframe.style.backgroundColor = "transparent";

	// Append the iframe to the overlay, and the overlay to the document body
	overlay.appendChild(iframe);
	document.body.appendChild(overlay);

	// Close the modal when clicking outside the iframe
	overlay.addEventListener("click", function (e) {
		if (e.target === overlay) {
			hideSwitcherModal();
		}
	});
	// close the modal on escape key
	document.addEventListener("keydown", function (e) {
		if (e.key === "Escape") {
			hideSwitcherModal();
		}
	});
}

mountSwitcherModal();

function showSwitcherModal() {
	// Save the currently focused element
	originalFocus = document.activeElement;

	modalIsOpen = true;

	const overlay = document.getElementById("switcher-modal-overlay");
	overlay.style.display = "flex";

	// get the modal iframe and focus it
	const modal = getModal();

	modal.contentWindow.focus();
	modal.contentWindow.postMessage({ action: "focusInput" }, "*");
}

function hideSwitcherModal() {
	modalIsOpen = false;
	const overlay = document.getElementById("switcher-modal-overlay");
	overlay.style.display = "none";

	// Restore the focus to the previously focused element
	originalFocus.focus();
}

function getModal() {
	return document.getElementById("switcher-modal");
}

function openModal() {
	const modal = getModal();

	if (!modal) return;
	// if (modalIsOpen) return;

	// use postMessage to communicate with the iframe
	// send the iframe a list of anchors on the page
	// and their hrefs
	const anchors = Array.from(document.querySelectorAll("a"));
	const anchorData = anchors.map((a) => ({
		link: a.href,
		text: a.innerText,
	}));

	modal.contentWindow.postMessage(
		{
			action: "openModal",
			anchors: anchorData,
		},
		"*"
	);

	showSwitcherModal();
}

function closeModal() {
	const modal = getModal();

	if (!modal) return;

	// hide the modal
	hideSwitcherModal();
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === "show-switcher-modal") {
		openModal();
	}
});

// Listen for messages from the iframe
window.addEventListener("message", (event) => {
	const { action } = event.data;

	switch (action) {
		case "closeModal":
			closeModal();
			break;
		case "openLink":
			closeModal();
			window.location.href = event.data.link;
			break;
		default:
			break;
	}
});
