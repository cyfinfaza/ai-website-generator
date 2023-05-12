// create a store called "conversations" that syncs to localStorage

import { writable } from "svelte/store";
import { browser } from "$app/environment";

export const conversations = writable(
	JSON.parse(browser && window.localStorage.getItem("conversations")) || []
);
if (browser)
	conversations.subscribe((value) =>
		window.localStorage.setItem("conversations", JSON.stringify(value))
	);
