# AGENTS.md · 3D 城市绿色能源沙盘

本文件是给 coding agent 的操作手册。`README.md` 面向项目使用者；这里保留会直接影响实现正确性的项目约束、事实源和验收门槛。

## 语言与协作

- 用户交互响应只用简体中文。
- 代码、命令、配置、提交信息、文件内容按项目/生态约定；本项目源码与注释以英文为主，项目说明文档以中文为主。
- 技术名词、API、库名、错误名、命令名、路径保留原文。
- 解释技术方案时先讲真实使用场景，再讲技术机制和取舍。不要只给抽象概念。
- 不要为了过测试删除、跳过或放宽测试；不要用 `any`、`@ts-ignore`、禁用 lint 来藏错误，除非任务语境明确支持并说明理由。
- 不要回滚用户已有改动。工作区脏时只改本任务相关文件。

## 项目定位

React + Vite + `@react-three/fiber` + three.js `0.169`。目标是 Runjian Command Center 风格的可视化外壳，加一个低多边形、住宅为主的绿色能源城市沙盘。

第一屏必须是可用的指挥中心体验，不是营销 landing page。3D 城市、事件流、AI agent 面板、设施卡片和相机巡航共同构成核心演示。

## 最高优先级

1. **布局单一事实源**：所有硬编码静态 prop 坐标必须登记到 `src/scene/layout.ts` 的 `PLACEMENTS`。
2. **验证器是唯一判定者**：不要写 “verified manually”，不要靠手算说没撞路、没穿模。
3. **道路视觉与碰撞同步**：`src/scene/roads.ts` 是道路常量真相源，`src/scene/cityPlan.ts` 是可见沥青真相源；改路网必须同步。
4. **城市不是能源展厅**：住宅是主体，每类能源设施只保留少量代表性锚点，不要为了“丰富”重复堆同类道具。
5. **浏览器测试显式触发**：算法验证不等于看起来正确，但不要把浏览器测试当成默认动作。只有用户明确要求浏览器验收、截图、视觉测试，或 autonomous 程序进入完整端到端验收流程时，才打开浏览器做 DOM 和截图检查。

## React / R3F 状态规则

真实使用场景：展厅页面会一边自动巡航相机，一边响应用户 hover、点击设施、打开操作员卡片。这里最容易爆的不是组件文件太长，而是一次 hover 把几十个 anchor、整棵 Canvas、DOM HUD 全部带着重算。

- Canvas 内高频交互状态必须用 selector store 订阅。`hoveredTarget`、`selectedTarget`、cue、camera readout 这类状态不要用大 Context 广播；重复渲染的 anchor、marker、card 只能订阅“自己是否相关”的 boolean 或标量。
- `CityScene.tsx` 必须保持 composition-only。不要在 scene root 订阅 `hoveredTarget` / `selectedTarget` 整对象；事件 handler 需要最新状态时，用 store `getState()` 读取，避免为了事件逻辑触发整棵 Canvas re-render。
- `useFrame` 内禁止每帧写 DOM / dataset / React state，禁止每帧 `new THREE.*`。需要临时对象用 `useRef` 复用，需要颜色、曲线、geometry 用 `useMemo`，需要 HUD/debug 数据用 store 节流发布。
- UI 不要走 `useFrame -> document.dataset/window.__debug -> setInterval/rAF -> React` 这种旁路。`window.__*` 只用于审计、测试和 debug，不作为真实 UI 数据流。
- 高 churn Context 要拆。Context 只适合低频依赖注入；action log、proposal、cue request、selection、camera runtime 这类会频繁变化的状态应使用 Zustand selector store 或等价 selector 机制。

## 单一事实源与契约测试

真实使用场景：用户点击某个设施后，相机聚焦、卡片内容、布局验证、可视沥青和操作员路线都应该指向同一个东西。只要 anchor id、placement id、road constants 或 telemetry node list 漂移，页面会表现成“点得到但聚焦错”“验证没报错但路不见了”“HUD 节点和场景节点不一致”。

