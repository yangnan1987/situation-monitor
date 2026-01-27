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
 * Fetch both USD/JPY and USD/CNY rates
 */
export async function fetchForexRates(): Promise<{
	jpy: ForexRate | null;
	cny: ForexRate | null;
}> {
	const [jpy, cny] = await Promise.all([
		fetchUSDJPYWithFallback(),
		fetchUSDCNYWithFallback()
	]);

	return { jpy, cny };
}
