import express from "express";
import multer from "multer";
import request from "supertest";
import { makeReq, makeRes } from "../test/helpers.js";
import { errorHandler } from "./error-handler.js";
import { notFoundHandler } from "./not-found.js";
import { upload } from "../utils/uploads.js";

describe("errorHandler", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("handles file-size errors", () => {
    const error = new multer.MulterError("LIMIT_FILE_SIZE");
    const res = makeRes();

    errorHandler(error, makeReq(), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "File size must be 5 MB or smaller" }),
    );
  });

  it("handles generic multer errors", () => {
    const error = new multer.MulterError("LIMIT_UNEXPECTED_FILE", "avatar");
    const res = makeRes();

    errorHandler(error, makeReq(), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: error.message }),
    );
  });

  it("handles invalid file type errors", () => {
    const res = makeRes();

    errorHandler(new Error("Only JPEG, PNG, and WebP images are allowed"), makeReq(), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("handles generic errors", () => {
    const res = makeRes();

    errorHandler(new Error("boom"), makeReq(), res, jest.fn());

    expect(console.error).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("notFoundHandler", () => {
  it("formats the missing route message", () => {
    const req = makeReq({ method: "POST", originalUrl: "/missing" });
    const res = makeRes();

    notFoundHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Route not found: POST /missing" }),
    );
  });
});

describe("upload middleware", () => {
  function makeUploadApp() {
    const app = express();

    app.post("/upload", upload.single("file"), (_req, res) => {
      res.status(200).json({ ok: true });
    });

    app.use(errorHandler);

    return app;
  }

  it("accepts supported image types", async () => {
    const response = await request(makeUploadApp())
      .post("/upload")
      .attach("file", Buffer.from("image"), {
        filename: "avatar.png",
        contentType: "image/png",
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });

  it("rejects unsupported image types", async () => {
    const response = await request(makeUploadApp())
      .post("/upload")
      .attach("file", Buffer.from("text"), {
        filename: "note.txt",
        contentType: "text/plain",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Only JPEG, PNG, and WebP images are allowed");
  });

  it("rejects oversized images", async () => {
    const response = await request(makeUploadApp())
      .post("/upload")
      .attach("file", Buffer.alloc(5 * 1024 * 1024 + 1), {
        filename: "large.png",
        contentType: "image/png",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("File size must be 5 MB or smaller");
  });
});
