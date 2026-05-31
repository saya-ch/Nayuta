# RESEARCH.md — Nayuta 市场调研与设计依据

## 市场趋势

### 1. 独立游戏主导 Steam 生态
- 2026年 Steam Top 20 中有 9 款独立游戏（2020年仅3款）
- 独立游戏占 Steam 收入 45%（5年前仅28%）
- 超200款独立游戏在2025年突破百万美元收入
- 来源：[Toxigon - How Indie Games Are Changing PC Gaming in 2026](https://toxigon.com/how-indie-games-are-shaping-pc-gaming-trends)

### 2. 玩家对 AAA 疲劳，渴望个人化体验
- 玩家厌倦：过度商业化、live-service、无限开放世界
- 独立游戏平均游玩时长比同类型 AAA 长 30%
- 短会话、尊重玩家时间、明确结局的设计更受欢迎
- 来源：[NowLoading - Most Anticipated Indie Games 2026](https://nowloading.co/best-indie-games-2026)

### 3. 热门玩法标签（2025-2026）
- Roguelike/Roguelite（杀戮尖塔2、Hades II）
- Metroidvania（Hollow Knight: Silksong、Earthblade）
- 叙事驱动探索（Koira、Blue Prince）
- 科幻生存（新星拓荒、凯普勒186F、Abiotic Factor）
- 宇宙恐怖/克苏鲁（Ritual Tides、Delusion Out of Space、Water Womb World）
- 来源：[GeekChamp - 15 Must-Play Indie Games 2026](https://geekchamp.com/15-must-play-indie-games-in-2026-trending-indie-video-games-and-top-indie-releases-gaining-serious-buzz/)

### 4. 美术风格趋势
- 手绘像素+现代光照（Sea of Stars、Hollow Knight）
- 低多边形+荒诞感（Photomaly）
- 油画风+蒸汽朋克（布拉维恩）
- VHS/复古滤镜+心理恐怖（Until the Last Philomel）
- 来源：[Itch.io 2026年初独立游戏盘点](https://indiegamed.com/review/itch-io-hidden-gem-indie-games-2026)

## 情感共鸣点

### 核心情感需求
1. **孤独中的连接** — 玩家渴望在虚拟世界中找到情感共鸣（Koira：零对白却催泪）
2. **未知的敬畏** — 宇宙恐怖带来的存在主义震撼（Water Womb World、Ritual Tides）
3. **脆弱与韧性** — 2026趋势从"力量幻想"转向"脆弱、合作、慢探索"（NowLoading 报告）
4. **发现的喜悦** — 环境叙事、隐藏路径、碎片化故事（Tunic、Hollow Knight）
5. **心理安全感** — Cozy设计+低压力机制成为主流，但与恐怖的张力对比更有冲击

### 玩家画像
- 核心受众：18-35岁，偏好氛围感强的独立游戏
- 次要受众：克苏鲁/宇宙恐怖爱好者，日式暗黑美学粉丝
- 平台偏好：Steam（PC）为主，itch.io 为辅

## 候选方向

### 方向 A：深渊回响 — 宇宙恐怖 + Metroidvania
在海底废墟中探索远古文明遗迹，面对不可名状的存在。融合 Hollow Knight 式探索与克苏鲁式恐惧。
- 参考游戏：Hollow Knight、Water Womb World、Ritual Tides

### 方向 B：星尘旅人 — 科幻生存 + 叙事解谜
在潮汐锁定的系外行星上，以机器人视角揭开殖民地的真相。硬核科幻设定+环境叙事。
- 参考游戏：凯普勒186F、Abiotic Factor、Delusion Out of Space

### 方向 C：那由他之梦 — 暗黑童话 + 探索解谜（★选定）
一个融合宇宙恐怖与日式暗黑童话的 2D 探索解谜游戏。少女"那由他"坠入由破碎记忆构成的深渊世界，在光与暗的边界寻找失落的真实。每一层深渊都是一段被遗忘的记忆碎片，而深渊底部等待的，是超越人类认知的宇宙存在。
- 参考游戏：Hollow Knight、Koira、Well Dweller、Celeste

### 方向 D：虚空织者 — Roguelite + 基地建造
在异星战场上同时进行弹幕射击和基地建造，双核驱动。
- 参考游戏：新星拓荒、Hades II

### 方向 E：记忆回廊 — 心理恐怖 + 空间解谜
在无限循环的阈限空间中寻找出口，每次循环空间微妙变化。
- 参考游戏：The Exit 8、The Bathrooms、Backrooms

## 选定设计依据

**选定方向 C：那由他之梦**

理由：
1. **差异化最强** — 宇宙恐怖+暗黑童话的融合在市场上几乎空白，既有克苏鲁的敬畏感，又有童话的情感温度
2. **情感深度** — 从"脆弱与韧性"出发，主角不是战士而是寻找记忆的少女，与2026玩家情感需求高度契合
3. **美术空间大** — 暗黑童话+宇宙恐怖提供了极具辨识度的视觉方向，适合用 shader 和生成艺术创造震撼画面
4. **玩法可扩展** — 探索解谜为核心，可逐步加入战斗、收集、Roguelite 元素
5. **名字契合** — "那由他"（Nayuta）是佛教计量单位，意为"不可计数之遥远"，完美暗示宇宙恐怖的尺度感与深渊的无尽

### 世界观定义（200字）
在时间的尽头，少女"那由他"从一场无始无终的梦中醒来，发现自己身处由破碎记忆构成的深渊——"忘却之海"。每一层深渊都是一段被遗忘的世界记忆：坍缩的星系、沉没的神殿、被吞噬的文明。她必须收集散落的"记忆之锚"，才能向下深入，接近深渊底部的真相。但越深入，现实的边界越模糊——那些记忆并非属于人类，而是来自一个远超人类认知的宇宙存在。当最后的锚被找到，那由他将面对一个选择：回归虚无的安宁，还是以凡人之躯凝视深渊？

### 核心循环
探索深渊层 → 发现记忆碎片 → 解谜解锁新区域 → 收集记忆之锚 → 深入下一层 → 世界逐渐异变 → 最终抉择

### 独特卖点
1. **记忆即关卡** — 每层深渊是一段"被遗忘的世界记忆"，关卡设计可跨越时空（星系→海底→废墟→梦境）
2. **现实侵蚀系统** — 随着深入，UI、画面、音乐逐渐"被侵蚀"，从童话风渐变为宇宙恐怖
3. **零对白叙事** — 全程无文字对白，通过环境、光影、shader 特效讲述故事
