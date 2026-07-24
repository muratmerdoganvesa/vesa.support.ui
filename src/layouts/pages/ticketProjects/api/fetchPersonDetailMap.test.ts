import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchPersonDetailData } from "./fetchPersonDetailMap";

const apiMocks = vi.hoisted(() => ({
  fetchUsers: vi.fn(),
  fetchLevels: vi.fn(),
  fetchPositions: vi.fn(),
}));

vi.mock("confiuration", () => ({
  default: () => ({}),
}));

vi.mock("api/generated", () => ({
  UserApi: class {
    apiUserVesaUsersWithoutPhotoGet = apiMocks.fetchUsers;
    apiUserUserLevelsGet = apiMocks.fetchLevels;
  },
  PositionsApi: class {
    apiPositionsGet = apiMocks.fetchPositions;
  },
}));

describe("fetchPersonDetailData", () => {
  beforeEach(() => {
    apiMocks.fetchUsers.mockReset();
    apiMocks.fetchLevels.mockReset();
    apiMocks.fetchPositions.mockReset();

    apiMocks.fetchUsers.mockResolvedValue({
      data: [
        {
          id: "alice",
          firstName: "Alice",
          lastName: "Vesa",
          departmentText: " Engineering ",
          userLevel: 2,
        },
      ],
    });
    apiMocks.fetchLevels.mockResolvedValue({
      data: [{ id: 2, description: "Senior" }],
    });
    apiMocks.fetchPositions.mockResolvedValue({ data: [] });
  });

  it("keeps user and level data when the optional positions request fails", async () => {
    apiMocks.fetchPositions.mockRejectedValue(new Error("positions unavailable"));

    const result = await fetchPersonDetailData();

    expect(result.detailsById.get("alice")).toMatchObject({
      department: "Engineering",
      levelLabel: "Senior",
    });
    expect(result.unavailableMetadata).toEqual(["positions"]);
  });

  it("keeps user and position data when the optional levels request fails", async () => {
    apiMocks.fetchLevels.mockRejectedValue(new Error("levels unavailable"));

    const result = await fetchPersonDetailData();

    expect(result.detailsById.get("alice")).toMatchObject({
      department: "Engineering",
      levelLabel: null,
    });
    expect(result.unavailableMetadata).toEqual(["levels"]);
  });
});
