/**
 * Forex API - Fetch USD/JPY and USD/CNY exchange rates
 * Uses exchangerate-api.com (free, no API key required)
 */

import { fetchWithProxy, logger } from '$lib/config/api';

export interface ForexRate {
	symbol: string;
	rate: number;
	change?: number;
	changePercent?: number;
	timestamp: number;
}

/**
 * Fetch USD/JPY exchange rate from exchangerate-api.com
 * Free tier: No API key required, 1500 requests/month
 */
export async function fetchUSDJPY(): Promise<ForexRate | null> {
	try {
		// exchangerate-api.com free endpoint
		const url = 'https://api.exchangerate-api.com/v4/latest/USD';
		
		logger.log('Forex API', 'Fetching USD/JPY rate');

		const response = await fetchWithProxy(url);
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const data = await response.json();
		const jpyRate = data.rates?.JPY;

		if (!jpyRate || typeof jpyRate !== 'number') {
			throw new Error('Invalid JPY rate in response');
		}

		return {
			symbol: 'USD/JPY',
			rate: jpyRate,
			timestamp: Date.now()
		};
	} catch (error) {
		logger.error('Forex API', 'Error fetching USD/JPY:', error);
		return null;
	}
}

/**
 * Alternative: Fetch from Yahoo Finance (backup option)
 * This uses a public Yahoo Finance API endpoint
 */
export async function fetchUSDJPYFromYahoo(): Promise<ForexRate | null> {
	try {
		// Yahoo Finance API endpoint for USD/JPY
		const url = 'https://query1.finance.yahoo.com/v8/finance/chart/USDJPY=X';
		
		logger.log('Forex API', 'Fetching USD/JPY from Yahoo Finance');

		const response = await fetchWithProxy(url);
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const data = await response.json();
		const result = data.chart?.result?.[0];
		
		if (!result) {
			throw new Error('Invalid response from Yahoo Finance');
		}

		const meta = result.meta;
		const regularMarketPrice = meta?.regularMarketPrice;
		const previousClose = meta?.previousClose;

		if (!regularMarketPrice || typeof regularMarketPrice !== 'number') {
			throw new Error('Invalid price in Yahoo Finance response');
		}

		const change = previousClose ? regularMarketPrice - previousClose : undefined;
		const changePercent = previousClose && change !== undefined 
			? (change / previousClose) * 100 
			: undefined;

		return {
			symbol: 'USD/JPY',
			rate: regularMarketPrice,
			change,
			changePercent,
			timestamp: Date.now()
		};
	} catch (error) {
		logger.error('Forex API', 'Error fetching USD/JPY from Yahoo:', error);
		return null;
	}
}

/**
 * Fetch USD/CNY exchange rate from exchangerate-api.com
 */
export async function fetchUSDCNY(): Promise<ForexRate | null> {
	try {
		const url = 'https://api.exchangerate-api.com/v4/latest/USD';
		
		logger.log('Forex API', 'Fetching USD/CNY rate');

		const response = await fetchWithProxy(url);
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const data = await response.json();
		const cnyRate = data.rates?.CNY;

		if (!cnyRate || typeof cnyRate !== 'number') {
			throw new Error('Invalid CNY rate in response');
		}

		return {
			symbol: 'USD/CNY',
			rate: cnyRate,
			timestamp: Date.now()
		};
	} catch (error) {
		logger.error('Forex API', 'Error fetching USD/CNY:', error);
		return null;
	}
}

/**
 * Alternative: Fetch USD/CNY from Yahoo Finance (backup option)
 */
export async function fetchUSDCNYFromYahoo(): Promise<ForexRate | null> {
	try {
		const url = 'https://query1.finance.yahoo.com/v8/finance/chart/USDCNY=X';
		
		logger.log('Forex API', 'Fetching USD/CNY from Yahoo Finance');

		const response = await fetchWithProxy(url);
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const data = await response.json();
		const result = data.chart?.result?.[0];
		
		if (!result) {
			throw new Error('Invalid response from Yahoo Finance');
		}

		const meta = result.meta;
		const regularMarketPrice = meta?.regularMarketPrice;
		const previousClose = meta?.previousClose;

		if (!regularMarketPrice || typeof regularMarketPrice !== 'number') {
			throw new Error('Invalid price in Yahoo Finance response');
		}

		const change = previousClose ? regularMarketPrice - previousClose : undefined;
		const changePercent = previousClose && change !== undefined 
			? (change / previousClose) * 100 
			: undefined;

		return {
			symbol: 'USD/CNY',
			rate: regularMarketPrice,
			change,
			changePercent,
			timestamp: Date.now()
		};
	} catch (error) {
		logger.error('Forex API', 'Error fetching USD/CNY from Yahoo:', error);
		return null;
	}
}

/**
 * Fetch USD/JPY with fallback
 * Tries exchangerate-api.com first, falls back to Yahoo Finance
 */
