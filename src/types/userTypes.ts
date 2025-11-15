export type UserRole = "ADMIN" | "EDITOR" | "AUTHOR";

export type RegisterUserPayload = {
  email?: string;
  password?: string;
  name?: string;
};

export type UserItem = {
  userId: string;
  email: string;
  passwordHash: string;
  name?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

export type AuthenticatedUser = {
  userId: string;
  email: string;
  role: UserRole;
};
