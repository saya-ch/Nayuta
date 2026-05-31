# Nayuta — 那由他之梦

一个融合宇宙恐怖与暗黑童话的 2D 探索解谜游戏。

🔗 **在线游玩：https://saya-ch.github.io/Nayuta**

## 世界观

在时间的尽头，少女"那由他"从一场无始无终的梦中醒来，发现自己身处由破碎记忆构成的深渊——"忘却之海"。每一层深渊都是一段被遗忘的世界记忆：坍缩的星系、沉没的神殿、被吞噬的文明。她必须收集散落的"记忆之锚"，才能向下深入，接近深渊底部的真相。

## 操作

| 按键 | 功能 |
|------|------|
| ← → / A D | 移动 |
| ↑ / W / Space | 跳跃 |
| Enter / Space | 确认菜单 |
| ↑ ↓ / W S | 选择菜单项 |
| Esc | 暂停游戏 / 返回 |

## 开发

```bash
npm install
npm run dev     # 启动开发服务器
npm run build   # 构建生产版本
```

## 部署

项目已配置 GitHub Pages 自动部署（通过 GitHub Actions）：

### 部署说明：

1. **开启 GitHub Pages（必须手动完成）：
   - 访问仓库 → **Settings** → **Pages**
   - 在 **Build and deployment** → **Source** 中选择：**Deploy from a branch**
   - 在 **Branch** 中选择：**gh-pages** 分支，文件夹选择 **/ (root)**
   - 点击 Save

2. **自动部署：**
   - 每次推送到 `main` 分支时会自动构建并推送到 `gh-pages` 分支
   - GitHub Pages 会自动从 `gh-pages` 分支部署
   - 部署地址：https://saya-ch.github.io/Nayuta
   - 配置文件：[.github/workflows/deploy.yml](.github/workflows/deploy.yml)
   - Vite 部署路径配置：[vite.config.js](vite.config.js)

## 技术栈

- HTML5 Canvas 2D 渲染
- Vite 构建工具
- 原生 JavaScript（ES Modules）
- p5.js 生成艺术（算法视觉特效）

## 视觉风格

- 主色板：深渊蓝 #0A0E1A / 荧光青 #00FFD4 / 虚空橙 #FF6B35
- 风格关键词：宇宙恐怖 · 暗黑童话 · 生物荧光 · 记忆侵蚀
- 详见 [STYLE_GUIDE.md](STYLE_GUIDE.md)
