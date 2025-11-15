export type MediaType = "IMAGE" | "VIDEO" | "OTHER";

export type MediaItem = {
  mediaId: string;
  ownerId: string;
  postId?: string;
  type: MediaType;
  mimeType: string;
  fileName: string;
  fileSize: number;
  bucketKey: string;
  createdAt: string;
};

export type CreateMediaPayload = {
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  type?: MediaType;
  postId?: string;
};
