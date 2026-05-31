

import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import profile from "../../../assets/images/profile-icon.png";
import saplogo from "../../../assets/images/small-logos/sap-logo-svg.svg";


import {
  MenuApi,
  TicketPermDto,
  TicketApi,
  UserApi,
  ApproveItemsApi,
} from "api/generated/api";
import getConfiguration, { getConfigurationAccessTokenLogin } from "confiuration";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useQuery } from "react-query";
import { menuAPIController } from "locales/controller";

import { cn } from "lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "components/ui/avatar";
import { Badge } from "components/ui/badge";
import { Button, buttonVariants } from "components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "components/ui/dropdown-menu";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "components/ui/popover";
import { Separator } from "components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "components/ui/sheet";
import {
  Bell,
  BellOff,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  KeyRound,
  LogOut,
  Menu as MenuIcon,
  Ticket,
  User,
  Wrench,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import type { MenuLike } from "./menuLucideResolver";
import { resolveMenuLucideIcon } from "./menuLucideResolver";

interface Props {
  absolute?: boolean;
  light?: boolean;
  isMini?: boolean;
}

type NavAlertState =
  | { open: false }
  | { open: true; title: string; description: string };

const useMediaQueryLg = () => {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return matches;
};

const topNavBtnClass = ({
  active,
  hasSubs,
}: {
  active: boolean;
  hasSubs: boolean;
}) =>
  cn(
    "relative inline-flex box-border h-8 min-w-max shrink-0 items-center gap-1 rounded-full px-3 py-0 text-sm font-medium tracking-tight whitespace-nowrap outline-none transition-all duration-200 ease-out select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
    active
      ? "bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary"
      : cn(
          "text-muted-foreground hover:bg-slate-100/80 hover:text-slate-800 dark:hover:bg-slate-800/60 dark:hover:text-slate-100",
          "bg-transparent ring-0",
          hasSubs &&
            "data-[state=open]:bg-slate-100/80 data-[state=open]:text-slate-800 dark:data-[state=open]:bg-slate-800/60 dark:data-[state=open]:text-slate-100",
        ),
  );

const submenuItemClass = (selected: boolean) =>
  cn(
    "relative gap-3 rounded-xl px-3 py-2.5 text-sm font-medium tracking-tight transition-all duration-200 ease-out",
    selected &&
      "bg-primary/8 text-primary border-l-2 border-primary pl-[10px] focus:bg-primary/10 [&_svg]:text-primary dark:bg-primary/12",
    !selected &&
      "cursor-pointer border-l-2 border-transparent pl-[10px] text-slate-700 hover:bg-slate-50 hover:text-slate-900 focus:text-foreground dark:text-slate-200 dark:hover:bg-slate-800/50",
  );

/** Profil bildirimi + üst menü alt panelleri için ortak yüzey */
const menuSurfaceClass = cn(
  "backdrop-blur-xl",
  "border border-border/40 bg-background/98 dark:bg-slate-900/95",
  "shadow-xl shadow-black/8 dark:shadow-black/30",
  "ring-1 ring-black/5 dark:ring-white/8",
  "outline-none",
);

const profileDropdownItemClass = cn(
  "cursor-pointer gap-3 rounded-xl px-3 py-2.5 text-sm font-medium tracking-tight text-foreground",
  "transition-all duration-200 ease-out",
  "focus:bg-slate-50 focus:text-slate-900 dark:focus:bg-slate-800/60 dark:focus:text-slate-100",
  "[&_svg]:transition-colors [&_svg]:duration-200 [&_svg]:ease-out",
  "hover:bg-slate-50/80 dark:hover:bg-slate-800/40",
  "hover:[&_svg]:text-foreground",
);

const profileDropdownIconClass = "size-4 shrink-0 text-muted-foreground/70";

const DashboardNavbar = ({
  absolute: _absolute = false,
  light: _light = false,
  isMini: _isMini = false,
}: Props): JSX.Element => {
  const [, setNavbarType] = useState<
    "fixed" | "absolute" | "relative" | "static" | "sticky"
  >();
  const [isDeleteModalOpen, setisDeleteModalOpen] = useState(false);
  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();
  const [userData, setUserData] = useState<TicketPermDto>();

  const [waitingCount, setwaitingCount] = useState(0);
  const [showNoNotification, setShowNoNotification] = useState(false);
  const [isTopMenuDrawerOpen, setIsTopMenuDrawerOpen] = useState(false);
  const [topMenuItems, setTopMenuItems] = useState<MenuLike[]>([]);
  const isDesktopMenu = useMediaQueryLg();

  const [newPw, setnewPw] = useState<string>("");
  const [newPwConfirm, setnewPwConfirm] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [pswTrue, setPswTrue] = useState(true);
  const [loginMail, setloginMail] = useState<string>("");
  const dispatchBusy = useBusy();
  const [navAlert, setNavAlert] = useState<NavAlertState>({ open: false });

  const { data: userDataQuery } = useQuery(
    "dashboardUserData",
    async () => {
      dispatchBusy({ isBusy: true });
      try {
        const conf = getConfiguration();
        const ticketApi = new TicketApi(conf);
        const userApi = new UserApi(conf);

        const [ticketData, userDetail] = await Promise.all([
          ticketApi.apiTicketCheckPermGet(),
          userApi.apiUserGetLoginUserDetailGet(),
        ]);

        return {
          ticketPermission: ticketData.data,
          userDetail: userDetail.data,
        };
      } finally {
        dispatchBusy({ isBusy: false });
      }
    },
    {
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 60,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      enabled: !!localStorage.getItem("accessToken"),
    },
  );

  useQuery(
    "dashboardMenuData",
    async () => {
      dispatchBusy({ isBusy: true });
      try {
        const conf = getConfiguration();
        const api = new MenuApi(conf);
        const data = await api.apiMenuAllListDataGet();
        return data.data;
      } finally {
        dispatchBusy({ isBusy: false });
      }
    },
    {
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 60,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      enabled: !!localStorage.getItem("accessToken"),
    },
  );

  const { data: topMenuItemsQuery } = useQuery(
    "menuItems",
    async () => {
      const conf = getConfigurationAccessTokenLogin();
      const api = new MenuApi(conf);
      const data = await api.apiMenuGet();
      return data.data;
    },
    {
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 60,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      enabled: !!localStorage.getItem("accessToken"),
    },
  );

  async function getApproveDetail(_userId: unknown) {
    const conf = getConfiguration();
    const api = new ApproveItemsApi(conf);
    const result = await api.apiApproveItemsGetPendingCountGetPendingCountGet();
    setwaitingCount(result.data);
  }

  useEffect(() => {
    if (userDataQuery) {
      setUserData(userDataQuery.ticketPermission);
      setloginMail(userDataQuery.userDetail.email);
      getApproveDetail(userDataQuery.ticketPermission.id);
    }
  }, [userDataQuery]);

  useEffect(() => {
    if (topMenuItemsQuery) {
      setTopMenuItems(topMenuItemsQuery as MenuLike[]);
    }
  }, [topMenuItemsQuery]);



  const handleTopMenuDrawerToggle = () => setIsTopMenuDrawerOpen((prev) => !prev);

  const handleDeleteCloseModal = () => {
    setnewPw("");
    setnewPwConfirm("");
    setPasswordError("");
    setisDeleteModalOpen(false);
  };

  const handleChangePassword = () => {
    setisDeleteModalOpen(true);
  };

  const validatePassword = (password: string): string => {
    if (password.length < 6) {
      return "Parola en az 6 karakter uzunluğunda olmalıdır";
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return "Parola en az bir özel karakter içermelidir";
    }
    if (!/\d/.test(password)) {
      return "Parola en az bir rakam içermelidir";
    }
    if (!/[A-Z]/.test(password)) {
      return "Parola en az bir büyük harf (A-Z) içermelidir";
    }
    return "";
  };

  const handlePasswordChange = (pw: string) => {
    setnewPw(pw);
    const validationError = validatePassword(pw);
    if (validationError) {
      setPasswordError(validationError);
    } else {
      setPasswordError("");
    }
  };

  const handleConfirmPasswordChange = (pw: string) => {
    setnewPwConfirm(pw);
    const validationError = validatePassword(pw);
    if (validationError) {
      setPasswordError(validationError);
      setPswTrue(true);
    } else if (newPw && pw !== newPw) {
      setPasswordError("Şifreler eşleşmiyor..!");
      setPswTrue(true);
    } else {
      setPasswordError("");
      setPswTrue(false);
    }
  };

  const changePassword = async () => {
    try {
      dispatchBusy({ isBusy: true });
      if (validatePassword(newPw) || validatePassword(newPwConfirm) || newPw !== newPwConfirm) {
        setNavAlert({
          open: true,
          title: "Hata",
          description: "Şifre geçerli değil. Lütfen kontrol edin.",
        });
        return;
      }

      const conf = getConfiguration();
      const api = new UserApi(conf);
      await api.apiUserResetPassWordGet(loginMail, newPw);

      setNavAlert({
        open: true,
        title: "Başarılı",
        description: "Şifre başarıyla güncellendi",
      });
      handleDeleteCloseModal();
    } catch (error) {
      setNavAlert({
        open: true,
        title: "Hata",
        description: `Hata: ${error}`,
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const passwordRequirements = [
    "Parola en az 6 karakter uzunluğunda olmalıdır",
    "Parola en az bir özel karakter içermelidir",
    "Parola en az bir rakam içermelidir",
    "Parola en az bir büyük harf (A-Z) içermelidir",
  ];

  const isActiveRoute = (routeValue: string) => {
    if (!routeValue || routeValue === "#") return false;
    return pathname === routeValue;
  };

  const isParentMenuActive = (menuItem: MenuLike) => {
    if (!menuItem) return false;
    if (menuItem.href) {
      return isActiveRoute(menuItem.href);
    }
    if (Array.isArray(menuItem.subMenus)) {
      return menuItem.subMenus.some((subItem) => isActiveRoute(subItem?.href || "#"));
    }
    return false;
  };

  const renderLucideGlyph = (
    Icon: LucideIcon,
    className?: string,
  ) => <Icon className={cn("size-4 shrink-0", className)} aria-hidden />;

  const renderTopMenuButton = (menuItem: MenuLike, parentIndex: number) => {
    const hasSubMenus = Array.isArray(menuItem?.subMenus) && menuItem.subMenus.length > 0;
    const isActive = isParentMenuActive(menuItem);
    const TopNavIcon = resolveMenuLucideIcon(menuItem, undefined, parentIndex);
    const btnClass = topNavBtnClass({ active: isActive, hasSubs: !!hasSubMenus });

    if (hasSubMenus) {
      return (
        <DropdownMenu key={menuItem.id}>
          <DropdownMenuTrigger asChild>
            <button type="button" className={btnClass}>
              {renderLucideGlyph(TopNavIcon, "size-3.5 text-slate-500 dark:text-slate-400")}
              <span className="whitespace-nowrap">{menuAPIController(String(menuItem.name))}</span>
              <ChevronDown className="size-3.5 shrink-0 opacity-50" aria-hidden />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className={cn(menuSurfaceClass, "z-1200 min-w-[260px] rounded-2xl p-2")}
          >
            {(menuItem.subMenus ?? []).map((subItem: MenuLike, subIndex: number) => {
              const isSelected = isActiveRoute(subItem.href || "#");
              const SubNavIcon = resolveMenuLucideIcon(subItem, menuItem?.name, subIndex);
              return (
                <DropdownMenuItem
                  key={subItem.id}
                  className={submenuItemClass(isSelected)}
                  onClick={() => navigate(subItem.href || "#")}
                >
                  {renderLucideGlyph(
                    SubNavIcon,
                    isSelected
                      ? "text-slate-700 dark:text-slate-200"
                      : "text-slate-500 dark:text-slate-400",
                  )}
                  <span>{menuAPIController(String(subItem.name))}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <button
        key={menuItem.id}
        type="button"
        className={btnClass}
        onClick={() => navigate(menuItem.href || "#")}
      >
        {renderLucideGlyph(TopNavIcon, "size-3.5 text-slate-500 dark:text-slate-400")}
        <span className="whitespace-nowrap">{menuAPIController(String(menuItem.name))}</span>
      </button>
    );
  };

  return (
    <div className="sticky top-0 z-1050 w-full mb-1">
      <header
        className={cn(
          "relative flex h-14 rounded-xl w-full min-w-0 items-center gap-2 px-3 backdrop-blur-xl lg:gap-3 lg:px-4",
          "bg-white/85 supports-backdrop-filter:bg-white/80 dark:bg-slate-950/90 dark:supports-backdrop-filter:bg-slate-950/85",
          "border-b border-slate-200/60 dark:border-slate-800/60",
          "shadow-[0_1px_0_0_rgba(0,0,0,0.04),0_4px_20px_0_rgba(0,0,0,0.06)] dark:shadow-[0_1px_0_0_rgba(0,0,0,0.2),0_4px_20px_0_rgba(0,0,0,0.25)]",
        )}
      >
        <div className="flex min-w-0 shrink-0 items-center gap-2.5 md:gap-3">
          <img
            src={saplogo}
            alt="SAP Logo"
            className="h-7 w-auto shrink-0 object-contain"
            loading="eager"
            
          />
          <Separator orientation="vertical" className="hidden h-4 bg-border/60 sm:block" />
         
        </div>

        {isDesktopMenu ? (
          <nav
            className="relative hidden h-full min-h-0 min-w-0 flex-1 flex-row items-center overflow-hidden lg:mr-40 lg:flex xl:mr-44"
            aria-label="Ana menü"
          >
            <div
              className="scrollbar-hide flex h-full w-max min-h-0 min-w-max flex-nowrap shrink-0 items-center gap-0.5 overflow-x-auto overflow-y-hidden overscroll-x-contain py-0.5"
            >
              {topMenuItems.map((menuItem, parentIndex) =>
                renderTopMenuButton(menuItem, parentIndex),
              )}
            </div>
          </nav>
        ) : (
          <div
            className="relative min-h-0 min-w-0 flex-1 pr-44 sm:pr-48"
            aria-hidden
          />
        )}

        <div
          className="absolute top-1/2 right-2 z-1200 flex max-w-[calc(100vw-1rem)] -translate-y-1/2 items-center gap-0.5 sm:right-3 sm:gap-1"
        >
          {!isDesktopMenu ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 rounded-xl border-border/60 bg-white/70 px-2.5 text-sm font-medium tracking-tight text-slate-700 shadow-sm backdrop-blur-sm transition-all duration-200 ease-out hover:bg-slate-50 hover:shadow-md dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-800"
              onClick={handleTopMenuDrawerToggle}
            >
              <MenuIcon className="size-4" aria-hidden />
              <span className="hidden sm:inline">Menüler</span>
            </Button>
          ) : null}

          {waitingCount > 0 ? (
            <button
              type="button"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon-sm" }),
                "relative rounded-xl text-slate-600 transition-all duration-200 ease-out hover:bg-slate-100/80 hover:text-foreground [&_svg]:pointer-events-auto dark:text-slate-300 dark:hover:bg-slate-800/60",
              )}
              aria-label="Bildirimler"
              onClick={() => navigate("/approve")}
            >
              <Bell className="size-4 shrink-0" aria-hidden />
              <Badge
                className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-4 min-w-4 animate-pulse items-center justify-center border-0 bg-rose-500 px-1 text-[10px] font-medium text-white hover:bg-rose-500"
              >
                {waitingCount > 99 ? "99+" : waitingCount}
              </Badge>
            </button>
          ) : (
            <Popover open={showNoNotification} onOpenChange={setShowNoNotification}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon-sm" }),
                    "relative rounded-xl text-slate-600 transition-all duration-200 ease-out hover:bg-slate-100/80 hover:text-foreground [&_svg]:pointer-events-auto dark:text-slate-300 dark:hover:bg-slate-800/60",
                  )}
                  aria-label="Bildirimler"
                >
                  <Bell className="size-4 shrink-0 opacity-40" aria-hidden />
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                sideOffset={8}
                className={cn(
                  menuSurfaceClass,
                  "z-1200 flex min-w-[280px] flex-col items-center justify-center gap-3 rounded-2xl p-5 text-center",
                )}
              >
                <BellOff
                  className="size-10 shrink-0 text-muted-foreground/55"
                  aria-hidden
                  strokeWidth={1.15}
                />
                <p className="max-w-[240px] text-xs leading-relaxed text-muted-foreground">
                  Bildiriminiz Bulunmamaktadır
                </p>
              </PopoverContent>
            </Popover>
          )}

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon-sm" }),
                  "ml-1.5 rounded-full p-0 [&_svg]:pointer-events-auto focus-visible:ring-2 focus-visible:ring-ring/50",
                )}
                aria-haspopup="menu"
                aria-label="Profil menüsü"
              >
                <Avatar className="size-8 border-2 border-white shadow-md ring-2 ring-transparent transition-all duration-200 ease-out hover:ring-primary/40 dark:border-slate-800">
                  {userDataQuery?.userDetail?.photo ? (
                    <AvatarImage
                      src={`data:image/jpeg;base64,${userDataQuery.userDetail.photo}`}
                      alt=""
                    />
                  ) : (
                    <AvatarImage src={profile} alt="" />
                  )}
                  <AvatarFallback className="bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-100">
                    U
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className={cn(menuSurfaceClass, "z-1200 w-64 rounded-2xl p-2")}>
              {/* User header — non-interactive */}
              <div className="flex items-center gap-3 rounded-xl bg-slate-50/80 px-3 py-2.5 dark:bg-slate-800/40">
                <Avatar className="size-9 shrink-0 border border-border/50">
                  {userDataQuery?.userDetail?.photo ? (
                    <AvatarImage
                      src={`data:image/jpeg;base64,${userDataQuery.userDetail.photo}`}
                      alt=""
                    />
                  ) : (
                    <AvatarImage src={profile} alt="" />
                  )}
                  <AvatarFallback className="bg-slate-200 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-100">
                    U
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 flex flex-col gap-2">
                  <span className="truncate text-sm font-semibold leading-none tracking-tight text-foreground">
                    {userData?.name ?? "Kullanıcı"}
                  </span>
                  <span className="truncate text-xs leading-none text-muted-foreground/80">{loginMail}</span>
                </div>
              </div>
              <DropdownMenuSeparator className="mx-2 my-2 h-px shrink-0 bg-border/50" />
              <DropdownMenuItem
                className={profileDropdownItemClass}
                onClick={() => navigate("/profile/profile-overview")}
              >
                <User className={profileDropdownIconClass} aria-hidden />
                Profilim
              </DropdownMenuItem>
              <DropdownMenuItem
                className={profileDropdownItemClass}
                onClick={() => navigate("/tickets")}
              >
                <Ticket className={profileDropdownIconClass} aria-hidden />
                Talep Yönetimi
              </DropdownMenuItem>
              <DropdownMenuItem
                className={profileDropdownItemClass}
                onClick={() => navigate("/solveAllTicket")}
              >
                <Wrench className={profileDropdownIconClass} aria-hidden />
                Talep Çözümleme
              </DropdownMenuItem>
              <DropdownMenuItem
                className={profileDropdownItemClass}
                onClick={() => navigate("/profile/all-projects")}
              >
                <Briefcase className={profileDropdownIconClass} aria-hidden />
                Projelerim
              </DropdownMenuItem>
              <DropdownMenuSeparator className="mx-2 my-2 h-px shrink-0 bg-border/50" />
              <DropdownMenuItem className={profileDropdownItemClass} onClick={handleChangePassword}>
                <KeyRound className={profileDropdownIconClass} aria-hidden />
                Şifre Değiştir
              </DropdownMenuItem>
              <DropdownMenuItem
                className={cn(
                  profileDropdownItemClass,
                  "mt-0.5 text-rose-500 hover:bg-rose-50 focus:bg-rose-50 focus:text-rose-600 dark:text-rose-400 dark:hover:bg-rose-950/30 dark:focus:bg-rose-950/35 dark:focus:text-rose-300",
                  "hover:[&_svg]:text-rose-600 dark:hover:[&_svg]:text-rose-400",
                )}
                onClick={() => navigate("/logout")}
              >
                <LogOut className="size-4 shrink-0 text-rose-500/80 dark:text-rose-400/80" aria-hidden />
                Çıkış Yap
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <Sheet open={isTopMenuDrawerOpen} onOpenChange={setIsTopMenuDrawerOpen}>
        <SheetContent side="left" className="w-[300px] gap-0 p-0 sm:max-w-[300px]">
          <SheetHeader className="flex flex-row items-center gap-2.5 border-b border-border/60 bg-slate-50/60 px-4 py-3.5 text-left dark:bg-slate-900/40">
            <img
              src={saplogo}
              alt="SAP Logo"
              className="h-6 w-auto shrink-0 object-contain"
              loading="lazy"
            />
            <SheetTitle className="text-sm font-semibold tracking-tight text-foreground">
              {userData?.name ?? "Uygulama"}
            </SheetTitle>
          </SheetHeader>
          <div className="max-h-[calc(100vh-4rem)] overflow-y-auto p-3">
            {topMenuItems.map((menuItem, parentIndex) => {
              const hasSubMenus = Array.isArray(menuItem?.subMenus) && menuItem.subMenus.length > 0;

              if (hasSubMenus) {
                return (
                  <div key={menuItem.id} className="mb-5">
                    <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
                      {menuAPIController(String(menuItem.name))}
                    </p>
                    <Separator className="mb-2 bg-border/50" />
                    <div className="flex flex-col gap-0.5">
                      {(menuItem.subMenus ?? []).map((subItem: MenuLike, subIndex: number) => {
                        const DrawerSubIcon = resolveMenuLucideIcon(
                          subItem,
                          menuItem?.name,
                          subIndex,
                        );
                        return (
                          <Button
                            key={subItem.id}
                            type="button"
                            variant={isActiveRoute(subItem.href || "#") ? "secondary" : "ghost"}
                            className={cn(
                              "h-auto w-full justify-start gap-2.5 rounded-xl py-2.5 px-3 text-sm font-medium tracking-tight text-slate-700 transition-all duration-200 ease-out dark:text-slate-200",
                              isActiveRoute(subItem.href || "#") &&
                                "border-l-2 border-primary bg-primary/8 text-primary pl-2.5",
                            )}
                            onClick={() => {
                              navigate(subItem.href || "#");
                              setIsTopMenuDrawerOpen(false);
                            }}
                          >
                            {renderLucideGlyph(
                              DrawerSubIcon,
                              isActiveRoute(subItem.href || "#")
                                ? "text-primary size-3.5"
                                : "text-slate-400 dark:text-slate-500 size-3.5",
                            )}
                            <span>{menuAPIController(String(subItem.name))}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              const DrawerNavIcon = resolveMenuLucideIcon(menuItem, undefined, parentIndex);
              return (
                <Button
                  key={menuItem.id}
                  type="button"
                  variant={isActiveRoute(menuItem.href || "#") ? "secondary" : "ghost"}
                  className={cn(
                    "mb-0.5 h-auto w-full justify-start gap-2.5 rounded-xl py-2.5 px-3 text-sm font-medium tracking-tight text-slate-700 transition-all duration-200 ease-out dark:text-slate-200",
                    isActiveRoute(menuItem.href || "#") &&
                      "border-l-2 border-primary bg-primary/8 text-primary pl-2.5",
                  )}
                  onClick={() => {
                    navigate(menuItem.href || "#");
                    setIsTopMenuDrawerOpen(false);
                  }}
                >
                  {renderLucideGlyph(
                    DrawerNavIcon,
                    isActiveRoute(menuItem.href || "#")
                      ? "text-primary size-3.5"
                      : "text-slate-400 dark:text-slate-500 size-3.5",
                  )}
                  <span>{menuAPIController(String(menuItem.name))}</span>
                </Button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={isDeleteModalOpen} onOpenChange={(open) => !open && handleDeleteCloseModal()}>
        <DialogContent className="gap-0 overflow-hidden rounded-2xl border-border/60 p-0 sm:max-w-md">
          <DialogHeader className="space-y-0 border-b border-border/60 bg-linear-to-b from-muted/60 to-background px-6 py-5 text-left">
            <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
              Şifre değiştir
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-6 pb-2 pt-5">
            <div className="space-y-2">
              <Label htmlFor="nav-new-pw" className="text-sm font-medium tracking-tight">
                Yeni şifre
              </Label>
              <Input
                id="nav-new-pw"
                type="password"
                autoComplete="new-password"
                value={newPw}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className={cn(
                  "rounded-xl transition-all duration-200 ease-out focus-visible:ring-2 focus-visible:ring-primary/50",
                  passwordError && "border-destructive focus-visible:ring-destructive/40",
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nav-new-pw2" className="text-sm font-medium tracking-tight">
                Yeni şifre tekrar
              </Label>
              <Input
                id="nav-new-pw2"
                type="password"
                autoComplete="new-password"
                value={newPwConfirm}
                onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                className={cn(
                  "rounded-xl transition-all duration-200 ease-out focus-visible:ring-2 focus-visible:ring-primary/50",
                  passwordError && "border-destructive focus-visible:ring-destructive/40",
                )}
              />
            </div>
            {passwordError ? (
              <p className="rounded-lg bg-destructive/8 px-3 py-2 text-sm text-destructive" role="alert">
                {passwordError}
              </p>
            ) : null}
            <ul className="space-y-1.5 rounded-xl bg-slate-50/80 p-3 dark:bg-slate-800/30">
              {[
                { text: "En az 6 karakter uzunluğunda olmalıdır", met: newPw.length >= 6 },
                {
                  text: "En az bir özel karakter içermelidir",
                  met: /[!@#$%^&*(),.?":{}|<>]/.test(newPw),
                },
                { text: "En az bir rakam içermelidir", met: /\d/.test(newPw) },
                { text: "En az bir büyük harf (A-Z) içermelidir", met: /[A-Z]/.test(newPw) },
              ].map((req, key) => (
                <li key={`pw-req-${key}`} className="flex items-center gap-2">
                  {req.met ? (
                    <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" aria-hidden />
                  ) : (
                    <XCircle className="size-3.5 shrink-0 text-slate-300 dark:text-slate-600" aria-hidden />
                  )}
                  <span
                    className={cn(
                      "text-[11px] leading-snug tracking-tight transition-colors duration-200",
                      req.met
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-muted-foreground",
                    )}
                  >
                    {req.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <DialogFooter className="gap-2 border-t border-border/50 bg-slate-50/60 px-6 py-4 mb-1 mr-1 dark:bg-slate-900/30 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl transition-all duration-200 ease-out"
              onClick={handleDeleteCloseModal}
            >
              İptal
            </Button>
            <Button
              type="button"
              disabled={pswTrue}
              className="rounded-xl transition-all duration-200 ease-out"
              onClick={() => void changePassword()}
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={navAlert.open} onOpenChange={(open) => !open && setNavAlert({ open: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{navAlert.open ? navAlert.title : ""}</AlertDialogTitle>
            <AlertDialogDescription className="tracking-tight">
              {navAlert.open ? navAlert.description : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction type="button">Tamam</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DashboardNavbar;
