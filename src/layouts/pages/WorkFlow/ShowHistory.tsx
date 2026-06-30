import React, { useEffect, useState } from "react";
import { SelectDialog, TimelineItem, Timeline } from "@ui5/webcomponents-react";
import { WorkFlowItemApi, WorkFlowItemDtoWithApproveItems } from "api/generated";
import "@ui5/webcomponents-icons/dist/hr-approval";
import { useBusy } from "../hooks/useBusy";
import { formatDateTime } from "../utils/utils";
import getConfiguration from "confiuration";

interface ShowHistoryProps {
    open: boolean;
    onClose: () => void;
    approveId: string;
}

const getStatusConfig = (status?: number) => {
    if (status === 1) {
        return { label: "Onaylandı", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    }
    if (status === 2) {
        return { label: "Reddedildi", className: "bg-red-50 text-red-700 border-red-200" };
    }
    return { label: "Beklemede", className: "bg-amber-50 text-amber-700 border-amber-200" };
};

const DetailRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="grid grid-cols-[minmax(0,10.5rem)_1fr] items-start gap-x-4 gap-y-1 py-2 border-b border-slate-100 last:border-0">
        <span className="text-xs font-medium text-slate-500 leading-5">{label}</span>
        <div className="text-sm text-slate-800 leading-5 min-w-0 wrap-break-word">{children}</div>
    </div>
);

const ShowHistory: React.FC<ShowHistoryProps> = ({ open, onClose, approveId }) => {
    const dispatchBusy = useBusy();
    const [approveItems, setApproveItems] = useState<WorkFlowItemDtoWithApproveItems[]>([]);
    const configuration = getConfiguration();

    useEffect(() => {
        if (!open) return;
        getApproveItem();
    }, [open, approveId]);

    const getApproveItem = async () => {
        dispatchBusy({ isBusy: true });

        if (approveId !== "") {
            const api = new WorkFlowItemApi(configuration);
            const data = await api.apiWorkFlowItemGetApproveItemsWorkFlowHeadIdGet(approveId);

            const sortedItems = [...data.data].sort((a, b) => {
                const dateA = a.approveItems?.[0]?.createdDate
                    ? new Date(a.approveItems[0].createdDate).getTime()
                    : 0;
                const dateB = b.approveItems?.[0]?.createdDate
                    ? new Date(b.approveItems[0].createdDate).getTime()
                    : 0;
                return dateB - dateA;
            });

            setApproveItems(sortedItems);
        } else {
            setApproveItems([]);
        }

        dispatchBusy({ isBusy: false });
    };

    return (
        <SelectDialog
            open={open}
            style={{ width: "800px" }}
            headerText="Onay Akışı"
            onClose={onClose}
            onBeforeClose={() => {}}
            onBeforeOpen={() => {}}
            onCancel={onClose}
            onClear={() => {}}
            onConfirm={() => {}}
            onLoadMore={() => {}}
            onSearchInput={() => {}}
        >
            <div className="w-full px-4 py-5 max-h-[65vh] overflow-y-auto">
                {!approveId ? (
                    <p className="py-10 text-center text-sm text-slate-500">
                        Onay akışı bilgisi bulunamadı.
                    </p>
                ) : approveItems.length === 0 ? (
                    <p className="py-10 text-center text-sm text-slate-500">
                        Henüz onay kaydı bulunmamaktadır.
                    </p>
                ) : (
                    <Timeline className="w-full">
                        {approveItems.map((item, index) => {
                            const approveItem = item.approveItems?.[0];
                            if (!approveItem) return null;

                            const status = getStatusConfig(approveItem.approverStatus);
                            const note = approveItem.approvedUser_RuntimeNote?.trim();
                            const manDay = approveItem.approvedUser_RuntimeNumberManDay?.trim();

                            return (
                                <TimelineItem
                                    key={`${item.nodeName}-${index}`}
                                    icon="hr-approval"
                                    name={item.nodeName ?? "Onay Adımı"}
                                    subtitleText={`Onayına gönderilen: ${approveItem.approveUserNameSurname ?? "—"}`}
                                >
                                    <div className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 shadow-sm">
                                        <DetailRow label="İşlem yapan">
                                            {approveItem.approvedUser_RuntimeNameSurname ?? "—"}
                                        </DetailRow>

                                        <DetailRow label="İşlem tipi">
                                            <span
                                                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${status.className}`}
                                            >
                                                {status.label}
                                            </span>
                                        </DetailRow>

                                        <DetailRow label="Gönderim tarihi">
                                            {approveItem.createdDate
                                                ? formatDateTime(approveItem.createdDate.toString())
                                                : "—"}
                                        </DetailRow>

                                        {note && (
                                            <DetailRow label="Açıklama">{note}</DetailRow>
                                        )}

                                        {manDay && (
                                            <DetailRow label="Adam/Gün">{manDay}</DetailRow>
                                        )}
                                    </div>
                                </TimelineItem>
                            );
                        })}
                    </Timeline>
                )}
            </div>
        </SelectDialog>
    );
};

export default ShowHistory;
