import { RegisterUserPayload } from "./userTypes";

export type LoginValid = {
  ok: true;
  email: string;
  password: string;
};

export type LoginInvalid = {
  ok: false;
  message: string;
};

export type RegistrationValid = {
  ok: true;
  value: Required<Pick<RegisterUserPayload, "email" | "password">> & {
    name?: string;
  };
};

export type RegistrationInvalid = {
  ok: false;
  message: string;
};

export type RequireRoleSuccess = {
  ok: true;
};

export type RequireRoleFailure = {
  ok: false;
  message: string;
};

export type LoginResult = LoginValid | LoginInvalid;

export type RegistrationResult = RegistrationValid | RegistrationInvalid;

export type RequireRoleResult = RequireRoleSuccess | RequireRoleFailure;
