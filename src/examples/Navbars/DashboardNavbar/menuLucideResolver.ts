import {
  BarChart3,
  Bell,
  Briefcase,
  Calendar,
  CheckSquare,
  Circle,
  CircleCheck,
  Clipboard,
  Clock,
  Compass,
  Database,
  File,
  FileEdit,
  Flag,
  FolderOpen,
  GitBranch,
  Headphones,
  Home,
  IdCard,
  Inbox,
  LayoutGrid,
  LineChart,
  ListChecks,
  ListTodo,
  MessageSquare,
  Network,
  Send,
  Settings,
  Shield,
  SlidersHorizontal,
  Star,
  Target,
  Ticket,
  Trophy,
  User,
  Users,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

/** API / legacy Prime ikon anahtarları → Lucide */
export const PRIME_ICON_TO_LUCIDE: Readonly<Record<string, LucideIcon>> = {
  home: Home,
  user: User,
  shield: Shield,
  users: Users,
  ticket: Ticket,
  "file-edit": FileEdit,
  "chart-bar": BarChart3,
  calendar: Calendar,
  database: Database,
  briefcase: Briefcase,
  comments: MessageSquare,
  cog: Settings,
  "check-circle": CircleCheck,
  "th-large": LayoutGrid,
  sitemap: Network,
  "id-card": IdCard,
  inbox: Inbox,
  headphones: Headphones,
  comment: MessageSquare,
  bell: Bell,
  wrench: Wrench,
  clock: Clock,
  "list-check": ListChecks,
  "chart-line": LineChart,
  send: Send,
  file: File,
  "check-square": CheckSquare,
  "sliders-h": SlidersHorizontal,
  clipboard: Clipboard,
  "folder-open": FolderOpen,
  trophy: Trophy,
  star: Star,
  target: Target,
  bolt: Zap,
  "diagram-3": GitBranch,
  tasks: ListTodo,
  compass: Compass,
  flag: Flag,
  "circle-fill": Circle,
};

const MENU_ICON_RULES: ReadonlyArray<{ keywords: string[]; icon: string }> = [
  { keywords: ["dashboard", "anasayfa", "home"], icon: "home" },
  { keywords: ["profil", "profile", "kullanici", "user"], icon: "user" },
  { keywords: ["rol", "role", "yetki", "permission"], icon: "shield" },
  { keywords: ["departman", "department", "team", "ekip"], icon: "users" },
  { keywords: ["talep", "ticket", "request", "support"], icon: "ticket" },
  { keywords: ["form", "anket", "survey", "parametre"], icon: "file-edit" },
  { keywords: ["rapor", "report", "analiz", "istatistik"], icon: "chart-bar" },
  { keywords: ["takvim", "calendar", "plan"], icon: "calendar" },
  { keywords: ["envanter", "inventory", "stok"], icon: "database" },
  { keywords: ["proje", "project", "gorev", "task"], icon: "briefcase" },
  { keywords: ["mesaj", "chat", "sohbet", "message"], icon: "comments" },
  { keywords: ["ayar", "settings", "config"], icon: "cog" },
  { keywords: ["onay", "approve", "approval"], icon: "check-circle" },
  { keywords: ["modul", "module", "uygulama", "app"], icon: "th-large" },
];

const PARENT_ICON_POOLS: ReadonlyArray<{ parentKeywords: string[]; icons: string[] }> = [
  {
    parentKeywords: ["yonetim", "yönetim"],
    icons: ["users", "shield", "sitemap", "id-card", "briefcase", "cog"],
  },
  {
    parentKeywords: ["yardim masasi", "yardım masası", "help desk", "destek"],
    icons: ["ticket", "headphones", "comment", "bell", "inbox", "wrench"],
  },
  {
    parentKeywords: ["ekip planlama", "team planning", "planlama"],
    icons: ["calendar", "clock", "users", "list-check", "chart-line", "send"],
  },
  {
    parentKeywords: ["form yonetimi", "form yönetimi"],
    icons: ["file-edit", "file", "check-square", "sliders-h", "clipboard", "folder-open"],
  },
  {
    parentKeywords: ["performans yonetimi", "performans yönetimi"],
    icons: ["chart-bar", "trophy", "star", "chart-line", "target", "bolt"],
  },
  {
    parentKeywords: ["proje yonetimi", "proje yönetimi", "project management"],
    icons: ["briefcase", "diagram-3", "tasks", "sitemap", "compass", "flag"],
  },
];

const normalizePrimeIconToken = (raw: string): string => {
  let s = raw.trim().toLowerCase();
  if (s.startsWith("pi pi-")) s = s.slice(6);
  else if (s.startsWith("pi-")) s = s.slice(3);
  return s.replace(/\s+/g, "-");
};

export type MenuLike = {
  id?: string | number;
  name?: string;
  href?: string;
  icon?: string | null;
  subMenus?: MenuLike[];
};

export const resolveMenuLucideIcon = (
  menuItem: MenuLike,
  parentMenuName?: string,
  siblingIndex: number = 0,
): LucideIcon => {
  const explicitIcon = menuItem?.icon;
  if (explicitIcon && explicitIcon !== "null" && explicitIcon !== "undefined") {
    const key = normalizePrimeIconToken(String(explicitIcon));
    return PRIME_ICON_TO_LUCIDE[key] ?? Circle;
  }

  const normalizedName = String(menuItem?.name || "").toLocaleLowerCase("tr-TR");
  const normalizedHref = String(menuItem?.href || "").toLocaleLowerCase("tr-TR");
  const normalizedComposite = `${normalizedName} ${normalizedHref}`;
  const normalizedParentName = String(parentMenuName || "").toLocaleLowerCase("tr-TR");

  if (
    normalizedParentName.includes("yardim masasi") ||
    normalizedParentName.includes("yardım masası") ||
    normalizedParentName.includes("help desk")
  ) {
    if (normalizedComposite.includes("taleplerim")) {
      return Inbox;
    }
    if (
      normalizedComposite.includes("talep yonetimi") ||
      normalizedComposite.includes("talep yönetimi")
    ) {
      return Network;
    }
  }

  const matchedRule = MENU_ICON_RULES.find((rule) =>
    rule.keywords.some((keyword) => normalizedComposite.includes(keyword)),
  );

  if (matchedRule) {
    return PRIME_ICON_TO_LUCIDE[matchedRule.icon] ?? Circle;
  }

  const matchedParentPool = PARENT_ICON_POOLS.find((pool) =>
    pool.parentKeywords.some((keyword) => normalizedParentName.includes(keyword)),
  );

  if (matchedParentPool) {
    const pooledIcon =
      matchedParentPool.icons[siblingIndex % matchedParentPool.icons.length];
    return PRIME_ICON_TO_LUCIDE[pooledIcon] ?? Circle;
  }

  return Circle;
};