- 同一业务事实只能有一个主登记点。布局 block、anchor→placement 映射、road constants、telemetry node list 变更时，必须补契约测试防止两份清单漂移。
- Node 脚本和验证器不得 import React/R3F renderer 文件。纯 type / registry 要放在无 JSX、无 three runtime 的模块里，避免 `tsc -b` 或 `tsx scripts/*` 被渲染层依赖污染。
- 新增或移动 showroom anchor 时，同步检查 `PLACEMENTS`、`SHOWROOM_ANCHOR_REGISTRY`、`SHOWROOM_ANCHOR_PLACEMENT_IDS`、selectable focus frame、metadata fallback 和对应契约测试。
- 改道路时必须同时验证“碰撞真相源”和“可见沥青真相源”。`roads.ts` 变更要有测试确认 `cityPlan.ts` 渲染了对应 avenue/stub。

## Typography / Tailwind / shadcn 规则

目标：DOM HUD、shadcn primitive、浏览器默认字号共享同一个 `rem` 基准；项目语义字号通过 Tailwind v4 theme token 表达。

- `html` root font-size 必须保持 `16px`。
- `body` 承载产品默认显示密度；不要用 root font-size 调整体 UI 密度。
- 项目 DOM/HUD 字号使用 `text-ui-*` token：`text-ui-micro`、`text-ui-caption`、`text-ui-label`、`text-ui-body`、`text-ui-title`、`text-ui-metric`。
- 项目 DOM/HUD 行高使用 `leading-ui-*` token；字距使用 `tracking-ui-*` token。
- 新增可复用 typography 值时，先扩展 `src/styles.css` 的 `@theme inline`，再在 JSX/CSS 中使用对应 utility。
- 禁止在项目 HUD 中新增裸的 `text-[Npx]`、`leading-[N]`、`tracking-[N]`，除非该值是一次性布局修正并在代码旁说明原因。
- shadcn primitive 默认字号保留在 `src/components/ui/*` 内；不要全局替换 `text-xs`、`text-xs/relaxed`、`text-[0.625rem]`。
- 调用 shadcn 组件承载 command-center 内容时，在调用处用项目 token 覆盖文本层级；不要在同一个组件树里混用 shadcn 默认字号、硬编码 px 和项目 token。
- 3D scene 坐标、几何尺寸、材质色不属于 Tailwind typography；坐标服从 `PLACEMENTS` / scene registry，颜色服从 scene palette。
- Dev-only UI（例如 `LayoutAuditBanner`）不定义产品 typography 标准。
- Typography 重构顺序：先加 token，再迁移项目 HUD，再处理 3D `<Html>` card / fixed-height 控件，最后才考虑 shadcn variant。
- Typography 视觉正确性不由 `npm run verify` 证明；需要视觉验收时必须做浏览器 DOM/截图检查。

## R3F 性能红线

真实使用场景：客户演示机上掉帧先表现为 hover 抖、点击切卡顿、相机过渡发喘。优先修会直接影响操作手感的热路径，不要先做只让代码看起来更优雅的拆分。

- 先修全场 re-render、frame-loop DOM 写入、每帧对象分配、永久 rAF 轮询。不要优先做“更优雅但不降成本”的拆文件。
- 重复出现的 3D 元素优先考虑 instancing 或共享 geometry/material；但只有在 draw call / frame time 数据显示收益明确时再做。
- 调试指标要低频采样。HUD 级数据 10Hz 已足够；性能指标 1Hz 已足够。不要把 debug 通道做成主线程常驻负载。

## 常用命令

```bash
npm run dev      # 启动 Vite，默认 http://localhost:5173
npm run verify   # 布局、道路、procedural、vehicle、street-prop 验证
npm run build    # tsc -b + vite build
npm run test     # vitest run
```

