import { SagaExecutionTrace } from "./trace.js";

export class TraceBuilder {
  trace: SagaExecutionTrace;

  constructor(eventName: string) {
    this.trace = {
      executionId: crypto.randomUUID(),
      eventName: eventName.toString(),
      startTime: performance.now(),
      status: "SUCCESS",
      steps: [],
      rollbackSteps: [],
    };
  }

  startStep(name: string) {
    const step = {
      name,
      startTime: performance.now(),
      status: "SUCCESS" as const,
    };

    this.trace.steps.push(step);
    return step;
  }

  endStep(step: any, status: "SUCCESS" | "ERROR" | "STOPPED") {
    step.endTime = performance.now();
    step.duration = step.endTime - step.startTime;
    step.status = status;
  }

  startRollback(name: string) {
    const rb = {
      name,
      startTime: performance.now(),
      status: "SUCCESS" as const,
    };
    this.trace.rollbackSteps.push(rb);
    return rb;
  }

  endRollback(rb: any, status: "SUCCESS" | "FAILED") {
    rb.endTime = performance.now();
    rb.duration = rb.endTime - rb.startTime;
    rb.status = status;
  }

  fail(step: string, message: string) {
    this.trace.status = "FAILED";
    this.trace.error = { step, message };
  }

  stop() {
    this.trace.status = "STOPPED";
  }

  complete() {
    this.trace.endTime = performance.now();
    this.trace.duration = this.trace.endTime - this.trace.startTime;
  }
}
