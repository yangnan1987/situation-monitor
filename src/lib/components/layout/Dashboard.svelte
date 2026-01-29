<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<main class="dashboard">
	<div class="dashboard-grid">
		{@render children()}
	</div>
</main>

<style>
	.dashboard {
		flex: 1;
		padding: 0.5rem;
		overflow-y: auto;
	}

	.dashboard-grid {
		display: grid;
		/* 响应式列布局：自动填充，每列最小 320px，最大 1fr */
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 0.5rem;
		max-width: 2000px;
		margin: 0 auto;
	}

	/* 确保每个面板不会被挤压 */
	.dashboard-grid > :global(*) {
		min-width: 320px;
		min-height: 200px;
	}

	/* 响应式断点 */
	@media (min-width: 600px) and (max-width: 899px) {
		.dashboard-grid {
			grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
		}
	}

	@media (min-width: 900px) and (max-width: 1199px) {
		.dashboard-grid {
			grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
		}
	}

	@media (min-width: 1200px) {
		.dashboard-grid {
			grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
		}
	}

	@media (max-width: 599px) {
		.dashboard-grid {
			/* 移动端单列布局 */
			grid-template-columns: 1fr;
		}
		
		.dashboard-grid > :global(*) {
			min-width: 100%;
		}
	}
</style>
