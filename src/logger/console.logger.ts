import { SagaExecutionTrace } from "../trace/trace.js";
import { SagaLogger } from "./logger.interface.js";

export class ConsoleSagaLogger implements SagaLogger {
  log(trace: SagaExecutionTrace): void {
    console.log("Saga Trace", JSON.stringify(trace, null, 2));
  }
}
