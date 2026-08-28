import { describe, expect, it } from "vitest";
import {
  DATABASE_UPDATE_SUBJECT_ID,
  filterTicketSubjectsForCompany,
  isVesaDanismanlikCompany,
  VESA_DANISMANLIK_COMPANY_ID,
} from "./filterTicketSubjectsForCompany";

const subjects = [
  { id: 1, description: "Genel" },
  { id: 8, description: "Ücret Modülü" },
  { id: DATABASE_UPDATE_SUBJECT_ID, description: "DB İşlemleri" },
];

describe("filterTicketSubjectsForCompany", () => {
  it("shows DB İşlemleri for Vesa Danışmanlık users", () => {
    expect(isVesaDanismanlikCompany("2E5C2BA5-3EB8-414D-8BC7-08DD44716854")).toBe(true);

    const filtered = filterTicketSubjectsForCompany(subjects, VESA_DANISMANLIK_COMPANY_ID);

    expect(filtered).toHaveLength(subjects.length);
    expect(filtered.some((s) => s.id === DATABASE_UPDATE_SUBJECT_ID)).toBe(true);
  });

  it("hides DB İşlemleri for other customers", () => {
    const filtered = filterTicketSubjectsForCompany(
      subjects,
      "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    );

    expect(filtered.some((s) => s.id === DATABASE_UPDATE_SUBJECT_ID)).toBe(false);
    expect(filtered.map((s) => s.description)).toEqual(["Genel", "Ücret Modülü"]);
  });

  it("hides DB İşlemleri when company id is missing", () => {
    expect(filterTicketSubjectsForCompany(subjects, null)).toHaveLength(2);
    expect(filterTicketSubjectsForCompany(subjects, undefined)).toHaveLength(2);
    expect(filterTicketSubjectsForCompany(subjects, "")).toHaveLength(2);
  });
});
