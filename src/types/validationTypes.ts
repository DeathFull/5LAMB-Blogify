import { MediaType } from "./mediaTypes";
import { RegisterUserPayload } from "./userTypes";

export type LoginValid = {
  ok: true;
  email: string;
  password: string;
};

export type RegistrationValid = {
  ok: true;
  value: Required<Pick<RegisterUserPayload, "email" | "password">> & {
    name?: string;
  };
};

export type RequireRoleSuccess = {
  ok: true;
};

export type CreatePostValid = {
  ok: true;
  value: {
    title: string;
    content: string;
  };
};

export type UpdatePostValid = {
  ok: true;
  value: {
    title?: string;
    content?: string;
  };
};
export type CreateMediaValid = {
  ok: true;
  value: {
    fileName: string;
    mimeType: string;
    fileSize: number;
    type: MediaType;
    postId?: string;
  };
};

export type RequestFailure = {
  ok: false;
  message: string;
};

export type CreateMediaResult = CreateMediaValid | RequestFailure;

export type UpdatePostResult = UpdatePostValid | RequestFailure;

export type CreatePostResult = CreatePostValid | RequestFailure;

export type LoginResult = LoginValid | RequestFailure;

export type RegistrationResult = RegistrationValid | RequestFailure;

export type RequireRoleResult = RequireRoleSuccess | RequestFailure;
