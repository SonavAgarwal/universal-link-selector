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
	if (modalIsOpen) return;

	// Save the currently focused element
	originalFocus = document.activeElement;

	const overlay = document.getElementById("switcher-modal-overlay");
	overlay.style.display = "flex";

	// get the modal iframe and focus it
	const modal = getModal();

	if (!modal) return;

	modalIsOpen = true;
	modal.contentWindow.focus();
	modal.contentWindow.postMessage({ action: "focusInput" }, "*");
}

function hideSwitcherModal() {
	modalIsOpen = false;
	const overlay = document.getElementById("switcher-modal-overlay");
	overlay.style.display = "none";

	// Restore the focus to the previously focused element
	if (originalFocus) originalFocus.focus();
}

function getModal() {
	return document.getElementById("switcher-modal");
}

function openModal() {
	const modal = getModal();

	if (!modal) return;

	// Find all the anchor tags in the page
	const anchors = Array.from(document.querySelectorAll("a"));
	let anchorData = anchors.map((a) => {
		let serializedAttributes = null;

		if (!a.href) {
			// extract all the attributes from the anchor
			let attributes = Array.from(a.attributes).map((attr) => {
				return {
					name: attr.name,
					value: attr.value,
				};
			});
			// serialize the attributes to a string
			serializedAttributes = JSON.stringify(attributes);
		}

		return {
			type: "anchor",
			link: a.href,
			text: a.innerText,
			attributes: serializedAttributes,
		};
	});

	// combine all the duplicate links by concatenating their text
	let linkMap = new Map();
	anchorData.forEach((a) => {
		if (linkMap.has(a.link)) {
			let existingLink = linkMap.get(a.link);
			// if the new text is already in the existing text, don't add it
			if (!existingLink.text.includes(a.text)) {
				existingLink.text += " " + a.text;
			}
		} else {
			linkMap.set(a.link, a);
		}
	});
	anchorData = Array.from(linkMap.values());

	// Find all the buttons in the page
	const buttons = Array.from(document.querySelectorAll("button"));
	const buttonData = buttons.map((b) => {
		let serializedAttributes = null;
		let attributes = Array.from(b.attributes).map((attr) => {
			return {
				name: attr.name,
				value: attr.value,
			};
		});
		serializedAttributes = JSON.stringify(attributes);
		let linkObject = {
			type: "button",
			text: b.innerText,
			link: "button",
			attributes: serializedAttributes,
		};

		return linkObject;
	});

	// Find all divs with click event listeners
	// (look for onclick or onmousedown or role=button or role=link)
	const divs = Array.from(
		document.querySelectorAll(
			"div[onclick], div[onmousedown], div[role='button'], div[role='link'], div[jsaction]"
		)
	);

	// let jsactionDivs = Array.from(document.querySelectorAll("div[jsaction]"));
	// // keep only the ones with jsaction that has a click, mousedown or touchstart event
	// jsactionDivs.forEach((d) => {
	// 	let jsaction = d.getAttribute("jsaction");
	// 	if (
	// 		jsaction.includes("click") ||
	// 		jsaction.includes("mousedown") ||
	// 		jsaction.includes("touchstart")
	// 	) {
	// 		divs.push(d);
	// 	}
	// });

	const divData = divs.map((d) => {
		let divText = d.innerText;

		// split the div text by new lines and take the first line
		if (divText) {
			divText = divText.split("\n")[0];
		}

		// recursively find the text of the div inside any of its children

		// let elementStack = [d];

		// while (elementStack.length > 0) {
		// 	let element = elementStack.pop();
		// 	if (element.innerText) {
		// 		divText += " " + element.innerText;
		// 	} else {
		// 		for (let i = 0; i < element.children.length; i++) {
		// 			elementStack.push(element.children[i]);
		// 		}
		// 	}

		// 	console.log("ELEMENT STACK: ", elementStack);
		// 	console.log("DIV TEXT: ", divText);

		// 	if (divText.length > 0) break;
		// }

		// function findText(node, depth) {
		// 	if (depth > 3) return;
		// 	if (node.innerText) {
		// 		divText += " " + node.innerText;
		// 		return;
		// 	} else {
		// 		for (let i = 0; i < node.children.length; i++) {
		// 			findText(node.children[i], depth + 1);
		// 			if (divText.length > 0) break;
		// 		}
		// 	}
		// }

		// findText(d);

		const attributes = Array.from(d.attributes).map((attr) => {
			return {
				name: attr.name,
				value: attr.value,
			};
		});
		serializedAttributes = JSON.stringify(attributes);

		let linkObject = {
			type: "div",
			text: divText,
			link: "clickable div",
			attributes: serializedAttributes,
		};

		// console.log(linkObject);

		return linkObject;
	});

	const inputs = Array.from(
		document.querySelectorAll(
			"input[type='text'], input[type='email'], input[type='password'], textarea"
		)
	);
	const inputData = inputs.map((i) => {
		let serializedAttributes = null;
		let attributes = Array.from(i.attributes).map((attr) => {
			return {
				name: attr.name,
				value: attr.value,
			};
		});
		serializedAttributes = JSON.stringify(attributes);

		let elementType = i.tagName.toLowerCase();

		return {
			type: elementType,
			text: i.placeholder + " " + i.value,
			link: "focus input",
			attributes: serializedAttributes,
		};
	});

	links = [...anchorData, ...buttonData, ...divData, ...inputData];

	// remove anything that doesn't have a link or text
	links = links.filter((l) => {
		return l.link && l.text;
	});

	modal.contentWindow.postMessage(
		{
			action: "openModal",
			links: links,
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

			let linkOption = event.data.link;

			// console.log("OPENING LINK: ", linkOption);

			if (linkOption.type === "anchor" && linkOption.link) {
				window.location.href = linkOption.link;
			} else if (["input", "textarea"].includes(linkOption.type)) {
				// find the input in the page and focus it
				let elementType = linkOption.type;
				const allInputs = Array.from(document.querySelectorAll(elementType));
				const elem = allInputs.find((i) => {
					const attributes = JSON.parse(linkOption.attributes);
					const matches = attributes.every((attr) => {
						return i.getAttribute(attr.name) === attr.value;
					});

					// if (matches) console.log("MATCHES: ", linkOption, attributes);

					return matches;
				});

				if (elem) {
					elem.scrollIntoView({ behavior: "instant" });
					elem.focus();
					// scroll to the input
				}
			} else {
				// find the link in the page and click it
				// use the attributes to find the link
				let elementType = "";
				switch (linkOption.type) {
					case "anchor":
						elementType = "a";
						break;
					case "button":
						elementType = "button";
						break;
					case "div":
						elementType = "div";
						break;
					default:
						elementType = "a";
						break;
				}

				const allAnchors = Array.from(document.querySelectorAll(elementType));
				const elem = allAnchors.find((a) => {
					const attributes = JSON.parse(linkOption.attributes);
					const matches = attributes.every((attr) => {
						return a.getAttribute(attr.name) === attr.value;
					});

					// if (matches) console.log("MATCHES: ", linkOption, attributes);

					return matches;
				});

				if (elem) {
					// scroll to the link
					elem.scrollIntoView({ behavior: "instant" });
					elem.click();
				}
			}
			break;
		default:
			break;
	}
});
