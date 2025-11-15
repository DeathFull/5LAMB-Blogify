import buildJsonResponse from "../helpers/buildJsonResponse";
import { HttpApiEvent, HttpApiResponse } from "../types/httpTypes";
import { verifyJwt } from "../helpers/verifyJwt";
import { validateCreateMediaPayload } from "../middleware/media/validateMediaPayload";
import { s3Client } from "../config/s3Client";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { dynamoDbDocumentClient } from "../config/dynamoDbClient";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { MediaItem } from "../types/mediaTypes";
import { PostItem } from "../types/postTypes";
import { canModifyPost } from "../middleware/posts/canModifyPost";

const MEDIA_BUCKET = process.env.MEDIA_BUCKET;
const MEDIA_TABLE = process.env.MEDIA_TABLE;
const POSTS_TABLE = process.env.POSTS_TABLE;

export async function createMedia(
  event: HttpApiEvent,
): Promise<HttpApiResponse> {
  if (!MEDIA_BUCKET || !MEDIA_TABLE) {
    return buildJsonResponse(500, {
      message:
        "Server configuration error: MEDIA_BUCKET or MEDIA_TABLE is not set",
    });
  }

  const authResult = verifyJwt(event);
  if (!authResult.ok) {
    return buildJsonResponse(authResult.statusCode, {
      message: authResult.message,
    });
  }

  const user = authResult.user;

  const validationResult = validateCreateMediaPayload(event.body ?? null);

  if (!validationResult.ok) {
    return buildJsonResponse(400, {
      message: validationResult.message,
    });
  }

  const { fileName, mimeType, fileSize, type, postId } = validationResult.value;

  if (postId) {
    if (!POSTS_TABLE) {
      return buildJsonResponse(500, {
        message: "Server configuration error: POSTS_TABLE is not set",
      });
    }

    try {
      const postResult = await dynamoDbDocumentClient.send(
        new GetCommand({
          TableName: POSTS_TABLE,
          Key: { postId },
        }),
      );

      if (!postResult.Item) {
        return buildJsonResponse(400, {
          message: "Cannot attach media: target post does not exist",
        });
      }

      const post = postResult.Item as PostItem;

      const permission = canModifyPost(user, post);
      if (!permission.ok) {
        return buildJsonResponse(403, {
          message: "You do not have permission to attach media to this post",
        });
      }
    } catch (error) {
      console.error("Error validating post in createMedia:", error);
      return buildJsonResponse(500, {
        message:
          "An unexpected error occurred while validating the target post",
      });
    }
  }

  const mediaId = randomUUID();
  const safeFileName = fileName.replace(/\s+/g, "-");
  const bucketKeyParts = [user.userId, mediaId, safeFileName].filter(Boolean);
  const bucketKey = bucketKeyParts.join("/");

  const now = new Date().toISOString();

  const mediaItem: MediaItem = {
    mediaId,
    ownerId: user.userId,
    postId,
    type,
    mimeType,
    fileName,
    fileSize,
    bucketKey,
    createdAt: now,
  };

  try {
    await dynamoDbDocumentClient.send(
      new PutCommand({
        TableName: MEDIA_TABLE,
        Item: mediaItem,
        ConditionExpression: "attribute_not_exists(mediaId)",
      }),
    );

    const putCommand = new PutObjectCommand({
      Bucket: MEDIA_BUCKET,
      Key: bucketKey,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(s3Client, putCommand, {
      expiresIn: 15 * 60,
    });

    return buildJsonResponse(201, {
      uploadUrl,
      media: mediaItem,
    });
  } catch (error) {
    console.error("Error in createMedia:", error);

    return buildJsonResponse(500, {
      message:
        "An unexpected error occurred while preparing media upload (metadata)",
    });
  }
}

export async function getMedia(event: HttpApiEvent): Promise<HttpApiResponse> {
  if (!MEDIA_BUCKET || !MEDIA_TABLE) {
    return buildJsonResponse(500, {
      message:
        "Server configuration error: MEDIA_BUCKET or MEDIA_TABLE is not set",
    });
  }

  const mediaId = event.pathParameters?.mediaId;

  if (!mediaId) {
    return buildJsonResponse(400, {
      message: "mediaId path parameter is required",
    });
  }

  try {
    const result = await dynamoDbDocumentClient.send(
      new GetCommand({
        TableName: MEDIA_TABLE,
        Key: { mediaId },
      }),
    );

    if (!result.Item) {
      return buildJsonResponse(404, {
        message: "Media not found",
      });
    }

    const media = result.Item as MediaItem;

    const getCommand = new GetObjectCommand({
      Bucket: MEDIA_BUCKET,
      Key: media.bucketKey,
    });

    const downloadUrl = await getSignedUrl(s3Client, getCommand, {
      expiresIn: 15 * 60,
    });

    const response: HttpApiResponse = {
      statusCode: 302,
      headers: {
        Location: downloadUrl,
      },
      body: "",
    };

    return response;
  } catch (error) {
    console.error("Error in getMedia:", error);

    return buildJsonResponse(500, {
      message: "An unexpected error occurred while preparing media download",
    });
  }
}
