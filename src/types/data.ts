// Return type for async requests
export interface GenericAsyncReturnType {
  success: boolean;
  error: Error | null;
}

// Server side and cloud functions
export type FunctionsResponse<Data = any, TError = string> = {
  success: boolean;
  data: Data | null;
  error: TError | null;
};

/** As coming from Segment */
export interface EventTrigger {
  event: string;
  context: any;
  properties: any;
  timestamp: number;
}
