# 拖拽布局功能使用指南

## 功能概述

Situation Monitor 现在支持**可拖拽的网格布局系统**，允许每个用户自定义面板的位置和大小，并将布局保存在浏览器的 localStorage 中。

## 核心特性

### 1. 拖拽移动面板
- **操作方式**：点击并拖动面板左上角的 **拖拽手柄**（四点图标）
- **效果**：面板会跟随鼠标移动，并自动对齐到网格
- **保存**：松开鼠标后，位置会自动保存到 localStorage

### 2. 调整面板大小
- **操作方式**：点击并拖动面板右下角的 **调整大小手柄**（三角图标）
- **效果**：面板的宽度和高度会随鼠标移动而变化
- **保存**：松开鼠标后，大小会自动保存到 localStorage

### 3. 自动记忆布局
- **存储位置**：浏览器 localStorage
- **存储键名**：`situation_monitor_layout_v1`
- **跨设备**：每个浏览器独立存储，不同用户互不干扰
- **持久化**：关闭浏览器后重新打开，布局会自动恢复

### 4. 重置布局
- **操作路径**：设置 → 仪表板 → 重置面板布局
- **效果**：恢复所有面板的默认位置和大小

## 技术实现

### 文件结构

```
src/lib/
├── stores/
│   └── layout.ts          # 布局管理 store
├── components/
│   ├── layout/
│   │   └── Dashboard.svelte   # 网格布局容器（拖拽逻辑）
│   └── common/
│       └── Panel.svelte       # 面板组件（拖拽/调整大小手柄）
└── components/modals/
    └── SettingsModal.svelte   # 设置界面（重置布局按钮）
```

### 核心组件

#### 1. Layout Store (`src/lib/stores/layout.ts`)

```typescript
// 面板布局接口
interface PanelLayout {
  id: PanelId;
  x: number;  // 网格列位置
  y: number;  // 网格行位置
  w: number;  // 宽度（网格单位）
  h: number;  // 高度（网格单位）
}

// 主要方法
- init()                           // 初始化，从 localStorage 加载布局
- updatePanelPosition(id, x, y)   // 更新面板位置
- updatePanelSize(id, w, h)       // 更新面板大小
- resetLayout()                    // 重置为默认布局
- saveNow()                        // 立即保存布局
```

#### 2. Dashboard 组件 (`src/lib/components/layout/Dashboard.svelte`)

- 使用 **CSS Grid** 实现 12 列网格系统
- 监听全局鼠标事件处理拖拽和调整大小
- 实时更新面板样式（`grid-column` 和 `grid-row`）
- 拖拽结束后自动保存布局

#### 3. Panel 组件 (`src/lib/components/common/Panel.svelte`)

- 左上角：**拖拽手柄**（四点图标）
- 右下角：**调整大小手柄**（三角图标）
- 支持 `draggable` 属性控制是否可拖拽

### LocalStorage 数据格式

```json
{
  "usdjpy": { "id": "usdjpy", "x": 0, "y": 0, "w": 3, "h": 2 },
  "map": { "id": "map", "x": 0, "y": 2, "w": 12, "h": 4 },
  "politics": { "id": "politics", "x": 0, "y": 6, "w": 3, "h": 3 },
  "tech": { "id": "tech", "x": 3, "y": 6, "w": 3, "h": 3 },
  // ... 其他面板
}
```

### 网格系统

- **列数**：12 列
- **行高**：80px
- **间距**：8px
- **响应式**：移动端自动调整为 4 列

## 使用场景

### 场景 1：多用户共享同一设备
- 用户 A 登录浏览器 A → 自定义布局 → 布局保存在浏览器 A 的 localStorage
- 用户 B 登录浏览器 B → 自定义布局 → 布局保存在浏览器 B 的 localStorage
- **结果**：两个用户的布局互不影响

### 场景 2：同一用户多设备
- 在办公电脑上设置布局 → 布局保存在办公电脑的浏览器
- 在家用电脑上打开 → 显示默认布局（需要重新自定义）
- **注意**：localStorage 不会跨设备同步（这是浏览器的限制）

### 场景 3：布局出错或想恢复默认
- 打开设置 → 仪表板 → 点击"重置面板布局"
- **结果**：所有面板恢复到默认位置和大小

## 性能优化

### 1. 防抖保存
- 拖拽过程中不会频繁保存到 localStorage
- 使用 **500ms 防抖**，拖拽结束后才保存
- 避免性能损耗和浏览器卡顿

### 2. 立即保存
- 拖拽/调整大小结束后，调用 `layout.saveNow()` 立即保存
- 确保用户操作立即生效，不会丢失

### 3. 网格对齐
- 拖拽和调整大小时自动对齐到网格
- 避免面板位置不规则，保持整洁

## 开发者注意事项

### 添加新面板
如果需要添加新面板，请在 `src/lib/stores/layout.ts` 的 `getDefaultLayout()` 函数中添加默认布局配置：

```typescript
// 添加新面板的默认布局
layouts['new_panel_id'] = { 
  id: 'new_panel_id', 
  x: 0,  // 列位置
  y: 10, // 行位置
  w: 3,  // 宽度
  h: 3   // 高度
};
```

### 禁用拖拽
某些面板（如地图）可能不希望被拖拽，可以在 `Panel.svelte` 中设置 `draggable={false}`：

```svelte
<Panel id="map" title="地图" draggable={false}>
  <!-- 面板内容 -->
</Panel>
```

## 未来改进建议

1. **云端同步**：使用后端 API 保存布局，实现跨设备同步
2. **布局预设**：提供多套预设布局供用户快速切换
3. **拖拽动画**：添加平滑动画效果，提升用户体验
4. **碰撞检测**：防止面板重叠，自动调整其他面板位置
5. **撤销/重做**：支持布局操作的撤销和重做

## 常见问题

### Q1: 为什么我的布局在另一台电脑上不显示？
**A**: localStorage 是浏览器本地存储，不会跨设备同步。每台设备需要独立设置布局。

### Q2: 如何清除所有布局数据？
**A**: 在设置中点击"重置面板布局"，或者在浏览器开发者工具中手动删除 `situation_monitor_layout_v1` 键。

### Q3: 拖拽时面板会卡顿怎么办？
**A**: 这可能是因为面板内容过于复杂。尝试关闭一些不常用的面板，或者使用性能更好的浏览器。

### Q4: 可以导出/导入布局吗？
**A**: 当前版本不支持，但可以手动从 localStorage 中复制 `situation_monitor_layout_v1` 的值，然后在另一台设备上粘贴到 localStorage 中。

## 总结

拖拽布局功能让 Situation Monitor 更加个性化和灵活。每个用户可以根据自己的工作流程调整面板位置和大小，提高工作效率。所有更改都会自动保存在浏览器中，下次打开时自动恢复。

---

**版本**: v1.0  
**更新日期**: 2026-01-29  
**作者**: Claude (AI Assistant)
