import type { StatsBoardItem } from "../types";

export type PersonFilterCriteria = {
  selectedPersonId: string;
  selectedDepartment: string;
  selectedLevel: string;
};

const hasActivePersonCriteria = ({
  selectedPersonId,
  selectedDepartment,
  selectedLevel,
}: PersonFilterCriteria): boolean =>
  selectedPersonId !== "All" || selectedDepartment !== "All" || selectedLevel !== "All";

const getUniqueItemPersonIds = (item: StatsBoardItem): string[] => {
  const personIds = new Set<string>();

  if (item.projectManager?.id) {
    personIds.add(item.projectManager.id);
  }

  for (const employee of item.employees) {
    if (employee.id) {
      personIds.add(employee.id);
    }
  }

  return Array.from(personIds);
};

export const getMatchingItemPersonIds = (
  item: StatsBoardItem,
  criteria: PersonFilterCriteria,
  userDepartmentById: Map<string, string>,
  userLevelById: Map<string, string>,
): string[] => {
  const { selectedPersonId, selectedDepartment, selectedLevel } = criteria;

  return getUniqueItemPersonIds(item).filter((personId) => {
    if (selectedPersonId !== "All" && personId !== selectedPersonId) {
      return false;
    }

    if (
      selectedDepartment !== "All" &&
      userDepartmentById.get(personId) !== selectedDepartment
    ) {
      return false;
    }

    if (selectedLevel !== "All" && userLevelById.get(personId) !== selectedLevel) {
      return false;
    }

    return true;
  });
};

export const getHighlightPersonIds = (
  items: StatsBoardItem[],
  criteria: PersonFilterCriteria,
  userDepartmentById: Map<string, string>,
  userLevelById: Map<string, string>,
): Set<string> | null => {
  if (!hasActivePersonCriteria(criteria)) {
    return null;
  }

  const matchingPersonIds = new Set<string>();

  for (const item of items) {
    for (const personId of getMatchingItemPersonIds(
      item,
      criteria,
      userDepartmentById,
      userLevelById,
    )) {
      matchingPersonIds.add(personId);
    }
  }

  return matchingPersonIds;
};
