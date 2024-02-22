chrome.commands.onCommand.addListener((command) => {
	// console.log(`Command: ${command}`);

	if (command !== "open-switcher") return;

	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		chrome.tabs.sendMessage(tabs[0].id, { action: "show-switcher-modal" });
	});
});
