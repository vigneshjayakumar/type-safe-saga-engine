import { continueWith, SagaEngine } from "./core/SagaEngine.js";
import { ConsoleSagaLogger } from "./logger/console.logger.js";
import { named } from "./utils/named.js";

type TEvents = {
  login: { userId: number };
  "create.invoice": { invoiceId: string };
};

const emitter = new SagaEngine<TEvents>(new ConsoleSagaLogger());

emitter
  .use(
    "login",
    named("user name", (payload) => ({
      status: "continue",
      data: { userName: "John Doe" },
    })),
  )
  .use(
    "login",
    named("User Phone Number", (payload) => {
      payload.userName;
      return { status: "continue", data: { phoneNumber: 999999999 } };
    }),
  )
  .use(
    "login",
    named("Is Email present", async () => {
      await new Promise((r) => setTimeout(r, 1000));
      return { status: "continue", data: { isEmail: false } };
    }),
  )
  .use(
    "login",
    named("Async Check", async (payload) => {
      // throw new Error("Failed to fetch lastLogin");
      return continueWith(
        { lastLogin: new Date() },
        () =>
          new Promise((r) =>
            setTimeout(() => console.log("Failed to lastLogin"), 1000),
          ),
      );
    }),
  )
  .use(
    "login",
    named("Is Phone Verified", (payload) => ({
      status: "continue",
      data: { isPhoneVerified: true },
    })),
  );

emitter.on("login", (payload) => {
  payload.userId;
});

emitter.emit("login", { userId: 90 }).then((res) => {
  console.log(res);
});
