import serverless from "serverless-http";
import app from "../../server.js";

// Export Lambda function handler
export const handler = serverless(app);