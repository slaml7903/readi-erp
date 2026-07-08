"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Drawer } from "@/components/ui";

import PurchaseFilterBar from "./PurchaseFilterBar";
import PurchaseRequestDetail from "./PurchaseRequestDetail";
import PurchaseRequestTable from "./PurchaseRequestTable";

import type { PurchaseRequest } from "../types/purchase.type";

interface Props {
  data: PurchaseRequest[];
  initialSearch?: string;
}

export default function PurchaseRequestClient({ data, initialSearch = "" }: Props) {
  const router = useRouter();

  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState("");
  const [team, setTeam] = useState("");
  const [selectedRequest, setSelectedRequest] =
    useState<PurchaseRequest | null>(null);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const searchText = search.toLowerCase();

      const keywordMatched =
        item.prNo.toLowerCase().includes(searchText) ||
        item.title.toLowerCase().includes(searchText) ||
        Boolean(item.teamName?.toLowerCase().includes(searchText)) ||
        Boolean(item.requester?.toLowerCase().includes(searchText)) ||
        Boolean(item.status?.toLowerCase().includes(searchText)) ||
        Boolean(
          item.projectNames?.some((projectName) =>
            projectName.toLowerCase().includes(searchText)
          )
        ) ||
        Boolean(
          item.vendorNames?.some((vendorName) =>
            vendorName.toLowerCase().includes(searchText)
          )
        );

      const statusMatched = status === "" || item.status === status;
      const teamMatched = team === "" || item.teamName === team;

      return keywordMatched && statusMatched && teamMatched;
    });
  }, [data, search, status, team]);

  const handleRowClick = (request: PurchaseRequest) => {
    setSelectedRequest(request);
  };

  const handleCloseDrawer = () => {
    setSelectedRequest(null);
  };

  const handleCreateClick = () => {
    router.push("/purchase/request/new");
  };

  return (
    <div className="space-y-4">
      <PurchaseFilterBar
        search={search}
        status={status}
        team={team}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onTeamChange={setTeam}
        onCreateClick={handleCreateClick}
      />

      <PurchaseRequestTable
        data={filteredData}
        selectedRequestId={selectedRequest?.id ?? null}
        onRowClick={handleRowClick}
      />

      <Drawer
        open={selectedRequest !== null}
        title="구매요청 상세"
        onClose={handleCloseDrawer}
        width="w-[560px]"
      >
        {selectedRequest ? (
          <PurchaseRequestDetail request={selectedRequest} />
        ) : null}
      </Drawer>
    </div>
  );
}
