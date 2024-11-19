export type ResponseMetrics = {
  firstTokenTime: number;
  responseTime: number;
  inputTokens: number;
  outputTokens: number;
  cost?: number;
};
