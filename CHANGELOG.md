# CHANGELOG.md — Nayuta 迭代日志

## [2026-05-31 18:10 迭代2] - 深渊氛围与界面完善 | 所用 skills: algorithmic-art, frontend-skill, byted-seedream-image-gen(失败) | 完成的任务 ID: T007, T013 | 备注: T008 因 ARK_API_KEY 缺少再次失败，已用程序化替代

### 完成内容
- **深渊雾气与侵蚀效果 (T007)**：使用 algorithmic-art 创建了"Abyssal Erosion"交互式 p5.js 生成艺术，包含三层系统：
  - 雾气层：多层 Perlin 噪声驱动的漂浮雾气，带呼吸循环
  - 侵蚀层：噪声驱动的边缘溶解效果，荧光青/虚空橙边缘光
  - 漂移粒子层：受噪声场影响的漂浮粒子，深度色彩映射
  - 集成到 GameScene：添加了 `_renderAbyssFog` 和 `_renderErosionEffect` 方法
- **暂停菜单与设置界面 (T013)**：使用 frontend-skill 创建了 PauseScene：
  - 暂停菜单：继续探索、设置、返回主菜单
  - 设置面板：粒子效果、雾气浓度、侵蚀效果开关
  - 深渊美学设计：荧光青选中指示器、呼吸脉冲标题、暗色半透明遮罩
  - Esc 键从游戏场景触发暂停（替代直接返回主菜单）
- **主角概念图生成器**：因 ARK_API_KEY 不可用，创建了程序化 Canvas 概念图生成器

### 异常记录
- byted-seedream-image-gen 调用再次失败：环境缺少 ARK_API_KEY，T008 标记为 FAILED
- 已使用程序化 Canvas 绘制作为替代方案（concept_nayuta_generator.html）

## [2026-05-31 17:30 迭代1] - 项目初始化与基础搭建 | 所用 skills: algorithmic-art, frontend-skill | 完成的任务 ID: T001, T002, T003, T004, T006, T011, T012 | 备注: byted-seedream-image-gen 因缺少 ARK_API_KEY 失败(T008/T009/T010)，待后续重试

### 完成内容
- **市场调研**：分析了2026年Steam/itch.io/TapTap独立游戏趋势，确定"宇宙恐怖+暗黑童话+探索解谜"方向
- **概念锚定**：定义了世界观（200字）、核心循环、独特卖点（记忆即关卡、现实侵蚀系统、零对白叙事）
- **风格指南**：建立了完整色板（深渊蓝#0A0E1A、荧光青#00FFD4、虚空橙#FF6B35等）、光照风格、形状语言
- **项目架构**：基于 Vite + HTML5 Canvas 的游戏框架，含 Game 主循环、SceneManager 场景切换、InputManager 输入管理
- **主菜单**：全屏深渊背景 + 300颗视差星星 + 80个上升星尘粒子 + 呼吸式星云 + 脉冲标题 + 极简菜单
- **游戏场景**：玩家角色控制（移动/跳跃）、记忆之锚收集系统、深渊粒子效果、HUD 显示
- **算法艺术**：创建了"Abyssal Stardust"交互式 p5.js 生成艺术，含种子控制、参数调节、呼吸动画

### 异常记录
- byted-seedream-image-gen 调用失败：环境缺少 ARK_API_KEY，T008/T009/T010 标记为 FAILED
- 已使用程序化生成作为替代方案

## [2026-05-31 17:00 初始化] - 项目初始化 | 所用 skills: 无（seedream 因缺少 API key 失败） | 完成的任务: 调研、概念锚定、路线图 | 备注: byted-seedream-image-gen 因缺少 ARK_API_KEY 无法使用，概念图待后续生成
