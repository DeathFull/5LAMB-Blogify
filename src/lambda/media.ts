import buildJsonResponse from "../helpers/buildJsonResponse";
import { HttpApiEvent, HttpApiResponse } from "../types/httpTypes";
import { verifyJwt } from "../helpers/verifyJwt";

export async function createMedia(
  event: HttpApiEvent,
): Promise<HttpApiResponse> {
  const authResult = verifyJwt(event);

  if (!authResult.ok) {
    return buildJsonResponse(authResult.statusCode, {
      message: authResult.message,
    });
  }

  const user = authResult.user;

  return buildJsonResponse(201, {
    message: "createMedia - not implemented yet",
    debug: {
      userId: user.userId,
      email: user.email,
      role: user.role,
    },
  });
}

export async function getMedia(event: HttpApiEvent): Promise<HttpApiResponse> {
  const mediaId = event.pathParameters?.mediaId;

  return buildJsonResponse(200, {
    message: "getMedia - not implemented yet",
    debug: {
      mediaId,
      method: event.requestContext.http.method,
      path: event.rawPath,
    },
  });
}
