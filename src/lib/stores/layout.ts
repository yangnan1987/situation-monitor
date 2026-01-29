/**
 * Layout store - 管理面板的位置和大小（拖拽布局）
 * 使用 localStorage 保存每个用户的个性化布局
 */

import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { PanelId } from '$lib/config';

// localStorage 键名
const LAYOUT_STORAGE_KEY = 'situation_monitor_layout_v1';

// 面板布局配置
export interface PanelLayout {
	id: PanelId;
	x: number; // 网格列位置
	y: number; // 网格行位置
	w: number; // 宽度（网格单位）
	h: number; // 高度（网格单位）
}

export interface LayoutState {
	panels: Record<PanelId, PanelLayout>;
	gridCols: number; // 网格列数
	initialized: boolean;
}

// 默认布局配置 - 自动排列所有面板
function getDefaultLayout(): Record<PanelId, PanelLayout> {
	const panelIds: PanelId[] = [
		'usdjpy',
		'map',
		'politics',
		'tech',
		'finance',
		'gov',
		'heatmap',
		'markets',
		'monitors',
		'commodities',
		'crypto',
		'polymarket',
		'whales',
		'mainchar',
		'printer',
		'contracts',
		'ai',
		'layoffs',
		'venezuela',
		'greenland',
		'iran',
		'leaders',
		'intel',
		'correlation',
		'narrative',
		'fed'
	];

	const layouts: Record<string, PanelLayout> = {};
	let x = 0;
	let y = 0;
	const cols = 12; // 12列网格系统

	panelIds.forEach((id) => {
		// 特殊面板配置
		if (id === 'map') {
			layouts[id] = { id, x: 0, y: y, w: 12, h: 4 };
			y += 4;
			x = 0;
		} else if (id === 'usdjpy') {
			layouts[id] = { id, x: x, y: y, w: 3, h: 2 };
			x += 3;
		} else {
			// 默认面板大小
			const defaultW = 3;
			const defaultH = 3;

			// 检查是否需要换行
			if (x + defaultW > cols) {
				x = 0;
				y += 3;
			}

			layouts[id] = { id, x, y, w: defaultW, h: defaultH };
			x += defaultW;
		}
	});

	return layouts as Record<PanelId, PanelLayout>;
}

// 从 localStorage 加载布局
function loadLayoutFromStorage(): Record<PanelId, PanelLayout> | null {
	if (!browser) return null;

	try {
		const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
		if (saved) {
			const parsed = JSON.parse(saved);
			console.log('[Layout] 从 localStorage 加载布局:', Object.keys(parsed).length, '个面板');
			return parsed;
		}
	} catch (e) {
		console.warn('[Layout] 无法从 localStorage 加载布局:', e);
	}

	return null;
}

// 保存布局到 localStorage
function saveLayoutToStorage(layouts: Record<PanelId, PanelLayout>): void {
	if (!browser) return;

	try {
		localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layouts));
		console.log('[Layout] 布局已保存到 localStorage');
	} catch (e) {
		console.warn('[Layout] 无法保存布局到 localStorage:', e);
	}
}

// 创建布局 store
function createLayoutStore() {
	const savedLayout = loadLayoutFromStorage();
	const defaultLayout = getDefaultLayout();

	const initialState: LayoutState = {
		panels: savedLayout || defaultLayout,
		gridCols: 12,
		initialized: false
	};

	const { subscribe, set, update } = writable<LayoutState>(initialState);

	// 防抖保存函数
	let saveTimeout: ReturnType<typeof setTimeout> | null = null;
	function debouncedSave(layouts: Record<PanelId, PanelLayout>) {
		if (saveTimeout) clearTimeout(saveTimeout);
		saveTimeout = setTimeout(() => {
			saveLayoutToStorage(layouts);
		}, 500); // 500ms 防抖
	}

	return {
		subscribe,

		/**
		 * 初始化 store（在组件 mount 后调用）
		 */
		init() {
			update((state) => ({ ...state, initialized: true }));
		},

		/**
		 * 获取面板布局
		 */
		getPanelLayout(panelId: PanelId): PanelLayout | undefined {
			const state = get({ subscribe });
			return state.panels[panelId];
		},

		/**
		 * 更新面板位置（拖拽结束时调用）
		 */
		updatePanelPosition(panelId: PanelId, x: number, y: number) {
			update((state) => {
				const panel = state.panels[panelId];
				if (!panel) return state;

				const newPanels = {
					...state.panels,
					[panelId]: { ...panel, x, y }
				};

				debouncedSave(newPanels);
				return { ...state, panels: newPanels };
			});
		},

		/**
		 * 更新面板大小（调整大小结束时调用）
		 */
		updatePanelSize(panelId: PanelId, w: number, h: number) {
			update((state) => {
				const panel = state.panels[panelId];
				if (!panel) return state;

				const newPanels = {
					...state.panels,
					[panelId]: { ...panel, w, h }
				};

				debouncedSave(newPanels);
				return { ...state, panels: newPanels };
			});
		},

		/**
		 * 更新面板完整布局（位置 + 大小）
		 */
		updatePanelLayout(panelId: PanelId, layout: Partial<Omit<PanelLayout, 'id'>>) {
			update((state) => {
				const panel = state.panels[panelId];
				if (!panel) return state;

				const newPanels = {
					...state.panels,
					[panelId]: { ...panel, ...layout }
				};

				debouncedSave(newPanels);
				return { ...state, panels: newPanels };
			});
		},

		/**
		 * 重置布局为默认值
		 */
		resetLayout() {
			const defaultLayout = getDefaultLayout();
			if (browser) {
				localStorage.removeItem(LAYOUT_STORAGE_KEY);
			}
			set({ panels: defaultLayout, gridCols: 12, initialized: true });
			console.log('[Layout] 布局已重置为默认值');
		},

		/**
		 * 立即保存当前布局（不使用防抖）
		 */
		saveNow() {
			const state = get({ subscribe });
			saveLayoutToStorage(state.panels);
		}
	};
}

// 导出单例 store
export const layout = createLayoutStore();
