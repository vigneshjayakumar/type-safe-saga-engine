import * as TP from "../types/types.js";
import { SagaLogger } from "../logger/logger.interface.js";
import { TraceBuilder } from "../trace/trace-builder.js";

export class SagaEngine<
  T extends Record<string, object>,
  E extends Partial<Record<keyof T, object>> = {},
> {
  private middlewares = new Map<keyof T, Array<(payload: any) => any>>();
  private handlers = new Map<
    keyof T,
    Array<(payload: any) => void | Promise<void>>
  >();

  constructor(private logger?: SagaLogger) {}

  // middleware function.
  use<K extends keyof T, M extends object>(
    eventName: K,
    middleware: (
      payload: T[K] & (E[K] extends object ? E[K] : {}),
    ) => TP.TPromiseOrNot<TP.TErrorMessage<TP.TNoOverlap<E[K], M>>>,
  ): SagaEngine<T, TP.TMergeBaseExtra<T, E, K, M>> {
    const list = this.middlewares.get(eventName) ?? [];

    list.push(middleware);
    this.middlewares.set(eventName, list);

    return this as unknown as SagaEngine<T, TP.TMergeBaseExtra<T, E, K, M>>;
  }

  // handler function
  on<K extends keyof T>(
    eventName: K,
    handler: (payload: T[K]) => void | Promise<void>,
  ) {
    const list = this.handlers.get(eventName) ?? [];
    list.push(handler);
    this.handlers.set(eventName, list);
  }

  // final execution of middleware
  async emit<K extends keyof T>(eventName: K, payload: T[K]) {
    const trace = new TraceBuilder(eventName.toString());
    let finalPayload = { ...payload };
    const compensation: Array<{ fn: () => Promise<void>; name: string }> = [];

    const mws = this.middlewares.get(eventName) ?? [];
    for (const mw of mws) {
      const step = trace.startStep(mw.name || "anonymous");

      let extra: TP.TErrorMessage<any>;

      try {
        extra = await mw(finalPayload);
        trace.endStep(step, "SUCCESS");
      } catch (err: any) {
        trace.endStep(step, "ERROR");
        trace.fail(mw.name || "anonymous", err?.message || "unknown");

        await this.runRollback(compensation, trace);

        trace.complete();
        this.logger?.log(trace.trace);

        return {
          status: "error" as const,
          error: err,
          payload: finalPayload,
        };
      }

      // check the status and manage rollback compensation.
      switch (extra.status) {
        case "continue":
          const conti = extra as TP.TContinueWith<any>;

          if (extra.compensate) {
            compensation.push({
              fn: () => Promise.resolve(conti.compensate!(finalPayload)),
              name: mw.name || "anonymous",
            });
          }

          finalPayload = { ...finalPayload, ...extra.data };
          break;

        case "stop":
          trace.endStep(step, "STOPPED");
          trace.stop();

          await this.runRollback(compensation, trace);

          trace.complete();
          this.logger?.log(trace.trace);

          return {
            status: "stop" as const,
            reason: extra.reason,
            payload: finalPayload,
          };
        case "error":
          trace.endStep(step, "ERROR");
          trace.fail(mw.name || "anonymous", "error event");

          await this.runRollback(compensation, trace);

          trace.complete();
          this.logger?.log(trace.trace);

          return {
            status: "error" as const,
            error: extra.error,
            payload: finalPayload,
          };
          break;
      }
    }

    const hws = this.handlers.get(eventName) ?? [];
    const frozenPayload = Object.freeze({ ...finalPayload });

    for (const hw of hws) {
      await hw(frozenPayload);
    }
    trace.complete();
    this.logger?.log(trace.trace);

    return finalPayload;
  }

  private runRollback = async (
    compensation: Array<{ fn: () => Promise<void>; name: string }>,
    trace: TraceBuilder,
  ) => {
    for (let i = compensation.length - 1; i >= 0; i--) {
      const { fn, name } = compensation[i]!;
      const rb = trace.startRollback(name);

      try {
        await fn();
        trace.endRollback(rb, "SUCCESS");
      } catch (err) {
        trace.endRollback(rb, "FAILED");
        console.log("Error While rollback", err);
      }
    }
  };
}

export const continueWith = <T extends object>(
  payload: T,
  compensate?: (payload: any) => void | Promise<void>,
): TP.TErrorMessage<T> =>
  ({
    status: "continue",
    data: payload,
    ...(compensate && { compensate }),
  }) as const;

export const stopEvent = (reason: string): TP.TErrorMessage<{}> =>
  ({
    status: "stop",
    reason,
  }) as const;

export const errorEvent = (error: unknown): TP.TErrorMessage<{}> =>
  ({
    status: "error",
    error,
  }) as const;
