import { SagaExecutionTrace } from "../trace/trace.js";

export interface SagaLogger {
  log(trace: SagaExecutionTrace): void;
}
