import { useState, useEffect, ReactNode } from "react";
import { ArrowLeft, User } from "lucide-react";
import { UserAppDto } from "api/generated";
import { useBusy } from "layouts/pages/hooks/useBusy";

interface HeaderProps {
  children?: ReactNode;
  profileData?: UserAppDto;
  booleanControl?: boolean;
  selectedUser?: (user: UserAppDto) => void;
  headerControl?: boolean;
}

function Header({ children, profileData, booleanControl, selectedUser, headerControl }: HeaderProps): JSX.Element {
  const [tabsOrientation, setTabsOrientation] = useState<"horizontal" | "vertical">("horizontal");
  const [tabValue, setTabValue] = useState(0);

  const dispatchBusy = useBusy();

  const handleLetEmptyUserSelect = () => {
    selectedUser(null);
  };

  const handleSetTabValue = (event: any, newValue: any) => setTabValue(newValue);

  useEffect(() => {
    const handleTabsOrientation = () => {
      window.innerWidth < 600
        ? setTabsOrientation("vertical")
        : setTabsOrientation("horizontal");
    };

    window.addEventListener("resize", handleTabsOrientation);
    handleTabsOrientation();

    return () => window.removeEventListener("resize", handleTabsOrientation);
  }, [tabsOrientation]);

  const fullName = `${profileData?.firstName ?? ""} ${profileData?.lastName ?? ""}`.trim();
  const avatarSrc = profileData?.photo ? `data:image/png;base64,${profileData.photo}` : null;

  return (
    <div className="relative mb-6">
      <div
        className="relative mx-3 rounded-xl border border-slate-200 bg-white shadow-sm px-5 py-5"
        style={{ marginTop: headerControl ? "40px" : "34px" }}
      >

        {/* Back button */}
        {booleanControl && (
          <button
            type="button"
            onClick={handleLetEmptyUserSelect}
            className="absolute top-3 left-4 flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
            aria-label="Geri dön"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Geri Dön</span>
          </button>
        )}

        {/* Avatar + Name row */}
        <div
          className="flex items-center gap-4"
          style={{ marginTop: headerControl ? "4px" : "36px", marginBottom: headerControl ? "14px" : "0" }}
        >
          {/* Avatar */}
          <div className="shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-slate-100 flex items-center justify-center">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt="profile-image"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-9 h-9 text-slate-400" />
            )}
          </div>

          {/* Name + title */}
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-800 leading-tight truncate">
              {fullName || "—"}
            </h2>
            {profileData?.title && (
              <p className="text-sm text-slate-500 mt-0.5 truncate">
                {profileData.title}
              </p>
            )}
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}

Header.defaultProps = {
  children: "",
};

export default Header;
