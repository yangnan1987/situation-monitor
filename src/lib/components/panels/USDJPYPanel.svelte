<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Panel } from '$lib/components/common';
	import { fetchForexRates } from '$lib/api/forex';
	import { formatPercentChange, getChangeClass } from '$lib/utils';
	import type { ForexRate } from '$lib/api/forex';

	let jpyRate = $state<ForexRate | null>(null);
	let cnyRate = $state<ForexRate | null>(null);
	let cnyjpyRate = $state<ForexRate | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let refreshInterval: ReturnType<typeof setInterval> | null = null;

	async function loadRates() {
		loading = true;
		error = null;
		try {
			const data = await fetchForexRates();
			jpyRate = data.jpy;
			cnyRate = data.cny;
			cnyjpyRate = data.cnyjpy;
			
			if (!jpyRate && !cnyRate && !cnyjpyRate) {
				error = '无法获取汇率数据';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : '获取汇率失败';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadRates();
		// 每30秒刷新一次
		refreshInterval = setInterval(loadRates, 30000);
	});

	onDestroy(() => {
		if (refreshInterval) {
			clearInterval(refreshInterval);
		}
	});

	function formatRate(rate: ForexRate | null): string {
		return rate ? rate.rate.toFixed(2) : '—';
	}

	function formatChange(rate: ForexRate | null): string {
		if (!rate || rate.changePercent === undefined) return '—';
		return formatPercentChange(rate.changePercent);
	}

	function getChangeClassForRate(rate: ForexRate | null): string {
		if (!rate || rate.changePercent === undefined) return '';
		return getChangeClass(rate.changePercent);
	}

	function formatChangeValue(rate: ForexRate | null): string {
		if (!rate || rate.change === undefined) return '—';
		return rate.change.toFixed(2);
	}
</script>

<Panel id="usdjpy" title="汇率" {loading} {error}>
	{#if jpyRate || cnyRate || cnyjpyRate}
		<div class="forex-display">
			<!-- USD/JPY -->
			{#if jpyRate}
				<div class="forex-item">
					<div class="forex-header">
						<div class="forex-symbol">USD/JPY</div>
						<div class="forex-label">美元/日元</div>
					</div>
					<div class="rate-main">
						<div class="rate-value">{formatRate(jpyRate)}</div>
					</div>
					{#if jpyRate.changePercent !== undefined}
						<div class="rate-change">
							<div class="change-value {getChangeClassForRate(jpyRate)}">
								{jpyRate.change !== undefined && jpyRate.change > 0 ? '+' : ''}{formatChangeValue(jpyRate)}
							</div>
							<div class="change-percent {getChangeClassForRate(jpyRate)}">
								{formatChange(jpyRate)}
							</div>
						</div>
					{/if}
				</div>
			{/if}

			<!-- USD/CNY -->
			{#if cnyRate}
				<div class="forex-item">
					<div class="forex-header">
						<div class="forex-symbol">USD/CNY</div>
						<div class="forex-label">美元/人民币</div>
					</div>
					<div class="rate-main">
						<div class="rate-value">{formatRate(cnyRate)}</div>
					</div>
					{#if cnyRate.changePercent !== undefined}
						<div class="rate-change">
							<div class="change-value {getChangeClassForRate(cnyRate)}">
								{cnyRate.change !== undefined && cnyRate.change > 0 ? '+' : ''}{formatChangeValue(cnyRate)}
							</div>
							<div class="change-percent {getChangeClassForRate(cnyRate)}">
								{formatChange(cnyRate)}
							</div>
						</div>
					{/if}
				</div>
			{/if}

			<!-- CNY/JPY (新增) -->
			{#if cnyjpyRate}
				<div class="forex-item">
					<div class="forex-header">
						<div class="forex-symbol">CNY/JPY</div>
						<div class="forex-label">人民币/日元</div>
					</div>
					<div class="rate-main">
						<div class="rate-value">{formatRate(cnyjpyRate)}</div>
					</div>
					{#if cnyjpyRate.changePercent !== undefined}
						<div class="rate-change">
							<div class="change-value {getChangeClassForRate(cnyjpyRate)}">
								{cnyjpyRate.change !== undefined && cnyjpyRate.change > 0 ? '+' : ''}{formatChangeValue(cnyjpyRate)}
							</div>
							<div class="change-percent {getChangeClassForRate(cnyjpyRate)}">
								{formatChange(cnyjpyRate)}
							</div>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Timestamp -->
			{#if jpyRate || cnyRate || cnyjpyRate}
				<div class="rate-timestamp">
					更新时间: {new Date((jpyRate || cnyRate || cnyjpyRate)!.timestamp).toLocaleTimeString('zh-CN')}
				</div>
			{/if}
		</div>
	{:else if !loading && !error}
		<div class="empty-state">暂无数据</div>
	{/if}
</Panel>

<style>
	.forex-display {
		display: flex;
		flex-direction: column;
		padding: 0.75rem 0.5rem;
		gap: 1rem;
	}

	.forex-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--border);
	}

	.forex-item:last-of-type {
		border-bottom: none;
		padding-bottom: 0;
	}

	.forex-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
		width: 100%;
	}

	.forex-symbol {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--text-primary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.forex-label {
		font-size: 0.6rem;
		color: var(--text-secondary);
	}

	.rate-main {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	.rate-value {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
		line-height: 1;
	}

	.rate-change {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.2rem;
	}

	.change-value {
		font-size: 0.8rem;
		font-weight: 500;
		font-variant-numeric: tabular-nums;
	}

	.change-percent {
		font-size: 0.7rem;
		font-weight: 500;
		font-variant-numeric: tabular-nums;
	}

	.change-value.up,
	.change-percent.up {
		color: var(--success);
	}

	.change-value.down,
	.change-percent.down {
		color: var(--danger);
	}

	.rate-timestamp {
		font-size: 0.55rem;
		color: var(--text-muted);
		margin-top: 0.25rem;
		text-align: center;
	}

	.empty-state {
		text-align: center;
		color: var(--text-secondary);
		font-size: 0.7rem;
		padding: 1rem;
	}
</style>
