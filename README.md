# 3D 城市绿色能源沙盘

Runjian Command Center 风格的 3D 绿色能源城市沙盘。它不是静态模型展示页，而是一个可交互的运维指挥中心：中间是低多边形城市，左右两侧是事件流、KPI、AI agent、设施状态和处置动作。

## 快速开始

```bash
npm install
npm run dev
```

常用命令：

```bash
npm run verify   # 布局/道路/车辆/procedural/street-prop 验证
npm run build    # TypeScript + Vite 构建
npm run test     # Vitest
npm run preview  # 预览生产构建
```

dev server 默认运行在 `http://localhost:5173`。

## 当前体验

用户打开页面后看到的是一个实时能源运维 cockpit：

- 顶部展示系统健康、告警数、链路延迟、在线 AI agent 和 MYT/UTC 时间。
- 左侧是事件流，包含 PS-02 告警、无人机巡检、维修派单、H2/VAT/风场等状态。
- 中央是 Three.js 城市沙盘，可巡航、缩放、点击设施查看卡片。
- 右侧是 AI agent 面板，展示诊断、调度、报表、工单等动作。
- dev 模式会在布局违规时显示 `LAYOUT AUDIT FAILED` banner。

## 技术栈

- React 18 + Vite 5
- TypeScript
- `@react-three/fiber` + `@react-three/drei`
- three.js `0.169`
- Framer Motion、Recharts、Sonner、Radix UI、Lucide React
- Vitest

## 城市模型

城市基调是“住宅为主 + 少量能源锚点”，避免变成设备展厅。

当前主要区域：

| 区域 | 内容 |
| --- | --- |
| 中央广场 | CommandTower、PS-01、PS-02、PS-05、EVChargingStation、BenchPlanters、EnergyPlazaRelay |
| 北侧 | DroneHub、PS-04 CarRow |
| 东侧 | GreenEcoOffice |
| 西侧 | SolarCanopy、H2Sphere、PowerSubstation |
| 南侧 | VAT、TransmissionTower |
| NE | TwinSolarOffice + skyline/CBD 锚点 |
| NW | CommunityPark |
| SW | WindFarmHill |
| SE | ContainerStack、WaterTanks |
| 外圈 | University、Hospital、Museum、Market、SportsComplex、TransitHub、ResearchPark、DataCenter |

当前 telemetry 节点为 `PS-01`、`PS-02`、`PS-04`、`PS-05`。`PS-03` 的南侧位置已被 `EVChargingStation` 取代。

## 架构速览

- `src/App.tsx`：指挥中心 UI shell，负责顶部状态、事件流、agent 面板、toast、场景 lazy load。
- `src/components/CityScene.tsx`：3D 场景装配层，只组合元素，不承载大型 inline 几何。
- `src/elements/`：所有 3D 元素，按 buildings、facilities、road、street、vehicles、fx、people 等目录拆分。
- `src/scene/layout.ts`：静态设施布局登记表 `PLACEMENTS` 和浏览器/runtime 布局验证逻辑。
- `src/scene/roads.ts`：道路中心线、宽度、buffer、reach、stub road 的单一事实源。
- `src/scene/cityPlan.ts`：可见道路与地块平面。
- `src/scene/cityGenerator.ts`：procedural building 生成和 reserved zones。
- `src/scene/showroomContract.ts`：交互锚点、卡片 bound、展厅契约。
- `scripts/verify-layout.ts`：提交前布局验证入口。

## 布局纪律

现实问题：这个项目的 3D 道具很多，肉眼看“差不多没撞”很容易漏掉旋转后的 AABB、道路 buffer、procedural 建筑和街边道具叠柱。漏一次，用户看到的就是车穿楼、屏幕背对马路、路灯长在空地上。

所以规则很硬：

- 每个硬编码静态 prop 坐标都必须登记在 `src/scene/layout.ts` 的 `PLACEMENTS`。
- 移动道具时，组件坐标和 `PLACEMENTS` 必须同步。
- 改道路常量时，同步 `roads.ts`、`cityPlan.ts`、排除逻辑和验证器预期。
- 不要用手算或 “verified manually” 代替 `npm run verify`。

更细的 agent 操作规则在 `AGENTS.md`。

## 验收清单

视觉相关改动至少跑：

```bash
npm run verify
npx tsc --noEmit
```

然后打开浏览器确认：

- 页面标题 `GREEN GRID · Command` 渲染。
- 没有红色 `LAYOUT AUDIT FAILED` banner。
- `PS-01`、`PS-02`、`PS-04`、`PS-05` 出现在 telemetry/node 状态里。
- 中央广场、mid-block 主题、外圈 civic landmarks、远景天际线没有明显穿模、悬浮、占路或遮挡。

## 参考文档

- `AGENTS.md`：agent 工作约束、踩坑记录、布局规则。