import type prismaType from "../../utils/prisma.js";
import { makeAuthReq, makeRes } from "../../test/helpers.js";

jest.mock("../../utils/prisma.js", () => ({
  __esModule: true,
  default: {
    companyProfile: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    jobListing: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const prisma = require("../../utils/prisma.js").default;
const { openJob } = require("../company.controller.js") as typeof import("../company.controller.js");

describe("company.controller coverage supplement", () => {
  it("executes the openJob wrapper path", async () => {
    (prisma.companyProfile.findUnique as jest.Mock).mockResolvedValueOnce({ id: "company-1" });
    (prisma.jobListing.findFirst as jest.Mock).mockResolvedValueOnce({ id: "job-1" });
    (prisma.jobListing.update as jest.Mock).mockResolvedValueOnce({ id: "job-1", isClosed: false });

    const res = makeRes();
    await openJob(
      makeAuthReq({
        user: { id: "company-user", role: "companyUser" },
        params: { id: "job-1" },
      }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });
});
