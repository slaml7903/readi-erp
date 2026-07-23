import type { VendorDocument } from "../types/vendor.type";

export function createLatestVendorDocumentMap(documents: VendorDocument[]) {
  const map = new Map<string, VendorDocument>();

  documents.forEach((document) => {
    document.vendorRecordIds.forEach((vendorRecordId) => {
      const key = createVendorDocumentKey(vendorRecordId, document.type);
      const current = map.get(key);

      if (
        !current ||
        (document.registeredAt ?? "") > (current.registeredAt ?? "")
      ) {
        map.set(key, document);
      }
    });
  });

  return map;
}

export function createVendorDocumentKey(
  vendorRecordId: string,
  documentType: string
) {
  return `${vendorRecordId}:${documentType}`;
}
