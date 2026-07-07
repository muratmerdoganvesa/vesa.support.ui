import { CrmModulDto } from "api/generated";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "components/ui/table";
import {
  CrmCustomerListTableHeader,
  CUSTOMER_LIST_TABLE_COLUMN_COUNT,
} from "./crmOpportunityRowShared";
import { CrmModulCustomerListRow } from "./CrmModulCustomerListRow";
import { CrmModulListEmpty } from "./CrmModulListEmpty";
import { CrmModulListPagination } from "./CrmModulListPagination";

type CrmModulGridViewProps = {
  rows: CrmModulDto[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  allCount: number;
  onPageChange: (page: number) => void;
  onEdit: (row: CrmModulDto) => void;
};

/** Müşteri listesi — tablo görünümü (müşteri başına bir satır) */
export const CrmModulGridView = ({
  rows,
  currentPage,
  totalPages,
  totalCount,
  allCount,
  onPageChange,
  onEdit,
}: CrmModulGridViewProps) => (
  <>
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <CrmCustomerListTableHeader />
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={CUSTOMER_LIST_TABLE_COLUMN_COUNT}>
                <CrmModulListEmpty />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <CrmModulCustomerListRow
                key={row.id}
                row={row}
                onEdit={() => onEdit(row)}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>

    <CrmModulListPagination
      currentPage={currentPage}
      totalPages={totalPages}
      totalCount={totalCount}
      allCount={allCount}
      onPageChange={onPageChange}
    />
  </>
);
