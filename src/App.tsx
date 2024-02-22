import cN from "classnames";
import FuzzySearch from "fuzzy-search";
import { useEffect, useReducer, useRef, useState } from "react";
import styles from "./App.module.css";
import SwitcherItem from "./components/SwitcherItem";
import { LinkOption } from "./types";

const sampleData: LinkOption[] = [
	{ text: "Google", link: "https://www.google.com" },
	{ text: "Facebook", link: "https://www.facebook.com" },
	{ text: "Twitter", link: "https://www.twitter.com" },
	{ text: "Instagram", link: "https://www.instagram.com" },
	{ text: "LinkedIn", link: "https://www.linkedin.com" },
	{ text: "Reddit", link: "https://www.reddit.com" },
	{ text: "Pinterest", link: "https://www.pinterest.com" },
	{ text: "TikTok", link: "https://www.tiktok.com" },
	{ text: "Snapchat", link: "https://www.snapchat.com" },
	{ text: "WhatsApp", link: "https://www.whatsapp.com" },
	{ text: "Telegram", link: "https://www.telegram.com" },
	{ text: "Signal", link: "https://www.signal.com" },
	{ text: "Skype", link: "https://www.skype.com" },
	{ text: "Zoom", link: "https://www.zoom.com" },
	{ text: "Slack", link: "https://www.slack.com" },
	{ text: "Discord", link: "https://www.discord.com" },
	{ text: "Twitch", link: "https://www.twitch.com" },
	{ text: "YouTube", link: "https://www.youtube.com" },
	{ text: "Vimeo", link: "https://www.vimeo.com" },
	{ text: "Spotify", link: "https://www.spotify.com" },
	{ text: "Apple Music", link: "https://www.apple.com" },
	{ text: "SoundCloud", link: "https://www.soundcloud.com" },
	{ text: "Bandcamp", link: "https://www.bandcamp.com" },
	{ text: "Tidal", link: "https://www.tidal.com" },
	{ text: "Deezer", link: "https://www.deezer.com" },
	{ text: "Pandora", link: "https://www.pandora.com" },
	{ text: "Amazon Music", link: "https://www.amazon.com" },
];

function App() {
	// force update
	const [, forceUpdate] = useReducer((x) => x + 1, 0);

	const searchRef = useRef<HTMLInputElement>(null);
	const [searchValue, setSearchValue] = useState<string>("");
	const [activeIndex, setActiveIndex] = useState<number>(0);
	const fuzzySearcher = useRef<FuzzySearch<LinkOption> | null>(
		new FuzzySearch(sampleData, ["text"], { caseSensitive: false })
	);
	const links = useRef<LinkOption[]>(sampleData);

	useEffect(() => {
		window.addEventListener("message", handleModalOpen);
		return () => window.removeEventListener("message", handleModalOpen);
	}, []);

	const handleModalOpen = (event: any) => {
		// IMPORTANT: Check the origin of the data! (event.origin)

		const action = event.data.action;
		switch (action) {
			case "openModal":
				let newLinks: LinkOption[] = event.data.anchors || [];

				links.current = newLinks;
				forceUpdate();

				const fs = new FuzzySearch(newLinks, ["text"], {
					caseSensitive: false,
				});
				fuzzySearcher.current = fs;

				break;
			case "closeModal":
				break;
			case "focusInput":
				// focus on the input
				if (searchRef.current) {
					searchRef.current.focus();
				}
				break;
			default:
				break;
		}
	};

	function focusNextItem() {
		setActiveIndex((prevIndex) => prevIndex + 1);
	}

	function focusPrevItem() {
		setActiveIndex((prevIndex) => prevIndex - 1);
	}

	function closeModal() {
		window.parent.postMessage({ action: "closeModal" }, "*");
	}

	function openLink(link: string, newTab: boolean) {
		if (newTab) {
			window.open(link, "_blank");
		} else {
			// send the message to the parent to open the link
			window.parent.postMessage({ action: "openLink", link }, "*");
		}
	}

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "ArrowUp") {
				focusPrevItem();
			} else if (event.key === "ArrowDown") {
				focusNextItem();
			} else if (event.key === "Escape") {
				// close the modal
				closeModal();
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [links.current]); // Depend on links.length so it updates if the number of links changes

	// use fuzzy search to filter the links right before rendering
	let filteredLinks = links.current;
	if (searchValue?.length > 0 && fuzzySearcher.current !== null) {
		filteredLinks = fuzzySearcher.current.search(searchValue);
	}

	const activeIndexClamped =
		(activeIndex + filteredLinks.length) % filteredLinks.length;

	return (
		<div className={cN(styles.app, "App")}>
			<div className={cN(styles.modal)}>
				<div className={cN(styles.inputContainer)}>
					<input
						type="text"
						placeholder="Search"
						className={cN(styles.input)}
						ref={searchRef}
						onChange={(e) => {
							setSearchValue(e.target.value);
						}}
						value={searchValue}
						// detect enter key press
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								// open the link
								if (filteredLinks[activeIndex]) {
									// if command is pressed, open the link in a new tab
									// else open the link in the same tab
									if (e.metaKey) {
										openLink(filteredLinks[activeIndex].link, true);
									} else {
										openLink(filteredLinks[activeIndex].link, false);
									}
								} else {
									// close the modal
									closeModal();
								}
							} else if (e.key === "Tab") {
								e.preventDefault();
								// if shift is pressed, focus the previous item
								if (e.shiftKey) {
									focusPrevItem();
								} else {
									focusNextItem();
								}
							}
							// else if (e.key === "Escape") {
							// 	// e.preventDefault();
							// 	// close the modal
							// 	closeModal();
							// 	e.stopPropagation();
							// }
						}}
					/>
				</div>

				<div className={cN(styles.items)}>
					{filteredLinks?.map((link, index) => (
						<SwitcherItem
							key={index}
							item={link}
							index={index}
							activeIndex={activeIndexClamped}
						/>
					))}

					{filteredLinks.length === 0 && (
						<div className={cN(styles.noResults)}>
							<p className={cN(styles.noResultsText)}>No results found</p>
							<p className={cN(styles.noResultsTextSub)}>
								Close the search modal
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default App;