不要把 `npm run build` 当成每次改动后的默认动作。小范围视觉、文案、单点布局或数据登记改动，优先跑与风险匹配的检查，例如 `npm run verify`、相关测试或 `npx tsc --noEmit`。只有在改到构建配置、依赖、打包边界、类型边界明显受影响、准备发布/提交前需要完整产物验证，或用户明确要求时，才跑 `npm run build`。

dev 模式必须保留 `<LayoutAuditBanner/>` 在 `src/App.tsx` 顶层挂载。布局违规时必须显示红色 `LAYOUT AUDIT FAILED` banner，并在 console 输出完整违规。

## 提交前验收

视觉相关改动提交前必须完成：

1. **算法层**：`npm run verify` 返回 `0 violations, 0 kind drift, 0 vehicle path issues, 0 procedural building issues, 0 street-prop rule violations`。
2. **类型层**：默认跑 `npx tsc --noEmit`；只有改到构建链、依赖、打包输出或提交/发布前确实需要完整产物验证时，才跑 `npm run build`。不能引入新增类型错误。
3. **浏览器 DOM（显式触发时）**：只有用户明确要求浏览器验收、截图、视觉测试，或 autonomous 程序进入完整端到端验收流程时，才打开 dev server，确认页面标题 `GREEN GRID · Command` 渲染；顶部没有红色 `LAYOUT AUDIT FAILED` banner；telemetry 的 node 状态包含当前 4 个节点 `PS-01`、`PS-02`、`PS-04`、`PS-05`。
4. **浏览器视觉（显式触发时）**：只有用户明确要求，或 autonomous 程序进入完整端到端验收流程时，才截图确认中央广场、四个 mid-block 主题、外圈 civic landmarks、远景天际线都正常；没有悬浮、穿模、占路、标签互相遮挡。

如果 Preview screenshot 因 WebGL 压力 timeout，用真实 Chrome tab + screenshot。不要用 commit message 里写 “scene visuals unchanged” 代替验收。

## 布局登记规则

`src/scene/layout.ts` 的 `PLACEMENTS` 是硬编码静态设施的空间真相源。`verifyLayout()` 使用同一套 OBB 旋转后 AABB 计算，检查道路占用、pairwise overlap 和 sweep 半径。

- 新增静态 prop：先加 `PLACEMENTS`，再渲染组件。
- 移动静态 prop：组件坐标和 `PLACEMENTS` 必须同步。
- 同一设施组内允许重叠的子件用 `group` 标记，例如 `PS-02` 的 SolarFarm + BatteryBank。
- `halfW/halfD` 是旋转前本地 x/z 半宽；`rot` 是 Y 轴弧度；`sweepR` 用于风机/VAT 等旋转部件的额外半径。
- 空中元素用 `airborne: true`，只在确实没有地面 footprint 时使用。
- 街道道具类型登记在 `STREET_PROP_KINDS`。现在包括 `Billboard`，新增 RoadSign、BusShelter 等时必须加入集合，让验证器覆盖。

## Footprint 与 variant

- `PLACEMENTS` 是 footprint 真相源。
- 禁止重新引入 `FACILITY_FOOTPRINTS` 或其他 per-kind footprint catalog 到 `src/elements/facilities/catalog.ts`。
- `scripts/verify-layout.ts` 会检查同一 `(kind, variant)` 的 `halfW/halfD/sweepR` 必须一致。
- 如果一个 renderer variant 改变实际占地，必须使用新的 `variant` id，并让所有同 kind+variant 的登记 footprint 一致。
- procedural `pv-*` 位置是实例级 footprint，跳过 kind drift 检查。

## 路网规则

道路常量在 `src/scene/roads.ts`：

- `ROAD_AVENUES_X = [-24, -16, -8, 8, 16, 24]`
- `ROAD_AVENUES_Z = [-22, -16, -8, 8, 16, 22]`
- `ROAD_HALF_WIDTH = 0.75`
- `ROAD_BUFFER = 0.2`
- `ROAD_REACH = 28`

