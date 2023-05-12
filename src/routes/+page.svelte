<script>
	import { onMount, tick } from "svelte";
	import { conversations } from "$lib/stores";
	import { exportFile } from "$lib/export";
	import AreYouSureButton from "../components/AreYouSureButton.svelte";

	let iframeCode = "sample code";
	let buttonMessage = "Send";
	let controlsActive = true;
	let prompt = "";

	let selectorDialog;

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
		selectorDialog.close();
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
		buttonMessage = "Loading (takes a while)...";
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

	function deleteConversation(index) {
		$conversations = $conversations.filter((_, i) => i !== index);
		if (index === currentConversationIndex) {
			changeConversation(-1);
		}
	}
</script>

<main>
	<div class="conversation" class:controlsInactive={!controlsActive}>
		<div style="display: flex;gap: 1px;">
			<!-- <select
				bind:value={currentConversationIndex}
				on:change={(e) => changeConversation(e.target.value)}
				disabled={!controlsActive}
			>
				{#each $conversations as conv, index}
					<option value={index}>{conv?.[0]?.content || index + 1}</option>
				{/each}
			</select> -->
			<button
				on:click={() => selectorDialog.showModal()}
				style=" width: 100%; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;"
			>
				<strong
					>{$conversations?.[currentConversationIndex]?.[0]?.content ||
						"(session)"}</strong
				>
				<br /> <small>click to switch</small>
			</button>
			<button on:click={() => changeConversation(-1)} disabled={!controlsActive}
				>New Session</button
			>
		</div>
		<div class="historyList">
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
		</div>
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
			style:display={viewingConvIndex < conversation.length - 1 &&
			controlsActive
				? null
				: "none"}
			disabled={!controlsActive}
		>
			Restore to this point (delete all after)
		</button>
		<div
			style="display: flex; justify-content: flex-end; gap: 8px; padding: 8px;"
		>
			{#if iframeCode?.indexOf("<!DOCTYPE html>") == 0}
				<button on:click={() => exportFile(iframeCode, conversation)}
					>&darr; Export</button
				>
			{/if}
		</div>
	</div>
	<iframe
		class="preview"
		srcdoc={iframeCode}
		sandbox="allow-scripts allow-forms allow-pointer-lock"
		frameborder="0"
	/>
	<dialog bind:this={selectorDialog}>
		<button on:click={() => selectorDialog.close()}>close</button>
		<div class="selectorList">
			{#each $conversations as conversation, index}
				<div>
					<span>{conversation?.[0]?.content || index + 1}</span>
					<button on:click={() => changeConversation(index)}>Open</button>
					<AreYouSureButton on:click={() => deleteConversation(index)}
						>Delete</AreYouSureButton
					>
				</div>
			{/each}
		</div>
	</dialog>
</main>

<style lang="scss">
	main {
		width: 100vw;
		height: 100vh;
		display: grid;
		grid-template-columns: min(400px, 50vw) 1fr;
		font-size: 1.2em;
		overflow: hidden;
	}
	.conversation {
		background-color: #222;
		display: flex;
		flex-direction: column;
		padding: 1px;
		gap: 1px;
		height: 100%;
		overflow: auto;
	}
	.preview {
		width: 100%;
		height: 100%;
		background-color: white;
	}
	.conversationBubble {
		background-color: #fff3;
		padding: 8px;
		border-radius: 0px;
		margin: 0;
		box-sizing: border-box;
	}
	.controlsInactive {
		filter: contrast(0.7);
		pointer-events: none;
	}
	.viewingMe {
		border-right: 4px solid #fe0;
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

	.selectorList {
		display: flex;
		flex-direction: column;
		// gap: 1px;
		> * {
			display: grid;
			grid-template-columns: 1fr auto auto;
			gap: 8px;
			align-items: center;
			padding: 8px;
			&:nth-child(2n) {
				background-color: #fff1;
			}
			&:nth-child(2n-1) {
				background-color: #fff2;
			}
			> span {
				margin-right: 12px;
			}
		}
	}

	.historyList {
		display: flex;
		flex-direction: column;
		gap: 1px;
		margin-block: 3px;
		&:empty {
			gap: 0;
			margin-block: 0;
		}
	}
</style>
