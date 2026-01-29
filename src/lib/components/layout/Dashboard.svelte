<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import { layout } from '$lib/stores';
	import type { PanelId } from '$lib/config';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	// 拖拽状态
	let draggingPanel: PanelId | null = $state(null);
	let dragStartPos = $state({ x: 0, y: 0 });
	let dragOffset = $state({ x: 0, y: 0 });
	let resizingPanel: PanelId | null = $state(null);
	let resizeStartSize = $state({ w: 0, h: 0 });
	let resizeStartPos = $state({ x: 0, y: 0 });

	// 网格配置
	const GRID_COLS = 12;
	const GRID_ROW_HEIGHT = 80; // 每个网格行的高度（px）
	const GAP = 8; // 间距（px）

	// 在 Mount 时加载布局
	onMount(() => {
		layout.init();
		console.log('[Dashboard] 布局已初始化');
	});

	// 拖拽开始
	function handleDragStart(event: MouseEvent, panelId: PanelId) {
		draggingPanel = panelId;
		dragStartPos = { x: event.clientX, y: event.clientY };

		const panelLayout = $layout.panels[panelId];
		if (panelLayout) {
			dragOffset = { x: panelLayout.x, y: panelLayout.y };
		}

		// 添加全局鼠标事件监听
		document.addEventListener('mousemove', handleDragMove);
		document.addEventListener('mouseup', handleDragEnd);
	}

	// 拖拽移动
	function handleDragMove(event: MouseEvent) {
		if (!draggingPanel) return;

		const deltaX = event.clientX - dragStartPos.x;
		const deltaY = event.clientY - dragStartPos.y;

		// 计算网格单位的移动量
		const gridWidth = (window.innerWidth - 32) / GRID_COLS; // 减去 padding
		const colsDelta = Math.round(deltaX / gridWidth);
		const rowsDelta = Math.round(deltaY / GRID_ROW_HEIGHT);

		const newX = Math.max(0, Math.min(GRID_COLS - 1, dragOffset.x + colsDelta));
		const newY = Math.max(0, dragOffset.y + rowsDelta);

		// 实时更新位置（视觉反馈）
		layout.updatePanelPosition(draggingPanel, newX, newY);
	}

	// 拖拽结束
	function handleDragEnd() {
		if (draggingPanel) {
			// 保存最终位置
			layout.saveNow();
			draggingPanel = null;
		}

		// 移除全局事件监听
		document.removeEventListener('mousemove', handleDragMove);
		document.removeEventListener('mouseup', handleDragEnd);
	}

	// 调整大小开始
	function handleResizeStart(event: MouseEvent, panelId: PanelId) {
		event.stopPropagation(); // 防止触发拖拽
		resizingPanel = panelId;
		resizeStartPos = { x: event.clientX, y: event.clientY };

		const panelLayout = $layout.panels[panelId];
		if (panelLayout) {
			resizeStartSize = { w: panelLayout.w, h: panelLayout.h };
		}

		// 添加全局鼠标事件监听
		document.addEventListener('mousemove', handleResizeMove);
		document.addEventListener('mouseup', handleResizeEnd);
	}

	// 调整大小移动
	function handleResizeMove(event: MouseEvent) {
		if (!resizingPanel) return;

		const deltaX = event.clientX - resizeStartPos.x;
		const deltaY = event.clientY - resizeStartPos.y;

		// 计算网格单位的大小变化
		const gridWidth = (window.innerWidth - 32) / GRID_COLS;
		const colsDelta = Math.round(deltaX / gridWidth);
		const rowsDelta = Math.round(deltaY / GRID_ROW_HEIGHT);

		const newW = Math.max(2, Math.min(GRID_COLS, resizeStartSize.w + colsDelta));
		const newH = Math.max(2, resizeStartSize.h + rowsDelta);

		// 实时更新大小
		layout.updatePanelSize(resizingPanel, newW, newH);
	}

	// 调整大小结束
	function handleResizeEnd() {
		if (resizingPanel) {
			// 保存最终大小
			layout.saveNow();
			resizingPanel = null;
		}

		// 移除全局事件监听
		document.removeEventListener('mousemove', handleResizeMove);
		document.removeEventListener('mouseup', handleResizeEnd);
	}

	// 计算面板样式
	function getPanelStyle(panelId: PanelId): string {
		const panelLayout = $layout.panels[panelId];
		if (!panelLayout) return '';

		const { x, y, w, h } = panelLayout;

		return `
			grid-column: ${x + 1} / span ${w};
			grid-row: ${y + 1} / span ${h};
		`;
	}

	// 将样式应用到面板（通过全局选择器）
	$effect(() => {
		if (!$layout.initialized) return;

		// 为每个面板应用样式
		Object.keys($layout.panels).forEach((panelId) => {
			const element = document.querySelector(`[data-panel-id="${panelId}"]`) as HTMLElement;
			if (element) {
				const panelLayout = $layout.panels[panelId as PanelId];
				if (panelLayout) {
					const { x, y, w, h } = panelLayout;
					element.style.gridColumn = `${x + 1} / span ${w}`;
					element.style.gridRow = `${y + 1} / span ${h}`;
				}
			}
		});
	});
</script>

<!-- 拖拽和调整大小的全局事件监听 -->
<svelte:window
	onmousedown={(e) => {
		// 检查是否点击了拖拽手柄
		const target = e.target as HTMLElement;
		const dragHandle = target.closest('.drag-handle');
		if (dragHandle) {
			const panelElement = dragHandle.closest('[data-panel-id]') as HTMLElement;
			if (panelElement) {
				const panelId = panelElement.dataset.panelId as PanelId;
				handleDragStart(e, panelId);
			}
		}

		// 检查是否点击了调整大小手柄
		const resizeHandle = target.closest('.resize-handle');
		if (resizeHandle) {
			const panelElement = resizeHandle.closest('[data-panel-id]') as HTMLElement;
			if (panelElement) {
				const panelId = panelElement.dataset.panelId as PanelId;
				handleResizeStart(e, panelId);
			}
		}
	}}
/>

<main class="dashboard">
	<div
		class="dashboard-grid"
		style="--grid-cols: {GRID_COLS}; --grid-row-height: {GRID_ROW_HEIGHT}px; --gap: {GAP}px;"
	>
		{@render children()}
	</div>
</main>

<style>
	.dashboard {
		flex: 1;
		padding: 0.5rem;
		overflow-y: auto;
		position: relative;
	}

	.dashboard-grid {
		display: grid;
		grid-template-columns: repeat(var(--grid-cols), 1fr);
		grid-auto-rows: var(--grid-row-height);
		gap: var(--gap);
		max-width: 100%;
		margin: 0 auto;
		position: relative;
	}

	.dashboard-grid > :global(*) {
		position: relative;
	}

	/* 拖拽中的面板样式 */
	.dashboard-grid > :global([data-dragging='true']) {
		opacity: 0.8;
		z-index: 1000;
		cursor: grabbing !important;
	}

	/* 调整大小中的面板样式 */
	.dashboard-grid > :global([data-resizing='true']) {
		opacity: 0.9;
		z-index: 999;
	}

	@media (max-width: 768px) {
		.dashboard-grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}
</style>
