<script>
	import { createEventDispatcher } from "svelte";

	const dispatch = createEventDispatcher();

	let dialogElement;
</script>

<button on:click={() => dialogElement.show()}>
	<slot />
</button>
<dialog bind:this={dialogElement}>
	Are you sure? <button on:click={() => dispatch("click")}>Yes</button>
	<button on:click={dialogElement.close()}>No</button>
</dialog>
