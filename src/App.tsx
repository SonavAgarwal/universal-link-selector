import cN from "classnames";
import FuzzySearch from "fuzzy-search";
import { useEffect, useReducer, useRef, useState } from "react";
import styles from "./App.module.css";
import SwitcherItem from "./components/SwitcherItem";
import { LinkOption } from "./types";

const sampleData: LinkOption[] = [
	{ text: "Google", link: "https://www.google.com" },
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
				let newLinks: LinkOption[] = event.data.links || [];

				newLinks = addLinkDates(newLinks);

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
				setTimeout(() => {
					if (searchRef.current) {
						searchRef.current.focus();
					}
				}, 100);
				break;
			default:
				break;
		}
	};

	function saveLink(link: LinkOption) {
		const savedLinks = localStorage.getItem("savedLinks");
		const linkMap = savedLinks ? JSON.parse(savedLinks) : {};
		let linkCopy = { ...link };
		linkCopy.lastVisited = new Date();
		// remove the attributes from the link
		delete linkCopy.attributes;
		linkMap[linkCopy.link] = linkCopy;

		// go through all the links and remove the one's that are older than 30 days
		const currentDate = new Date();
		for (const key in linkMap) {
			if (Object.prototype.hasOwnProperty.call(linkMap, key)) {
				const link = linkMap[key];
				const lastVisited = new Date(link.lastVisited);
				const diffTime = Math.abs(
					currentDate.getTime() - lastVisited.getTime()
				);
				const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
				if (diffDays > 30) {
					delete linkMap[key];
				}
			}
		}

		// save the links to local storage
		localStorage.setItem("savedLinks", JSON.stringify(linkMap));
	}

	function addLinkDates(links: LinkOption[]) {
		const savedLinks = localStorage.getItem("savedLinks");
		const linkMap = savedLinks ? JSON.parse(savedLinks) : {};
		for (const link of links) {
			if (linkMap[link.link]) {
				link.lastVisited = new Date(linkMap[link.link].lastVisited);
			}
		}
		return links;
	}

	function focusNextItem() {
		setActiveIndex((prevIndex) => prevIndex + 1);
	}

	function focusPrevItem() {
		setActiveIndex((prevIndex) => prevIndex - 1);
	}

	function closeModal() {
		window.parent.postMessage({ action: "closeModal" }, "*");
	}

	function openLink(link: LinkOption, newTab: boolean) {
		// save the link to local storage
		saveLink(link);

		if (newTab) {
			window.open(link.link, "_blank");
		} else {
			// send the message to the parent to open the link
			window.parent.postMessage({ action: "openLink", link: link }, "*");
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

	function compareDates(a: Date | undefined, b: Date | undefined) {
		if (!a) a = new Date(0);
		if (!b) b = new Date(0);

		return b.getTime() - a.getTime();
	}

	// sort the links by lastVisited
	filteredLinks.sort((a, b) => {
		return compareDates(a.lastVisited, b.lastVisited);
	});

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
										openLink(filteredLinks[activeIndex], true);
									} else {
										openLink(filteredLinks[activeIndex], false);
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
