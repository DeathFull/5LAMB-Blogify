import buildJsonResponse from "../helpers/buildJsonResponse";
import { HttpApiEvent, HttpApiResponse } from "../types/httpTypes";
import { dynamoDbDocumentClient } from "../config/dynamoDbClient";
import { QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import validateRegisterPayload from "../middleware/auth/validateRegisterPayload";
import { UserItem } from "../types/userTypes";
import { validateLoginPayload } from "../middleware/auth/validateLoginPayload";

const USERS_TABLE = process.env.USERS_TABLE;
const JWT_SECRET = process.env.JWT_SECRET;

export async function registerUser(
  event: HttpApiEvent,
): Promise<HttpApiResponse> {
  if (!USERS_TABLE) {
    return buildJsonResponse(500, {
      message: "Server configuration error: USERS_TABLE is not set",
    });
  }

  const validateResult = validateRegisterPayload(event.body ?? null);

  if (!validateResult.ok) {
    return buildJsonResponse(400, {
      message: validateResult.message,
    });
  }

  const { email, password, name } = validateResult.value;

  try {
    const existingUser = await dynamoDbDocumentClient.send(
      new QueryCommand({
        TableName: USERS_TABLE,
        IndexName: "email-index",
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: {
          ":email": email,
        },
        Limit: 1,
      }),
    );

    if ((existingUser.Count ?? 0) > 0) {
      return buildJsonResponse(409, {
        message: "A user with this email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const now = new Date().toISOString();
    const userId = randomUUID();

    const userItem: UserItem = {
      userId,
      email,
      passwordHash,
      name,
      role: "AUTHOR",
      createdAt: now,
      updatedAt: now,
    };

    await dynamoDbDocumentClient.send(
      new PutCommand({
        TableName: USERS_TABLE,
        Item: userItem,
        ConditionExpression: "attribute_not_exists(userId)",
      }),
    );

    return buildJsonResponse(201, {
      userId,
      email,
      name,
      role: "AUTHOR",
      createdAt: now,
    });
  } catch (error) {
    console.log("Error in registerUser:", error);

    return buildJsonResponse(500, {
      message: "An unexpected error occurred while registering the user",
    });
  }
}

export async function loginUser(event: HttpApiEvent): Promise<HttpApiResponse> {
  if (!USERS_TABLE || !JWT_SECRET) {
    return buildJsonResponse(500, {
      message: "Server configuration error: USERS_TABLE or JWT_SECRET not set",
    });
  }

  const validationResult = validateLoginPayload(event.body ?? null);

  if (!validationResult.ok) {
    return buildJsonResponse(400, {
      message: validationResult.message,
    });
  }

  const { email, password } = validationResult;

  try {
    const existingUser = await dynamoDbDocumentClient.send(
      new QueryCommand({
        TableName: USERS_TABLE,
        IndexName: "email-index",
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: {
          ":email": email,
        },
        Limit: 1,
      }),
    );

    if (!existingUser.Items || existingUser.Items.length === 0) {
      return buildJsonResponse(401, {
        message: "Invalid email or password",
      });
    }

    const user = existingUser.Items[0] as UserItem;
    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return buildJsonResponse(401, {
        message: "Invalid email or password",
      });
    }

    const tokenPayload = {
      sub: user.userId,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "1h" });

    return buildJsonResponse(200, {
      token,
      user: {
        userId: user.userId,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.log("Error in loginUser:", error);

    return buildJsonResponse(500, {
      message: "An unexpected error occurred while logging in",
    });
  }
}
