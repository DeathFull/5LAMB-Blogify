import { CreateMediaPayload } from "../../types/mediaTypes";
import {
  CreateMediaResult,
  CreateMediaValid,
  RequestFailure,
} from "../../types/validationTypes";

export function validateCreateMediaPayload(
  body: string | null | undefined,
): CreateMediaResult {
  if (!body) {
    const result: RequestFailure = {
      ok: false,
      message: "Request body is required",
    };
    return result;
  }

  let parsed: CreateMediaPayload;
  try {
    parsed = JSON.parse(body);
  } catch {
    const result: RequestFailure = {
      ok: false,
      message: "Invalid JSON body",
    };
    return result;
  }

  const fileName = parsed.fileName?.trim();
  const mimeType = parsed.mimeType?.trim();
  const fileSize = parsed.fileSize;
  const type = parsed.type ?? "IMAGE";
  const postId = parsed.postId?.trim();

  if (!fileName) {
    const result: RequestFailure = {
      ok: false,
      message: "fileName is required",
    };
    return result;
  }

  if (!mimeType) {
    const result: RequestFailure = {
      ok: false,
      message: "mimeType is required",
    };
    return result;
  }

  if (!fileSize || fileSize <= 0) {
    const result: RequestFailure = {
      ok: false,
      message: "fileSize must be a positive number",
    };
    return result;
  }

  const valid: CreateMediaValid = {
    ok: true,
    value: {
      fileName,
      mimeType,
      fileSize,
      type,
      postId,
    },
  };

  return valid;
}
