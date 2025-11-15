import { HttpApiResponse } from "../types/httpTypes";

export default function buildJsonResponse(
  statusCode: number,
  data: unknown,
): HttpApiResponse {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };
}
