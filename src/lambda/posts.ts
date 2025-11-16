import buildJsonResponse from "../helpers/buildJsonResponse";
import { HttpApiEvent, HttpApiResponse } from "../types/httpTypes";
import { verifyJwt } from "../helpers/verifyJwt";
import {
  validateCreatePostPayload,
  validateUpdatePostPayload,
} from "../middleware/posts/validatePostPayload";
import { dynamoDbDocumentClient } from "../config/dynamoDbClient";
import {
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { PostItem } from "../types/postTypes";
import { randomUUID } from "crypto";
import { canModifyPost } from "../middleware/posts/canModifyPost";

const POSTS_TABLE = process.env.POSTS_TABLE;

export async function createPost(
  event: HttpApiEvent,
): Promise<HttpApiResponse> {
  if (!POSTS_TABLE) {
    return buildJsonResponse(500, {
      message: "Server configuration error: POSTS_TABLE is not set",
    });
  }

  const authResult = verifyJwt(event);

  if (!authResult.ok) {
    return buildJsonResponse(authResult.statusCode, {
      message: authResult.message,
    });
  }

  const user = authResult.user;

  const validationResult = validateCreatePostPayload(event.body ?? null);

  if (!validationResult.ok) {
    return buildJsonResponse(400, {
      message: validationResult.message,
    });
  }

  const { title, content } = validationResult.value;

  const now = new Date().toISOString();
  const postId = randomUUID();

  const postItem: PostItem = {
    postId,
    authorId: user.userId,
    title,
    content,
    status: "PUBLISHED",
    createdAt: now,
    updatedAt: now,
  };

  try {
    await dynamoDbDocumentClient.send(
      new PutCommand({
        TableName: POSTS_TABLE,
        Item: postItem,
        ConditionExpression: "attribute_not_exists(postId)",
      }),
    );

    return buildJsonResponse(201, {
      postId,
      authorId: postItem.authorId,
      title: postItem.title,
      content: postItem.content,
      status: postItem.status,
      createdAt: postItem.createdAt,
      updatedAt: postItem.updatedAt,
    });
  } catch (error) {
    console.error("Error in createPost:", error);

    return buildJsonResponse(500, {
      message: "An unexpected error occurred while creating the post",
    });
  }
}

export async function getPost(event: HttpApiEvent): Promise<HttpApiResponse> {
  if (!POSTS_TABLE) {
    return buildJsonResponse(500, {
      message: "Server configuration error: POSTS_TABLE is not set",
    });
  }

  const postId = event.pathParameters?.postId;

  if (!postId) {
    return buildJsonResponse(400, {
      message: "postId path parameter is required",
    });
  }

  try {
    const result = await dynamoDbDocumentClient.send(
      new GetCommand({
        TableName: POSTS_TABLE,
        Key: { postId },
      }),
    );

    if (!result.Item) {
      return buildJsonResponse(404, {
        message: "Post not found",
      });
    }

    const post = result.Item as PostItem;

    return buildJsonResponse(200, {
      postId: post.postId,
      authorId: post.authorId,
      title: post.title,
      content: post.content,
      status: post.status,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    });
  } catch (error) {
    console.error("Error in getPost:", error);

    return buildJsonResponse(500, {
      message: "An unexpected error occurred while fetching the post",
    });
  }
}

export async function listPosts(event: HttpApiEvent): Promise<HttpApiResponse> {
  if (!POSTS_TABLE) {
    return buildJsonResponse(500, {
      message: "Server configuration error: POSTS_TABLE is not set",
    });
  }

  const queryParams = event.queryStringParameters ?? {};
  const query = queryParams.q?.trim();
  const limitRaw = queryParams.limit;

  let limit: number | undefined;
  if (limitRaw) {
    const parsed = Number.parseInt(limitRaw, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      limit = parsed;
    }
  }

  const scanInput: any = {
    TableName: POSTS_TABLE,
  };

  if (limit) {
    scanInput.Limit = limit;
  }

  if (query && query.length > 0) {
    scanInput.FilterExpression =
      "(contains(#title, :q) OR contains(#content, :q))";
    scanInput.ExpressionAttributeNames = {
      "#title": "title",
      "#content": "content",
    };
    scanInput.ExpressionAttributeValues = {
      ":q": query,
    };
  }

  try {
    const result = await dynamoDbDocumentClient.send(
      new ScanCommand(scanInput),
    );

    const items = (result.Items ?? []) as PostItem[];

    return buildJsonResponse(200, {
      items,
      count: items.length,
    });
  } catch (error) {
    console.log("Error in listPosts:", error);

    return buildJsonResponse(500, {
      message: "An unexpected error occurred while listing posts",
    });
  }
}

export async function updatePost(
  event: HttpApiEvent,
): Promise<HttpApiResponse> {
  if (!POSTS_TABLE) {
    return buildJsonResponse(500, {
      message: "Server configuration error: POSTS_TABLE is not set",
    });
  }

  const authResult = verifyJwt(event);
  if (!authResult.ok) {
    return buildJsonResponse(authResult.statusCode, {
      message: authResult.message,
    });
  }

  const user = authResult.user;
  const postId = event.pathParameters?.postId;

  if (!postId) {
    return buildJsonResponse(400, {
      message: "postId path parameter is required",
    });
  }

  const validationResult = validateUpdatePostPayload(event.body ?? null);

  if (!validationResult.ok) {
    return buildJsonResponse(400, {
      message: validationResult.message,
    });
  }

  const { title, content } = validationResult.value;

  try {
    const existing = await dynamoDbDocumentClient.send(
      new GetCommand({
        TableName: POSTS_TABLE,
        Key: { postId },
      }),
    );

    if (!existing.Item) {
      return buildJsonResponse(404, {
        message: "Post not found",
      });
    }

    const post = existing.Item as PostItem;

    const permission = canModifyPost(user, post);
    if (!permission.ok) {
      return buildJsonResponse(403, {
        message: permission.message,
      });
    }

    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, unknown> = {};

    if (title !== undefined) {
      updateExpressions.push("#title = :title");
      expressionAttributeNames["#title"] = "title";
      expressionAttributeValues[":title"] = title;
    }

    if (content !== undefined) {
      updateExpressions.push("#content = :content");
      expressionAttributeNames["#content"] = "content";
      expressionAttributeValues[":content"] = content;
    }

    updateExpressions.push("#updatedAt = :updatedAt");
    expressionAttributeNames["#updatedAt"] = "updatedAt";
    expressionAttributeValues[":updatedAt"] = new Date().toISOString();

    const updateExpression = "SET " + updateExpressions.join(", ");

    const updated = await dynamoDbDocumentClient.send(
      new UpdateCommand({
        TableName: POSTS_TABLE,
        Key: { postId },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW",
      }),
    );

    const updatedPost = updated.Attributes as PostItem;

    return buildJsonResponse(200, {
      postId: updatedPost.postId,
      authorId: updatedPost.authorId,
      title: updatedPost.title,
      content: updatedPost.content,
      status: updatedPost.status,
      createdAt: updatedPost.createdAt,
      updatedAt: updatedPost.updatedAt,
    });
  } catch (error) {
    console.log("Error in updatePost:", error);

    return buildJsonResponse(500, {
      message: "An unexpected error occurred while updating the post",
    });
  }
}

export async function deletePost(
  event: HttpApiEvent,
): Promise<HttpApiResponse> {
  if (!POSTS_TABLE) {
    return buildJsonResponse(500, {
      message: "Server configuration error: POSTS_TABLE is not set",
    });
  }

  const authResult = verifyJwt(event);
  if (!authResult.ok) {
    return buildJsonResponse(authResult.statusCode, {
      message: authResult.message,
    });
  }

  const user = authResult.user;
  const postId = event.pathParameters?.postId;

  if (!postId) {
    return buildJsonResponse(400, {
      message: "postId path parameter is required",
    });
  }

  try {
    const existing = await dynamoDbDocumentClient.send(
      new GetCommand({
        TableName: POSTS_TABLE,
        Key: { postId },
      }),
    );

    if (!existing.Item) {
      return buildJsonResponse(404, {
        message: "Post not found",
      });
    }

    const post = existing.Item as PostItem;

    const permission = canModifyPost(user, post);
    if (!permission.ok) {
      return buildJsonResponse(403, {
        message: permission.message,
      });
    }

    await dynamoDbDocumentClient.send(
      new DeleteCommand({
        TableName: POSTS_TABLE,
        Key: { postId },
      }),
    );

    return buildJsonResponse(204, "");
  } catch (error) {
    console.log("Error in deletePost:", error);

    return buildJsonResponse(500, {
      message: "An unexpected error occurred while deleting the post",
    });
  }
}
