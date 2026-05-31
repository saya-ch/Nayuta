# CHANGELOG.md — Nayuta 迭代日志

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
