"use client";

import { useRouter } from "next/navigation";
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Button, Card, Input, Select } from "@/components/ui";

type VendorOption = {
  id: string;
  name: string;
};

type PurchaseRequestFormState = {
  title: string;
  teamName: string;
  requester: string;
  requestDate: string;
  requiredDate: string;
  memo: string;
  orders: PurchaseOrderFormState[];
};

type PurchaseOrderFormState = {
  id: string;
  vendorRecordId: string;
  vendorName: string;
  businessLicenseUrl: string;
  bankbookUrl: string;
  orderDate: string;
  expectedReceivingDate: string;
  receivingChecker: string;
  needPayment: boolean;
  memo: string;
  items: PurchaseOrderItemFormState[];
};

type PurchaseOrderItemFormState = {
  id: string;
  modelName: string;
  quantity: string;
  unitPrice: string;
  vatIncluded: boolean;
  memo: string;
};

function createId() {
  return crypto.randomUUID();
}

function createEmptyOrderItem(): PurchaseOrderItemFormState {
  return {
    id: createId(),
    modelName: "",
    quantity: "1",
    unitPrice: "",
    vatIncluded: true,
    memo: "",
  };
}

function createEmptyOrder(): PurchaseOrderFormState {
  return {
    id: createId(),
    vendorRecordId: "",
    vendorName: "",
    businessLicenseUrl: "",
    bankbookUrl: "",
    orderDate: "",
    expectedReceivingDate: "",
    receivingChecker: "",
    needPayment: true,
    memo: "",
    items: [createEmptyOrderItem()],
  };
}

function calculateVatIncludedAmount({
  quantity,
  unitPrice,
  vatIncluded,
}: {
  quantity: string;
  unitPrice: string;
  vatIncluded: boolean;
}) {
  const quantityNumber = Number(quantity || 0);
  const unitPriceNumber = Number(unitPrice || 0);
  const supplyAmount = quantityNumber * unitPriceNumber;

  if (vatIncluded) {
    return supplyAmount;
  }

  return Math.round(supplyAmount * 1.1);
}

const initialFormState: PurchaseRequestFormState = {
  title: "",
  teamName: "",
  requester: "",
  requestDate: "",
  requiredDate: "",
  memo: "",
  orders: [createEmptyOrder()],
};

