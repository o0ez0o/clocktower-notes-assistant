import { useEffect, useMemo, useRef, useState } from "react";
import {
  BottomSheet,
  Carousel,
  KeyboardInput,
  KeyboardTextarea,
  MobileScroll,
} from "./mobile";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  CopyIcon,
  Cross2Icon,
  EyeOpenIcon,
  FileTextIcon,
  GearIcon,
  MagnifyingGlassIcon,
  Pencil1Icon,
  Pencil2Icon,
  PlusIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import "./prototype.css";
import "./responsive.css";
import "./design-system.css";
import { translate, teamText, type Language } from "./i18n";

function LightbulbIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 18h6M10 21h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.2 15.1C6.8 14 6 12.3 6 10.5a6 6 0 1 1 12 0c0 1.8-.8 3.5-2.2 4.6-.6.5-.8 1.1-.8 1.9H9c0-.8-.2-1.4-.8-1.9Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
type Mark =
  | "demon"
  | "minion"
  | "drunk"
  | "poison"
  | "poisonQ"
  | "deadVote"
  | "deadSpent"
  | "madness"
  | "question";
type CoreTeam = "镇民" | "外来者" | "爪牙" | "恶魔";
type Team = CoreTeam | "旅行者";
type Role = {
  id: string;
  zh: string;
  en: string;
  team: Team;
  edition: "tb" | "bmr" | "snv" | "carousel" | "sy" | "zhenhuan";
  image: string;
  gender?: "男" | "女" | "未标注";
  abilityZh?: string;
  firstNightReminderZh?: string;
  otherNightReminderZh?: string;
};
type Player = {
  id: number;
  name: string;
  role?: Role;
  marks: Mark[];
  notes: Record<number, string>;
};
type Relation = {
  id: number;
  day: number;
  from: number;
  to: number;
  type: "nominate" | "good" | "bad";
  votes?: number[];
  executed?: boolean;
};
type DeathEvent = {
  id: number;
  day: number;
  playerId: number;
  reason: "execution" | "manual" | "revival";
};
type ScriptBoard = {
  id: string;
  name: string;
  roleIds: string[];
  official?: boolean;
  author?: string;
  sourceLabel?: string;
  specialRule?: string;
};
type Composition = Record<CoreTeam, number>;
type DisplaySettings = {
  showRoleNames: boolean;
  showPlayerNames: boolean;
  alwaysShowDailyRoles: boolean;
  markSize: "small" | "medium" | "large";
};
const assetUrl = (path: string) => `${import.meta.env.BASE_URL}assets/${path}`;
const fanRoleIcon = (name: string, team: Team) => {
  const palette: Record<Team, [string, string]> = {
    镇民: ["#d8eef2", "#17647b"],
    外来者: ["#dcebf5", "#336b8c"],
    爪牙: ["#f1d8d7", "#8a2c32"],
    恶魔: ["#ecd0cc", "#761c22"],
    旅行者: ["#eee2c7", "#765532"],
  };
  const [background, foreground] = palette[team];
  const label = name.slice(0, 2);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><circle cx="48" cy="48" r="45" fill="${background}" stroke="${foreground}" stroke-width="4"/><path d="M25 70c5-18 15-27 23-27s18 9 23 27" fill="none" stroke="${foreground}" stroke-width="5" opacity=".28"/><circle cx="48" cy="31" r="13" fill="none" stroke="${foreground}" stroke-width="5" opacity=".28"/><text x="48" y="57" text-anchor="middle" font-family="serif" font-weight="700" font-size="23" fill="${foreground}">${label}</text></svg>`,
  )}`;
};
const zhenHuanAvatarFiles: Record<string, string> = {
  "zhenhuan-huanbi": "huanbi.png", "zhenhuan-yurao": "yurao.png",
  "zhenhuan-jingfei": "jingfei.png", "zhenhuan-xiaoyunzi": "xiaoyunzi.png",
  "zhenhuan-jinxi": "jinxi.png", "zhenhuan-wenshichu": "wenshichu.png",
  "zhenhuan-guojunwang": "guojunwang.png", "zhenhuan-sanage": "sanage.png",
  "zhenhuan-yelanayi": "yelanyi.png", "zhenhuan-dunqinwang": "dunqinwang.png",
  "zhenhuan-qiguiren": "qiguiren.png", "zhenhuan-chunyuan": "chunyuan.png",
  "zhenhuan-niangengyao": "niangengyao.png", "zhenhuan-zhenhuan": "zhenhuan.png",
  "zhenhuan-longyue": "longyue.png", "zhenhuan-qifei": "qifei.png",
  "zhenhuan-sundaying": "sundaying.png", "zhenhuan-kuangtu": "kuangtu.png",
  "zhenhuan-huafei": "huafei.png", "zhenhuan-anlingrong": "anlingrong.png",
  "zhenhuan-supeisheng": "supeisheng.png", "zhenhuan-huanghou": "huanghou.png",
  "zhenhuan-chongfei": "chongfei.png", "zhenhuan-huangshang": "huangshang.png",
  "zhenhuan-taihou": "taihou.png", "zhenhuan-huihuntsh": "huihuntsh.png",
  "zhenhuan-nvhuang": "nvhuang.png", "zhenhuan-shutaifei": "shutaifei.png",
  "zhenhuan-caoqinmo": "caoqinmo.png", "zhenhuan-moyan": "moyan.png",
  "zhenhuan-shenmeizhuang": "shenmeizhuang.png", "zhenhuan-miaoyinniangzi": "miaoyin.png",
  "zhenhuan-xiayi": "xiayi.png",
};
const zhenHuanClassicEquivalents: Record<string, string> = {
  "zhenhuan-huanbi": "钟表匠",
  "zhenhuan-yurao": "祖母",
  "zhenhuan-jinxi": "占卜师",
  "zhenhuan-guojunwang": "僧侣",
  "zhenhuan-yelanayi": "教授",
  "zhenhuan-qiguiren": "造谣者",
  "zhenhuan-chunyuan": "贞洁者",
  "zhenhuan-niangengyao": "月之子",
  "zhenhuan-longyue": "圣徒",
  "zhenhuan-kuangtu": "畸形秀演员",
  "zhenhuan-huafei": "女巫",
  "zhenhuan-huanghou": "红唇女郎",
  "zhenhuan-taihou": "沙巴洛斯",
};
const defaultPortrait = (id: number) =>
  assetUrl(`clocktower/default-portrait-${((id - 1) % 4) + 1}.png`);
const tb = [
  ["washerwoman", "洗衣妇", "Washerwoman", "镇民"],
  ["librarian", "图书管理员", "Librarian", "镇民"],
  ["investigator", "调查员", "Investigator", "镇民"],
  ["chef", "厨师", "Chef", "镇民"],
  ["empath", "共情者", "Empath", "镇民"],
  ["fortuneteller", "占卜师", "Fortune Teller", "镇民"],
  ["undertaker", "送葬者", "Undertaker", "镇民"],
  ["monk", "僧侣", "Monk", "镇民"],
  ["ravenkeeper", "守鸦人", "Ravenkeeper", "镇民"],
  ["virgin", "贞洁者", "Virgin", "镇民"],
  ["butler", "管家", "Butler", "外来者"],
  ["drunk", "酒鬼", "Drunk", "外来者"],
  ["poisoner", "投毒者", "Poisoner", "爪牙"],
  ["spy", "间谍", "Spy", "爪牙"],
  ["imp", "小恶魔", "Imp", "恶魔"],
] as const;
const tbExtra = [
  ["slayer", "猎手", "Slayer", "镇民"],
  ["soldier", "士兵", "Soldier", "镇民"],
  ["mayor", "市长", "Mayor", "镇民"],
  ["recluse", "隐士", "Recluse", "外来者"],
  ["saint", "圣徒", "Saint", "外来者"],
  ["scarletwoman", "红唇女郎", "Scarlet Woman", "爪牙"],
  ["baron", "男爵", "Baron", "爪牙"],
] as const;
const bmr = [
  ["grandmother", "祖母", "Grandmother", "镇民"],
  ["sailor", "水手", "Sailor", "镇民"],
  ["chambermaid", "侍女", "Chambermaid", "镇民"],
  ["exorcist", "驱魔人", "Exorcist", "镇民"],
  ["innkeeper", "旅店老板", "Innkeeper", "镇民"],
  ["gambler", "赌徒", "Gambler", "镇民"],
  ["gossip", "造谣者", "Gossip", "镇民"],
  ["courtier", "侍臣", "Courtier", "镇民"],
  ["professor", "教授", "Professor", "镇民"],
  ["minstrel", "吟游诗人", "Minstrel", "镇民"],
  ["tealady", "茶艺师", "Tea Lady", "镇民"],
  ["pacifist", "和平主义者", "Pacifist", "镇民"],
  ["fool", "弄臣", "Fool", "镇民"],
  ["goon", "莽夫", "Goon", "外来者"],
  ["lunatic", "疯子", "Lunatic", "外来者"],
  ["tinker", "修补匠", "Tinker", "外来者"],
  ["moonchild", "月之子", "Moonchild", "外来者"],
  ["godfather", "教父", "Godfather", "爪牙"],
  ["devilsadvocate", "魔鬼代言人", "Devil's Advocate", "爪牙"],
  ["assassin", "刺客", "Assassin", "爪牙"],
  ["mastermind", "主谋", "Mastermind", "爪牙"],
  ["zombuul", "僵怖", "Zombuul", "恶魔"],
  ["pukka", "普卡", "Pukka", "恶魔"],
  ["shabaloth", "沙巴洛斯", "Shabaloth", "恶魔"],
  ["po", "珀", "Po", "恶魔"],
] as const;
const snv = [
  ["clockmaker", "钟表匠", "Clockmaker", "镇民"],
  ["dreamer", "筑梦师", "Dreamer", "镇民"],
  ["snakecharmer", "舞蛇人", "Snake Charmer", "镇民"],
  ["mathematician", "数学家", "Mathematician", "镇民"],
  ["flowergirl", "卖花女孩", "Flowergirl", "镇民"],
  ["towncrier", "城镇公告员", "Town Crier", "镇民"],
  ["oracle", "神谕者", "Oracle", "镇民"],
  ["savant", "博学者", "Savant", "镇民"],
  ["seamstress", "女裁缝", "Seamstress", "镇民"],
  ["philosopher", "哲学家", "Philosopher", "镇民"],
  ["artist", "艺术家", "Artist", "镇民"],
  ["juggler", "杂耍艺人", "Juggler", "镇民"],
  ["sage", "贤者", "Sage", "镇民"],
  ["mutant", "畸形秀演员", "Mutant", "外来者"],
  ["sweetheart", "心上人", "Sweetheart", "外来者"],
  ["barber", "理发师", "Barber", "外来者"],
  ["klutz", "呆瓜", "Klutz", "外来者"],
  ["eviltwin", "邪恶双子", "Evil Twin", "爪牙"],
  ["witch", "女巫", "Witch", "爪牙"],
  ["cerenovus", "洗脑师", "Cerenovus", "爪牙"],
  ["pithag", "麻脸巫婆", "Pit-Hag", "爪牙"],
  ["fanggu", "方古", "Fang Gu", "恶魔"],
  ["vigormortis", "亡骨魔", "Vigormortis", "恶魔"],
  ["nodashii", "诺-达鲺", "No Dashii", "恶魔"],
  ["vortox", "涡流", "Vortox", "恶魔"],
] as const;
const makeRoles = (
  rows: readonly (readonly [string, string, string, Team])[],
  edition: Role["edition"],
): Role[] =>
  rows.map((r) => ({
    id: r[0],
    zh: r[1],
    en: r[2],
    team: r[3],
    edition,
    image: `https://release.botc.app/resources/characters/${edition}/${r[0]}_${r[3] === "爪牙" || r[3] === "恶魔" ? "e" : "g"}.webp`,
  }));
