import { describe, expect, it } from "vitest";
import {
  buildDepartmentTree,
  buildRelevantDepartmentNodes,
  filterDepartmentTreeForSearch,
  flattenDepartmentTree,
  getSelfAndDescendantNames,
  searchDepartmentTreeListItems,
} from "./departmentTree";

const hierarchy = [
  { id: "1", name: "IT", parentId: null },
  { id: "2", name: "Destek", parentId: "1" },
  { id: "3", name: "Gelistirme", parentId: "1" },
  { id: "4", name: "Frontend", parentId: "3" },
  { id: "5", name: "IK", parentId: null },
];

describe("departmentTree", () => {
  it("builds indented tree order", () => {
    const flat = flattenDepartmentTree(buildDepartmentTree(hierarchy));
    expect(flat.map((n) => `${n.depth}:${n.name}`)).toEqual([
      "0:IK",
      "0:IT",
      "1:Destek",
      "1:Gelistirme",
      "2:Frontend",
    ]);
  });

  it("links parent/child even when guid casing differs", () => {
    const mixedCase = [
      { id: "88E80DC3-26F8-42E0-AF7F-5BEC2CDAA93E", name: "Sap Head of AMS", parentId: null },
      {
        id: "757639BF-5D72-4E74-BEA4-E9C6738ADC80",
        name: "SAP HCM Destek Departmanı DG",
        parentId: "88e80dc3-26f8-42e0-af7f-5bec2cdaa93e",
      },
      {
        id: "6AD800A2-5D81-431F-A423-B9CAA9F3DBD0",
        name: "SAP HCM Destek Departmanı ED",
        parentId: "88e80dc3-26f8-42e0-af7f-5bec2cdaa93e",
      },
    ];
    const flat = flattenDepartmentTree(buildDepartmentTree(mixedCase));
    expect(flat.map((n) => `${n.depth}:${n.name}`)).toEqual([
      "0:Sap Head of AMS",
      "1:SAP HCM Destek Departmanı DG",
      "1:SAP HCM Destek Departmanı ED",
    ]);
  });

  it("selecting parent includes all descendant names", () => {
    expect(Array.from(getSelfAndDescendantNames(hierarchy, "IT")).sort()).toEqual([
      "Destek",
      "Frontend",
      "Gelistirme",
      "IT",
    ]);
  });

  it("keeps ancestors of board departments and orphan names", () => {
    const relevant = buildRelevantDepartmentNodes(hierarchy, ["Frontend", "Orphan"]);
    const names = relevant.map((n) => n.name).sort();
    expect(names).toEqual(["Frontend", "Gelistirme", "IT", "Orphan"]);
  });

  it("search keeps matching node with ancestors", () => {
    const roots = buildDepartmentTree(hierarchy);
    const filtered = filterDepartmentTreeForSearch(roots, "front");
    expect(filtered.map((n) => n.name)).toEqual(["IT", "Gelistirme", "Frontend"]);
  });

  it("searchDepartmentTreeListItems keeps ancestors", () => {
    const items = flattenDepartmentTree(buildDepartmentTree(hierarchy)).map((n) => ({
      id: n.id,
      name: n.name,
      parentId: n.parentId,
      depth: n.depth,
      hasChildren: n.children.length > 0,
      count: 1,
    }));
    expect(searchDepartmentTreeListItems(items, "front").map((n) => n.name)).toEqual([
      "IT",
      "Gelistirme",
      "Frontend",
    ]);
  });
});
