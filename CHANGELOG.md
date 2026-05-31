# CHANGELOG.md — Nayuta 迭代日志

## [2026-05-31 19:20 迭代3] - 解谜系统与关卡架构 | 所用 skills: algorithmic-art, byted-seedream-image-gen(失败) | 完成的任务 ID: T005, T008(替代), T015, T016-T018(框架) | 备注: byted-seedream-image-gen 第3次因 ARK_API_KEY 缺少失败，T008 已用 algorithmic-art 程序化替代

### 完成内容
- **基础解谜机制 (T005)**：创建了完整的解谜系统，包含6种解谜元素：
  - PuzzleElement 类：支持开关(switch)、压力板(pressurePlate)、光源(lightSource)、反射镜(lightMirror)、光目标(lightTarget)、门(door)
  - PuzzleManager 类：管理所有解谜元素、光线追踪、交互检测、目标激活链
  - 光线反射系统：光源发射光线→遇到镜面反射→命中目标激活，支持多级反射
  - 门系统：由多个源(开关/压力板)控制，带平滑开关动画和符文装饰
  - E 键交互：靠近可交互元素时显示提示，按 E 触发开关/旋转镜面
  - 平台碰撞检测：AABB碰撞+最小重叠方向分离，支持多平台和门的碰撞
- **主角概念图 (T008 替代)**：使用 algorithmic-art 创建了精致的程序化概念图生成器：
  - 800x1000 竖向角色概念图
  - 深渊暗影少女轮廓 + 流动暗紫斗篷 + 荧光青镶边 + 尖顶冠冕 + 单只荧光青眼
  - 漂浮记忆碎片 + 深渊背景星场 + 宇宙恐怖元素 + 侵蚀裂纹效果
  - 可调参数：斗篷飘动、碎片数量、侵蚀强度、星密度
- **关卡数据系统 (T015-T018)**：创建了 LevelData 模块，定义4层深渊关卡：
  - 第1层（浅层记忆-蓝色童话）：完整关卡，含11个平台、5个记忆之锚、6个解谜元素、水晶/光球/符文装饰
  - 第2层（中层记忆-紫色神秘）：框架已搭，待充实解谜
  - 第3层（深层记忆-红色压迫）：框架已搭，待充实解谜
  - 第4层（最深层-纯黑宇宙恐怖）：框架已搭，待充实解谜
  - 每层有独立配色、雾气浓度、星场密度、粒子颜色
  - 关卡过渡：淡入淡出动画，完成条件检测，深度递增
  - 掉落重生机制：掉出画面自动回到起点
  - 4层通关后返回主菜单

### 异常记录
- byted-seedream-image-gen 第3次调用失败：环境缺少 ARK_API_KEY
- T008 已用 algorithmic-art 程序化概念图生成器替代，标记为完成
- T009/T010 仍标记为 FAILED，待后续 ARK_API_KEY 可用时重试

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
