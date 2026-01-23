import { z } from 'zod';

export const refundRequestSchema = z.object({
  // Since we use parsing from FormData, we actually just need to validate
  // the extracted fields, but withValidation typically parses JSON.
  // The refund-request route uses FormData because of image upload.
  // We can't use withValidation middleware directly on FormData routes
  // unless we adapt it.
  // Wait, if the Original Route uses FormData, withValidation (which calls req.json) will FAIL.
  // We should NOT apply withValidation to routes consuming FormData.
  // We will instead use Zod inside the handler manually for these specific cases.
});

// Since the refund request handles file uploads, we'll stick to Zod validation inside the handler.
// But we can still export the schema here for consistency.

export const manualRefundValidation = z.object({
  orderId: z.string().min(1),
  reason: z.string().min(10),
  // File validation is separate
});
