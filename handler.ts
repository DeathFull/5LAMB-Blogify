// import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
// import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

// const json = (statusCode: number, data: any) => ({
//   statusCode,
//   headers: {
//     "Content-Type": "application/json",
//     "Access-Control-Allow-Origin": "*",
//     "Access-Control-Allow-Headers": "Content-Type",
//     "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
//   },
//   body: JSON.stringify(data),
// });
//
// const handler = async (_event: Event) => {
//   return json(200, { message: "This worked !" });
// };
//
// export default handler;
