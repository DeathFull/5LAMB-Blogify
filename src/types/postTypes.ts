export type PostStatus = "DRAFT" | "PUBLISHED";

export type CreatePostPayload = {
  title?: string;
  content?: string;
};

export type PostItem = {
  postId: string;
  authorId: string;
  title: string;
  content: string;
  status: PostStatus;
  createdAt: string;
  updatedAt: string;
};
