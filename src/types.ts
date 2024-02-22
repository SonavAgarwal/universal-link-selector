export enum LinkType {
	anchor = "anchor",
	button = "button",
}

export interface LinkOption {
	text: string;
	link: string;

	type?: LinkType;
	attributes?: string;
	lastVisited?: Date;
}

export interface SavedLinks {
	[key: string]: LinkOption;
}
