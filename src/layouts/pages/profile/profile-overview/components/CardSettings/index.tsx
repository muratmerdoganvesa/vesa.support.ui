import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";

import getConfiguration from "confiuration";
import { ProjectsApi } from "api/generated";
import { Category } from "layouts/pages/profile/all-projects";
import { useBusy } from "layouts/pages/hooks/useBusy";

import index0png from "assets/images/sapfiori.jpg";
import index1png from "assets/images/SAP-HR.jpg";
import index2png from "assets/images/btplogo.jpg";
import index3png from "assets/images/SAP-SuccessFactors.png";

function CardSettings({ name, description, id, userId, categoryName }: Category) {
  const [nameofCategories, setnameofCategories] = useState([]);
  const navigate = useNavigate();
  const dispatchBusy = useBusy();

  const getnameofCategories = async () => {
    dispatchBusy({ isBusy: true });
    const api = new ProjectsApi(getConfiguration());
    const data = await api.apiProjectsGetCategoryGet();
    setnameofCategories(data.data as any);
    dispatchBusy({ isBusy: false });
  };

  useEffect(() => {
    getnameofCategories();
  }, []);

  // ── Image selection (logic preserved exactly) ─────────────────────────────

  const indexOfCategory = nameofCategories.findIndex(
    (category: any) => category.description === categoryName
  );

  let image: string;
  if (indexOfCategory === 0)      image = index0png;
  else if (indexOfCategory === 1) image = index2png;
  else if (indexOfCategory === 2) image = index3png;
  else if (indexOfCategory === 3) image = index1png;

  const imageWidth = () => {
    switch (image) {
      case index0png: return "80px";
      case index1png: return "80px";
      case index2png: return "80px";
      case index3png: return "80px";
      default:        return "60px";
    }
  };

  const imageHeight = () => {
    switch (image) {
      case index0png: return "80px";
      case index1png: return "50px";
      case index2png: return "80px";
      case index3png: return "55px";
      default:        return "60px";
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col overflow-hidden">

      {/* ── Card header ── */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">

        {/* Category logo */}
        <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
          {image ? (
            <img
              src={image}
              alt="categoryIcons"
              style={{ width: imageWidth(), height: imageHeight() }}
              className="object-contain"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <span className="text-indigo-500 text-lg font-bold">
                {name?.[0]?.toUpperCase() ?? "?"}
              </span>
            </div>
          )}
        </div>

        {/* Title + category */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-slate-800 leading-tight truncate">
            {name}
          </h4>
          {categoryName && (
            <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
              {categoryName}
            </span>
          )}
        </div>

        {/* View action */}
        <button
          type="button"
          onClick={() =>
            navigate(`/profile/all-projects/edit-project/${id}?isOnlyRead=true`)
          }
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          aria-label="Projeyi görüntüle"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* Divider */}
      <hr className="border-slate-100 mx-4" />

      {/* ── Description ── */}
      <div className="px-4 py-3 flex-1 overflow-y-auto" style={{ minHeight: "80px", maxHeight: "100px" }}>
        <p className="text-xs text-slate-500 leading-relaxed">
          {description || <span className="italic text-slate-300">Açıklama yok</span>}
        </p>
      </div>

    </div>
  );
}

export default CardSettings;