const roles: Role[] = [
  ...makeRoles([...tb, ...tbExtra], "tb"),
  ...makeRoles(bmr, "bmr"),
  ...makeRoles(snv, "snv"),
  {
    id: "noble", zh: "贵族", en: "Noble", team: "镇民", edition: "carousel",
    image: "https://release.botc.app/resources/characters/carousel/noble_g.webp",
  },
  {
    id: "zhifu", zh: "知府", en: "Zhifu", team: "镇民", edition: "sy",
    image: "https://oss.gstonegames.com/data_file/clocktower/upload/202404/c_2565080943171_2bd68241.jpg",
    abilityZh: "每个夜晚*，你会得知今天是否有非镇民且非旅行者玩家死亡。",
    otherNightReminderZh: "告通知府今天是否有非镇民且非旅行者玩家死亡。",
  },
  {
    id: "shutong", zh: "书童", en: "Shutong", team: "外来者", edition: "sy",
    image: "https://oss.gstonegames.com/data_file/clocktower/upload/202404/c_2027903943171_36d374a5.jpg",
    abilityZh: "在你的首个夜晚，你要选择除你以外的一名玩家：除首个夜晚以外，当他被邪恶玩家的能力选择或影响时，你会在当晚死亡。",
    firstNightReminderZh: "书童选择除自己以外的一名玩家。",
    otherNightReminderZh: "如果书童选择的玩家今晚被邪恶玩家的能力选择或影响，书童死亡。",
  },
  {
    id: "niangjiushi", zh: "酿酒师", en: "Brewer", team: "爪牙", edition: "sy",
    image: "https://oss.gstonegames.com/data_file/clocktower/upload/202301/c_3356597694761_0a4b67e6.jpg",
    abilityZh: "每个夜晚，你要选择一个镇民角色：当他下一次通过自身能力获取信息时，改为得知你给出的信息。",
    firstNightReminderZh: "酿酒师选择一个镇民角色，并为其下一次获取信息准备错误信息。",
    otherNightReminderZh: "酿酒师选择一个镇民角色，并为其下一次获取信息准备错误信息。",
  },
  {
    id: "marionette", zh: "提线木偶", en: "Marionette", team: "爪牙", edition: "carousel",
    image: "https://release.botc.app/resources/characters/carousel/marionette_e.webp",
  },
  ...([
    ["zhenhuan-huanbi", "浣碧", "Huanbi", "镇民", "女", "在你的首个夜晚，你会得知恶魔与爪牙之间最近的距离。（邻座玩家距离为1）当你坐在果郡王旁边时，你醉酒。"],
    ["zhenhuan-yurao", "玉娆", "Yurao", "镇民", "女", "在你的首个夜晚，你会得知一名善良玩家和他的角色。如果恶魔杀死了他，你也会死亡。"],
    ["zhenhuan-jingfei", "敬妃", "Consort Jing", "镇民", "女", "在你的首个夜晚，你会得知有多少名非男性角色在场。如果恶魔杀死了你，你会在当晚被唤醒并得知场上有多少名存活的邪恶玩家。"],
    ["zhenhuan-xiaoyunzi", "小允子", "Xiao Yunzi", "镇民", "男", "每个夜晚，你会得知与你邻近的两名存活玩家是否为同一阵营。"],
    ["zhenhuan-jinxi", "槿汐姑姑", "Jinxi", "镇民", "女", "每个夜晚*，你要选择两名玩家：你会得知他们之中是否有恶魔。"],
    ["zhenhuan-wenshichu", "温实初", "Wen Shichu", "镇民", "男", "每个夜晚，你可以选择一名玩家：你会得知他是否醉酒或中毒。如果你得知是，你可以让他恢复清醒健康。"],
    ["zhenhuan-guojunwang", "果郡王", "Prince Guo", "镇民", "男", "每个夜晚*，你要选择一名玩家（与上个夜晚不同）：当晚恶魔的负面能力对他无效。"],
    ["zhenhuan-sanage", "三阿哥", "Third Prince", "镇民", "男", "每个夜晚*，你可以染指一名与你临近的存活玩家。不同角色会令染指成功、失败或导致死亡；你可能会得知染指是否成功。"],
    ["zhenhuan-yelanayi", "叶澜依", "Ye Lanyi", "镇民", "女", "每局游戏限一次，在夜晚时，你可以选择一名死亡的玩家：你会将他起死回生（复活）。"],
    ["zhenhuan-dunqinwang", "敦亲王", "Prince Dun", "镇民", "男", "每个白天，你可以公开猜测一名玩家的角色并宣称结果；如果你猜对，他醉酒至下一天黎明。"],
    ["zhenhuan-qiguiren", "祺贵人", "Lady Qi", "镇民", "女", "每个白天，你可以公开猜测一名玩家的角色。如果猜对，当晚会有一名玩家死亡；如果猜错，当晚你死亡。"],
    ["zhenhuan-chunyuan", "纯元皇后", "Empress Chunyuan", "镇民", "女", "当你首次被提名时，如果提名你的玩家是镇民，他立刻被处决。"],
    ["zhenhuan-niangengyao", "年羹尧", "Nian Gengyao", "镇民", "男", "当你死亡时，你可以选择一名玩家：在当晚他会死亡。"],
    ["zhenhuan-zhenhuan", "甄嬛", "Zhen Huan", "外来者", "女", "当你将要在夜晚被恶魔杀死时，你不会死亡，该名恶魔死亡，然后你变成邪恶的女皇。"],
    ["zhenhuan-longyue", "胧月", "Princess Longyue", "外来者", "女", "如果你死于处决，你的阵营落败。"],
    ["zhenhuan-qifei", "齐妃", "Consort Qi", "外来者", "女", "每个白天限一次，你可以公开选择一名与上个白天不同的玩家；他在这个白天不可以说话。如果他说话了，他可能会被处决。"],
    ["zhenhuan-sundaying", "孙答应", "Attendant Sun", "外来者", "女", "当狂徒死亡时，当晚你也会死亡。当你死亡时，所有镇民醉酒至下个黄昏。"],
    ["zhenhuan-kuangtu", "狂徒", "Madman", "外来者", "未标注", "你随时可能死亡。如果你“疯狂”地证明你是狂徒，你可能会被处决。"],
    ["zhenhuan-huafei", "华妃", "Consort Hua", "爪牙", "女", "每个夜晚，你要选择一名玩家赐一丈红：如果他明天白天发起提名，他死亡。如果只有三名存活玩家，你失去此能力。"],
    ["zhenhuan-anlingrong", "安陵容", "An Lingrong", "爪牙", "女", "在你的首个夜晚，你会得知一个在场的女性角色。每个夜晚，你可以选择一个女性角色：她会中毒直到下个黄昏。"],
    ["zhenhuan-supeisheng", "苏培盛", "Su Peisheng", "爪牙", "男", "如果槿汐姑姑在场，她会转变为邪恶阵营且你和她会互相认识。[+1外来者]"],
    ["zhenhuan-huanghou", "皇后", "Empress", "爪牙", "女", "如果大于等于五名玩家存活（旅行者不计算在内）且恶魔死亡，你变成女皇；如果恶魔是太后，你发动能力时会变成太后。如果有其他女皇在场，你的能力失效。"],
    ["zhenhuan-chongfei", "宠妃", "Favored Consort", "爪牙", "女", "每个夜晚，你要选择一名与上个夜晚不同的玩家：当晚他不会因自身能力被唤醒。宠妃死亡后的第三个夜晚，存活恶魔会获得炸弹宝宝或狸猫宝宝。"],
    ["zhenhuan-huangshang", "皇上", "Emperor", "恶魔", "男", "每个夜晚*，你要选择一名玩家：他死亡。每局游戏限一次，在夜晚时，你可以选择一名女性角色侍寝：她变成邪恶的宠妃。"],
    ["zhenhuan-taihou", "太后", "Empress Dowager", "恶魔", "女", "每个夜晚*，你要选择两名玩家：他们可能会死亡。"],
    ["zhenhuan-huihuntsh", "回魂太上皇", "Returned Retired Emperor", "恶魔", "男", "每个夜晚*，你要选择一名玩家：他死亡。如果你以这种方式自杀，上个白天所有与说书人私聊过的玩家会变成邪恶的皇上。"],
    ["zhenhuan-nvhuang", "女皇", "Empress Regnant", "恶魔", "女", "每个夜晚*，你要选择一名玩家：他死亡。[初始不在游戏中]"],
    ["zhenhuan-shutaifei", "舒太妃", "Consort Dowager Shu", "旅行者", "女", "每局游戏限一次，在处决后，你可以选择一名玩家：如果他不是果郡王，你与他一同死亡。"],
    ["zhenhuan-caoqinmo", "曹琴默", "Cao Qinmo", "旅行者", "女", "在你的首个夜晚，你要选择除你以外的一名玩家：你转变为他的阵营。每局游戏限一次，如果他死亡，在当晚你要选择除他以外的一名玩家并转变为他的阵营。"],
    ["zhenhuan-moyan", "莫言", "Mo Yan", "旅行者", "女", "当一名女性角色因为一名男性角色的提名而即将被处决时，你可以让这次处决改为得票数第二高的玩家被处决。"],
    ["zhenhuan-shenmeizhuang", "沈眉庄", "Shen Meizhuang", "旅行者", "女", "你会得知谁是甄嬛，你的阵营始终与她相同。你的投票算作两票。"],
    ["zhenhuan-miaoyinniangzi", "妙音娘子", "Lady Miaoyin", "旅行者", "女", "在你的首个白天，你要选择一个镇民角色并询问一名玩家是否相信你。相信则你获得该角色能力；若该角色在场，该角色醉酒。不相信则你被流放。"],
    ["zhenhuan-xiayi", "夏刈", "Xia Yi", "旅行者", "男", "每个夜晚*，你要选择两名玩家进行滴血认亲：他们获得亲情羁绊。父母死亡时孩子会一同死亡；孩子死亡时父母会醉酒。"],
  ] as const).map(([id, zh, en, team, gender, abilityZh]) => ({
    id,
    zh: zhenHuanClassicEquivalents[id] ? `${zh}（${zhenHuanClassicEquivalents[id]}）` : zh,
    en,
    team: team as Team,
    gender: gender as Role["gender"],
    edition: "zhenhuan" as const,
    image: zhenHuanAvatarFiles[id]
      ? assetUrl(`zhenhuan/avatars/${zhenHuanAvatarFiles[id]}`)
      : fanRoleIcon(zh, team as Team),
    abilityZh,
    firstNightReminderZh: [
      "zhenhuan-supeisheng", "zhenhuan-huanghou", "zhenhuan-caoqinmo",
      "zhenhuan-anlingrong", "zhenhuan-huanbi", "zhenhuan-yurao", "zhenhuan-jingfei",
      "zhenhuan-xiaoyunzi", "zhenhuan-wenshichu", "zhenhuan-guojunwang", "zhenhuan-sanage",
    ].includes(id) ? abilityZh : undefined,
    otherNightReminderZh: [
      "zhenhuan-chongfei", "zhenhuan-anlingrong", "zhenhuan-huafei", "zhenhuan-huanghou",
      "zhenhuan-huangshang", "zhenhuan-taihou", "zhenhuan-huihuntsh", "zhenhuan-nvhuang",
      "zhenhuan-guojunwang", "zhenhuan-sanage", "zhenhuan-yelanayi", "zhenhuan-wenshichu",
      "zhenhuan-jinxi", "zhenhuan-xiaoyunzi", "zhenhuan-niangengyao", "zhenhuan-xiayi",
    ].includes(id) ? abilityZh : undefined,
  })),
];
const zhenHuanReferences: Array<{ name: string; actor?: string; file?: string; note?: string }> = [
  { name: "浣碧", actor: "蓝盈莹", file: "huanbi-source.jpg" },
  { name: "玉娆", actor: "徐璐", file: "yurao-source.jpg" },
  { name: "敬妃", actor: "杨紫嫣", file: "jingfei-single.jpg" },
  { name: "小允子", actor: "罗康", file: "xiaoyunzi-source.jpg" },
  { name: "槿汐姑姑", actor: "孙茜", file: "jinxi-single.jpg" },
  { name: "温实初", actor: "张晓龙", file: "wenshichu-single.png" },
  { name: "果郡王", actor: "李东学", file: "guojunwang-source.png" },
  { name: "三阿哥", actor: "邬立朋", file: "sanage-source.jpg" },
  { name: "叶澜依", actor: "热依扎", file: "yelanyi-single.jpg" },
  { name: "敦亲王", actor: "田西平", file: "dunqinwang-single.png" },
  { name: "祺贵人", actor: "唐艺昕", file: "qiguiren-single.jpg" },
  { name: "纯元皇后", file: "chunyuan-ai-blue.png", note: "剧中未正式正面出镜 · AI 蓝色线稿候选" },
  { name: "年羹尧", actor: "孙宁", file: "niangengyao-source.jpg" },
  { name: "甄嬛", actor: "孙俪", file: "zhenhuan-source.jpg" },
  { name: "胧月", actor: "杨心仪", file: "longyue-single.jpg" },
  { name: "齐妃", actor: "张雅萌", file: "qifei-single.jpg" },
  { name: "孙答应", file: "sundaying-ai-blue.png", note: "剧中仅由台词提及 · AI 蓝色线稿候选" },
  { name: "狂徒", file: "kuangtu-ai-blue.png", note: "民间板子原创身份 · AI 蓝色线稿候选" },
  { name: "华妃", actor: "蒋欣", file: "huafei-source.jpeg" },
  { name: "安陵容", actor: "陶昕然", file: "anlingrong-single.jpg" },
  { name: "苏培盛", actor: "李天柱", file: "supeisheng-single.jpg" },
  { name: "皇后", actor: "蔡少芬", file: "huanghou-single.jpg" },
  { name: "宠妃", file: "chongfei-ai-red.png", note: "民间板子原创身份 · AI 红色线稿候选" },
  { name: "皇上", actor: "陈建斌", file: "huangshang-single.png" },
  { name: "太后", actor: "刘雪华", file: "taihou-single.jpg" },
  { name: "回魂太上皇", file: "huihuntsh-ai-red.png", note: "民间板子原创身份 · AI 红色线稿候选" },
  { name: "女皇", file: "nvhuang-ai-red.png", note: "民间板子原创身份 · AI 红色线稿候选" },
  { name: "舒太妃", actor: "刘岩", file: "shutaifei-single.jpg" },
  { name: "曹琴默", actor: "陈思斯", file: "caoqinmo-single.jpg" },
  { name: "莫言", actor: "王丽涵", file: "moyan-single.jpeg" },
  { name: "沈眉庄", actor: "斓曦", file: "shenmeizhuang-single.jpg" },
  { name: "妙音娘子", file: "miaoyin-ai-neutral.png", note: "民间板子原创身份 · AI 旅行者线稿候选" },
  { name: "夏刈", actor: "孙渤洋", file: "xiayi-single.jpg" },
];
const quasiAccurateRoleIds = [
  "noble", "chef", "clockmaker", "empath", "gambler", "fortuneteller",
  "chambermaid", "snakecharmer", "zhifu", "towncrier", "monk", "seamstress", "artist",
  "drunk", "shutong", "moonchild", "recluse",
  "niangjiushi", "assassin", "godfather", "scarletwoman", "marionette",
  "nodashii", "vortox",
];
const defaultBoards: ScriptBoard[] = [
  {
    id: "tb",
    name: "暗流涌动（Trouble Brewing）",
    roleIds: makeRoles([...tb, ...tbExtra], "tb").map((r) => r.id),
    official: true,
  },
  {
    id: "bmr",
    name: "黯月初升（Bad Moon Rising）",
    roleIds: makeRoles(bmr, "bmr").map((r) => r.id),
    official: true,
  },
  {
    id: "snv",
    name: "梦殒春宵（Sects & Violets）",
    roleIds: makeRoles(snv, "snv").map((r) => r.id),
    official: true,
  },
  {
    id: "quasi-accurate",
    name: "似准非准",
    roleIds: quasiAccurateRoleIds,
    official: true,
    author: "魏准",
    sourceLabel: "玩家自制板子",
  },
  {
    id: "zhenhuan-v420",
    name: "血染甄嬛 v4.2.0",
    roleIds: roles
      .filter((role) => role.edition === "zhenhuan")
      .map((role) => role.id),
    official: true,
    author: "桂花小排骨",
    sourceLabel: "玩家自制特殊板子",
    specialRule:
      "支持7–15人。角色具有男性／女性属性，并包含6名不计入常规阵营配比的旅行者。宠妃死亡后的第三个夜晚，存活恶魔获得一个宝宝并选择玩家携带：炸弹宝宝所在玩家死亡时会导致与其关联的玩家受到死亡影响；狸猫宝宝会改变宠妃相关死亡的处理。女皇初始不在游戏中，只能由其他角色能力产生。具体结算以原板子《宠妃的宝宝》规则为准。",
  },
  {
    id: "all-amnesiac",
    name: "全员失忆（官三板角色池）",
    roleIds: [...new Set([
      ...makeRoles([...tb, ...tbExtra], "tb").map((r) => r.id),
      ...makeRoles(bmr, "bmr").map((r) => r.id),
      ...makeRoles(snv, "snv").map((r) => r.id),
    ])],
    official: true,
    author: "",
    sourceLabel: "社区特殊规则板子",
    specialRule: "每个白天限一次，所有玩家都能向说书人询问一个有关自己能力的问题，并得知“完美／接近／有关／无关”。黄昏时说书人公布完美数量；第四个白天时所有玩家的猜测视为完美。",
  },
];
const firstNightOrder = [
  "zhenhuan-supeisheng", "zhenhuan-huanghou", "zhenhuan-caoqinmo",
  "zhenhuan-anlingrong", "zhenhuan-huanbi", "zhenhuan-yurao", "zhenhuan-jingfei",
  "zhenhuan-xiaoyunzi", "zhenhuan-wenshichu", "zhenhuan-guojunwang", "zhenhuan-sanage",
  "philosopher", "minioninfo", "demoninfo", "sailor", "marionette", "niangjiushi",
  "poisoner", "courtier", "snakecharmer", "godfather", "devilsadvocate", "eviltwin",
  "witch", "cerenovus", "pukka", "shutong", "amnesiac", "washerwoman", "librarian",
  "investigator", "chef", "empath", "fortuneteller", "butler", "grandmother", "clockmaker",
  "dreamer", "seamstress", "noble", "spy", "chambermaid", "mathematician",
];
const firstNightInformationRoleIds = new Set([
  "washerwoman",
  "librarian",
  "investigator",
  "chef",
  "empath",
  "fortuneteller",
  "grandmother",
  "clockmaker",
  "dreamer",
  "seamstress",
  "noble",
  "chambermaid",
  "mathematician",
  "amnesiac",
]);
const otherNightOrder = [
  "zhenhuan-chongfei", "zhenhuan-anlingrong", "zhenhuan-huafei", "zhenhuan-huanghou",
  "zhenhuan-huangshang", "zhenhuan-taihou", "zhenhuan-huihuntsh", "zhenhuan-nvhuang",
  "zhenhuan-guojunwang", "zhenhuan-sanage", "zhenhuan-yelanayi", "zhenhuan-wenshichu",
  "zhenhuan-jinxi", "zhenhuan-xiaoyunzi", "zhenhuan-niangengyao", "zhenhuan-xiayi",
  "philosopher", "sailor", "niangjiushi", "poisoner", "courtier", "innkeeper", "gambler",
  "snakecharmer", "monk", "devilsadvocate", "witch", "cerenovus", "pithag", "scarletwoman",
  "lunatic", "exorcist", "imp", "zombuul", "pukka", "shabaloth", "po", "fanggu",
  "nodashii", "vortox", "vigormortis", "assassin", "godfather", "gossip", "barber",
  "sweetheart", "sage", "professor", "shutong", "tinker", "moonchild", "grandmother",
  "ravenkeeper", "empath", "fortuneteller", "undertaker", "dreamer", "flowergirl",
  "towncrier", "zhifu", "oracle", "seamstress", "juggler", "amnesiac", "butler", "spy",
  "chambermaid", "mathematician",
];
const marks: { key: Mark; label: string; short: string; icon: string }[] = [
  {
    key: "demon",
    label: "恶魔",
    short: "魔",
    icon: assetUrl("clocktower/marks/demon.png"),
  },
  {
    key: "minion",
    label: "爪牙",
    short: "爪",
    icon: assetUrl("clocktower/marks/minion.png"),
  },
  {
    key: "poison",
    label: "中毒",
    short: "毒",
    icon: assetUrl("clocktower/marks/poison.png"),
  },
  {
    key: "drunk",
    label: "酒鬼",
    short: "酒",
    icon: assetUrl("clocktower/marks/drunk.png"),
  },
  {
    key: "deadVote",
    label: "死亡 · 幽灵票可用",
    short: "有票",
    icon: assetUrl("clocktower/marks/dead-vote.png"),
  },
  {
    key: "madness",
    label: "疯狂",
    short: "疯",
    icon: assetUrl("clocktower/marks/madness.png"),
  },
];
const createPlayers = (count: number): Player[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: "",
    marks: [],
    notes: {},
  }));
