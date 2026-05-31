

import React, { useEffect, useState } from 'react';
import { SelectDialog, TimelineItem, Timeline } from '@ui5/webcomponents-react';
import { WorkFlowItemApi, WorkFlowItemDtoWithApproveItems } from 'api/generated';
import "@ui5/webcomponents-icons/dist/hr-approval";
import { useBusy } from '../hooks/useBusy';
import { formatDateTime } from '../utils/utils';
import getConfiguration from "confiuration";
interface User {
    userId: string;
    firstName: string;
    lastName: string;
    // Diğer kullanıcı alanları...
}
interface UserSelectDialogProps {
    open: boolean;
    onClose: () => void;
    approveId: string;
}
const ShowHistory: React.FC<UserSelectDialogProps> = ({
    open,
    onClose,
    approveId
}) => {
    const dispatchBusy = useBusy()
    const [searchText, setSearchText] = useState("");
    const [approveItems, setApproveItems] = useState<WorkFlowItemDtoWithApproveItems[]>([]);
    const [itemOffset, setItemOffset] = useState(0);
    const [pageCount, setpageCount] = useState(0);
    const [sfUserSearchDataCount, setsfUserSearchDataCount] = useState(0);
    const [searchBusy, setsearchBusy] = useState(false);
    const itemsPerPage = 10;
   const configuration = getConfiguration();
    const onSearhboxSelect = (instance: any) => {

    };
    useEffect(() => {

        getApproveItem();

    }, []); //
    async function getApproveItem() {
        dispatchBusy({ isBusy: true });
        if (approveId != "") {

            let api = new WorkFlowItemApi(configuration);
            var data = await api.apiWorkFlowItemGetApproveItemsWorkFlowHeadIdGet(approveId);

            data.data.sort((a, b) => {
                let dateA = a.approveItems![0]?.createdDate ? new Date(a.approveItems![0]!.createdDate).getTime() : 0;
                let dateB = b.approveItems![0]?.createdDate ? new Date(b.approveItems![0]!.createdDate).getTime() : 0;
                return dateB - dateA;;
            });
            setApproveItems(data.data);
            console.log("history data:", data.data)
        }
        else {
            setApproveItems([]);
        }
        dispatchBusy({ isBusy: false });
    }
    return (
        <SelectDialog
            open={open}
            style={{ width: "800px" }}
            headerText="Onay Akışı"
            onClose={onClose}
            onBeforeClose={() => { }}
            onBeforeOpen={() => { }}
            onCancel={onClose}
            onClear={() => { }}
            onConfirm={() => { }}
            onLoadMore={() => { }}

            onSearchInput={() => { }}
        >
            <div style={{ marginBottom: "5px", width: '100%' }}>
                {approveId && (
                    <Timeline>
                        {approveItems.map((item, index) => (
                            <TimelineItem
                                key={index}
                                icon="hr-approval"
                                name={item.nodeName!}
                                subtitleText={"Onayına Gönderilen Kullanıcı: " + item.approveItems![0]!.approveUserNameSurname!}

                                style={{ color: 'lightblue' }}
                            >
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html:
                                            "İşlem Yapan Kullanıcı: " + item.approveItems![0]!.approvedUser_RuntimeNameSurname! + "<br>" +
                                            "İşlem Tipi: " +
                                            (item.approveItems![0]!.approverStatus === 2 ? "<span style='color:red;'>Reddedildi</span>" :
                                                item.approveItems![0]!.approverStatus === 1 ? "<span style='color:green;'>Onaylandı</span>" : "") +
                                            "<br>" +
                                            "Onaya Gönderilen Tarih: " + formatDateTime(item.approveItems![0]!.createdDate?.toString()!) + "<br>"
                                            + (item.approveItems![0].approvedUser_RuntimeNote != "" && item.approveItems![0].approvedUser_RuntimeNote != null
                                                ? "Açıklama: " + item.approveItems![0]!.approvedUser_RuntimeNote!
                                                : "")
                                            + "<br>"
                                            + (item.approveItems![0].approvedUser_RuntimeNumberManDay != "" && item.approveItems![0].approvedUser_RuntimeNumberManDay != null
                                                ? "Adam/Gün: " + item.approveItems![0]!.approvedUser_RuntimeNumberManDay!
                                                : "")
                                    }}
                                />

                            </TimelineItem>
                        ))}
                    </Timeline>
                )}
            </div>
        </SelectDialog>
    );
};

export default ShowHistory;
