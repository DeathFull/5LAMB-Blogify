import { AuthenticatedUser } from "./userTypes";

export type VerifyJwtSuccess = {
  ok: true;
  user: AuthenticatedUser;
};

export type VerifyJwtFailure = {
  ok: false;
  statusCode: number;
  message: string;
};
