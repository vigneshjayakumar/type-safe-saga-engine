export type SagaExecutionStatus = "SUCCESS" | "FAILED" | "STOPPED";

export type MiddlewareTrace = {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: "SUCCESS" | "ERROR" | "STOPPED";
};

export type RollbackTrace = {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: "SUCCESS" | "FAILED";
};

export type SagaExecutionTrace = {
  executionId: string;
  eventName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: SagaExecutionStatus;
  steps: MiddlewareTrace[];
  rollbackSteps: RollbackTrace[];

  error?: {
    step: string;
    message: string;
  };
};