const localizedToast = (language: Language, value: string) =>
  language === "zh"
    ? value
    : value
        .replace(/已开始/g, "Started")
        .replace(/玩家状态已更新/g, "Player status updated")
        .replace(/日期已切换/g, "Day changed")
        .replace(/玩家\s*(\d+)/g, "Player $1")
        .replace(/第\s*(\d+)\s*天/g, "Day $1")
        .replace(/(\d+)\s*票/g, "$1 votes")
        .replace(/已保存/g, "saved")
        .replace(/已记录认好/g, "Trust recorded")
        .replace(/已记录认坏/g, "Distrust recorded")
        .replace(/标记处决/g, "marked for execution")
        .replace(/今天无人死亡/g, "no one died today")
        .replace(/处决死亡，幽灵票可用/g, "executed; ghost vote available")
        .replace(/切换到可能性\s*(\d+)/g, "Switched to possibility $1")
        .replace(/已创建可能性\s*(\d+)/g, "Possibility $1 created")
        .replace(/切换到可能性视图\s*(\d+)/g, "Switched to possibility view $1")
        .replace(/已创建可能性视图\s*(\d+)/g, "Possibility view $1 created")
        .replace(/玩家笔记已保存/g, "Player note saved")
        .replace(/官方角色描述载入失败/g, "Official role text failed to load");
