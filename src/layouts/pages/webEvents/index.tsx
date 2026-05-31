import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { useNavigate } from "react-router-dom";
import { WebEventResponseDto, WebEventsApi } from "api/generated/api";
import getConfiguration from "confiuration";
import { useBusy } from "../hooks/useBusy";
import { useAlert } from "../hooks/useAlert";
import GlobalCell from "../talepYonetimi/allTickets/tableData/globalCell";
import { toWebEventImageSource } from "./imageUtils";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import { PlusIcon, PencilIcon, ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "lucide-react";

type WebEventRow = WebEventResponseDto & {
  rowType: "Etkinlik" | "Haber";
};

const PAGE_SIZE = 10;

function WebEventsList() {
  const navigate = useNavigate();
  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();
  const [rows, setRows] = useState<WebEventRow[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const fetchData = async () => {
    try {
      dispatchBusy({ isBusy: true });
      const conf = getConfiguration();
      const api = new WebEventsApi(conf);

      const [eventsResponse, newsResponse] = await Promise.all([
        api.apiWebEventsGet(),
        api.apiWebEventsGetAllNewGet(),
      ]);

      const mappedEvents = (eventsResponse.data ?? []).map((item) => ({
        ...item,
        rowType: "Etkinlik" as const,
      }));
      const mappedNews = (newsResponse.data ?? []).map((item) => ({
        ...item,
        rowType: "Haber" as const,
      }));

      setRows([...mappedEvents, ...mappedNews]);
    } catch (error) {
      dispatchAlert({
        message: "Haber ve etkinlik listesi yuklenirken hata olustu.",
        type: "Error",
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) =>
        row.rowType?.toLowerCase().includes(q) ||
        row.title?.tr?.toLowerCase().includes(q) ||
        row.title?.en?.toLowerCase().includes(q) ||
        row.title?.az?.toLowerCase().includes(q) ||
        row.startsAt?.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

  const pagedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, page]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <div className="w-full mt-[-15px] bg-white rounded-xl shadow-[0_2px_12px_0_rgba(0,0,0,0.1)]">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div>
            <h1 className="text-xl font-semibold text-[#344767]">Haber ve Etkinlik Yonetimi</h1>
            <p className="text-sm text-[#7b809a] mt-0.5">
              Etkinlikleri ve haberleri tek panelden listeleyin.
            </p>
          </div>
          <Button
            variant="default"
            size="sm"
            className="flex items-center gap-1.5 mt-1"
            onClick={() => navigate("/webEvents/detail")}
          >
            <PlusIcon className="w-4 h-4" />
            Yeni Kayit
          </Button>
        </div>

        {/* Search */}
        <div className="px-6 pb-3">
          <div className="relative w-full max-w-sm">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Ara..."
              value={search}
              onChange={handleSearchChange}
              className="pl-8"
            />
          </div>
        </div>

        {/* Table */}
        <div className="px-4 pb-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-base font-bold text-black">Gorsel</TableHead>
                <TableHead className="text-base font-bold text-black">Tip</TableHead>
                <TableHead className="text-base font-bold text-black">Baslik (TR)</TableHead>
                <TableHead className="text-base font-bold text-black">Baslik (EN)</TableHead>
                <TableHead className="text-base font-bold text-black">Baslik (AZ)</TableHead>
                <TableHead className="text-base font-bold text-black">Tarih</TableHead>
                <TableHead className="text-base font-bold text-black">Islem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-10">
                    Kayit bulunamadi.
                  </TableCell>
                </TableRow>
              ) : (
                pagedRows.map((row) => {
                  const imageSource = toWebEventImageSource(row.coverImage);
                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        {imageSource ? (
                          <img
                            src={imageSource}
                            alt={row.title?.tr ?? "Kayit gorseli"}
                            className="w-16 h-11 object-cover rounded-md border border-gray-200 block"
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">Yok</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <GlobalCell value={row.rowType} columnName="rowType" testRow={row} />
                      </TableCell>
                      <TableCell>
                        <GlobalCell value={row.title?.tr ?? ""} />
                      </TableCell>
                      <TableCell>
                        <GlobalCell value={row.title?.en ?? ""} />
                      </TableCell>
                      <TableCell>
                        <GlobalCell value={row.title?.az ?? ""} />
                      </TableCell>
                      <TableCell>
                        <GlobalCell value={row.startsAt ?? ""} />
                      </TableCell>
                      <TableCell>
                        <button
                          aria-label="Duzenle"
                          className="p-1 rounded hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={() => navigate(`/webEvents/detail/${row.id}`)}
                        >
                          <PencilIcon className="w-4 h-4 text-gray-600" />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
          <span className="text-sm text-muted-foreground">
            {filteredRows.length} kayit — Sayfa {page} / {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              aria-label="Onceki sayfa"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Sonraki sayfa"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </DashboardLayout>
  );
}

export default WebEventsList;
