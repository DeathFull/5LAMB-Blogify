export type HttpApiEvent = {
  rawPath?: string;
  body?: string | null;
  headers?: Record<string, string | undefined>;
  requestContext: {
    http: {
      method: string;
      path?: string;
    };
  };
};

export type HttpApiResponse = {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
};
