// AUTO-GENERATED from server/box-assets.json by npm run box:assets.
// Box object IDs are not secrets. Do not edit by hand.
export interface BoxFileAsset { fileId: string; versionId: string | null; folderId: string; metadata: Record<string,string>; }
export const BOX_ROOT_FOLDER_ID = "428498300549";
export const BOX_ENTERPRISE_SCOPE = "enterprise_1559749886";
export const BOX_FILES: Record<string, BoxFileAsset> = {
  "Atlas_PSU_Supply_Agreement_APC-2025-017.pdf": {
    "fileId": "2533180220614",
    "versionId": "2810947744387",
    "folderId": "428499172039",
    "metadata": {
      "documentType": "SupplyAgreement",
      "contractId": "APC-2025-017",
      "supplierId": "SUP-ATLAS",
      "oemPartNumber": "PSU-750",
      "supplierPartNumber": "AP-750R2",
      "productModel": "R500",
      "reviewStatus": "ReviewerConfirmed",
      "confidentiality": "Confidential"
    }
  },
  "Atlas_PSU_Amendment_01_APC-2025-017.pdf": {
    "fileId": "2533178075488",
    "versionId": "2810946726688",
    "folderId": "428499172039",
    "metadata": {
      "documentType": "ContractAmendment",
      "contractId": "APC-2025-017",
      "supplierId": "SUP-ATLAS",
      "oemPartNumber": "PSU-750",
      "supplierPartNumber": "AP-750R2",
      "reviewStatus": "ReviewerConfirmed",
      "confidentiality": "Confidential"
    }
  },
  "SIG-2026-009_Warranty_Trend_Report.pdf": {
    "fileId": "2533171981920",
    "versionId": "2810940251520",
    "folderId": "428499666465",
    "metadata": {
      "documentType": "WarrantyTrendReport",
      "signalId": "SIG-2026-009",
      "productModel": "R500",
      "oemPartNumber": "PSU-750",
      "reviewStatus": "Candidate",
      "confidentiality": "Internal"
    }
  },
  "SIG-2026-009_R500_PSU_Engineering_Report.pdf": {
    "fileId": "2533181230836",
    "versionId": "2810949601236",
    "folderId": "428499666465",
    "metadata": {
      "documentType": "EngineeringReport",
      "signalId": "SIG-2026-009",
      "productModel": "R500",
      "oemPartNumber": "PSU-750",
      "supplierPartNumber": "AP-750R2",
      "reviewStatus": "ReviewerConfirmed",
      "confidentiality": "Internal"
    }
  },
  "SIG-2026-009_Traceability_Matrix.xlsx": {
    "fileId": "2533175958176",
    "versionId": "2810944388576",
    "folderId": "428499666465",
    "metadata": {
      "documentType": "TraceabilityMatrix",
      "signalId": "SIG-2026-009",
      "productModel": "R500",
      "oemPartNumber": "PSU-750",
      "supplierPartNumber": "AP-750R2",
      "reviewStatus": "Candidate",
      "confidentiality": "Internal"
    }
  },
  "WR-10482_Evidence_Packet.pdf": {
    "fileId": "2533181447204",
    "versionId": "2810950091204",
    "folderId": "428499666465",
    "metadata": {
      "documentType": "ClaimEvidencePacket",
      "signalId": "SIG-2026-009",
      "claimId": "WR-10482",
      "productModel": "R500",
      "oemPartNumber": "PSU-750",
      "supplierPartNumber": "AP-750R2",
      "componentSerialNumber": "NS-PSU-10482",
      "lotNumber": "ATL-24-118",
      "reviewStatus": "ReviewerConfirmed",
      "confidentiality": "Internal"
    }
  }
};
export function openInBoxUrl(fileId: string): string { return `https://app.box.com/file/${fileId}`; }
