type HttpApiEvent = unknown;

const json = (statusCode: number, data: unknown) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});

export const handler = async (_event: HttpApiEvent) => {
  return json(200, { message: "This worked !" });
};
