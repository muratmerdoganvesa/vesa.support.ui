import React, { ForwardedRef, useEffect, useRef, useState } from 'react';
import { SelectDialog, AnalyticalTable, FlexBox, Button, TextAlign, Input, Icon, Label } from '@ui5/webcomponents-react';
import ReactPaginate from 'react-paginate';
import { GenericList, GenericListApi } from 'api/generated';
import ReactDOM from 'react-dom';
import getConfiguration from "confiuration";

export interface SelectDialog {
    externalCode: string;
    name: string;
}

interface UserSelectDialogProps {
    value: ForwardedRef<SelectDialog | null>;
    open: boolean;
    onClose: () => void;
    onConfirm: (user: SelectDialog) => void;
    headerText: any,
    dataId: GenericList
    displayValue?: string;



}
const GenericSelectDialogWithInputEnum: React.FC<UserSelectDialogProps> = ({
    value,
    open,
    onClose,
    onConfirm,
    headerText,
    dataId,
    displayValue

}) => {

    const [searchText, setsearchText] = useState("");
    const [openDialog, setopenDialog] = useState(false);
    const [list, setList] = useState<any[]>([]);
    const [genericSelectPageCount, setgenericSelectPageCount] = useState(0);
    const [genericSelectTotalCount, setgenericSelectTotalCount] = useState(0);

    const [txtvalue, settxtvalue] = useState("");
    const [txtCode, setTxtCode] = useState("");
    const [searchBusy, setsearchBusy] = useState(false);
    const itemsPerPage = 7;

    const localValueRef = useRef<SelectDialog | null>(null);
   
    const configuration = getConfiguration();
    const onSearhboxSelect = (instance: any) => {



        setTxtCode(instance.row.original.externalCode)
        settxtvalue(instance.row.original.name);
        onClose();
        onConfirm(instance.row.original);
        setopenDialog(false);
        localValueRef.current = {
            externalCode: "initialExternalCode",
            name: "initialName"
        };

        if (localValueRef.current) {

            localValueRef.current.externalCode = instance.row.original.externalCode;
            localValueRef.current.name = instance.row.original.name;
        }

        if (value && typeof value === 'object') {

            value.current = {
                externalCode: "",
                name: ""
            };
            value.current!.externalCode = instance.row.original.externalCode;
            value.current!.name = instance.row.original.name;

            displayValue = instance.row.original.externalCode;
        }
    };
    const handleJobCodeCombobox = (e: any) => {
        setopenDialog(true);
    };

    const closeHandle = (e: any) => {
        onClose();
        setopenDialog(false);
    };
    const handlePageClick = async (event: any) => {


        let api = new GenericListApi(configuration);
        var data = null;
        if (searchText != "") {
            data = await api.apiGenericListGet(dataId, event.selected, 7, searchText);
        }
        else {
            data = await api.apiGenericListGet(dataId, event.selected, 7, searchText);
        }

        setList(data.data.list!);
        setgenericSelectPageCount(Math.ceil(data.data.count! / itemsPerPage));
        setgenericSelectTotalCount(data.data.count!);

    };
    const search = async (event: any) => {



        let api = new GenericListApi(configuration);
        var data = await api.apiGenericListGet(dataId, event.selected, 10, event.detail.value);
        setList(data.data.list!);
        setgenericSelectPageCount(Math.ceil(data.data.count! / itemsPerPage));
        setgenericSelectTotalCount(data.data.count!);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {



                setsearchBusy(true);
                let api = new GenericListApi(configuration);
                var data = await api.apiGenericListGet(dataId, 0, 7);


                setList(data.data.list!);
                setgenericSelectPageCount(Math.ceil(data.data.count! / itemsPerPage));
                setgenericSelectTotalCount(data.data.count!);
                setsearchBusy(false);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchData();
    }, [openDialog]);

    const render = async (e: any) => {



    }


    const fetchDataText = async (value: any) => {
        try {

            let api = new GenericListApi(configuration);


            const data = await api.apiGenericListGetFilteredDataAsyncGet(dataId, value);
            // Gelen verilerle işlemler yapabilirsiniz
            if (data.data != undefined) {

                settxtvalue(data.data);
                setTxtCode(value);

                return data.data;

            }

        } catch (error) {
            // Hata yönetimi burada yapılabilir
            console.error("Hata oluştu:", error);
        }
    }

    useEffect(() => {
        if (displayValue != undefined) {

            if (value && typeof value === 'object') {
                value.current = {
                    externalCode: "",
                    name: ""
                };
                const fetchData = async () => {
                    try {
                        var x = await fetchDataText(displayValue)
                        value.current!.externalCode = displayValue!;
                        value.current!.name = x!;
                    } catch (error) {
                        console.error('Error fetching data:', error);
                    }
                };
                fetchData();

                // fetchDataText(displayValue)

                // value.current!.externalCode = displayValue!;
                // value.current!.name = displayValue!;
            }
            settxtvalue(displayValue!);
        }
    }, [displayValue]);

   

    const handleInput = (e: any) => {
        setsearchText(e.target.value);
    };
    const onReset = async (e: any) => {
        setsearchText("");

        setsearchBusy(true);
        let api = new GenericListApi(configuration);
        var data = await api.apiGenericListGet(dataId, 0, 7);
        setList(data.data.list!);
        setgenericSelectPageCount(Math.ceil(data.data.count! / itemsPerPage));
        setgenericSelectTotalCount(data.data.count!);
        setsearchBusy(false);
    };
    return (

        <div>
            <div>


            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
                <Input readonly={true} style={{ width: "150px" }} value={txtCode} icon={<Icon name="search" onClick={handleJobCodeCombobox} />} type="Text" onClick={handleJobCodeCombobox} />

                <Label style={{ marginLeft: '10px' }}>{txtvalue}</Label>
            </div>

            {openDialog && ReactDOM.createPortal(
                <div >
                    <SelectDialog

                        onSearchReset={onReset}
                        onReset={handleInput}
                        showClearButton={true}
                        open={openDialog}
                        style={{ zIndex: 100001, position: 'fixed', top: '50%', left: '50%' }}
                        headerText="Arama Yapın"

                        onClose={closeHandle}
                        onSearch={search}

                        onBeforeClose={() => { }}
                        onBeforeOpen={() => { }}
                        onInput={handleInput}
                        onCancel={closeHandle}
                        // onClear={handleInput}
                        onConfirm={() => { }}
                        onLoadMore={() => { }}

                        onSearchInput={handleInput}
                    >
                        <div style={{ marginBottom: "15px", marginLeft: '10px', width: '100%' }}>
                            <AnalyticalTable

                                columns={[
                                    {
                                        Header: 'Code',
                                        accessor: 'externalCode',
                                        autoResizable: false,
                                        headerTooltip: 'externalCode',
                                        width: 150
                                    },
                                    {
                                        Header: 'name',
                                        accessor: 'name',
                                        autoResizable: false,
                                        headerTooltip: 'name',
                                        width: 300
                                    },
                                    {
                                        Cell: (instance: any) => {
                                            const { webComponentsReactProperties } = instance;
                                            const isOverlay = webComponentsReactProperties.showOverlay;
                                            return (
                                                <FlexBox>
                                                    <Button icon="accept" onClick={() => onSearhboxSelect(instance)} disabled={isOverlay} />
                                                </FlexBox>
                                            );
                                        },
                                        Header: 'Seç',
                                        hAlign: TextAlign.Center,
                                        accessor: '.',
                                        disableFilters: true,
                                        disableGroupBy: true,
                                        disableResizing: true,
                                        disableSortBy: true,
                                        id: 'actions',
                                        width: 70
                                    }
                                ]}
                                loading={searchBusy}
                                data={list}
                                filterable
                                onAutoResize={() => { }}
                                onColumnsReorder={() => { }}
                                onGroup={() => { }}
                                onLoadMore={() => { }}
                                onRowClick={() => { }}
                                onRowExpandChange={() => { }}
                                onRowSelect={() => { }}
                                onSort={() => { }}
                                onTableScroll={() => { }}
                                selectionMode="None"
                                tableHooks={[]}
                                withRowHighlight
                                withNavigationHighlight={false}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <ReactPaginate
                                previousLabel="Geri"
                                nextLabel="İleri"
                                pageClassName="page-item"
                                pageLinkClassName="page-link"
                                previousClassName="page-item"
                                previousLinkClassName="page-link"
                                nextClassName="page-item"
                                nextLinkClassName="page-link"
                                breakLabel="..."
                                breakClassName="page-item"
                                breakLinkClassName="page-link"
                                pageCount={genericSelectPageCount}
                                marginPagesDisplayed={2}
                                pageRangeDisplayed={5}
                                onPageChange={handlePageClick}
                                containerClassName="pagination"
                                activeClassName="active"
                            />
                        </div>
                    </SelectDialog>
                </div>,
                document.body
            )}
        </div>

    );
};


export default React.memo(GenericSelectDialogWithInputEnum);;
