export interface UploadSession {
  expirationDateTime?: Date | null;
  nextExpectedRanges?: string[] | null;
  odataType?: string | null;
  uploadUrl?: string | null;
}
