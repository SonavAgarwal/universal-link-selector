import cN from "classnames";
import styles from "./SwitcherItem.module.css";
import { LinkOption } from "../types";
import { useEffect, useRef } from "react";

interface Props {
	item: LinkOption;
	index: number;
	activeIndex: number;
}

const SwitcherItem = ({ item, index, activeIndex }: Props) => {
	const elementRef = useRef<HTMLDivElement>(null);

	// if the item is active, scroll it into view
	useEffect(() => {
		const active = index === activeIndex;
		if (active) {
			elementRef.current?.scrollIntoView({
				// instant scroll
				behavior: "instant",
				block: "nearest",
			});
		}
	}, [index, activeIndex]);

	const active = index === activeIndex;

	function getTop() {
		if (!item.text) return null;
		return (
			<div className={cN(styles.top)}>
				<h1 className={cN(styles.text)}>{item.text}</h1>
			</div>
		);
	}

	function getBottom() {
		if (!item.text) return null;
		return (
			<div className={cN(styles.bottom)}>
				<p className={cN(styles.link)}>{item.link}</p>
			</div>
		);
	}

	return (
		<div className={cN(styles.item, active && styles.active)} ref={elementRef}>
			{getTop()}
			{getBottom()}
		</div>
	);
};

export default SwitcherItem;
