# 血染钟楼笔记助手

适配手机、平板和桌面浏览器的血染钟楼网页笔记助手。

## 本地运行

```bash
npm install
npm run dev
```

## 发布

推送到 `main` 分支后，GitHub Actions 会构建网页并自动发布到 GitHub Pages。
# 公开共享游戏局（Supabase）

1. 在 Supabase 建立项目，并在 SQL Editor 执行 [`supabase/game_rooms.sql`](./supabase/game_rooms.sql)。
2. 将 `.env.example` 复制为 `.env.local`，填入项目 URL 和匿名公钥；不要提交 `.env.local`，更不要使用 `service_role`。
3. 重新部署前端。开始页会显示“创建或加入共享局”。未配置时按钮会明确禁用，不会生成伪造局号。

共享局仅传输公开流程：天数、提名、公开票型、处决/死亡和流程状态。角色、私人笔记、私人阵营/关系判断及界面偏好只保存在本机，并以局号作为本地命名空间的基础。

## 新板子维护

新增或更新玩家自制板子前，必须遵循 [`BOARD_IMPORT_RULES.md`](./BOARD_IMPORT_RULES.md)：逐项对照官方角色与夜间顺序；名称不同但能力相同的角色保留板子原名，并显示为“板子原名（官方角色名）”。
