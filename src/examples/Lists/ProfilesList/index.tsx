import { useEffect, useRef, useState } from "react";

import { UserApi, UserAppDto } from "api/generated";
import getConfiguration from "confiuration";
import { useBusy } from "layouts/pages/hooks/useBusy";

import { cn } from "lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import { Input } from "components/ui/input";
import { Separator } from "components/ui/separator";
import { Bell, X } from "lucide-react";

interface Props {
  title: string;
  shadow?: boolean;
  allprofiles?: UserAppDto[];
  onUserSelect?: (user: UserAppDto) => void;
  initialUserData?: UserAppDto;
}

function ProfilesList({
  title,
  shadow,
  onUserSelect,
  initialUserData,
}: Props): JSX.Element {
  const [show, setShow] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAppDto>({} as UserAppDto);
  const toggleSnackBar = () => setShow((prev) => !prev);
  const [isMySelf, setIsMySelf] = useState(false);
  const [searchByName, setSearchByName] = useState<UserAppDto[]>([]);
  const dispatchBusy = useBusy();
  const [test, settest] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSearchByName = async (value: string) => {
    if (value === "") {
      setSearchByName([]);
    } else {
      dispatchBusy({ isBusy: true });
      settest(true);
      var conf = getConfiguration();
      var api = new UserApi(conf);
      var data = await api.apiUserGetAllUsersAsyncWitNameGet(value);
      var pureData = data.data;
      setSearchByName(pureData);
      settest(false);
      dispatchBusy({ isBusy: false });
    }
  };

  const handleUserSelect = (user: UserAppDto) => {
    if (onUserSelect) {
      onUserSelect(user);
      setCurrentUser(user);
    }
    toggleSnackBar();
    setInputValue("");
    setDropdownOpen(false);
    setSearchByName([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    handleSearchByName(val);
    setDropdownOpen(val.trim() !== "");
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-hide snackbar after 3 seconds
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        setShow(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  const getInitials = (user: UserAppDto) => {
    const first = user.firstName?.[0] ?? "";
    const last = user.lastName?.[0] ?? "";
    return `${first}${last}`.toUpperCase() || "?";
  };

  const visibleResults = searchByName.filter(
    (option) => option.id !== initialUserData?.id,
  );

  return (
    <>
      <Card
        className={cn(
          "h-full",
          !shadow && "shadow-none ring-0 border border-border/50",
        )}
      >
        <CardHeader className="flex justify-center items-center pb-0">
          <CardTitle className="text-md font-semibold capitalize tracking-tight">
            {title}
          </CardTitle>
        </CardHeader>

        <Separator className="my-3" />

        <CardContent className="pt-0">
          {/* Search field with dropdown */}
          <div ref={containerRef} className="relative mx-auto max-w-sm">
            <Input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onFocus={() => {
                if (inputValue.trim()) setDropdownOpen(true);
              }}
              placeholder="İsim giriniz..."
              aria-label="Kullanıcı ara"
              aria-expanded={dropdownOpen}
              aria-autocomplete="list"
              autoComplete="off"
            />

            {/* Dropdown results */}
            {dropdownOpen && visibleResults.length > 0 && (
              <ul
                role="listbox"
                aria-label="Arama sonuçları"
                className={cn(
                  "absolute left-0 right-0 top-[calc(100%+4px)] z-50",
                  "max-h-72 overflow-y-auto overscroll-contain",
                  "rounded-xl border border-border/60 bg-popover",
                  "shadow-[0_8px_30px_-6px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_-6px_rgba(0,0,0,0.4)]",
                  "py-1",
                )}
              >
                {visibleResults.map((option, idx) => (
                  <li
                    key={option.id ?? idx}
                    role="option"
                    aria-selected={false}
                    tabIndex={0}
                    onClick={() => handleUserSelect(option)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleUserSelect(option);
                      }
                    }}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 px-3 py-2.5",
                      "transition-colors hover:bg-accent focus-visible:bg-accent",
                      "outline-none select-none",
                    )}
                  >
                    <Avatar className="size-9 shrink-0">
                      <AvatarImage
                        src={`data:image/png;base64,${option.photo}`}
                        alt={option.firstName ?? ""}
                      />
                      <AvatarFallback className="text-xs font-medium">
                        {getInitials(option)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium text-foreground">
                        {option.firstName} {option.lastName}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {option.email}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Empty state */}
            {dropdownOpen && searchByName.length > 0 && visibleResults.length === 0 && (
              <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 rounded-xl border border-border/60 bg-popover px-4 py-3 text-center text-sm text-muted-foreground shadow-md">
                Sonuç bulunamadı.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Toast notification */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={cn(
          "fixed bottom-5 right-5 z-1400 flex min-w-80 max-w-88 items-start gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-xl ring-1 ring-foreground/5",
          "transition-all duration-300",
          show
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-3 opacity-0",
        )}
      >
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Bell className="size-4" aria-hidden />
        </span>

        <div className="flex-1 space-y-0.5">
          <p className="text-sm font-semibold leading-snug text-foreground">
            Bildirim
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {currentUser.firstName
              ? `${currentUser.firstName} ${currentUser.lastName} isimli kullanıcının profilini görüntülüyorsunuz.`
              : ""}
          </p>
          <p className="text-[10px] text-muted-foreground/60">Şimdi</p>
        </div>

        <button
          type="button"
          onClick={toggleSnackBar}
          aria-label="Bildirimi kapat"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && toggleSnackBar()}
          className="mt-0.5 shrink-0 rounded-md p-1 text-muted-foreground/60 transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      </div>
    </>
  );
}

ProfilesList.defaultProps = {
  shadow: true,
};

export default ProfilesList;
