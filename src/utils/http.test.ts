import { makeRes } from "../test/helpers.js";
import { notImplemented, sendError, sendSuccess } from "./http.js";

describe("http utils", () => {
  it("sends success responses with default status", () => {
    const res = makeRes();

    sendSuccess(res, "done", { ok: true });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "done",
      data: { ok: true },
    });
  });

  it("supports custom success and default error status codes", () => {
    const successRes = makeRes();
    const errorRes = makeRes();

    sendSuccess(successRes, "created", { ok: true }, 201);
    sendError(errorRes, "failed");

    expect(successRes.status).toHaveBeenCalledWith(201);
    expect(errorRes.status).toHaveBeenCalledWith(500);
  });

  it("sends errors without field details by default", () => {
    const res = makeRes();

    sendError(res, "bad", 400);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "bad",
    });
  });

  it("includes field errors when provided", () => {
    const res = makeRes();
    const errors = [{ field: "email", message: "Required" }];

    sendError(res, "invalid", 422, errors);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "invalid",
      errors,
    });
  });

  it("returns the scaffolded placeholder", () => {
    expect(notImplemented("Search")).toEqual({
      message: "Search is scaffolded but not implemented yet.",
    });
  });
});
