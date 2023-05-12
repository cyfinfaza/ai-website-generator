<script>
	import { onMount, tick } from "svelte";
	import { conversations } from "$lib/stores";

	let iframeCode = "sample code";
	let buttonMessage = "Send";
	let controlsActive = true;
	let prompt = "";

	let currentConversationIndex = -1;
	// $: changeConversation(currentConversationIndex);

	function changeConversation(index) {
		if (index !== -1) {
			conversation = $conversations[index];
			viewingConvIndex = conversation.length - 1;
		} else {
			conversation = [];
		}
		currentConversationIndex = index;
	}

	let viewingConvIndex = -1;

	let conversation = [];
	$: console.log(conversation);

	onMount(() => {
		window.importConv = function (str) {
			conversation = JSON.parse(str);
			viewingConvIndex = conversation.length - 1;
		};
	});

	async function submitPrompt() {
		controlsActive = false;
		buttonMessage = "Loading...";
		if (currentConversationIndex == -1) {
			$conversations = [...$conversations, []];
			currentConversationIndex = $conversations.length - 1;
			tick();
		}
		conversation = [...conversation, { role: "user", content: prompt }];
		console.log(conversation);
		// $conversations[currentConversationIndex] = conversation;
		prompt = "";
		const response = await fetch("/api/generate", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(conversation),
		});
		const data = await response.json();
		const rawResponse = data.content;
		// get the code starting with <!DOCTYPE html> and ending with </html> from the response text
		const htmlCode =
			rawResponse.match(/<!DOCTYPE html>[\s\S]*<\/html>/)?.[0] ||
			"<p color='red'>Generation Failed";
		console.log(conversation);
		conversation = [...conversation, { role: "assistant", content: htmlCode }];
		console.log(conversation);
		$conversations[currentConversationIndex] = conversation;
		console.log(conversation);

		viewingConvIndex = conversation.length - 1;
		console.log(conversation);

		buttonMessage = "Send";
		controlsActive = true;
	}

	$: iframeCode = conversation?.[viewingConvIndex]?.content;

	function restoreToIndex() {
		conversation = conversation.slice(0, viewingConvIndex + 1);
		viewingConvIndex = conversation.length - 1;
		$conversations[currentConversationIndex] = conversation;
	}
</script>

<main>
	<div class="conversation" class:controlsInactive={!controlsActive}>
		<div style="display: flex;gap: 8px;">
			<select
				bind:value={currentConversationIndex}
				on:change={(e) => changeConversation(e.target.value)}
				disabled={!controlsActive}
			>
				{#each $conversations as conv, index}
					<option value={index}>{conv?.[0]?.content || index + 1}</option>
				{/each}
			</select>
			<button on:click={() => changeConversation(-1)} disabled={!controlsActive}
				>New Session</button
			>
		</div>
		{#each conversation as message, index}
			{#if message.role === "user"}
				<p
					on:click={() => (viewingConvIndex = index + 1)}
					class:viewingMe={viewingConvIndex == index + 1}
					class="conversationBubble"
				>
					{message.content}
				</p>
			{/if}
		{/each}
		<input
			type="text"
			autofocus
			bind:value={prompt}
			on:keypress={(e) => {
				if (e.key === "Enter") {
					submitPrompt();
				}
			}}
			placeholder="Tell the AI what to do"
			disabled={!controlsActive}
		/>
		<button on:click={() => submitPrompt()} disabled={!controlsActive}>
			{buttonMessage}
		</button>
		<button
			on:click={() => restoreToIndex()}
			style:display={viewingConvIndex != conversation.length - 1
				? null
				: "none"}
			disabled={!controlsActive}
		>
			Restore to this point (DELETES STUFF)
		</button>
	</div>
	<iframe class="preview" srcdoc={iframeCode} frameborder="0" />
</main>

<style>
	:global(body) {
		margin: 0;
		background-color: black;
		color: white;
		font-family: sans-serif;
	}
	button,
	input,
	a,
	select {
		color: inherit;
		font-family: inherit;
	}
	main {
		width: 100vw;
		height: 100vh;
		display: grid;
		grid-template-columns: 300px 1fr;
	}
	.conversation {
		background-color: #222;
		display: flex;
		flex-direction: column;
		padding: 12px;
		gap: 8px;
	}
	.preview {
		width: 100%;
		height: 100%;
		background-color: white;
	}
	input,
	button,
	select {
		border: none;
		background-color: #fff;
		color: black;
		padding: 8px;
		border-radius: 8px;
	}
	.conversationBubble {
		background-color: #fff2;
		padding: 8px;
		border-radius: 8px;
		margin: 0;
		box-sizing: border-box;
	}
	.controlsInactive {
		filter: contrast(0.7);
		pointer-events: none;
	}
	.viewingMe {
		border-left: 8px solid #fe0;
	}

	button,
	.conversationBubble,
	select {
		cursor: pointer;
	}

	button,
	.conversationBubble,
	input,
	select {
		transition: 120ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}

	:is(button, .conversationBubble, input, select):active {
		transform: scale(0.98);
	}

	select {
		overflow: hidden;
		width: 200px;
	}
</style>