道路碰撞阈值是 `0.95`，也就是 `ROAD_HALF_WIDTH + ROAD_BUFFER`，不是 `0.75`。

改 `ROAD_AVENUES_X/Z`、`ROAD_REACH` 或 `STUB_RECTS` 时，要同步：

- `src/scene/cityPlan.ts` 的 `buildPrimaryInnerRoads()` 可见沥青。
- `src/scene/exclusion.ts` 的 road/stub 排除行为。
- `src/scene/lampLayout.ts`、`src/elements/road/RoadMarkings.tsx` 等依赖道路常量的生成逻辑。
- `scripts/verify-layout.ts` 对 procedural/stub/vehicle 的验证预期。

`STUB_RECTS` 是视觉-only stub road：不是 avenue，不进 `ROAD_AVENUES`，但必须让 `cityPlan` 渲染、`cityGenerator` 跳过、`verify-layout` 检查。

## 生成算法约束

- `roads.ts` 与 `cityPlan.ts` 必须同步。改碰撞道路常量、stub 或 reach 时，必须同步可见沥青生成，避免逻辑认路但画面缺路。
- 改 `RESERVED_ZONES` 必须核对 procedural lot grid 结果。由于 lot 由 `cellSize` 派生，必须确认新旧 lot center 差量或验证目标建筑确实变化。
- procedural overlap 验证必须穷举 source × source。当前 building 来源至少有 procedural、masterplan、`PLACEMENTS`；新增 source class 时必须补全 pairwise 组合。
- 道路元素数量用纯 `Math.round(span / step)`。当 `N <= 0` 时 early return；禁止用 `Math.max(1, ...)` 强塞短段元素。
- 最外圈 grid intersection 的 outward-facing 元素必须在生成阶段 suppress；不要依赖渲染裁剪。
- OBB 旋转 footprint 必须按 `obbToAABB()` 判断世界轴向占地。`rot = ±π/2` 会交换 `halfW` / `halfD` 的世界投影。
- sparse block 定义为 block 内 reserved facility ≤ 1，不按程序生成建筑密度判断。街道道具只放 sparse block；`legacy: true` 只能用于既有保留位置。
- 街道道具 `rot` 只允许 `0`、`π`、`π/2`、`-π/2`，避免道具背对马路。
- billboards/lamps 等视觉柱必须按道路线检查堆叠。同一条 outer road 上间距 < 10m 的柱状物会在透视上读成重复堆叠。
- 多车防撞必须靠独立环路，不靠时间错峰。ServiceVan/Sedan/Truck 分别使用内环 ±8、中环 ±16、外环 x=±24/z=±22。
- Drone 路径必须避开 CommandTower 正上方。塔顶球约 y=5.59m；扫描中央广场用偏心圆或绕 PV 环，不用必经原点的 figure-8/lemniscate。

## 城市设计纪律

当前城市应该读成“住宅为主的运行中城市”，不是“把每种绿色能源设备摆满一圈的展厅”。

- 每类能源设施只保留代表性锚点；新增道具前先确认是不是已有同类。
- mid-block 主要留给 residential infill；NE 是唯一 skyline/CBD 锚点。
- 建筑由 `MASTERPLAN_BUILDINGS` + `buildProceduralBuildings()` 混合生成，防碰撞靠 `isReservedOrMasterplan()`、`RESERVED_ZONES` 和验证器兜底。
- 中央广场保留留白。不要为了“塞满”加内圈道具。

当前场景事实（改动时保持同步）：

