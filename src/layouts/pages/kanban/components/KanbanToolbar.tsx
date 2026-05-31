import React, { useEffect, useState } from "react";
import { Search, X, Plus } from "lucide-react";
import { Button } from "components/ui/button";
import { cn } from "lib/utils";
import getConfiguration from "confiuration";
import { UserCalendarApi } from "api/generated";

interface KanbanToolbarProps {
  onAddCard: () => void;
  onFilterChange: (filter: string) => void;
  onSearch: (searchTerm: string) => void;
  selectedRadio: number;
  setSelectedRadio: (value: number) => void;
  handleRadioChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const KanbanToolbar: React.FC<KanbanToolbarProps> = ({
  onAddCard,
  onFilterChange,
  onSearch,
  selectedRadio,
  setSelectedRadio,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [hasPerm, setHasPerm] = useState(false);
  const [isManager, setIsManager] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  useEffect(() => {
    const fetchHasPerm = async () => {
      try {
        const api = new UserCalendarApi(getConfiguration());
        const res = await api.apiUserCalendarCheckOtherDeptpermGet();
        setHasPerm(res.data.perm);
      } catch {}
    };
    const fetchIsManager = async () => {
      try {
        const api = new UserCalendarApi(getConfiguration());
        const res = await api.apiUserCalendarCheckUserIsManagerGet();
        setIsManager(res.data.perm);
      } catch {}
    };
    fetchHasPerm();
    fetchIsManager();
  }, []);

  const radioOptions = [
    { value: 1, label: "Kendim" },
    { value: 2, label: "Ekibim" },
    { value: 3, label: "Herkes" },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm mb-4">
      {/* Left: Add + radio */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          type="button"
          onClick={onAddCard}
          className="h-9 px-4 gap-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Görev Ekle
        </Button>

        {(hasPerm || isManager) && (
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            {radioOptions.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSelectedRadio(value)}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                  selectedRadio === value
                    ? "bg-white text-indigo-700 shadow-sm font-semibold"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Search */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Görev ara..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="h-9 pl-9 pr-9 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all bg-white min-w-[200px]"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => { setSearchTerm(""); onSearch(""); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => { setSearchTerm(""); onSearch(""); onFilterChange("All"); }}
          className="h-9 px-3 border border-slate-200 rounded-lg text-xs text-slate-600 font-medium hover:bg-slate-50 transition-colors"
        >
          Temizle
        </button>
      </div>
    </div>
  );
};

export default KanbanToolbar;