export default function PurchaseRequestCreateForm() {
  const router = useRouter();

  const [form, setForm] =
    useState<PurchaseRequestFormState>(initialFormState);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [isVendorLoading, setIsVendorLoading] = useState(false);

  useEffect(() => {
    router.prefetch("/purchase/request");

    const fetchVendors = async () => {
      try {
        setIsVendorLoading(true);

        const response = await fetch("/api/purchase/vendors");
        const result = await response.json();

        if (!response.ok) {
          console.error(result.message ?? "거래처 조회 실패");
          return;
        }

        setVendors(result.vendors ?? []);
      } catch (error) {
        console.error(error);
      } finally {
        setIsVendorLoading(false);
      }
    };

    fetchVendors();
  }, [router]);

  const handleRequestChange = (
    key: keyof Omit<PurchaseRequestFormState, "orders">,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleOrderChange = (
    orderId: string,
    key: keyof Omit<PurchaseOrderFormState, "id" | "items">,
    value: string | boolean
  ) => {
    setForm((prev) => ({
      ...prev,
      orders: prev.orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              [key]: value,
            }
          : order
      ),
    }));
  };

  const handleVendorInputChange = (orderId: string, vendorName: string) => {
    const matchedVendor = vendors.find(
      (vendor) =>
        vendor.name.trim().toLowerCase() === vendorName.trim().toLowerCase()
    );

    setForm((prev) => ({
      ...prev,
      orders: prev.orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              vendorName,
              vendorRecordId: matchedVendor?.id ?? "",
              businessLicenseUrl: matchedVendor
                ? ""
                : order.businessLicenseUrl,
              bankbookUrl: matchedVendor ? "" : order.bankbookUrl,
            }
          : order
      ),
    }));
  };

  const handleVendorSelect = (orderId: string, vendor: VendorOption) => {
    setForm((prev) => ({
      ...prev,
      orders: prev.orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              vendorName: vendor.name,
              vendorRecordId: vendor.id,
              businessLicenseUrl: "",
              bankbookUrl: "",
            }
          : order
      ),
    }));
  };

  const handleOrderItemChange = (
    orderId: string,
    itemId: string,
    key: keyof Omit<PurchaseOrderItemFormState, "id">,
    value: string | boolean
  ) => {
    setForm((prev) => ({
      ...prev,
      orders: prev.orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              items: order.items.map((item) =>
                item.id === itemId
                  ? {
                      ...item,
                      [key]: value,
                    }
                  : item
              ),
            }
          : order
      ),
    }));
  };

  const handleAddOrder = () => {
    setForm((prev) => ({
      ...prev,
      orders: [...prev.orders, createEmptyOrder()],
    }));
  };

  const handleRemoveOrder = (orderId: string) => {
    setForm((prev) => {
      if (prev.orders.length === 1) {
        alert("발주는 최소 1개 이상 필요합니다.");
        return prev;
      }

      return {
        ...prev,
        orders: prev.orders.filter((order) => order.id !== orderId),
      };
    });
  };

  const handleAddOrderItem = (orderId: string) => {
    setForm((prev) => ({
      ...prev,
      orders: prev.orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              items: [...order.items, createEmptyOrderItem()],
            }
          : order
      ),
    }));
  };

  const handleRemoveOrderItem = (orderId: string, itemId: string) => {
    setForm((prev) => ({
      ...prev,
      orders: prev.orders.map((order) => {
        if (order.id !== orderId) return order;

        if (order.items.length === 1) {
          alert("발주상세품목은 최소 1개 이상 필요합니다.");
          return order;
        }

        return {
          ...order,
          items: order.items.filter((item) => item.id !== itemId),
        };
      }),
    }));
  };

  const handleCancel = () => {
    setIsCancelling(true);

    window.setTimeout(() => {
      router.replace("/purchase/request");
    }, 0);
  };

  const validateForm = () => {
    if (!form.title.trim()) {
      alert("제목을 입력해주세요.");
      return false;
    }

    if (!form.teamName) {
      alert("팀명을 선택해주세요.");
      return false;
    }

    if (!form.requester.trim()) {
      alert("요청자를 입력해주세요.");
      return false;
    }

    if (form.orders.length === 0) {
      alert("발주를 최소 1개 이상 입력해주세요.");
      return false;
    }

    for (let orderIndex = 0; orderIndex < form.orders.length; orderIndex += 1) {
      const order = form.orders[orderIndex];

      const isNewVendor =
        order.vendorName.trim().length > 0 && !order.vendorRecordId;

      if (isNewVendor) {
        if (!order.businessLicenseUrl.trim()) {
          alert(
            `${
              orderIndex + 1
            }번째 발주의 신규 거래처 사업자등록증 URL을 입력해주세요.`
          );
          return false;
        }

        if (!order.bankbookUrl.trim()) {
          alert(
            `${
              orderIndex + 1
            }번째 발주의 신규 거래처 통장사본 URL을 입력해주세요.`
          );
          return false;
        }
      }

      if (order.items.length === 0) {
        alert(`${orderIndex + 1}번째 발주에 품목을 1개 이상 입력해주세요.`);
        return false;
      }

      for (
        let itemIndex = 0;
        itemIndex < order.items.length;
        itemIndex += 1
      ) {
        const item = order.items[itemIndex];

        if (!item.modelName.trim()) {
          alert(
            `${orderIndex + 1}번째 발주의 ${
              itemIndex + 1
            }번째 품목 모델명을 입력해주세요.`
          );
          return false;
        }

        if (Number(item.quantity) <= 0) {
          alert(
            `${orderIndex + 1}번째 발주의 ${
              itemIndex + 1
            }번째 품목 수량을 확인해주세요.`
          );
          return false;
        }

        if (Number(item.unitPrice) < 0 || item.unitPrice === "") {
          alert(
            `${orderIndex + 1}번째 발주의 ${
              itemIndex + 1
            }번째 품목 단가를 확인해주세요.`
          );
          return false;
        }
      }
    }

    return true;
  };

  const buildSubmitPayload = () => {
    return {
      title: form.title.trim(),
      teamName: form.teamName,
      requester: form.requester.trim(),
      requestDate: form.requestDate || undefined,
      requiredDate: form.requiredDate || undefined,
      memo: form.memo.trim() || undefined,
      orders: form.orders.map((order) => {
        const isNewVendor =
          order.vendorName.trim().length > 0 && !order.vendorRecordId;

        return {
          vendorRecordId: order.vendorRecordId || undefined,
          vendorName: order.vendorName.trim() || undefined,
          newVendorDocuments: isNewVendor
            ? {
                businessLicenseUrl:
                  order.businessLicenseUrl.trim() || undefined,
                bankbookUrl: order.bankbookUrl.trim() || undefined,
              }
            : undefined,
          orderDate: order.orderDate || undefined,
          expectedReceivingDate: order.expectedReceivingDate || undefined,
          receivingChecker: order.receivingChecker.trim() || undefined,
          needPayment: true,
          memo: order.memo.trim() || undefined,
          items: order.items.map((item) => ({
            modelName: item.modelName.trim(),
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            vatIncluded: item.vatIncluded,
            memo: item.memo.trim() || undefined,
          })),
        };
      }),
    };
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) return;

    const payload = buildSubmitPayload();

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/purchase/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.message ?? "구매요청 등록에 실패했습니다.");
        return;
      }

      alert(
        `등록 완료\n발주 ${result.orderCount}건\n발주상세품목 ${result.itemCount}건`
      );

      window.location.href = "/purchase/request";
    } catch (error) {
      console.error(error);
      alert("구매요청 등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCancelling) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500">
        목록으로 이동 중입니다...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-7xl space-y-3">
      <Card className="p-4">
        <h2 className="mb-3 text-base font-semibold text-gray-900">
          구매요청 기본정보
        </h2>

        <div className="grid grid-cols-12 gap-3">
          <FormField label="제목" required className="col-span-12">
            <Input
              value={form.title}
              onChange={(e) =>
                handleRequestChange("title", e.target.value)
              }
              placeholder="예: 유압호스 및 피팅류 구매요청의 건"
              className="h-9"
            />
          </FormField>

          <FormField label="팀명" required className="col-span-2">
            <Select
              value={form.teamName}
              onChange={(e) =>
                handleRequestChange("teamName", e.target.value)
              }
              className="h-9"
            >
              <option value="">팀 선택</option>
              <option value="BSC">BSC</option>
              <option value="MSS">MSS</option>
              <option value="EHC">EHC</option>
              <option value="T&P">T&P</option>
            </Select>
          </FormField>

          <FormField label="요청자" required className="col-span-2">
            <Input
              value={form.requester}
              onChange={(e) =>
                handleRequestChange("requester", e.target.value)
              }
              placeholder="요청자명"
              className="h-9"
            />
          </FormField>

          <FormField label="요청일" className="col-span-2">
            <Input
              type="date"
              value={form.requestDate}
              onChange={(e) =>
                handleRequestChange("requestDate", e.target.value)
              }
              className="h-9"
            />
          </FormField>

          <FormField label="필요일자" className="col-span-2">
            <Input
              type="date"
              value={form.requiredDate}
              onChange={(e) =>
                handleRequestChange("requiredDate", e.target.value)
              }
              className="h-9"
            />
          </FormField>

          <FormField label="비고" className="col-span-4">
            <Input
              value={form.memo}
              onChange={(e) =>
                handleRequestChange("memo", e.target.value)
              }
              placeholder="구매요청 특이사항"
              className="h-9"
            />
          </FormField>
        </div>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-100">발주 정보</h2>

          <Button type="button" onClick={handleAddOrder}>
            발주 추가
          </Button>
        </div>

        {form.orders.map((order, orderIndex) => (
          <OrderFormCard
            key={order.id}
            order={order}
            orderIndex={orderIndex}
            vendors={vendors}
            isVendorLoading={isVendorLoading}
            onOrderChange={handleOrderChange}
            onVendorInputChange={handleVendorInputChange}
            onVendorSelect={handleVendorSelect}
            onRemoveOrder={handleRemoveOrder}
            onAddOrderItem={handleAddOrderItem}
            onOrderItemChange={handleOrderItemChange}
            onRemoveOrderItem={handleRemoveOrderItem}
          />
        ))}
      </div>

      <div className="sticky bottom-0 flex justify-end gap-3 border-t border-gray-800 bg-black/90 py-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting || isCancelling}
        >
          취소
        </Button>

        <Button type="submit" disabled={isSubmitting || isCancelling}>
          {isSubmitting ? "저장 중..." : "저장"}
        </Button>
      </div>
    </form>
  );
}