export async function fetchUSDJPYWithFallback(): Promise<ForexRate | null> {
	// Try exchangerate-api.com first
	const rate = await fetchUSDJPY();
	if (rate) {
		return rate;
	}

	// Fallback to Yahoo Finance
	logger.warn('Forex API', 'Primary API failed, trying Yahoo Finance fallback');
	return fetchUSDJPYFromYahoo();
}

/**
 * Fetch USD/CNY with fallback
 * Tries exchangerate-api.com first, falls back to Yahoo Finance
 */
export async function fetchUSDCNYWithFallback(): Promise<ForexRate | null> {
	// Try exchangerate-api.com first
	const rate = await fetchUSDCNY();
	if (rate) {
		return rate;
	}

	// Fallback to Yahoo Finance
	logger.warn('Forex API', 'Primary API failed, trying Yahoo Finance fallback');
	return fetchUSDCNYFromYahoo();
}

/**
 * Calculate CNY/JPY rate from USD/JPY and USD/CNY
 * Formula: CNY/JPY = USD/JPY / USD/CNY
 * (How many JPY equals 1 CNY)
 */
export function calculateCNYJPY(
	usdJpy: ForexRate | null,
	usdCny: ForexRate | null
): ForexRate | null {
	if (!usdJpy || !usdCny || usdCny.rate === 0) {
		return null;
	}

	const cnyjpyRate = usdJpy.rate / usdCny.rate;

	// Calculate change if both USD/JPY and USD/CNY have change data
	let change: number | undefined;
	let changePercent: number | undefined;

	if (
		usdJpy.change !== undefined &&
		usdCny.change !== undefined &&
		usdJpy.changePercent !== undefined &&
		usdCny.changePercent !== undefined
	) {
		// Approximate change calculation
		// If USD/JPY goes up and USD/CNY goes down, CNY/JPY goes up more
		// If USD/JPY goes up and USD/CNY goes up, effect is dampened
		const jpyChangePercent = usdJpy.changePercent;
		const cnyChangePercent = usdCny.changePercent;

		// Combined percentage change (approximate)
		changePercent = jpyChangePercent - cnyChangePercent;

		// Calculate absolute change
		const previousRate = cnyjpyRate / (1 + changePercent / 100);
		change = cnyjpyRate - previousRate;
	}

	return {
		symbol: 'CNY/JPY',
		rate: cnyjpyRate,
		change,
		changePercent,
		timestamp: Math.max(usdJpy.timestamp, usdCny.timestamp)
	};
}

/**
 * Try to fetch CNY/JPY directly from Yahoo Finance
 * If not available, calculate from USD/JPY and USD/CNY
 */
export async function fetchCNYJPY(
	usdJpy?: ForexRate | null,
	usdCny?: ForexRate | null
): Promise<ForexRate | null> {
	try {
		// Try Yahoo Finance directly first
		const url = 'https://query1.finance.yahoo.com/v8/finance/chart/CNYJPY=X';

		logger.log('Forex API', 'Fetching CNY/JPY from Yahoo Finance');

		const response = await fetchWithProxy(url);
		if (response.ok) {
			const data = await response.json();
			const result = data.chart?.result?.[0];

			if (result) {
				const meta = result.meta;
				const regularMarketPrice = meta?.regularMarketPrice;
				const previousClose = meta?.previousClose;

				if (regularMarketPrice && typeof regularMarketPrice === 'number') {
					const change = previousClose ? regularMarketPrice - previousClose : undefined;
					const changePercent =
						previousClose && change !== undefined ? (change / previousClose) * 100 : undefined;

					logger.log('Forex API', 'Successfully fetched CNY/JPY directly from Yahoo');

					return {
						symbol: 'CNY/JPY',
						rate: regularMarketPrice,
						change,
						changePercent,
						timestamp: Date.now()
					};
				}
			}
		}
	} catch (error) {
		logger.warn('Forex API', 'Direct CNY/JPY fetch failed, will calculate from USD rates');
	}

	// Fallback: Calculate from USD/JPY and USD/CNY
	logger.log('Forex API', 'Calculating CNY/JPY from USD/JPY and USD/CNY');

	// If rates not provided, fetch them
	if (!usdJpy || !usdCny) {
		const [jpyData, cnyData] = await Promise.all([
			usdJpy || fetchUSDJPYWithFallback(),
			usdCny || fetchUSDCNYWithFallback()
		]);

		return calculateCNYJPY(jpyData, cnyData);
	}

	return calculateCNYJPY(usdJpy, usdCny);
}

/**
 * Fetch both USD/JPY and USD/CNY rates
 */
export async function fetchForexRates(): Promise<{
	jpy: ForexRate | null;
	cny: ForexRate | null;
	cnyjpy: ForexRate | null;
}> {
	const [jpy, cny] = await Promise.all([
		fetchUSDJPYWithFallback(),
		fetchUSDCNYWithFallback()
	]);

	// Calculate or fetch CNY/JPY
	const cnyjpy = await fetchCNYJPY(jpy, cny);

	return { jpy, cny, cnyjpy };
}