| 区域 | 主要内容 | 备注 |
| --- | --- | --- |
| 中央广场 | CommandTower、PS-01、PS-02、PS-05、EVChargingStation、BenchPlanters、EnergyPlazaRelay | PS-03 已由 EVChargingStation 取代；PS-02 是告警锚点 |
| 北 (z≈12/14) | DroneHub、PS-04 CarRow | E-mobility / drone 运维 |
| 东 (x≈12) | GreenEcoOffice | 东侧能源建筑锚点 |
| 西 (x≈-12) | SolarCanopy、H2Sphere、PowerSubstation | H2 只保留单球 |
| 南 (z≈-12) | 1 个 VAT、TransmissionTower | VAT 只保留单台 |
| NE | TwinSolarOffice + masterplan skyline | 唯一天际线锚点 |
| NW | CommunityPark | 已替代旧 Crane set-piece |
| SW | WindFarmHill | 自带 3 个 mini wind turbine |
| SE | ContainerStack × 2、WaterTank × 3 | 保留少量工业感 |
| 外圈 | University、Hospital、Museum、Market、SportsComplex、TransitHub、ResearchPark、DataCenter | Phase 2/3 城市扩展锚点 |

## 禁用实现模式

- 禁止 `PVHotspot` 使用 rng-based 旋转。PV 旋转必须来自 placement 的显式 `rot`，保证 AABB 可预测。
- 禁止启用 PostFX Bloom。后处理保持克制，避免相机旋转时出现黑闪类渲染风险。
- 禁止启用 PostFX SSAO。阴影层次用 `BaseShadowDisc` 和底部 outline 表达。
- 禁止恢复全城 `PowerGrid` bezier cables。能源流用标签、状态环和选择态表达，避免 PV 到 CommandTower 的线缆噪音。
- 禁止把旧 inline `AIScanBeam` / `PipeRuns` / `RoadCones` 逻辑搬回 `CityScene.tsx`。相关职责必须保留在独立组件或删除状态。

## 文件地图

- `src/App.tsx`：指挥中心 shell、顶部状态、事件流、agent 面板、lazy charts/scene。
- `src/components/CityScene.tsx`：3D 场景装配层；保持 composition-only，不要塞大型 inline 组件。
- `src/scene/roads.ts`：道路常量与 `STUB_RECTS`。
- `src/scene/layout.ts`：`PLACEMENTS`、`BLOCKS`、street-prop 分类、`verifyLayout()`。
- `scripts/verify-layout.ts`：pre-commit/手动布局验证入口。
- `src/scene/cityPlan.ts`：可见道路、地块、城市平面计划。
- `src/scene/cityGenerator.ts`：procedural building 生成与 `RESERVED_ZONES`。
- `src/scene/vehicles.ts`：车辆路径真相源与 path validator。
- `src/scene/showroomContract.ts`：3D 锚点、卡片 bound、展厅交互契约。
- `src/data.ts`：事件流、PV/V2G 节点、KPI。
- `src/data/agents.ts`：右侧 AI agent 人设、动作与响应文案。
- `src/elements/`：所有 3D 元素模块，按 buildings/facilities/road/street/vehicles/fx/nature/people 拆分。

## Elements 组织

`CityScene.tsx` 只负责装配。新元素优先放在 `src/elements/*`：

```text
src/elements/
  buildings/      # building renderers, skyline, command tower, catalog
  facilities/     # PV, storage, EV, H2, civic/outer landmarks, heavy props
  road/           # roads, lamps, markings
  street/         # bench planters, billboards
  vehicles/       # ServiceVan, Sedan, Truck, Drone, ParkedEV
  fx/             # route lines, assignment cues, sky dome
  ground/         # ground plate
  parcels/        # masterplan / energy plaza ground
  nature/         # trees and planters
  people/         # Lego-style operator/person variants
  shared/         # instancing/shared assets
```

大型 visual set-piece 新增流程：

1. 先判断是否符合城市设计纪律，尤其是是否重复同类能源设施。
2. 在 `src/elements/...` 写独立组件，复用 `sceneMaterials.ts` / `scenePrimitives.tsx`。
3. 在 `PLACEMENTS` 登记 footprint；如需交互卡片，同步 `showroomContract.ts`。
4. 如会影响 procedural infill，同步 `RESERVED_ZONES`。
5. 跑 `npm run verify`，再做浏览器验收。