function OrderFormCard({
  order,
  orderIndex,
  vendors,
  isVendorLoading,
  onOrderChange,
  onVendorInputChange,
  onVendorSelect,
  onRemoveOrder,
  onAddOrderItem,
  onOrderItemChange,
  onRemoveOrderItem,
}: {
  order: PurchaseOrderFormState;
  orderIndex: number;
  vendors: VendorOption[];
  isVendorLoading: boolean;
  onOrderChange: (
    orderId: string,
    key: keyof Omit<PurchaseOrderFormState, "id" | "items">,
    value: string | boolean
  ) => void;
  onVendorInputChange: (orderId: string, vendorName: string) => void;
  onVendorSelect: (orderId: string, vendor: VendorOption) => void;
  onRemoveOrder: (orderId: string) => void;
  onAddOrderItem: (orderId: string) => void;
  onOrderItemChange: (
    orderId: string,
    itemId: string,
    key: keyof Omit<PurchaseOrderItemFormState, "id">,
    value: string | boolean
  ) => void;
  onRemoveOrderItem: (orderId: string, itemId: string) => void;
}) {
  const isNewVendor =
    order.vendorName.trim().length > 0 && !order.vendorRecordId;

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-gray-900">
          발주 {orderIndex + 1}
        </h3>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onAddOrderItem(order.id)}
          >
            품목 추가
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => onRemoveOrder(order.id)}
          >
            발주 삭제
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <FormField label="거래처" className="col-span-3">
          <VendorCombobox
            orderId={order.id}
            value={order.vendorName}
            selectedVendorRecordId={order.vendorRecordId}
            vendors={vendors}
            isLoading={isVendorLoading}
            onInputChange={onVendorInputChange}
            onSelect={onVendorSelect}
          />
        </FormField>

        <FormField label="발주일" className="col-span-2">
          <Input
            type="date"
            value={order.orderDate}
            onChange={(e) =>
              onOrderChange(order.id, "orderDate", e.target.value)
            }
            className="h-9"
          />
        </FormField>

        <FormField label="예상 입고일" className="col-span-2">
          <Input
            type="date"
            value={order.expectedReceivingDate}
            onChange={(e) =>
              onOrderChange(
                order.id,
                "expectedReceivingDate",
                e.target.value
              )
            }
            className="h-9"
          />
        </FormField>

        <FormField label="입고확인자" className="col-span-2">
          <Input
            value={order.receivingChecker}
            onChange={(e) =>
              onOrderChange(
                order.id,
                "receivingChecker",
                e.target.value
              )
            }
            placeholder="예: 박종성"
            className="h-9"
          />
        </FormField>

        <FormField label="발주 비고" className="col-span-3">
          <Input
            value={order.memo}
            onChange={(e) =>
              onOrderChange(order.id, "memo", e.target.value)
            }
            placeholder="발주 특이사항"
            className="h-9"
          />
        </FormField>

        {isNewVendor ? (
          <>
            <FormField
              label="신규 거래처 사업자등록증 URL"
              required
              className="col-span-6"
            >
              <Input
                value={order.businessLicenseUrl}
                onChange={(e) =>
                  onOrderChange(
                    order.id,
                    "businessLicenseUrl",
                    e.target.value
                  )
                }
                placeholder="예: https://..."
                className="h-9"
              />
            </FormField>

            <FormField
              label="신규 거래처 통장사본 URL"
              required
              className="col-span-6"
            >
              <Input
                value={order.bankbookUrl}
                onChange={(e) =>
                  onOrderChange(order.id, "bankbookUrl", e.target.value)
                }
                placeholder="예: https://..."
                className="h-9"
              />
            </FormField>
          </>
        ) : null}
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full min-w-[1180px] text-sm">
          <thead className="bg-gray-100 text-xs text-gray-600">
            <tr>
              <th className="w-12 px-2 py-2 text-center">No.</th>
              <th className="px-2 py-2 text-left">발주상세 모델명</th>
              <th className="w-24 px-2 py-2 text-right">수량</th>
              <th className="w-32 px-2 py-2 text-right">단가</th>
              <th className="w-28 px-2 py-2 text-center">VAT</th>
              <th className="w-36 px-2 py-2 text-right">총액</th>
              <th className="w-56 px-2 py-2 text-left">비고</th>
              <th className="w-20 px-2 py-2 text-center">삭제</th>
            </tr>
          </thead>

          <tbody>
            {order.items.map((item, itemIndex) => (
              <OrderItemTableRow
                key={item.id}
                orderId={order.id}
                item={item}
                itemIndex={itemIndex}
                onOrderItemChange={onOrderItemChange}
                onRemoveOrderItem={onRemoveOrderItem}
              />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function VendorCombobox({
  orderId,
  value,
  selectedVendorRecordId,
  vendors,
  isLoading,
  onInputChange,
  onSelect,
}: {
  orderId: string;
  value: string;
  selectedVendorRecordId: string;
  vendors: VendorOption[];
  isLoading: boolean;
  onInputChange: (orderId: string, vendorName: string) => void;
  onSelect: (orderId: string, vendor: VendorOption) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const filteredVendors = useMemo(() => {
    const keyword = value.trim().toLowerCase();

    if (!keyword) {
      return vendors.slice(0, 20);
    }

    return vendors
      .filter((vendor) => vendor.name.toLowerCase().includes(keyword))
      .slice(0, 20);
  }, [value, vendors]);

  const selectedVendor = vendors.find(
    (vendor) => vendor.id === selectedVendorRecordId
  );

  const isNewVendor = value.trim().length > 0 && !selectedVendor;

  return (
    <div className="relative">
      <Input
        value={value}
        onFocus={() => setIsOpen(true)}
        onChange={(event) => {
          onInputChange(orderId, event.target.value);
          setIsOpen(true);
        }}
        placeholder={isLoading ? "거래처 불러오는 중..." : "거래처 검색/선택"}
        className="h-9 pr-8"
      />

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500"
      >
        ▼
      </button>

      {selectedVendor ? (
        <div className="mt-1 text-[11px] text-green-600">
          선택됨: {selectedVendor.name}
        </div>
      ) : isNewVendor ? (
        <div className="mt-1 text-[11px] leading-4 text-blue-600">
          신규 거래처가 생성됩니다.
          사업자등록증 URL과 통장사본 URL을 입력해야 저장됩니다.
        </div>
      ) : null}

      {isOpen && filteredVendors.length > 0 ? (
        <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {filteredVendors.map((vendor) => (
            <button
              key={vendor.id}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                onSelect(orderId, vendor);
                setIsOpen(false);
              }}
              className="block w-full px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-100"
            >
              {vendor.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function OrderItemTableRow({
  orderId,
  item,
  itemIndex,
  onOrderItemChange,
  onRemoveOrderItem,
}: {
  orderId: string;
  item: PurchaseOrderItemFormState;
  itemIndex: number;
  onOrderItemChange: (
    orderId: string,
    itemId: string,
    key: keyof Omit<PurchaseOrderItemFormState, "id">,
    value: string | boolean
  ) => void;
  onRemoveOrderItem: (orderId: string, itemId: string) => void;
}) {
  const totalAmount = calculateVatIncludedAmount({
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    vatIncluded: item.vatIncluded,
  });

  return (
    <tr className="border-t border-gray-100 bg-white">
      <td className="px-2 py-1 text-center text-gray-500">
        {itemIndex + 1}
      </td>

      <td className="px-2 py-1">
        <Input
          value={item.modelName}
          onChange={(e) =>
            onOrderItemChange(
              orderId,
              item.id,
              "modelName",
              e.target.value
            )
          }
          placeholder="모델명 또는 품명"
          className="h-8"
        />
      </td>

      <td className="px-2 py-1">
        <Input
          type="number"
          min="0"
          value={item.quantity}
          onChange={(e) =>
            onOrderItemChange(
              orderId,
              item.id,
              "quantity",
              e.target.value
            )
          }
          className="h-8 text-right"
        />
      </td>

      <td className="px-2 py-1">
        <Input
          type="number"
          min="0"
          value={item.unitPrice}
          onChange={(e) =>
            onOrderItemChange(
              orderId,
              item.id,
              "unitPrice",
              e.target.value
            )
          }
          placeholder="0"
          className="h-8 text-right"
        />
      </td>

      <td className="px-2 py-1 text-center">
        <label className="inline-flex items-center gap-1 text-xs text-gray-700">
          <input
            type="checkbox"
            checked={item.vatIncluded}
            onChange={(e) =>
              onOrderItemChange(
                orderId,
                item.id,
                "vatIncluded",
                e.target.checked
              )
            }
          />
          포함
        </label>
      </td>

      <td className="px-2 py-1">
        <div className="flex h-8 items-center justify-end rounded-md border border-gray-200 bg-gray-50 px-2 font-medium text-gray-900">
          {totalAmount.toLocaleString()}원
        </div>
      </td>

      <td className="px-2 py-1">
        <Input
          value={item.memo}
          onChange={(e) =>
            onOrderItemChange(orderId, item.id, "memo", e.target.value)
          }
          placeholder="품목 비고"
          className="h-8"
        />
      </td>

      <td className="px-2 py-1 text-center">
        <button
          type="button"
          onClick={() => onRemoveOrderItem(orderId, item.id)}
          className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100"
        >
          삭제
        </button>
      </td>
    </tr>
  );
}

function FormField({
  label,
  required = false,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <p className="mb-1 text-xs font-medium text-gray-700">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </p>

      {children}
    </label>
  );
}