export default function Prototype() {
  const [started, setStarted] = useState(false),
    [boards, setBoards] = useState<ScriptBoard[]>(() => {
      try {
        const saved = JSON.parse(
          localStorage.getItem("clocktower-boards") || "null",
        ) as ScriptBoard[] | null;
        if (!saved) return defaultBoards;
        const defaultsById = new Map(defaultBoards.map((board) => [board.id, board]));
        return [
          ...defaultBoards.map((board) =>
            saved.some((item) => item.id === board.id)
              ? { ...saved.find((item) => item.id === board.id), ...board }
              : board,
          ),
          ...saved.filter((board) => !defaultsById.has(board.id)),
        ];
      } catch {
        return defaultBoards;
      }
    }),
    [selectedBoardId, setSelectedBoardId] = useState(
      () => localStorage.getItem("clocktower-board") || "tb",
    ),
    [composition, setComposition] = useState<Composition>(() => {
      try {
        return (
          JSON.parse(localStorage.getItem("clocktower-composition") || "") || {
            镇民: 7,
            外来者: 2,
            爪牙: 2,
            恶魔: 1,
          }
        );
      } catch {
        return { 镇民: 7, 外来者: 2, 爪牙: 2, 恶魔: 1 };
      }
    }),
    [manager, setManager] = useState(false);
  const [players, setPlayers] = useState(createPlayers(12)),
    [day, setDay] = useState(1),
    [maxDay, setMaxDay] = useState(1),
    [quick, setQuick] = useState<number | null>(null),
    [rolePlayer, setRolePlayer] = useState<number | null>(null),
    [roleStatusOpen, setRoleStatusOpen] = useState(false),
    [roleSkill, setRoleSkill] = useState<Role | null>(null),
    [roleSkillMode, setRoleSkillMode] = useState<"hold" | "hover" | null>(null),
    [roleSkillAnchor, setRoleSkillAnchor] = useState({ left: 12, top: 84, width: 320 }),
    [roleReferenceOpen, setRoleReferenceOpen] = useState(false),
    [board, setBoard] = useState(false),
    [notes, setNotes] = useState(false),
    [notePlayer, setNotePlayer] = useState<number | null>(null),
    [drag, setDrag] = useState<{ from: number; to: number } | null>(null),
    [dragPreview, setDragPreview] = useState<{
      from: number;
      x: number;
      y: number;
      target?: number;
    } | null>(null),
    [votes, setVotes] = useState<number[]>([]),
    [relationDraft, setRelationDraft] = useState<Relation | null>(null),
    [deathDecisionPlayer, setDeathDecisionPlayer] = useState<number | null>(null),
    [poss, setPoss] = useState([1]),
    [possibility, setPossibility] = useState(1),
    [toast, setToast] = useState("游戏已开始");
  const suppressRoleClick = useRef<string | null>(null);
  const roleTouchStart = useRef<{ id: string; at: number } | null>(null);
  const [deaths, setDeaths] = useState<DeathEvent[]>([]),
    [peacefulDays, setPeacefulDays] = useState<number[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false),
    [manualOpen, setManualOpen] = useState(false),
    [mobileMenuOpen, setMobileMenuOpen] = useState(false),
    [display, setDisplay] = useState<DisplaySettings>(() => {
      try {
        const saved = JSON.parse(localStorage.getItem("clocktower-display") || "");
        return saved ? {
            showRoleNames: saved.showRoleNames ?? true,
            showPlayerNames: saved.showPlayerNames ?? true,
            alwaysShowDailyRoles: saved.alwaysShowDailyRoles ?? false,
            markSize: saved.markSize ?? "medium",
          } : {
            showRoleNames: true,
            showPlayerNames: true,
            alwaysShowDailyRoles: false,
            markSize: "medium",
          };
      } catch {
        return {
          showRoleNames: true,
          showPlayerNames: true,
          alwaysShowDailyRoles: false,
          markSize: "medium",
        };
      }
    });
  const [language, setLanguage] = useState<Language>(
      () => (localStorage.getItem("clocktower-language") as Language) || "zh",
    );
  const t = (text: string) => translate(language, text),
    team = (text: string) => teamText(language, text);
  const [relations, setRelations] = useState<Relation[]>([
    { id: 1, day: 1, from: 3, to: 7, type: "nominate", votes: [1, 3, 5, 7, 9] },
    { id: 2, day: 1, from: 8, to: 2, type: "good" },
    { id: 3, day: 1, from: 11, to: 4, type: "bad" },
  ]);
  useEffect(
    () => localStorage.setItem("clocktower-boards", JSON.stringify(boards)),
    [boards],
  );
  useEffect(
    () => localStorage.setItem("clocktower-board", selectedBoardId),
    [selectedBoardId],
  );
  useEffect(
    () =>
      localStorage.setItem(
        "clocktower-composition",
        JSON.stringify(composition),
      ),
    [composition],
  );
  useEffect(
    () => localStorage.setItem("clocktower-display", JSON.stringify(display)),
    [display],
  );
  useEffect(
    () => localStorage.setItem("clocktower-language", language),
    [language],
  );
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const syncCursor = () => {
      const screen = document.querySelector<HTMLElement>(".device-screen");
      if (screen) screen.dataset.cursorDebug = query.matches ? "true" : "false";
    };
    syncCursor();
    query.addEventListener("change", syncCursor);
    return () => query.removeEventListener("change", syncCursor);
  }, []);
  useEffect(() => {
    const active =
      board ||
      settingsOpen ||
      manualOpen ||
      rolePlayer !== null ||
      notePlayer !== null ||
      relationDraft !== null ||
      deathDecisionPlayer !== null ||
      notes;
    document.documentElement.dataset.desktopModal = active ? "true" : "false";
    return () => {
      delete document.documentElement.dataset.desktopModal;
    };
  }, [board, settingsOpen, manualOpen, rolePlayer, notePlayer, relationDraft, deathDecisionPlayer, notes]);
  useEffect(() => {
    if (roleSkillMode !== "hold") return;
    const closeHeldSkill = () => {
      if (roleTouchStart.current && performance.now() - roleTouchStart.current.at >= 180) {
        suppressRoleClick.current = roleTouchStart.current.id;
      }
      roleTouchStart.current = null;
      setRoleSkill(null);
      setRoleSkillMode(null);
    };
    window.addEventListener("pointerup", closeHeldSkill, true);
    window.addEventListener("pointercancel", closeHeldSkill, true);
    return () => {
      window.removeEventListener("pointerup", closeHeldSkill, true);
      window.removeEventListener("pointercancel", closeHeldSkill, true);
    };
  }, [roleSkillMode]);
  useEffect(() => {
    const reset = () => {
      (document.activeElement as HTMLElement | null)?.blur();
      const scroll = document.querySelector<HTMLElement>(".mobile-scroll");
      if (scroll) scroll.scrollTop = 0;
    };
    const timers = [0, 120].map((ms) => window.setTimeout(reset, ms));
    return () => timers.forEach(clearTimeout);
  }, [started]);
  const hold = useRef<{
    timer?: number;
    id?: number;
    target?: number;
    x: number;
    y: number;
    dragging: boolean;
    held?: boolean;
  }>({ x: 0, y: 0, dragging: false, held: false });
  const voteClickGuardUntil = useRef(0);
  const relationHold = useRef<{
    timer?: number;
    id?: number;
    x: number;
    y: number;
  }>({ x: 0, y: 0 });
  const noteScroll = useRef(0);
  useEffect(() => {
    const scroll = document.querySelector<HTMLElement>(".mobile-scroll");
    if (!scroll) return;
    if (notePlayer === null) {
      noteScroll.current = scroll.scrollTop;
      const remember = () => {
        noteScroll.current = scroll.scrollTop;
      };
      scroll.addEventListener("scroll", remember, { passive: true });
      return () => scroll.removeEventListener("scroll", remember);
    }
    const restore = () => {
      (document.activeElement as HTMLElement | null)?.blur();
      scroll.scrollTop = noteScroll.current;
    };
    const timers = [0, 40, 140].map((ms) => window.setTimeout(restore, ms));
    return () => timers.forEach(clearTimeout);
  }, [notePlayer]);
  const currentBoard =
    boards.find((b) => b.id === selectedBoardId) || boards[0];
  const boardRoles = roles.filter((r) => currentBoard?.roleIds.includes(r.id));
  const groups = useMemo(
    () => ({
      镇民: boardRoles.filter((r) => r.team === "镇民"),
      外来者: boardRoles.filter((r) => r.team === "外来者"),
      爪牙: boardRoles.filter((r) => r.team === "爪牙"),
      恶魔: boardRoles.filter((r) => r.team === "恶魔"),
    }),
    [currentBoard?.id, currentBoard?.roleIds.join(",")],
  );
  const showRoleSkill = (
    role: Role,
    trigger: HTMLElement,
    mode: "hold" | "hover",
  ) => {
    const sheet = trigger.closest<HTMLElement>(".bottom-sheet");
    if (!sheet) return;
    const triggerRect = trigger.getBoundingClientRect();
    const sheetRect = sheet.getBoundingClientRect();
    const gap = 12;
    const margin = 12;
    const width = Math.min(360, sheetRect.width - margin * 2);
    const estimatedHeight = 154;
    const localLeft = triggerRect.left - sheetRect.left;
    const localTop = triggerRect.top - sheetRect.top;
    const rightCandidate = localLeft + triggerRect.width + gap;
    const leftCandidate = localLeft - width - gap;
    const left = rightCandidate + width <= sheetRect.width - margin
      ? rightCandidate
      : leftCandidate >= margin
        ? leftCandidate
        : Math.max(margin, Math.min(localLeft + triggerRect.width / 2 - width / 2, sheetRect.width - width - margin));
    let top = localTop + triggerRect.height / 2 - estimatedHeight / 2;
    top = Math.max(68, Math.min(top, sheetRect.height - estimatedHeight - 76));
    setRoleSkillAnchor({ left, top, width });
    setRoleSkill(role);
    setRoleSkillMode(mode);
  };
  const point = (id: number) => {
    const a = ((id - 1) / players.length) * Math.PI * 2 - Math.PI / 2;
    return { x: 150 + Math.cos(a) * 121, y: 150 + Math.sin(a) * 121 };
  };
  const updateMark = (id: number, m: Mark) => {
    const player = players.find((p) => p.id === id);
    if (m === "deadVote" && player) {
      const isDead =
        player.marks.includes("deadVote") || player.marks.includes("deadSpent");
      if (isDead) {
        setDeathDecisionPlayer(id);
        setQuick(null);
        return;
      }
      setPlayers((ps) =>
        ps.map((p) =>
          p.id === id ? { ...p, marks: [...p.marks, "deadVote"] } : p,
        ),
      );
      setDeaths((ds) => [
        ...ds.filter((d) => d.playerId !== id || d.day !== day),
        { id: Date.now(), day, playerId: id, reason: "manual" },
      ]);
      setQuick(null);
      setToast(`玩家 ${id} 已标记死亡 · 幽灵票可用`);
      return;
    }
    setPlayers((ps) =>
      ps.map((p) => {
        if (p.id !== id) return p;
        let ms = [...p.marks];
        if (ms.includes(m)) ms = ms.filter((x) => x !== m);
        else {
          if (m === "demon" || m === "minion")
            ms = ms.filter((x) => x !== "demon" && x !== "minion");
          if (m === "poison" || m === "poisonQ")
            ms = ms.filter((x) => x !== "poison" && x !== "poisonQ");
          ms.push(m);
        }
        return { ...p, marks: ms };
      }),
    );
    setQuick(null);
    setToast("玩家状态已更新");
  };
  const nominationSources = new Set(
    relations
      .filter((r) => r.day === day && r.type === "nominate")
      .map((r) => r.from),
  );
  const nominationTargets = new Set(
    relations
      .filter((r) => r.day === day && r.type === "nominate")
      .map((r) => r.to),
  );
  const pointerToDial = (x: number, y: number) => {
    const el = document.querySelector<HTMLElement>(".town-dial"),
      r = el?.getBoundingClientRect();
    return r
      ? { x: ((x - r.left) / r.width) * 300, y: ((y - r.top) / r.height) * 300 }
      : { x: 150, y: 150 };
  };
  const nearestTarget = (x: number, y: number) =>
    [...document.querySelectorAll<HTMLElement>("[data-player]")]
      .map((el) => {
        const r = el.getBoundingClientRect();
        return {
          id: Number(el.dataset.player),
          distance: Math.hypot(
            x - (r.left + r.width / 2),
            y - (r.top + r.height / 2),
          ),
        };
      })
      .sort((a, b) => a.distance - b.distance)[0];
  const pointerTarget = (x: number, y: number) => {
    const direct = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-player]");
    if (direct) return Number(direct.dataset.player);
    const nearest = nearestTarget(x, y);
    const node = nearest
      ? document.querySelector<HTMLElement>(`[data-player="${nearest.id}"]`)
      : null;
    const radius = node ? Math.max(node.offsetWidth, node.offsetHeight) * 0.72 : 70;
    return nearest && nearest.distance <= radius ? nearest.id : undefined;
  };
  const down = (e: React.PointerEvent, id: number) => {
    if (drag) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    hold.current = { id, x: e.clientX, y: e.clientY, dragging: false, held: false };
    hold.current.timer = window.setTimeout(() => {
      if (!hold.current.dragging) {
        hold.current.held = true;
        setNotePlayer(id);
        setQuick(null);
        setRolePlayer(null);
      }
    }, 650);
  };
  const move = (e: React.PointerEvent, id: number) => {
    if (hold.current.id !== id) return;
    if (
      Math.hypot(e.clientX - hold.current.x, e.clientY - hold.current.y) > 14
    ) {
      hold.current.dragging = true;
      if (hold.current.timer) clearTimeout(hold.current.timer);
      const p = pointerToDial(e.clientX, e.clientY),
        target = pointerTarget(e.clientX, e.clientY);
      hold.current.target = target;
      setDragPreview({
        from: hold.current.id ?? id,
        ...p,
        target,
      });
      setQuick(null);
    }
  };
  const up = (e: React.PointerEvent, id: number) => {
    if (hold.current.timer) clearTimeout(hold.current.timer);
    const moved =
        hold.current.dragging ||
        Math.hypot(e.clientX - hold.current.x, e.clientY - hold.current.y) > 12,
      source = hold.current.id ?? id,
      target = moved ? pointerTarget(e.clientX, e.clientY) ?? hold.current.target : undefined;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    if (target !== undefined) {
      voteClickGuardUntil.current = Date.now() + 320;
      setDrag({ from: source, to: target });
      setVotes([]);
      setToast(`玩家 ${source} → 玩家 ${target} · 点击头像投票`);
    } else if (!moved && !hold.current.held) {
      setRolePlayer(id);
      setRoleStatusOpen(false);
      setQuick(null);
    }
    setDragPreview(null);
    hold.current = { x: 0, y: 0, dragging: false, held: false };
  };
  const cancelPointer = () => {
    if (hold.current.timer) clearTimeout(hold.current.timer);
    setDragPreview(null);
    hold.current = { x: 0, y: 0, dragging: false, held: false };
  };
  const livingCount = players.filter(
    (p) => !p.marks.includes("deadVote") && !p.marks.includes("deadSpent"),
  ).length;
  const openRelationEditor = (relation: Relation) => {
    setRelationDraft({
      ...relation,
      votes: relation.votes ? [...relation.votes] : undefined,
    });
    setQuick(null);
  };
  const beginRelationHold = (e: React.PointerEvent, relation: Relation) => {
    if (relation.id === -1 || e.pointerType === "mouse") return;
    relationHold.current = {
      id: relation.id,
      x: e.clientX,
      y: e.clientY,
      timer: window.setTimeout(() => openRelationEditor(relation), 550),
    };
  };
  const moveRelationHold = (e: React.PointerEvent) => {
    if (
      relationHold.current.timer &&
      Math.hypot(
        e.clientX - relationHold.current.x,
        e.clientY - relationHold.current.y,
      ) > 8
    ) {
      clearTimeout(relationHold.current.timer);
      relationHold.current.timer = undefined;
    }
  };
  const endRelationHold = () => {
    if (relationHold.current.timer) clearTimeout(relationHold.current.timer);
    relationHold.current = { x: 0, y: 0 };
  };
  const finish = (type: Relation["type"]) => {
    if (!drag) return;
    if (
      type === "nominate" &&
      (nominationSources.has(drag.from) || nominationTargets.has(drag.to))
    ) {
      setToast("当天提名或被提名资格已使用，只能记录保或踩");
      return;
    }
    const executed = type === "nominate" && votes.length > livingCount / 2;
    setRelations((rs) => [
      ...rs,
      {
        id: Date.now(),
        day,
        from: drag.from,
        to: drag.to,
        type,
        votes: type === "nominate" ? votes : undefined,
        executed,
      },
    ]);
    if (type === "nominate") {
      const targetWasAlive = !players
        .find((p) => p.id === drag.to)
        ?.marks.some((mark) => mark === "deadVote" || mark === "deadSpent");
      const spent = players
        .filter((p) => votes.includes(p.id) && p.marks.includes("deadVote"))
        .map((p) => p.id);
      setPlayers((ps) =>
        ps.map((p) => {
          let nextMarks = [...p.marks];
          if (spent.includes(p.id)) {
            nextMarks = [
              ...nextMarks.filter((m) => m !== "deadVote"),
              "deadSpent",
            ];
          }
          if (
            executed &&
            p.id === drag.to &&
            !nextMarks.includes("deadVote") &&
            !nextMarks.includes("deadSpent")
          ) {
            nextMarks.push("deadVote");
          }
          return nextMarks.length === p.marks.length &&
            nextMarks.every((mark, index) => mark === p.marks[index])
            ? p
            : { ...p, marks: nextMarks };
        }),
      );
      if (executed && targetWasAlive) {
        setDeaths((items) => [
          ...items.filter(
            (event) => !(event.day === day && event.playerId === drag.to),
          ),
          {
            id: Date.now() + 1,
            day,
            playerId: drag.to,
            reason: "execution",
          },
        ]);
      }
    }
    setToast(
      type === "good"
        ? "已记录保"
        : type === "bad"
          ? "已记录踩"
          : `已记录 ${votes.length} 票${executed ? " · 标记处决" : ""}`,
    );
    setDrag(null);
    setVotes([]);
  };
  const saveDay = () => {
    const candidates = relations.filter(
      (r) => r.day === day && r.type === "nominate" && r.executed,
    );
    if (!candidates.length) {
      setToast(`第 ${day} 天已保存 · 无人达到处决门槛`);
      return;
    }
    const high = Math.max(...candidates.map((r) => r.votes?.length || 0)),
      leaders = candidates.filter((r) => (r.votes?.length || 0) === high);
    if (leaders.length !== 1) {
      setToast(`第 ${day} 天已保存 · 最高票平票，今天无人死亡`);
      return;
    }
    const target = leaders[0].to;
    setPlayers((ps) =>
      ps.map((p) =>
        p.id === target
          ? {
              ...p,
              marks: [
                ...p.marks.filter((m) => m !== "deadSpent" && m !== "deadVote"),
                "deadVote",
              ],
            }
          : p,
      ),
    );
    setDeaths((ds) =>
      ds.some(
        (d) =>
          d.day === day && d.playerId === target && d.reason === "execution",
      )
        ? ds
        : [
            ...ds,
            { id: Date.now(), day, playerId: target, reason: "execution" },
          ],
    );
    setPeacefulDays((ds) => ds.filter((d) => d !== day));
    setToast(`第 ${day} 天已保存 · 玩家 ${target} 处决死亡，幽灵票可用`);
  };
  const resolveDeathChange = (mode: "correction" | "revival") => {
    if (deathDecisionPlayer === null) return;
    const playerId = deathDecisionPlayer;
    setPlayers((items) =>
      items.map((player) =>
        player.id === playerId
          ? {
              ...player,
              marks: player.marks.filter(
                (mark) => mark !== "deadVote" && mark !== "deadSpent",
              ),
            }
          : player,
      ),
    );
    if (mode === "correction") {
      setDeaths((items) => {
        const original = [...items]
          .filter(
            (event) =>
              event.playerId === playerId &&
              event.day <= day &&
              event.reason !== "revival",
          )
          .sort((a, b) => b.day - a.day)[0];
        return original
          ? items.filter((event) => event.id !== original.id)
          : items;
      });
      setToast(`玩家 ${playerId} 的原死亡记录已修正`);
    } else {
      setDeaths((items) => [
        ...items,
        {
          id: Date.now(),
          day,
          playerId,
          reason: "revival",
        },
      ]);
      setToast(`玩家 ${playerId} 被复活`);
    }
    setDeathDecisionPlayer(null);
  };
  const changeDay = (n: number) => {
    if (n < 0 && day > 1) setDay(day - 1);
    if (n > 0) {
      setDay(day + 1);
      setMaxDay(Math.max(maxDay, day + 1));
    }
    setQuick(null);
    setToast("日期已切换");
  };
  const selected = players.find((p) => p.id === notePlayer);
  const editPlayerDay = (playerId: number, recordDay: number) => {
    setDay(recordDay);
    setNotePlayer(playerId);
  };
  const clearPlayerDay = (playerId: number, recordDay: number) =>
    setPlayers((items) =>
      items.map((player) =>
        player.id === playerId
          ? {
              ...player,
              notes: { ...player.notes, [recordDay]: "" },
            }
          : player,
      ),
    );
  const playerCount = Object.values(composition).reduce((a, b) => a + b, 0);
  const startGame = () => {
    setPlayers(createPlayers(playerCount));
    setDay(1);
    setMaxDay(1);
    setRelations([]);
    setStarted(true);
    setToast(`已开始 · ${currentBoard.name}`);
  };
  const endGame = () => {
    setBoard(false);
    setNotes(false);
    setStarted(false);
    setDay(1);
    setMaxDay(1);
    setRelations([]);
    setPoss([1]);
    setPossibility(1);
  };
  if (!started)
    return (
      <StartScreen
        language={language}
        setLanguage={setLanguage}
        boards={boards}
        setBoards={setBoards}
        selectedId={selectedBoardId}
        setSelectedId={setSelectedBoardId}
        composition={composition}
        setComposition={setComposition}
        start={startGame}
        manager={manager}
        setManager={setManager}
        settingsOpen={settingsOpen}
        setSettingsOpen={setSettingsOpen}
        manualOpen={manualOpen}
        setManualOpen={setManualOpen}
      />
    );
  return (
    <>
      <MobileScroll className="app-screen">
        <main className="clock-app">
          <header className="topbar">
            <div className="game-board-row">
              <div className="game-meta">
                <span>{currentBoard.name}</span>
                <small>
                  {composition.镇民} {team("镇民")} · {composition.外来者}{" "}
                  {team("外来者")} · {composition.爪牙} {team("爪牙")} ·{" "}
                  {composition.恶魔} {team("恶魔")}
                </small>
              </div>
              <div className="utility-actions">
                <button
                  aria-label={t("板子信息")}
                  className="board-utility-button ui-button ui-button--secondary ui-button--icon"
                  onClick={() => setBoard(true)}
                >
                  <FileTextIcon />
                </button>
                <button
                  aria-label={t("使用手册")}
                  className="manual-utility-button"
                  onClick={() => setManualOpen(true)}
                >
                  <LightbulbIcon />
                </button>
                <button
                  aria-label={t("设置")}
                  className="settings-button"
                  onClick={() => setSettingsOpen(true)}
                >
                  <GearIcon />
                </button>
              </div>
            </div>
            <div className="title-day-row">
              <div className="title-day-copy">
                <div className="product-title">{t("血染钟楼笔记助手")}</div>
                <h1>{language === "zh" ? `第 ${day} 天` : `Day ${day}`}</h1>
              </div>
              <div className="day-actions">
                <button disabled={day === 1} onClick={() => changeDay(-1)}>
                  <ArrowLeftIcon />
                  <span>{t("上一天")}</span>
                </button>
                <button onClick={() => changeDay(1)}>
                  <span>{t("下一天")}</span>
                  <ArrowRightIcon />
                </button>
                <button className="save" onClick={saveDay}>
                  {t("保存")}
                </button>
              </div>
            </div>
          </header>
          <aside className="desktop-notes-column" data-scroll-drag="ignore">
            <div className="desktop-notes-heading">
              <span>{t("总体笔记")}</span>
              <small>
                {t("整局记录")} · {t("所有记录")}
              </small>
            </div>
            <div className="desktop-notes-compact">
              <Notes
                language={language}
                players={players}
                relations={relations}
                deaths={deaths}
                peacefulDays={peacefulDays}
                togglePeaceful={(d) =>
                  setPeacefulDays((ds) =>
                    ds.includes(d) ? ds.filter((x) => x !== d) : [...ds, d],
                  )
                }
                day={day}
                alwaysShowDailyRoles={display.alwaysShowDailyRoles}
                edit={editPlayerDay}
                clear={clearPlayerDay}
              />
            </div>
            <div className="desktop-notes-wide">
              <Notes
                initialTab="roles"
                language={language}
                players={players}
                relations={relations}
                deaths={deaths}
                peacefulDays={peacefulDays}
                togglePeaceful={(d) =>
                  setPeacefulDays((ds) =>
                    ds.includes(d) ? ds.filter((x) => x !== d) : [...ds, d],
                  )
                }
                day={day}
                alwaysShowDailyRoles={display.alwaysShowDailyRoles}
                edit={editPlayerDay}
                clear={clearPlayerDay}
              />
              <Notes
                initialTab="votes"
                language={language}
                players={players}
                relations={relations}
                deaths={deaths}
                peacefulDays={peacefulDays}
                togglePeaceful={(d) =>
                  setPeacefulDays((ds) =>
                    ds.includes(d) ? ds.filter((x) => x !== d) : [...ds, d],
                  )
                }
                day={day}
                alwaysShowDailyRoles={display.alwaysShowDailyRoles}
                edit={editPlayerDay}
                clear={clearPlayerDay}
              />
            </div>
          </aside>
          <section className="dial-section">
            <div
              className={`town-dial ${drag ? "relation-mode" : ""}`}
              onPointerDown={(e) => {
                if ((e.target as HTMLElement).classList.contains("town-dial"))
                  setQuick(null);
              }}
            >
              <svg className="relations" viewBox="0 0 300 300">
                <defs>
                  <marker
                    id="arrow-black"
                    markerUnits="userSpaceOnUse"
                    markerWidth="14.4"
                    markerHeight="14.4"
                    refX="13"
                    refY="7.2"
                    orient="auto"
                  >
                    <path d="M0,0 L14.4,7.2 L0,14.4 z" fill="#211711" />
                  </marker>
                  <marker
                    id="arrow-good"
                    markerUnits="userSpaceOnUse"
                    markerWidth="14.4"
                    markerHeight="14.4"
                    refX="13"
                    refY="7.2"
                    orient="auto"
                  >
                    <path d="M0,0 L14.4,7.2 L0,14.4 z" fill="#2f8455" />
                  </marker>
                  <marker
                    id="arrow-bad"
                    markerUnits="userSpaceOnUse"
                    markerWidth="14.4"
                    markerHeight="14.4"
                    refX="13"
                    refY="7.2"
                    orient="auto"
                  >
                    <path d="M0,0 L14.4,7.2 L0,14.4 z" fill="#a42c2c" />
                  </marker>
                </defs>
                {dragPreview && (
                  <path
                    className="drag-extension"
                    d={`M ${point(dragPreview.from).x} ${point(dragPreview.from).y} Q 150 150 ${dragPreview.x} ${dragPreview.y}`}
                    markerEnd="url(#arrow-black)"
                  />
                )}
                {(drag
                  ? [
                      {
                        id: -1,
                        day,
                        from: drag.from,
                        to: drag.to,
                        type: "nominate" as const,
                        votes,
                      },
                    ]
                  : relations
                      .filter((r) => r.day === day)
                      .sort(
                        (a, b) =>
                          Number(a.type === "nominate") -
                          Number(b.type === "nominate"),
                      )
                ).map((r, i) => {
                  const a = point(r.from),
                    b = point(r.to),
                    dx = b.x - a.x,
                    dy = b.y - a.y,
                    len = Math.max(1, Math.hypot(dx, dy)),
                    lane = (i % 2 ? 1 : -1) * (8 + Math.floor(i / 2) * 5),
                    cx = 150 - (dy / len) * lane,
                    cy = 150 + (dx / len) * lane,
                    sx =
                      a.x +
                      ((cx - a.x) /
                        Math.max(1, Math.hypot(cx - a.x, cy - a.y))) *
                        25,
                    sy =
                      a.y +
                      ((cy - a.y) /
                        Math.max(1, Math.hypot(cx - a.x, cy - a.y))) *
                        25,
                    ex =
                      b.x -
                      ((b.x - cx) /
                        Math.max(1, Math.hypot(b.x - cx, b.y - cy))) *
                        27,
                    ey =
                      b.y -
                      ((b.y - cy) /
                        Math.max(1, Math.hypot(b.x - cx, b.y - cy))) *
                        27,
                    px = 0.25 * sx + 0.5 * cx + 0.25 * ex,
                    py = 0.25 * sy + 0.5 * cy + 0.25 * ey,
                    color =
                      r.type === "good"
                        ? "#2f8455"
                        : r.type === "bad"
                          ? "#a42c2c"
                          : "#211711";
                  return (
                    <g
                      key={r.id}
                      className={`relation ${r.type} ${r.id === -1 ? "pending" : ""}`}
                      onPointerDown={(e) => beginRelationHold(e, r)}
                      onPointerMove={moveRelationHold}
                      onPointerUp={endRelationHold}
                      onPointerCancel={endRelationHold}
                      onDoubleClick={() =>
                        r.id !== -1 &&
                        window.matchMedia("(min-width: 1024px)").matches &&
                        openRelationEditor(r)
                      }
                    >
                      {r.type === "nominate" && (
                        <path
                          className="relation-outline"
                          d={`M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`}
                        />
                      )}
                      <path
                        d={`M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`}
                        stroke={color}
                        markerEnd={`url(#arrow-${r.type === "good" ? "good" : r.type === "bad" ? "bad" : "black"})`}
                      />
                      {r.type === "nominate" && (
                        <>
                          <circle cx={px} cy={py} r="8" />
                          <text x={px} y={py + 3}>
                            {r.votes?.length || 0}
                          </text>
                        </>
                      )}
                    </g>
                  );
                })}
              </svg>
              <div
                className={`dial-prompt ${drag ? "vote" : dragPreview ? "drag" : quick ? "mark" : "idle"}`}
              >
                {drag ? (
                  <>
                    <strong>
                      {language === "zh" ? "玩家" : "Player"} {drag.from} →{" "}
                      {language === "zh" ? "玩家" : "Player"} {drag.to}
                    </strong>
                    <span>{t("请选择投票处决的玩家")}</span>
                    <span>{votes.length}{t("票")}</span>
                  </>
                ) : dragPreview ? (
                  dragPreview.target !== undefined
                    ? t("松开即可进入投票状态")
                    : t("拖向一名可提名的玩家")
                ) : quick ? (
                  t("选择玩家状态标记")
                ) : (
                  <>
                    <span>{t("轻点选角色")}</span>
                    <span>{t("长按添加笔记")}</span>
                    <span>{t("拖拽提名")}</span>
                  </>
                )}
              </div>
              {drag && (
                <div className="vote-dial-actions">
                  <button
                    className="vote-exit-button"
                    aria-label={t("关闭")}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setDrag(null);
                      setVotes([]);
                    }}
                  >
                    <Cross2Icon />
                  </button>
                  <button
                    className={`vote-dial-confirm ${votes.length > livingCount / 2 ? "execution" : ""}`}
                    disabled={
                      nominationSources.has(drag.from) ||
                      nominationTargets.has(drag.to)
                    }
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      finish("nominate");
                    }}
                  >
                    {t(votes.length > livingCount / 2 ? "标记处决" : "确认")} · {votes.length}{t("票")}
                  </button>
                </div>
              )}
              {players.map((p) => {
                const q = point(p.id),
                  active = quick === p.id,
                  canVote = !p.marks.includes("deadSpent"),
                  voted = votes.includes(p.id),
                  outer = ((p.id - 1) / players.length) * 360,
                  visibleMarks = p.marks.filter(
                    (m) =>
                      m !== "deadVote" &&
                      m !== "deadSpent" &&
                      marks.some((x) => x.key === m),
                  ),
                  a = ((p.id - 1) / players.length) * Math.PI * 2 - Math.PI / 2,
                  inwardDistance = 120 + Math.abs(Math.sin(a)) * 66,
                  inX = -Math.cos(a) * inwardDistance,
                  inY = -Math.sin(a) * inwardDistance,
                  previewing = Boolean(dragPreview),
                  source = dragPreview?.from === p.id,
                  valid = previewing,
                  invalid = false;
                return (
                  <div
                    key={p.id}
                    className={`player-node mark-${display.markSize} ${active ? "active" : ""} ${drag ? "voting" : ""} ${voted ? "voted" : ""} ${drag && !canVote ? "vote-disabled" : ""} ${source ? "drag-source" : ""} ${valid ? "drag-valid" : ""} ${invalid ? "drag-invalid" : ""} ${dragPreview?.target === p.id ? "drag-hover" : ""}`}
                    data-player={p.id}
                    data-scroll-drag="ignore"
                    style={{ left: `${q.x / 3}%`, top: `${q.y / 3}%` }}
                    onClick={(e) => {
                      if (drag) {
                        e.preventDefault();
                        e.stopPropagation();
                        if (Date.now() < voteClickGuardUntil.current) return;
                        if (canVote)
                          setVotes((v) =>
                            v.includes(p.id)
                              ? v.filter((x) => x !== p.id)
                              : [...v, p.id],
                          );
                      }
                    }}
                    onPointerDown={(e) =>
                      drag ? e.stopPropagation() : down(e, p.id)
                    }
                    onPointerMove={(e) => !drag && move(e, p.id)}
                    onPointerUp={(e) => !drag && up(e, p.id)}
                    onPointerCancel={cancelPointer}
                  >
                    <span className="seat">{p.id}</span>
                    <img
                      draggable={false}
                      className={p.role ? "role-portrait" : "default-portrait"}
                      src={p.role?.image || defaultPortrait(p.id)}
                    />
                    {(p.marks.includes("deadVote") || p.marks.includes("deadSpent")) && (
                      <span className="death-dim-overlay" />
                    )}
                    {p.marks.includes("deadSpent") && (
                        <img
                          className="ghost-spent-overlay"
                          src={assetUrl("clocktower/marks/ghost-spent-slash.png")}
                          alt={t("幽灵票已使用")}
                        />
                    )}
                    {drag && canVote && (
                      <span className="vote-check">
                        {voted ? <CheckIcon /> : ""}
                      </span>
                    )}
                    {drag && drag.to === p.id && (
                      <div className="target-relation-actions">
                        <button
                          className="good"
                          onPointerDown={(event) => event.stopPropagation()}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            finish("good");
                          }}
                        >
                          {t("保")}
                        </button>
                        <button
                          className="bad"
                          onPointerDown={(event) => event.stopPropagation()}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            finish("bad");
                          }}
                        >
                          {t("踩")}
                        </button>
                      </div>
                    )}
                    {display.showRoleNames && p.role && (
                      <b className="role-name">
                        {language === "zh"
                          ? p.role.zh
                          : `${p.role.zh} (${p.role.en})`}
                      </b>
                    )}
                    {display.showPlayerNames && p.name && (
                      <small className={!p.role ? "player-name-no-role" : ""}>
                        {p.name}
                      </small>
                    )}
                    <div className="mark-orbit">
                      {visibleMarks.map((m, n) => {
                        const data = marks.find((x) => x.key === m),
                          markGap =
                            display.markSize === "large"
                              ? 51
                              : display.markSize === "medium"
                                ? 45
                                : 40,
                          angle =
                            outer +
                            (n - (visibleMarks.length - 1) / 2) * markGap;
                        return (
                          <i
                            key={m}
                            className={`selected-marker marker-${m}`}
                            style={{
                              transform: `rotate(${angle}deg) translateY(calc(-1 * var(--mark-radius))) rotate(${-angle}deg)`,
                            }}
                          >
                            <img src={data?.icon} alt={data?.label} />
                          </i>
                        );
                      })}
                    </div>
                    {active && (
                      <div
                        className="quick-ring"
                        style={{
                          transform: `translate(-50%,-50%) translate(${inX}px,${inY}px)`,
                        }}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          if (e.target === e.currentTarget) setQuick(null);
                        }}
                        onPointerUp={(e) => e.stopPropagation()}
                      >
                        {marks.map((m) => (
                          <button
                            key={m.key}
                            aria-label={t(m.label)}
                            className={`quick-${m.key} ${p.marks.includes(m.key) ? "selected" : ""}`}
                            onTouchEnd={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              updateMark(p.id, m.key);
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              updateMark(p.id, m.key);
                            }}
                          >
                            <img src={m.icon} alt="" />
                          </button>
                        ))}
                        <button
                          aria-label={t("记录")}
                          className="note-mark"
                          onTouchEnd={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setNotePlayer(p.id);
                            setQuick(null);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setNotePlayer(p.id);
                            setQuick(null);
                          }}
                        >
                          <Pencil2Icon />
                          <span>{t("记录")}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
          <section className="possibilities">
            <Carousel
              ariaLabel={t("推演可能性视图")}
              contentClassName="possibility-track"
            >
              {poss.map((n) => (
                <button
                  key={n}
                  className={possibility === n ? "active" : ""}
                  onClick={() => {
                    setPossibility(n);
                    setToast(`切换到可能性视图 ${n}，死亡与幽灵票保持不变`);
                  }}
                >
                  {t("可能性视图")} {n}
                </button>
              ))}
              <button
                className="add-possibility"
                disabled={poss.length >= 4}
                onClick={() => {
                  if (poss.length >= 4) return;
                  const n = poss.length + 1;
                  setPoss([...poss, n]);
                  setPossibility(n);
                  setToast(`已创建可能性视图 ${n}`);
                }}
              >
                <PlusIcon />
                {t("可能性视图")}
              </button>
            </Carousel>
          </section>
          <div className="bottom-tools">
            <div className="compact-tools-menu">
              <button
                className="compact-menu-trigger ui-button ui-button--secondary ui-button--icon"
                aria-label={t("板子信息")}
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen((open) => !open)}
              >
                <MenuIcon />
              </button>
              {mobileMenuOpen && (
                <div className="compact-menu-popover">
                  <button onClick={() => { setBoard(true); setMobileMenuOpen(false); }}><FileTextIcon /><span>{t("板子信息")}</span></button>
                  <button onClick={() => { setManualOpen(true); setMobileMenuOpen(false); }}><LightbulbIcon /><span>{t("使用手册")}</span></button>
                  <button onClick={() => { setSettingsOpen(true); setMobileMenuOpen(false); }}><GearIcon /><span>{t("设置")}</span></button>
                </div>
              )}
            </div>
            <button className="script-info-icon bottom-utility ui-button ui-button--secondary ui-button--icon" aria-label={t("板子信息")} onClick={() => setBoard(true)}>
              <FileTextIcon />
            </button>
            <button className="manual-bottom-button bottom-utility ui-button ui-button--secondary ui-button--icon" aria-label={t("使用手册")} onClick={() => setManualOpen(true)}>
              <LightbulbIcon />
            </button>
            <button className="settings-bottom-button bottom-utility ui-button ui-button--secondary ui-button--icon" aria-label={t("设置")} onClick={() => setSettingsOpen(true)}>
              <GearIcon />
            </button>
            <button className="open-notes ui-button ui-button--primary" onClick={() => setNotes(true)}>{t("打开笔记")}</button>
          </div>
          <div className="toast">{localizedToast(language, toast)}</div>
        </main>
      </MobileScroll>
      <BottomSheet
        open={deathDecisionPlayer !== null}
        onOpenChange={(open) => !open && setDeathDecisionPlayer(null)}
        title={t("取消死亡状态")}
        description={t("请选择修正记录或玩家复活")}
        snap={0.58}
      >
        <button
          aria-label={t("关闭")}
          className="desktop-modal-close death-modal-close"
          onClick={() => setDeathDecisionPlayer(null)}
        >
          <Cross2Icon />
        </button>
        {deathDecisionPlayer !== null && (() => {
          const player = players.find((item) => item.id === deathDecisionPlayer);
          if (!player) return null;
          return (
            <div className="death-decision">
              <div className="death-player-summary">
                <img src={player.role?.image || defaultPortrait(player.id)} alt="" />
                <p>
                  {t("你修改了")}「{language === "zh" ? "玩家" : "Player"} {player.id}
                  {player.name ? ` · ${player.name}` : ""}
                  {player.role
                    ? ` · ${language === "zh" ? player.role.zh : `${player.role.zh} (${player.role.en})`}`
                    : ""}」{t("的死亡状态，这是修正记录还是玩家复活？")}
                </p>
              </div>
              <div className="death-decision-copy">
                <section>
                  <b>{t("修正")}</b>
                  <span>{t("删除原死亡事件，不生成复活记录，并重新计算之后日期。")}</span>
                </section>
                <section>
                  <b>{t("复活")}</b>
                  <span>{t("保留原死亡事件，在当前日期新增玩家被复活记录。")}</span>
                </section>
              </div>
              <div className="death-decision-actions">
                <button onClick={() => resolveDeathChange("correction")}>{t("修正")}</button>
                <button className="revive" onClick={() => resolveDeathChange("revival")}>{t("复活")}</button>
              </div>
            </div>
          );
        })()}
      </BottomSheet>
      <BottomSheet
        open={relationDraft !== null}
        onOpenChange={(open) => !open && setRelationDraft(null)}
        title={t("编辑关系")}
        description={t("移动端长按线条 · 桌面端双击线条")}
        snap={0.72}
      >
        <button
          aria-label={t("关闭")}
          className="desktop-modal-close"
          onClick={() => setRelationDraft(null)}
        >
          <Cross2Icon />
        </button>
        {relationDraft && (
          <div className="relation-editor">
            <div className="relation-type-picks">
              {(["nominate", "good", "bad"] as const).map((type) => (
                <button
                  key={type}
                  className={relationDraft.type === type ? `active ${type}` : type}
                  onClick={() =>
                    setRelationDraft({
                      ...relationDraft,
                      type,
                      votes: type === "nominate" ? relationDraft.votes || [] : undefined,
                    })
                  }
                >
                  {t(type === "nominate" ? "提名" : type === "good" ? "保" : "踩")}
                </button>
              ))}
            </div>
            <div className="relation-endpoints">
              <label>
                <span>{t("来源玩家")}</span>
                <select
                  value={relationDraft.from}
                  onChange={(e) =>
                    setRelationDraft({ ...relationDraft, from: Number(e.target.value) })
                  }
                >
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {language === "zh" ? "玩家" : "Player"} {p.id}{p.name ? ` · ${p.name}` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>{t("目标玩家")}</span>
                <select
                  value={relationDraft.to}
                  onChange={(e) =>
                    setRelationDraft({ ...relationDraft, to: Number(e.target.value) })
                  }
                >
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {language === "zh" ? "玩家" : "Player"} {p.id}{p.name ? ` · ${p.name}` : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {relationDraft.type === "nominate" && (
              <fieldset className="relation-voters">
                <legend>{t("投票玩家")}</legend>
                <div>
                  {players.map((p) => {
                    const checked = relationDraft.votes?.includes(p.id) || false;
                    const disabled = p.marks.includes("deadSpent");
                    return (
                      <label className={disabled ? "disabled" : ""} key={p.id}>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() =>
                            setRelationDraft({
                              ...relationDraft,
                              votes: checked
                                ? (relationDraft.votes || []).filter((id) => id !== p.id)
                                : [...(relationDraft.votes || []), p.id],
                            })
                          }
                        />
                        {p.id}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            )}
            <div className="relation-editor-actions">
              <button
                className="delete"
                onClick={() => {
                  if (!window.confirm(t("确定删除这条关系记录吗？"))) return;
                  setRelations((items) => items.filter((item) => item.id !== relationDraft.id));
                  setRelationDraft(null);
                  setToast(t("关系记录已删除"));
                }}
              >
                <TrashIcon />
                {t("删除")}
              </button>
              <button
                className="save"
                onClick={() => {
                  const next = {
                    ...relationDraft,
                    executed:
                      relationDraft.type === "nominate" &&
                      (relationDraft.votes?.length || 0) > livingCount / 2,
                  };
                  setRelations((items) =>
                    items.map((item) => (item.id === next.id ? next : item)),
                  );
                  setRelationDraft(null);
                  setToast(t("关系记录已更新"));
                }}
              >
                {t("保存")}
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
      <BottomSheet
        open={manualOpen}
        onOpenChange={setManualOpen}
        title={t("使用手册")}
        description={t("圆盘交互与记录规则")}
        snap={0.88}
      >
        <button
          aria-label={t("关闭")}
          className="desktop-modal-close"
          onClick={() => setManualOpen(false)}
        >
          <Cross2Icon />
        </button>
        <div className="manual-content">
          <section>
            <h3>{t("玩家与标记")}</h3>
            <p>
              {t(
                "轻点玩家可从本局板子选择角色；长按玩家打开快捷标记，点击空白处关闭。",
              )}
            </p>
          </section>
          <section>
            <h3>{t("提名与关系")}</h3>
            <p>
              {t(
                "按住玩家并拖向另一名有效玩家；无效目标会置灰，未在有效目标上松手则取消。",
              )}
            </p>
            <p>
              {t(
                "拖拽完成后可直接保、踩，或在圆盘上选择投票玩家并确认本轮。保与踩不消耗提名资格。",
              )}
            </p>
            <p>
              {t(
                "移动端长按关系线、桌面端双击关系线，可修改或删除该条提名／保／踩记录。",
              )}
            </p>
          </section>
          <section>
            <h3>{t("投票规则")}</h3>
            <p>
              {t(
                "提名者与被提名者都可以投票。只有死亡且幽灵票已使用的玩家不能投票；幽灵票可用的死亡玩家确认投票后自动消耗幽灵票。",
              )}
            </p>
            <p>
              {t(
                "每名玩家每天只能提名一次、被提名一次；投票次数不限。进入下一天后提名资格重置。",
              )}
            </p>
          </section>
          <section>
            <h3>{t("笔记、日期与可能性视图")}</h3>
            <p>
              {t(
                "快捷标记中的记录按钮编辑单独玩家的当天笔记；底部打开笔记查看全部玩家和投票记录。",
              )}
            </p>
            <p>
              {t(
                "上一天、下一天与保存按天管理记录。切换可能性视图不会改变死亡、幽灵票、关系箭头或笔记。",
              )}
            </p>
          </section>
          <footer className="author-card">
            <b>{t("作者光光")}</b>
            <p>{t("这是一个兴趣使然的项目。")}</p>
            <p>
              {t("有改进建议请加微信")} <strong>o0ez0o</strong>
            </p>
          </footer>
        </div>
      </BottomSheet>
      <BottomSheet
        open={board}
        onOpenChange={setBoard}
        title={currentBoard.name}
        description={`${t("本局板子")} · ${boardRoles.length} ${t("个角色")}`}
        snap={0.88}
      >
        <button
          aria-label={t("关闭")}
          className="desktop-modal-close"
          onClick={() => setBoard(false)}
        >
          <Cross2Icon />
        </button>
        <div className="in-game-board-preview" data-scroll-drag="ignore">
          <ScriptPreviewContent board={currentBoard} language={language} />
        </div>
        <button className="end-game" onClick={endGame}>
          {t("结束本局并返回主页")}
        </button>
      </BottomSheet>
      <BottomSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        title={t("显示设置")}
        description={t("圆盘上的名字与标记")}
        snap={0.72}
      >
        <button
          aria-label={t("关闭")}
          className="desktop-modal-close"
          onClick={() => setSettingsOpen(false)}
        >
          <Cross2Icon />
        </button>
        <div className="display-settings">
          <section className="language-setting">
            <b>{t("界面语言")}</b>
            <div>
              <button
                className={language === "zh" ? "active" : ""}
                onClick={() => setLanguage("zh")}
              >
                中文
              </button>
              <button
                className={language === "en" ? "active" : ""}
                onClick={() => setLanguage("en")}
              >
                English
              </button>
            </div>
          </section>
          <label>
            <span>
              <b>{t("显示角色名字")}</b>
              <small>{t("圆盘玩家头像下方")}</small>
            </span>
            <input
              type="checkbox"
              checked={display.showRoleNames}
              onChange={(e) =>
                setDisplay({ ...display, showRoleNames: e.target.checked })
              }
            />
          </label>
          <label>
            <span>
              <b>{t("每日记录显示首夜信息角色")}</b>
              <small>{t("第一天以灰色显示首夜获取信息的角色")}</small>
            </span>
            <input
              type="checkbox"
              checked={display.alwaysShowDailyRoles}
              onChange={(e) =>
                setDisplay({ ...display, alwaysShowDailyRoles: e.target.checked })
              }
            />
          </label>
          <label>
            <span>
              <b>{t("显示玩家名字")}</b>
              <small>{t("有填写名字时显示")}</small>
            </span>
            <input
              type="checkbox"
              checked={display.showPlayerNames}
              onChange={(e) =>
                setDisplay({ ...display, showPlayerNames: e.target.checked })
              }
            />
          </label>
          <section>
            <b>{t("已选标记大小")}</b>
            <div>
              {(["small", "medium", "large"] as const).map((s, i) => (
                <button
                  className={display.markSize === s ? "active" : ""}
                  onClick={() => setDisplay({ ...display, markSize: s })}
                  key={s}
                >
                  {t(["小", "中", "大"][i])}
                </button>
              ))}
            </div>
          </section>
          <button className="settings-manual-link" onClick={() => { setSettingsOpen(false); setManualOpen(true); }}>
            <img src={assetUrl("clocktower/feather.svg")} alt="" />
            <span>{t("使用手册")}</span>
          </button>
        </div>
      </BottomSheet>
      <BottomSheet
        open={rolePlayer !== null}
        onOpenChange={(o) => {
          if (!o) {
            setRolePlayer(null);
            setRoleStatusOpen(false);
            setRoleSkill(null);
            setRoleSkillMode(null);
            setRoleReferenceOpen(false);
          }
        }}
        title={`${language === "zh" ? "为玩家" : "Player"} ${rolePlayer || ""} · ${t("选择角色")}`}
        description={t("轻点头像可随时修改 · 长按角色头像查看技能描述")}
        snap={0.88}
      >
        <button
          aria-label={t("关闭")}
          className="desktop-modal-close"
          onClick={() => {
            setRolePlayer(null);
            setRoleStatusOpen(false);
            setRoleSkill(null);
            setRoleSkillMode(null);
            setRoleReferenceOpen(false);
          }}
        >
          <Cross2Icon />
        </button>
        {currentBoard?.id === "zhenhuan-v420" && (
          <button className="role-reference-trigger ui-button ui-button--secondary" onClick={() => setRoleReferenceOpen(true)}>
            <EyeOpenIcon />
            {t("查看原剧头像核对")}
          </button>
        )}
        <div className="role-picker-content" data-scroll-drag="ignore">
          <section className="role-picker-group clear-role-group">
            <div className="role-avatar-grid">
              <button
                className="role-avatar-option clear-role-option"
                aria-label={t("取消标记")}
                onClick={() => {
                  setPlayers((ps) =>
                    ps.map((p) =>
                      p.id === rolePlayer ? { ...p, role: undefined } : p,
                    ),
                  );
                }}
              >
                <span>{t("取消标记")}</span>
              </button>
              <button
                className={`role-avatar-option role-drunk-option ${
                  players.find((player) => player.id === rolePlayer)?.marks.includes("drunk")
                    ? "selected"
                    : ""
                }`}
                aria-label={t("酒鬼")}
                aria-pressed={Boolean(
                  players.find((player) => player.id === rolePlayer)?.marks.includes("drunk"),
                )}
                title={t("酒鬼")}
                onClick={() => rolePlayer !== null && updateMark(rolePlayer, "drunk")}
              >
                <img src={marks.find((status) => status.key === "drunk")?.icon} alt="" />
              </button>
            </div>
          </section>
          {(["镇民", "外来者", "爪牙", "恶魔"] as CoreTeam[]).map((teamName) => (
            <section className={`role-picker-group team-${teamName}`} key={teamName}>
              <h3>{teamText(language, teamName)}</h3>
              <div className="role-avatar-grid">
                {groups[teamName].map((r) => {
                  const assigned = players.some((p) => p.role?.id === r.id);
                  const current = players.find((p) => p.id === rolePlayer)?.role?.id === r.id;
                  return (
                    <div className="role-avatar-item" key={r.id}>
                      <button
                        aria-label={language === "zh" ? r.zh : `${r.zh} (${r.en})`}
                        title={language === "zh" ? r.zh : `${r.zh} (${r.en})`}
                        className={`role-avatar-option ${assigned ? "assigned" : ""} ${current ? "current" : ""}`}
                        onPointerDown={(event) => {
                          if (event.pointerType === "mouse") return;
                          roleTouchStart.current = { id: r.id, at: performance.now() };
                          showRoleSkill(r, event.currentTarget, "hold");
                        }}
                        onPointerEnter={(event) => {
                          if (event.pointerType !== "mouse") return;
                          showRoleSkill(r, event.currentTarget, "hover");
                        }}
                        onPointerLeave={(event) => {
                          if (event.pointerType !== "mouse") return;
                          setRoleSkill((shown) => shown?.id === r.id ? null : shown);
                          setRoleSkillMode((mode) => mode === "hover" ? null : mode);
                        }}
                        onContextMenu={(event) => event.preventDefault()}
                        onClick={() => {
                          if (suppressRoleClick.current === r.id) {
                            suppressRoleClick.current = null;
                            return;
                          }
                          setPlayers((ps) =>
                            ps.map((p) => (p.id === rolePlayer ? { ...p, role: r } : p)),
                          );
                          setToast(`已选择${r.zh}`);
                        }}
                      >
                        <img src={r.image} alt="" />
                      </button>
                      {display.showRoleNames && (
                        <small>{language === "zh" ? r.zh : `${r.zh} (${r.en})`}</small>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
        {roleSkill && (
          <div
            className={`role-skill-popover mode-${roleSkillMode || "hold"}`}
            role="status"
            style={{ left: roleSkillAnchor.left, top: roleSkillAnchor.top, width: roleSkillAnchor.width }}
          >
            <article>
              <button aria-label={t("关闭")} onClick={() => { setRoleSkill(null); setRoleSkillMode(null); }}>
                <Cross2Icon />
              </button>
              <img src={roleSkill.image} alt="" />
              <div>
                <small>{teamText(language, roleSkill.team)}</small>
                <h3>{language === "zh" ? roleSkill.zh : `${roleSkill.zh} (${roleSkill.en})`}</h3>
                <p>{roleSkill.abilityZh}</p>
              </div>
            </article>
          </div>
        )}
        {roleReferenceOpen && (
          <div className="role-reference-overlay" role="dialog" aria-modal="true">
            <section>
              <header>
                <div><h3>{t("原剧头像核对")}</h3><p>{t("确认人物与造型后再生成正式头像")}</p></div>
                <button aria-label={t("关闭")} onClick={() => setRoleReferenceOpen(false)}><Cross2Icon /></button>
              </header>
              <div className="role-reference-grid">
                {zhenHuanReferences.map(({ name, actor, file, note }) => (
                  <figure key={name} className={!file ? "reference-missing" : ""}>
                    {file ? (
                      <img src={assetUrl(`zhenhuan/reference-originals/${file}`)} alt="" />
                    ) : (
                      <div className="reference-placeholder"><span>{name.slice(0, 2)}</span></div>
                    )}
                    <figcaption>
                      <b>{name}</b>
                      {actor && <small>{actor} {t("饰")}</small>}
                      {note && <em>{note}</em>}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          </div>
        )}
        <div className="role-picker-footer">
          {roleStatusOpen && rolePlayer !== null && (
            <div className="role-status-menu">
              {marks.map((status) => {
                const active = players.find((player) => player.id === rolePlayer)?.marks.includes(status.key);
                return (
                  <button
                    key={status.key}
                    className={active ? "selected" : ""}
                    onClick={() => updateMark(rolePlayer, status.key)}
                  >
                    <img src={status.icon} alt="" />
                    <span>{t(status.label === "死亡 · 幽灵票可用" ? "死亡" : status.label)}</span>
                  </button>
                );
              })}
            </div>
          )}
          <div className="role-picker-actions">
            <button
              className="role-status-trigger ui-button ui-button--secondary"
              onClick={() => setRoleStatusOpen((open) => !open)}
            >
              <span className="role-status-selected-icons">
                {rolePlayer !== null && players
                  .find((player) => player.id === rolePlayer)
                  ?.marks.filter((mark) => marks.some((status) => status.key === mark))
                  .map((mark) => (
                    <img key={mark} src={marks.find((status) => status.key === mark)?.icon} alt="" />
                  ))}
              </span>
              <span>{t("添加状态")}</span>
            </button>
            <button
              className="role-note-action ui-button ui-button--secondary"
              onClick={() => {
                if (rolePlayer === null) return;
                const playerId = rolePlayer;
                setRolePlayer(null);
                setRoleStatusOpen(false);
                setNotePlayer(playerId);
              }}
            >
              <Pencil2Icon />
              {t("添加笔记")}
            </button>
            <button
              className="role-save-close ui-button ui-button--primary"
              onClick={() => {
                setRolePlayer(null);
                setRoleStatusOpen(false);
              }}
            >
              {t("保存并关闭")}
            </button>
          </div>
        </div>
      </BottomSheet>
      <BottomSheet
        open={notePlayer !== null}
        onOpenChange={(o) => !o && setNotePlayer(null)}
        title={`${language === "zh" ? "玩家" : "Player"} ${notePlayer || ""} · ${language === "zh" ? `第 ${day} 天` : `Day ${day}`}`}
        description={t("单独玩家笔记")}
        snap={0.88}
      >
        <button
          aria-label={t("关闭")}
          className="desktop-modal-close"
          onClick={() => setNotePlayer(null)}
        >
          <Cross2Icon />
        </button>
        {selected && (
          <div className="note-editor">
            <label>{t("玩家名字（可选）")}</label>
            <KeyboardInput
              value={selected.name}
              placeholder={t("输入玩家名字")}
              onChange={(e) =>
                setPlayers((ps) =>
                  ps.map((p) =>
                    p.id === notePlayer ? { ...p, name: e.target.value } : p,
                  ),
                )
              }
            />
            <label>{t("当天记录")}</label>
            <KeyboardTextarea
              value={selected.notes[day] || ""}
              placeholder={t("记录查验、发言或推理…")}
              onChange={(e) =>
                setPlayers((ps) =>
                  ps.map((p) =>
                    p.id === notePlayer
                      ? { ...p, notes: { ...p.notes, [day]: e.target.value } }
                      : p,
                  ),
                )
              }
            />
            <div className="editor-actions">
              <button
                onClick={() =>
                  setPlayers((ps) =>
                    ps.map((p) =>
                      p.id === notePlayer
                        ? { ...p, notes: { ...p.notes, [day]: "" } }
                        : p,
                    ),
                  )
                }
              >
                {t("清除")}
              </button>
              <button
                className="save"
                onClick={() => {
                  setNotePlayer(null);
                  setToast(t("玩家笔记已保存"));
                }}
              >
                {t("保存")}
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
      <BottomSheet
        open={notes}
        onOpenChange={setNotes}
        title={t("总体笔记")}
        description={`${t("整局记录")} · ${t("所有记录")}`}
        snap={0.88}
      >
        <button
          aria-label={t("关闭")}
          className="desktop-modal-close"
          onClick={() => setNotes(false)}
        >
          <Cross2Icon />
        </button>
        <Notes
          language={language}
          players={players}
          relations={relations}
          deaths={deaths}
          peacefulDays={peacefulDays}
          togglePeaceful={(d) =>
            setPeacefulDays((ds) =>
              ds.includes(d) ? ds.filter((x) => x !== d) : [...ds, d],
            )
          }
          day={day}
          alwaysShowDailyRoles={display.alwaysShowDailyRoles}
          edit={editPlayerDay}
          clear={clearPlayerDay}
        />
      </BottomSheet>
    </>
  );
}
function Tabs({
  language,
  tab,
  setTab,
  groups,
}: {
  language: Language;
  tab: Role["team"];
  setTab: (t: Role["team"]) => void;
  groups: Record<Role["team"], Role[]>;
}) {
  return (
    <div className="sheet-tabs">
      {(["镇民", "外来者", "爪牙", "恶魔"] as const).map((key) => (
        <button
          className={tab === key ? "active" : ""}
          onClick={() => setTab(key)}
          key={key}
        >
          {teamText(language, key)}（{groups[key].length}）
        </button>
      ))}
    </div>
  );
}
function Notes({
  initialTab,
  language,
  players,
  relations,
  deaths,
  peacefulDays,
  togglePeaceful,
  day,
  alwaysShowDailyRoles,
  edit,
  clear,
}: {
  initialTab?: "roles" | "votes";
  language: Language;
  players: Player[];
  relations: Relation[];
  deaths: DeathEvent[];
  peacefulDays: number[];
  togglePeaceful: (d: number) => void;
  day: number;
  alwaysShowDailyRoles: boolean;
  edit: (playerId: number, recordDay: number) => void;
  clear: (playerId: number, recordDay: number) => void;
}) {
  const t = (text: string) => translate(language, text);
  const [tab, setTab] = useState<"roles" | "votes">(initialTab || "roles");
  const allDays = Array.from(
    new Set([
      day,
      ...players.flatMap((p) => Object.keys(p.notes).map(Number)),
      ...relations.map((r) => r.day),
      ...deaths.map((d) => d.day),
      ...peacefulDays,
    ]),
  ).sort((a, b) => a - b);
  const recorded = players.filter(
    (p) =>
      Object.values(p.notes).some(Boolean) ||
      p.marks.length > 0 ||
      deaths.some((d) => d.playerId === p.id) ||
      relations.some(
        (r) => r.from === p.id && r.type !== "nominate",
      ),
  );
  return (
    <div className="notes-panel">
      <div className="notes-tabs">
        <button
          className={tab === "roles" ? "active" : ""}
          onClick={() => setTab("roles")}
        >
          {t("角色记录")}
        </button>
        <button
          className={tab === "votes" ? "active" : ""}
          onClick={() => setTab("votes")}
        >
          {t("每日记录")}
        </button>
      </div>
      {tab === "roles" ? (
        <div className="player-notes">
          {recorded.length ? (
            recorded.map((p) => {
              const playerDays = allDays.filter(
                (recordDay) =>
                  Boolean(p.notes[recordDay]) ||
                  deaths.some(
                    (d) => d.day === recordDay && d.playerId === p.id,
                  ) ||
                  relations.some(
                    (r) =>
                      r.day === recordDay &&
                      r.from === p.id &&
                      r.type !== "nominate",
                  ) ||
                  (recordDay === day && p.marks.length > 0),
              ),
                summaryMarks: { key: string; label: string }[] = p.marks
                  .filter(
                    (mark) =>
                      mark !== "poison" &&
                      mark !== "poisonQ" &&
                      mark !== "madness" &&
                      mark !== "deadVote" &&
                      mark !== "deadSpent",
                  )
                  .map((mark) => ({
                    key: mark,
                    label: marks.find((item) => item.key === mark)?.label || mark,
                  }));
              if (p.marks.includes("deadSpent"))
                summaryMarks.push({ key: "ghost-spent", label: "幽灵票已使用" });
              return (
                <article key={p.id}>
                  <header>
                    <b>{p.id}{p.name ? ` ${p.name}` : ""}</b>
                    <span className="record-separator">·</span>
                    <img src={p.role?.image || defaultPortrait(p.id)} />
                    {p.role && (
                      <>
                        <span className="record-separator">·</span>
                        <span className="record-role">
                          {language === "zh"
                            ? p.role.zh
                            : `${p.role.zh} (${p.role.en})`}
                        </span>
                      </>
                    )}
                    {summaryMarks.map((mark) => (
                      <span
                        className={`record-summary-mark record-tag tag-${mark.key}`}
                        key={mark.key}
                      >
                        {t(mark.label)}
                      </span>
                    ))}
                  </header>
                  <div className="player-day-records">
                    {playerDays.map((recordDay) => {
                      const good = relations
                          .filter(
                            (r) =>
                              r.day === recordDay &&
                              r.from === p.id &&
                              r.type === "good",
                          )
                          .map((r) => r.to),
                        bad = relations
                          .filter(
                            (r) =>
                              r.day === recordDay &&
                              r.from === p.id &&
                              r.type === "bad",
                          )
                          .map((r) => r.to),
                        dayEvents = deaths.filter(
                          (event) =>
                            event.day === recordDay && event.playerId === p.id,
                        );
                      return (
                        <div className="player-day-record" key={recordDay}>
                          <p>
                            <em>
                              {language === "zh"
                                ? `第 ${recordDay} 天`
                                : `Day ${recordDay}`}
                            </em>
                            {recordDay === day && p.marks.includes("poison") && (
                              <i className="note-status record-tag poison">{t("中毒")}</i>
                            )}
                            {recordDay === day && p.marks.includes("madness") && (
                              <i className="note-status record-tag madness">{t("疯狂")}</i>
                            )}
                            {dayEvents.some((event) => event.reason === "execution" || event.reason === "manual") && (
                              <i className="note-status record-tag tag-death">{t("死亡")}</i>
                            )}
                            {good.length > 0 && (
                              <strong className="good-text">{t("保")} {good.join("、")}</strong>
                            )}
                            {bad.length > 0 && (
                              <strong className="bad-text">{t("踩")} {bad.join("、")}</strong>
                            )}
                            {dayEvents
                              .filter((event) => event.reason === "revival")
                              .map((event) => (
                                <strong className="revival-text" key={event.id}>
                                  {t("玩家被复活")}
                                </strong>
                              ))}
                            {p.notes[recordDay] && <span className="manual-note">{p.notes[recordDay]}</span>}
                          </p>
                          <div className="day-record-actions">
                            <button onClick={() => edit(p.id, recordDay)}>{t("编辑")}</button>
                            <button
                              disabled={!p.notes[recordDay]}
                              onClick={() => clear(p.id, recordDay)}
                            >
                              {t("删除")}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })
          ) : (
            <p className="empty">{t("还没有玩家记录")}</p>
          )}
        </div>
      ) : (
        <VoteNotes
          language={language}
          players={players}
          relations={relations}
          deaths={deaths}
          peacefulDays={peacefulDays}
          togglePeaceful={togglePeaceful}
          day={day}
          alwaysShowDailyRoles={alwaysShowDailyRoles}
        />
      )}
    </div>
  );
}
function VoteNotes({
  language,
  players,
  relations,
  deaths,
  peacefulDays,
  togglePeaceful,
  day,
  alwaysShowDailyRoles,
}: {
  language: Language;
  players: Player[];
  relations: Relation[];
  deaths: DeathEvent[];
  peacefulDays: number[];
  togglePeaceful: (d: number) => void;
  day: number;
  alwaysShowDailyRoles: boolean;
}) {
  const t = (text: string) => translate(language, text);
  const pairKey = (a: number, b: number) =>
    a < b ? `${a}-${b}` : `${b}-${a}`;
  const opposition = new Map<string, number>();
  const alliance = new Map<string, number>();
  const addScore = (map: Map<string, number>, a: number, b: number, score: number) => {
    if (a === b) return;
    const key = pairKey(a, b);
    map.set(key, (map.get(key) || 0) + score);
  };
  relations.forEach((relation) => {
    if (relation.type === "bad") addScore(opposition, relation.from, relation.to, 2);
    if (relation.type === "good") addScore(alliance, relation.from, relation.to, 2);
    if (relation.type === "nominate") {
      addScore(opposition, relation.from, relation.to, 2);
      players.forEach((player) => {
        if (player.id === relation.to) return;
        if (relation.votes?.includes(player.id))
          addScore(opposition, relation.to, player.id, 1);
        else addScore(alliance, relation.to, player.id, 1);
      });
      players.forEach((a, index) =>
        players.slice(index + 1).forEach((b) => {
          const aVote = relation.votes?.includes(a.id) || false;
          const bVote = relation.votes?.includes(b.id) || false;
          if (aVote === bVote) addScore(alliance, a.id, b.id, 0.5);
        }),
      );
    }
  });
  const mutualBonuses = new Set<string>();
  relations.forEach((relation) => {
    const mutual = relations.some(
      (other) =>
        other.type === relation.type &&
        other.from === relation.to &&
        other.to === relation.from,
    );
    const bonusKey = `${relation.type}-${pairKey(relation.from, relation.to)}`;
    if (mutual && !mutualBonuses.has(bonusKey)) {
      mutualBonuses.add(bonusKey);
      if (relation.type === "bad")
        addScore(opposition, relation.from, relation.to, 3);
      if (relation.type === "good")
        addScore(alliance, relation.from, relation.to, 3);
      if (relation.type === "nominate")
        addScore(opposition, relation.from, relation.to, 2);
    }
  });
  const topPair = (scores: Map<string, number>) =>
    [...scores.entries()].filter((entry) => entry[1] >= 3).sort((a, b) => b[1] - a[1])[0]?.[0]
      ?.split("-")
      .map(Number);
  const oppositionPair = topPair(opposition);
  const alliancePair = topPair(alliance);
  const playerLabel = (id: number) => {
    const player = players.find((item) => item.id === id);
    return `${id}${player?.name ? ` ${player.name}` : ""}`;
  };
  const days = Array.from(
    new Set([
      day,
      ...players.flatMap((p) => Object.keys(p.notes).map(Number)),
      ...relations.map((r) => r.day),
      ...deaths.map((d) => d.day),
      ...peacefulDays,
    ]),
  ).sort((a, b) => a - b);
  return (
    <div className="vote-notes">
      <section className="relation-insight">
        <span>{t("关系推测")}</span>
        <b>
          {t("可能对立")}：{oppositionPair
            ? `${playerLabel(oppositionPair[0])} ↔ ${playerLabel(oppositionPair[1])}`
            : t("暂无")}
        </b>
        <b className="ally">
          {t("可能共边")}：{alliancePair
            ? `${playerLabel(alliancePair[0])} ↔ ${playerLabel(alliancePair[1])}`
            : t("暂无")}
        </b>
        <small>{t("基于保／踩、提名与投票行为")}</small>
      </section>
      {days.map((recordDay) => {
        const rs = relations.filter(
            (r) => r.day === recordDay && r.type === "nominate",
          ),
          deathCount = deaths.filter(
            (d) => d.day === recordDay && d.reason !== "revival",
          ).length,
          nominators = [...new Set(rs.map((relation) => relation.from))],
          nominees = [...new Set(rs.map((relation) => relation.to))],
          hasOrganicDayRecord = (player: Player) => {
            const hasManualNote = Boolean(player.notes[recordDay]?.trim());
            const hasDayEvent = deaths.some(
              (event) => event.day === recordDay && event.playerId === player.id,
            );
            const hasDayStatus =
              recordDay === day &&
              (player.marks.includes("poison") ||
                player.marks.includes("madness"));
            return hasManualNote || hasDayEvent || hasDayStatus;
          },
          isFirstNightInfoReminder = (player: Player) =>
            alwaysShowDailyRoles &&
            recordDay === 1 &&
            Boolean(player.role && firstNightInformationRoleIds.has(player.role.id)),
          dayPlayers = players.filter(
            (player) => hasOrganicDayRecord(player) || isFirstNightInfoReminder(player),
          );
        return (
          <section className="vote-day-group" key={recordDay}>
            <div className="day-vote-header">
              <h3>
                {language === "zh" ? `第 ${recordDay} 天` : `Day ${recordDay}`}
              </h3>
              {rs.length > 0 && (
                <span className="day-nomination-summary">
                  {t("提名玩家")} {nominators.join("、")} · {t("被提名")} {nominees.join("、")}
                </span>
              )}
              <small>
                {t("今日死亡")}: {deathCount}
              </small>
              <button
                className={peacefulDays.includes(recordDay) ? "active" : ""}
                aria-pressed={peacefulDays.includes(recordDay)}
                onClick={() => togglePeaceful(recordDay)}
              >
                {!peacefulDays.includes(recordDay) && (
                  <span className="peaceful-checkbox" />
                )}
                <span>{t("平安夜")}</span>
              </button>
            </div>
            <div className="daily-notes-section">
              <h4>{t("当天笔记")}</h4>
              {dayPlayers.length ? (
                <div className="daily-player-notes">
                  {dayPlayers.map((player) => {
                    const dayEvents = deaths.filter(
                      (event) =>
                        event.day === recordDay && event.playerId === player.id,
                    );
                    return (
                      <article
                        className={`daily-player-note ${
                          isFirstNightInfoReminder(player) && !hasOrganicDayRecord(player)
                            ? "first-night-reminder"
                            : ""
                        }`}
                        key={player.id}
                      >
                        <img
                          src={player.role?.image || defaultPortrait(player.id)}
                          alt=""
                        />
                        <div className="daily-player-note-copy">
                          <div className="daily-player-note-meta">
                            <b>
                              {player.id}{player.name ? ` ${player.name}` : ""}
                            </b>
                            {player.role && (
                              <>
                                <span>·</span>
                                <span>
                                  {language === "zh"
                                    ? player.role.zh
                                    : `${player.role.zh} (${player.role.en})`}
                                </span>
                              </>
                            )}
                            {isFirstNightInfoReminder(player) && !hasOrganicDayRecord(player) && (
                              <i className="first-night-info-tag">{t("首夜信息")}</i>
                            )}
                            {player.marks.includes("drunk") && (
                              <i className="record-tag tag-drunk">{t("酒鬼")}</i>
                            )}
                            {recordDay === day && player.marks.includes("poison") && (
                              <i className="record-tag poison">{t("中毒")}</i>
                            )}
                            {recordDay === day && player.marks.includes("madness") && (
                              <i className="record-tag madness">{t("疯狂")}</i>
                            )}
                            {dayEvents.some(
                              (event) =>
                                event.reason === "execution" || event.reason === "manual",
                            ) && (
                              <i className="record-tag tag-death">{t("死亡")}</i>
                            )}
                            {dayEvents.some((event) => event.reason === "revival") && (
                              <i className="record-tag tag-revival">{t("复活")}</i>
                            )}
                          </div>
                          {player.notes[recordDay] && (
                            <p>{player.notes[recordDay]}</p>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="empty">{t("当天还没有玩家笔记")}</p>
              )}
            </div>
            <div className="daily-votes-section">
              <h4>{t("当天投票记录")}</h4>
              {rs.length ? (
                rs.map((r) => {
                  const a = players.find((p) => p.id === r.from),
                    b = players.find((p) => p.id === r.to);
                  return (
                    <article className="daily-vote-record" key={r.id}>
                      <b>
                        {r.from}
                        {a?.role
                          ? ` ${language === "zh" ? a.role.zh : `${a.role.zh} (${a.role.en})`}`
                          : ""}{" "}
                        → {r.to}
                        {b?.role
                          ? ` ${language === "zh" ? b.role.zh : `${b.role.zh} (${b.role.en})`}`
                          : ""}
                      </b>
                      <p>
                        {t("投票")}{" "}
                        {r.votes?.join("、") ||
                          (language === "zh" ? "无" : "None")} ·{" "}
                        {r.votes?.length || 0}
                        {t("票")} {r.executed && <strong>· {t("标记处决")}</strong>}
                      </p>
                    </article>
                  );
                })
              ) : (
                <p className="empty">{t("当天还没有投票记录")}</p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ScriptPreviewContent({
  board,
  language,
}: {
  board: ScriptBoard;
  language: Language;
}) {
  const [abilityEn, setAbilityEn] = useState<Record<string, string>>({});
  const [roleZh, setRoleZh] = useState<
    Record<string, { ability?: string; first?: string; other?: string }>
  >({});
  useEffect(() => {
    fetch(assetUrl("clocktower/official-roles.json"))
      .then((response) => response.json())
      .then((data: { id: string; ability: string }[]) =>
        setAbilityEn(Object.fromEntries(data.map((role) => [role.id, role.ability]))),
      )
      .catch(() => undefined);
    fetch(assetUrl("clocktower/official-roles-zh.json"))
      .then((response) => response.json())
      .then((data: { roles: typeof roleZh }) => setRoleZh(data.roles || {}))
      .catch(() => undefined);
  }, []);
  const boardRoles = roles.filter((role) => board.roleIds.includes(role.id));
  const orderedNightRoles = (order: string[], kind: "first" | "other") =>
    order
      .filter((id) => board.roleIds.includes(id))
      .map((id) => roles.find((role) => role.id === id))
      .filter((role): role is Role => Boolean(role))
      .filter((role) =>
        kind === "first"
          ? Boolean(role.firstNightReminderZh || roleZh[role.id]?.first)
          : Boolean(role.otherNightReminderZh || roleZh[role.id]?.other),
      );
  const firstRoles = orderedNightRoles(firstNightOrder, "first");
  const otherRoles = orderedNightRoles(otherNightOrder, "other");
  const counts = (["镇民", "外来者", "爪牙", "恶魔"] as CoreTeam[]).map(
    (team) => boardRoles.filter((role) => role.team === team).length,
  );
  const travellerCount = boardRoles.filter((role) => role.team === "旅行者").length;
  const roleAbility = (role: Role) =>
    language === "zh"
      ? role.abilityZh || roleZh[role.id]?.ability || "能力说明载入中…"
      : abilityEn[role.id] || role.abilityZh || roleZh[role.id]?.ability || "Ability text unavailable";
  const nightReminder = (role: Role, kind: "first" | "other") =>
    language === "zh"
      ? (kind === "first"
          ? role.firstNightReminderZh || roleZh[role.id]?.first
          : role.otherNightReminderZh || roleZh[role.id]?.other) || "按角色能力执行。"
      : abilityEn[role.id] || roleAbility(role);
  const NightRail = ({ kind }: { kind: "first" | "other" }) => {
    const list = kind === "first" ? firstRoles : otherRoles;
    return (
      <aside className={`night-rail ${kind}`}>
        <h3>{kind === "first" ? "首个夜晚" : "其他夜晚"}</h3>
        <ol>
          {kind === "first" && <li className="system-night">爪牙信息</li>}
          {kind === "first" && <li className="system-night">恶魔信息</li>}
          {list.map((role) => (
            <li key={`${kind}-${role.id}`} title={nightReminder(role, kind)}>
              <img src={role.image} alt="" />
              <span>{language === "zh" ? role.zh : role.en}</span>
            </li>
          ))}
          <li className="system-night">黎明</li>
        </ol>
      </aside>
    );
  };
  return (
    <div className="script-preview">
      <div className="preview-title">
        <div>
          <h2>{board.name}</h2>
          <p>
            {board.sourceLabel || (board.official ? "官方默认板子" : "我的板子")}
            {board.author ? `（作者：${board.author}）` : ""} · {board.roleIds.length} 个角色
          </p>
          <span>
            {counts[0]} 镇民 · {counts[1]} 外来者 · {counts[2]} 爪牙 · {counts[3]} 恶魔
            {travellerCount ? ` · ${travellerCount} 旅行者` : ""}
          </span>
        </div>
      </div>
      <div className="preview-sheet">
        <NightRail kind="first" />
        <div className="preview-role-body">
          {(["镇民", "外来者", "爪牙", "恶魔", "旅行者"] as Team[]).map((team) => {
            const teamRoles = boardRoles.filter((role) => role.team === team);
            if (!teamRoles.length) return null;
            return (
              <section className={`preview-team team-${team}`} key={team}>
                <h3>
                  {team === "旅行者"
                    ? "旅行者"
                    : `${team === "镇民" || team === "外来者" ? "善良阵营" : "邪恶阵营"} · ${team}`}
                  （{teamRoles.length}）
                </h3>
                <div className="preview-role-grid">
                  {teamRoles.map((role) => (
                    <article key={role.id}>
                      <img src={role.image} alt="" />
                      <div>
                        <b>
                          {role.zh}{role.en ? `（${role.en}）` : ""}
                          {role.gender ? <small className="role-gender"> · {role.gender}</small> : null}
                        </b>
                        <p>{roleAbility(role)}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
          {board.specialRule && (
            <section className="special-rule">
              <h3>特殊规则 · {board.name}</h3>
              <p>{board.specialRule}</p>
            </section>
          )}
          <section className="status-explainer">
            <h3>中毒／醉酒</h3>
            <p><b>中毒：</b>玩家暂时失去角色能力；说书人可以让其像能力仍有效一样行动，并给予错误信息。</p>
            <p><b>醉酒：</b>处理方式与中毒相同，但通常来自玩家自己的角色或另一角色能力。</p>
          </section>
        </div>
        <NightRail kind="other" />
      </div>
    </div>
  );
}

function BoardPreviewModal({
  board,
  language,
  close,
}: {
  board: ScriptBoard;
  language: Language;
  close: () => void;
}) {
  return (
    <div className="board-preview-overlay" role="dialog" aria-modal="true">
      <section className="board-preview-modal">
        <header>
          <span>板子预览</span>
          <button aria-label="关闭" onClick={close}><Cross2Icon /></button>
        </header>
        <div className="board-preview-scroll" data-scroll-drag="ignore">
          <ScriptPreviewContent board={board} language={language} />
        </div>
      </section>
    </div>
  );
}

function BoardCard({
  board,
  language,
  selected,
  select,
  preview,
  duplicate,
  edit,
  remove,
}: {
  board: ScriptBoard;
  language: Language;
  selected: boolean;
  select: () => void;
  preview: () => void;
  duplicate?: () => void;
  edit?: () => void;
  remove?: () => void;
}) {
  const tr = (text: string) => translate(language, text);
  const counts = (["镇民", "外来者", "爪牙", "恶魔"] as CoreTeam[]).map(
    (team) => roles.filter((role) => board.roleIds.includes(role.id) && role.team === team).length,
  );
  const travellerCount = roles.filter(
    (role) => board.roleIds.includes(role.id) && role.team === "旅行者",
  ).length;
  return (
    <article className={`script-card ${selected ? "selected" : ""}`}>
      <button className="script-select" onClick={select}>
        <span className="radio">{selected && <CheckIcon />}</span>
        <div>
          <b>{board.name}</b>
          <small>
            {board.sourceLabel || tr(board.official ? "官方默认板子" : "我的板子")}
            {board.author ? `（作者：${board.author}）` : ""} · {board.roleIds.length} {tr("个角色")}
          </small>
          <em>
            {counts[0]} {teamText(language, "镇民")} · {counts[1]} {teamText(language, "外来者")} · {counts[2]} {teamText(language, "爪牙")} · {counts[3]} {teamText(language, "恶魔")}
            {travellerCount ? ` · ${travellerCount} 旅行者` : ""}
          </em>
        </div>
      </button>
      <div className="board-card-actions">
        <button aria-label={tr("预览")} className="preview-cta" onClick={preview}>
          <EyeOpenIcon />
        </button>
        {duplicate && (
          <button aria-label={tr("复制板子")} onClick={duplicate}><CopyIcon /></button>
        )}
        {edit && (
          <button aria-label={tr("编辑板子")} onClick={edit}><Pencil1Icon /></button>
        )}
        {remove && (
          <button aria-label={tr("删除板子")} onClick={remove}><TrashIcon /></button>
        )}
      </div>
    </article>
  );
}

function StartScreen({
  language,
  setLanguage,
  boards,
  setBoards,
  selectedId,
  setSelectedId,
  composition,
  setComposition,
  start,
  manager,
  setManager,
  settingsOpen,
  setSettingsOpen,
  manualOpen,
  setManualOpen,
}: {
  language: Language;
  setLanguage: (v: Language) => void;
  boards: ScriptBoard[];
  setBoards: (v: ScriptBoard[]) => void;
  selectedId: string;
  setSelectedId: (v: string) => void;
  composition: Composition;
  setComposition: (v: Composition) => void;
  start: () => void;
  manager: boolean;
  setManager: (v: boolean) => void;
  settingsOpen: boolean;
  setSettingsOpen: (v: boolean) => void;
  manualOpen: boolean;
  setManualOpen: (v: boolean) => void;
}) {
  const t = (text: string) => translate(language, text);
  const [previewBoard, setPreviewBoard] = useState<ScriptBoard | null>(null);
  const [setupStep, setSetupStep] = useState<1 | 2>(1);
  const [boardQuery, setBoardQuery] = useState("");
  const selected = boards.find((b) => b.id === selectedId) || boards[0];
  const visibleBoards = boards.filter((board) =>
    `${board.name} ${board.sourceLabel || ""} ${board.author || ""}`
      .toLocaleLowerCase()
      .includes(boardQuery.trim().toLocaleLowerCase()),
  );
  const total = Object.values(composition).reduce((a, b) => a + b, 0);
  return (
    <MobileScroll className="app-screen">
      <main className="clock-app start-screen" data-setup-step={setupStep}>
        <header className="start-hero">
          <div className="start-heading-row">
            <div>
              <span>{t("血染钟楼笔记助手")}</span>
              <h1>{t("开始一局游戏")}</h1>
              <p>{t("先选择板子和本局阵营配比")}</p>
            </div>
            <div className="start-utilities">
              <button
                aria-label={t("设置")}
                onClick={() => setSettingsOpen(true)}
              >
                <GearIcon />
              </button>
            </div>
          </div>
        </header>
        <div className="start-layout">
        <section className="setup-card board-setup">
          <div className="section-title">
            <div>
              <small>{t("第一步")}</small>
              <h2>{t("选择板子")}</h2>
            </div>
            <button onClick={() => setManager(true)}>{t("管理板子")}</button>
          </div>
          <label className="board-search">
            <MagnifyingGlassIcon />
            <input
              value={boardQuery}
              onChange={(event) => setBoardQuery(event.target.value)}
              placeholder={t("搜索板子")}
              aria-label={t("搜索板子")}
            />
          </label>
          <div className="script-list" data-scroll-drag="ignore">
            {visibleBoards.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                language={language}
                selected={selectedId === board.id}
                select={() => setSelectedId(board.id)}
                preview={() => setPreviewBoard(board)}
              />
            ))}
          </div>
          <button className="setup-next ui-button ui-button--secondary" onClick={() => setSetupStep(2)}>
            {t("下一步")}
            <ArrowRightIcon />
          </button>
        </section>
        <div className="start-side">
        <section className="setup-card player-setup">
          <div className="section-title">
            <div>
              <small>{t("第二步")}</small>
              <h2>{t("设置本局阵营配比")}</h2>
            </div>
            <strong>
              {total}
              {t("人")}
            </strong>
          </div>
          <div className="composition-grid">
            {(["镇民", "外来者", "爪牙", "恶魔"] as CoreTeam[]).map((t) => (
              <div key={t}>
                <span>{teamText(language, t)}</span>
                <div>
                  <button
                    aria-label={`${translate(language, "减少")} ${teamText(language, t)}`}
                    onClick={() =>
                      setComposition({
                        ...composition,
                        [t]: Math.max(t === "恶魔" ? 1 : 0, composition[t] - 1),
                      })
                    }
                  >
                    −
                  </button>
                  <b>{composition[t]}</b>
                  <button
                    aria-label={`${translate(language, "增加")} ${teamText(language, t)}`}
                    onClick={() =>
                      setComposition({
                        ...composition,
                        [t]: composition[t] + 1,
                      })
                    }
                  >
                    ＋
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p>
            {composition.镇民} {teamText(language, "镇民")} ·{" "}
            {composition.外来者} {teamText(language, "外来者")} ·{" "}
            {composition.爪牙} {teamText(language, "爪牙")} · {composition.恶魔}{" "}
            {teamText(language, "恶魔")}，{t("共生成")} {total} {t("个座位")}。
          </p>
        </section>
        <div className="start-action-row">
          <button className="setup-back ui-button ui-button--secondary" onClick={() => setSetupStep(1)}>
            <ArrowLeftIcon />
            {t("上一步")}
          </button>
          <button
            className="start-game ui-button ui-button--primary"
            disabled={!selected || total < 5 || total > 20}
            onClick={start}
          >
            {t("开始游戏")} · {total}
            {t("人")}
          </button>
        </div>
        <small className="ccc-note">
          {t(
            "使用官方 Toolmaker 角色资源 · 非 The Pandemonium Institute 官方产品",
          )}
        </small>
        </div>
        </div>
        {manager && (
          <BoardManager
            language={language}
            boards={boards}
            setBoards={setBoards}
            selectedId={selectedId}
            select={setSelectedId}
            close={() => setManager(false)}
          />
        )}
        {previewBoard && (
          <BoardPreviewModal
            board={previewBoard}
            language={language}
            close={() => setPreviewBoard(null)}
          />
        )}
        <BottomSheet
          open={manualOpen}
          onOpenChange={setManualOpen}
          title={t("使用手册")}
          description={t("圆盘交互与记录规则")}
          snap={0.72}
        >
          <button
            aria-label={t("关闭")}
            className="desktop-modal-close"
            onClick={() => setManualOpen(false)}
          >
            <Cross2Icon />
          </button>
          <div className="manual-copy">
            <p>{t("轻点头像选择角色；长按头像添加状态标记；按住拖动建立提名、保或踩关系。")}</p>
            <p>{t("死亡玩家投票后会自动消耗幽灵票；已消耗幽灵票的玩家不能继续投票。")}</p>
          </div>
        </BottomSheet>
        <BottomSheet
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          title={t("设置")}
          description={t("界面语言")}
          snap={0.52}
        >
          <button
            aria-label={t("关闭")}
            className="desktop-modal-close"
            onClick={() => setSettingsOpen(false)}
          >
            <Cross2Icon />
          </button>
          <div className="display-settings">
            <section className="language-setting">
              <b>{t("界面语言")}</b>
              <div>
                <button
                  className={language === "zh" ? "active" : ""}
                  onClick={() => setLanguage("zh")}
                >
                  中文
                </button>
                <button
                  className={language === "en" ? "active" : ""}
                  onClick={() => setLanguage("en")}
                >
                  English
                </button>
              </div>
            </section>
            <button className="settings-manual-link" onClick={() => { setSettingsOpen(false); setManualOpen(true); }}>
              <img src={assetUrl("clocktower/feather.svg")} alt="" />
              <span>{t("使用手册")}</span>
            </button>
          </div>
        </BottomSheet>
      </main>
    </MobileScroll>
  );
}

function BoardManager({
  language,
  boards,
  setBoards,
  selectedId,
  select,
  close,
}: {
  language: Language;
  boards: ScriptBoard[];
  setBoards: (v: ScriptBoard[]) => void;
  selectedId: string;
  select: (id: string) => void;
  close: () => void;
}) {
  const tr = (text: string) => translate(language, text);
  const counts = (script: ScriptBoard) =>
    (["镇民", "外来者", "爪牙", "恶魔"] as CoreTeam[]).map(
      (team) =>
        roles.filter(
          (role) => script.roleIds.includes(role.id) && role.team === team,
        ).length,
    );
  const [editing, setEditing] = useState<string | null>(null),
    [previewing, setPreviewing] = useState<ScriptBoard | null>(null),
    [query, setQuery] = useState(""),
    [tab, setTab] = useState<Team>("镇民");
  const board = boards.find((b) => b.id === editing);
  const saveBoard = (next: ScriptBoard) =>
    setBoards(boards.map((b) => (b.id === next.id ? next : b)));
  const duplicate = (b: ScriptBoard) => {
    const copy = {
      ...b,
      id: `custom-${Date.now()}`,
      name: `${b.name} · ${tr("副本")}`,
      official: false,
      roleIds: [...b.roleIds],
      sourceLabel: "我的板子",
    };
    setBoards([...boards, copy]);
    setEditing(copy.id);
  };
  const create = () => {
    const fresh = {
      id: `custom-${Date.now()}`,
      name: tr("我的新板子"),
      roleIds: [],
      official: false,
    };
    setBoards([...boards, fresh]);
    setEditing(fresh.id);
  };
  if (board) {
    const boardCounts = counts(board);
    const filtered = roles.filter(
      (r) =>
        r.team === tab &&
        (r.zh.includes(query) ||
          r.en.toLowerCase().includes(query.toLowerCase())),
    );
    return (
      <div className="manager-overlay">
        <section className="manager-sheet editor">
          <header>
            <button onClick={() => setEditing(null)}>{tr("返回")}</button>
            <h2>{tr("编辑板子")}</h2>
            <button onClick={close}>
              <Cross2Icon />
            </button>
          </header>
          <label>{tr("板子名称")}</label>
          <KeyboardInput
            value={board.name}
            onChange={(e) => saveBoard({ ...board, name: e.target.value })}
          />
          <div className="chosen-head">
            <b>{tr("已选择角色")}</b>
            <span>
              {board.roleIds.length} {tr("个角色")}
            </span>
          </div>
          <p className="chosen-composition">
            {boardCounts[0]} {teamText(language, "镇民")} · {boardCounts[1]}{" "}
            {teamText(language, "外来者")} · {boardCounts[2]}{" "}
            {teamText(language, "爪牙")} · {boardCounts[3]}{" "}
            {teamText(language, "恶魔")}
          </p>
          <div className="chosen-roles">
            {board.roleIds.map((id) => {
              const r = roles.find((x) => x.id === id);
              return r ? (
                <button
                  key={id}
                  onClick={() =>
                    saveBoard({
                      ...board,
                      roleIds: board.roleIds.filter((x) => x !== id),
                    })
                  }
                >
                  <img src={r.image} />
                  <span>{r.zh}</span>
                  <small>{teamText(language, r.team)}</small>
                  <Cross2Icon />
                </button>
              ) : null;
            })}
          </div>
          <div className="role-search">
            <MagnifyingGlassIcon />
            <KeyboardInput
              value={query}
              placeholder={tr("搜索中文或英文角色名")}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="sheet-tabs">
            {(["镇民", "外来者", "爪牙", "恶魔"] as CoreTeam[]).map((t, i) => (
              <button
                className={tab === t ? "active" : ""}
                onClick={() => setTab(t)}
                key={t}
              >
                {teamText(language, t)}（{boardCounts[i]}）
              </button>
            ))}
          </div>
          <div className="add-role-grid">
            {filtered.map((r) => (
              <button
                className={board.roleIds.includes(r.id) ? "added" : ""}
                key={`${r.edition}-${r.id}`}
                onClick={() =>
                  saveBoard({
                    ...board,
                    roleIds: board.roleIds.includes(r.id)
                      ? board.roleIds.filter((x) => x !== r.id)
                      : [...board.roleIds, r.id],
                  })
                }
              >
                <img src={r.image} />
                <span>
                  {r.zh}
                  <small>
                    {r.en} · {teamText(language, r.team)}
                  </small>
                </span>
                {board.roleIds.includes(r.id) && <CheckIcon />}
              </button>
            ))}
          </div>
          <button className="done-edit" onClick={() => setEditing(null)}>
            {tr("完成编辑")}
          </button>
        </section>
      </div>
    );
  }
  const selected = boards.find((b) => b.id === selectedId) || boards[0];
  const selectedCounts = counts(selected);
  return (
    <div className="manager-overlay">
      <section className="manager-sheet">
        <header>
          <span></span>
          <h2>{tr("管理板子")}</h2>
          <button onClick={close}>
            <Cross2Icon />
          </button>
        </header>
        <div className="current-board">
          <small>{tr("当前选择")}</small>
          <b>{selected.name}</b>
          <span>
            {selected.sourceLabel || tr(selected.official ? "官方默认板子" : "我的板子")}
            {selected.author ? `（作者：${selected.author}）` : ""} ·{" "}
            {selected.roleIds.length} {tr("个角色")}
          </span>
          <em>
            {selectedCounts[0]} {teamText(language, "镇民")} ·{" "}
            {selectedCounts[1]} {teamText(language, "外来者")} ·{" "}
            {selectedCounts[2]} {teamText(language, "爪牙")} ·{" "}
            {selectedCounts[3]} {teamText(language, "恶魔")}
          </em>
        </div>
        <div className="manage-list" data-scroll-drag="ignore">
          {boards.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              language={language}
              selected={board.id === selectedId}
              select={() => select(board.id)}
              preview={() => setPreviewing(board)}
              duplicate={() => duplicate(board)}
              edit={!board.official ? () => setEditing(board.id) : undefined}
              remove={!board.official ? () => setBoards(boards.filter((item) => item.id !== board.id)) : undefined}
            />
          ))}
        </div>
        <footer className="manager-footer">
          <button className="new-board" onClick={create}>
            <PlusIcon />
            {tr("新建板子")}
          </button>
        </footer>
      </section>
      {previewing && (
        <BoardPreviewModal
          board={previewing}
          language={language}
          close={() => setPreviewing(null)}
        />
      )}
    </div>
  );
}
