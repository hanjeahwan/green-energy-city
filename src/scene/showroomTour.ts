import type { MasterplanSectorId } from './masterplan'

export interface ShowroomTourStop {
  stopId: string
  sectorId: MasterplanSectorId
  anchorId: string
  titleZh: string
  lineZh: string
  agentActionZh: string
  facilityIds: string[]
}

export const SHOWROOM_TOUR: ShowroomTourStop[] = [
  {
    stopId: 'command-core',
    sectorId: 'ne-cbd',
    anchorId: 'command-tower',
    titleZh: '全城 AI 能源指挥中心',
    lineZh: '客户一进展厅先看到中心塔：所有光伏、储能、氢能、车网和风电数据汇入同一个调度脑。',
    agentActionZh: '指挥智能体统一排序告警、派工、功率预测和客户讲解路径。',
    facilityIds: ['command-tower', 'PS-02', 'substation-W']
  },
  {
    stopId: 'north-mobility',
    sectorId: 'north-emobility',
    anchorId: 'ev-N',
    titleZh: 'AI 车网协同港',
    lineZh: '北侧展示电动车充放电、无人机巡检和移动负荷预测的协同运行。',
    agentActionZh: '出行智能体根据排队车辆、光伏余电和电价自动调整充电功率。',
    facilityIds: ['ev-N', 'drone-N', 'PS-04']
  },
  {
    stopId: 'east-storage',
    sectorId: 'east-storage',
    anchorId: 'green-office-E',
    titleZh: '储能与智能楼宇优化区',
    lineZh: '东侧把办公负荷、PS-02 储能 SoC 和分布式光伏接成一套楼宇级微网。',
    agentActionZh: '储能智能体执行削峰填谷，并把异常电芯推送给运维智能体。',
    facilityIds: ['PS-02', 'green-office-E']
  },
  {
    stopId: 'south-grid',
    sectorId: 'south-grid',
    anchorId: 'vat-S-W',
    titleZh: '风光电网调度带',
    lineZh: '南侧以低噪风机、输电塔和服务库展示城市边界的并网调度。',
    agentActionZh: '电网智能体预测 15 分钟功率波动，提前给储能和变电站下发约束。',
    facilityIds: ['vat-S-W', 'trans-S']
  },
  {
    stopId: 'west-hydrogen',
    sectorId: 'west-hydrogen',
    anchorId: 'h2-W-NW',
    titleZh: '氢能韧性社区',
    lineZh: '西侧表现氢储能与社区负荷的备用能力，适合讲城市韧性和安全边界。',
    agentActionZh: '韧性智能体根据压力、库存和社区负荷自动生成备用供能策略。',
    facilityIds: ['canopy-W', 'h2-W-NW']
  },
  {
    stopId: 'ne-cbd',
    sectorId: 'ne-cbd',
    anchorId: 'twin-office-NE',
    titleZh: '微网金融中枢',
    lineZh: '东北角用高层天际线与双塔办公体现客户展厅的城市尺度和商务场景。',
    agentActionZh: '楼宇智能体联动租户舒适度、需求响应和屋顶光伏收益。',
    facilityIds: ['twin-office-NE']
  },
  {
    stopId: 'nw-community',
    sectorId: 'nw-community',
    anchorId: 'nw-park',
    titleZh: '低碳生活社区',
    lineZh: '西北角围绕社区公园展开：居民楼组团 + 步道 + 中央喷泉，配套微网与社区智能体讲解。',
    agentActionZh: '社区智能体根据园区客流和微气候数据调度灯光与喷泉，并向居民推送活动信息。',
    facilityIds: ['nw-park']
  },
  {
    stopId: 'se-logistics',
    sectorId: 'se-logistics',
    anchorId: 'container-A',
    titleZh: '清洁物流场站',
    lineZh: '东南角让客户看到仓储、冷链、车辆调度和能源成本优化的工业场景。',
    agentActionZh: '物流智能体在电价低谷安排冷链预冷和车辆补能。',
    facilityIds: ['container-A', 'container-B']
  },
  {
    stopId: 'sw-wind-ops',
    sectorId: 'sw-wind-park',
    anchorId: 'wind-1',
    titleZh: '风电运维基地',
    lineZh: '西南角用小型风机山丘、气象点和运维建筑补齐城市边界的能源来源。',
    agentActionZh: '运维智能体根据振动、风速和巡检历史生成下一班检修路线。',
    facilityIds: ['wind-1']
  },
  // ===== Outer-ring civic landmarks (extended tour) =====
  {
    stopId: 'n-edu-edge',
    sectorId: 'n-edu-edge',
    anchorId: 'university-N',
    titleZh: '绿色能源大学',
    lineZh: '北侧外圈是城市的知识引擎：能源工程学院与车网协同实验室共享同一片屋顶光伏。',
    agentActionZh: '校园智能体把课程电力消耗、实验室仪器排程与北侧 PS-04 充电池组联动。',
    facilityIds: ['university-N']
  },
  {
    stopId: 'e-health-edge',
    sectorId: 'e-health-edge',
    anchorId: 'hospital-E',
    titleZh: '智慧医疗中心',
    lineZh: '东侧外圈承担城市三甲医疗，十字主楼带屋顶直升机停机坪，邻近 GreenEcoOffice。',
    agentActionZh: '医疗智能体监控负载并保留 8 小时离网应急储能，急救通道接入车网优先调度。',
    facilityIds: ['hospital-E']
  },
  {
    stopId: 's-culture-edge',
    sectorId: 's-culture-edge',
    anchorId: 'museum-S',
    titleZh: '城市记忆博物馆',
    lineZh: '南侧外圈用柱廊博物馆 + 户外广场 + 镜面水池，提供给客户城市公共文化的视觉锚点。',
    agentActionZh: '文化智能体根据当日人流与天气调整广场灯光、水池流速和展厅推荐。',
    facilityIds: ['museum-S']
  },
  {
    stopId: 'w-market-edge',
    sectorId: 'w-market-edge',
    anchorId: 'market-W',
    titleZh: '邻里市集',
    lineZh: '西侧外圈是住宅居民的零售动线，10 个青色帆布摊位组成连续天棚，连通氢能社区。',
    agentActionZh: '零售智能体管理冷链摊位补冷、电费分摊与高峰时段的微电网负荷转移。',
    facilityIds: ['market-W']
  },
  // ===== Phase 2 outer-ring landmarks =====
  {
    stopId: 'nw-sports',
    sectorId: 'n-edu-edge',
    anchorId: 'sports-NW',
    titleZh: '社区体育综合体',
    lineZh: '西北外圈塞进一个椭圆跑道 + 看台 + 篮球场，邻近大学校园和居民住宅，是夜跑和周末活动的中心。',
    agentActionZh: '场馆智能体根据预订高峰提前预冷场地灯光与看台 LED 大屏。',
    facilityIds: ['sports-NW']
  },
  {
    stopId: 'w-transit',
    sectorId: 'w-market-edge',
    anchorId: 'transit-W',
    titleZh: '西侧交通枢纽',
    lineZh: '西侧深处是新一代多式联运枢纽：4 个 BUS 泊位 + 地铁口 + 共享单车桩，把市集和外圈住宅接入主城网络。',
    agentActionZh: '出行智能体根据车流和电池余量统一调度公交补能与共享单车再分布。',
    facilityIds: ['transit-W']
  },
  {
    stopId: 'ne-research',
    sectorId: 'e-health-edge',
    anchorId: 'research-NE',
    titleZh: 'AI 能源科研园区',
    lineZh: '东北外圈承接大学的研究 spin-out：三栋玻璃实验楼围合中央反射水池，与医院组成「知识 + 健康」组团。',
    agentActionZh: '科研智能体把实验仪器排程、楼宇负载和数据中心算力打通调度。',
    facilityIds: ['research-NE']
  },
  {
    stopId: 'w-datacenter',
    sectorId: 'w-market-edge',
    anchorId: 'data-W',
    titleZh: 'AI 算力大厅',
    lineZh: '西南深处是城市的「大脑」实体：长方体服务器机房 + 屋顶冷却塔 + 周界围栏，是命令塔的物理基座。',
    agentActionZh: '运营智能体根据电网负荷在低谷加速算力任务，并把余热反馈给区域供暖网络。',
    facilityIds: ['data-W']
  }
]
