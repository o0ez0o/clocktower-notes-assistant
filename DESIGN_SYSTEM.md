# 血染钟楼笔记助手 · 设计系统

## 按钮

### Primary Button

- 用途：页面或流程中唯一的主要行动，例如“开始游戏”。
- 样式类：`ui-button ui-button--primary`。
- 视觉：酒红色实底、浅色文字、14px 圆角、轻微阴影。
- 状态：包含 hover、active、focus-visible 和 disabled。

### Secondary Button

- 用途：辅助操作、工具入口，例如“板子信息”。
- 样式类：`ui-button ui-button--secondary`。
- 图标方形按钮追加：`ui-button--icon`。
- 视觉：半透明羊皮纸浅底、棕色文字或图标、细描边、10px 圆角。
- 状态：包含 hover、active、focus-visible 和 disabled。

当前复用位置包括：顶部与移动端底部的“板子信息”、开始流程的“下一步”和“上一步”。“打开笔记”和“开始游戏”统一使用 Primary Button。

按钮颜色、圆角、阴影和焦点环统一定义在 `src/design-system.css` 的 CSS Variables 中；新增同层级按钮应复用对应样式类，不单独复制颜色和边框规则。
