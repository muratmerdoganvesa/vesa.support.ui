export type DepartmentNode = {
  id: string;
  name: string;
  parentId: string | null;
};

export type DepartmentTreeNode = DepartmentNode & {
  children: DepartmentTreeNode[];
  depth: number;
};

export type DepartmentTreeListItem = {
  id: string;
  name: string;
  parentId: string | null;
  depth: number;
  hasChildren: boolean;
  count: number;
};

const orphanId = (name: string) => `orphan:${name}`;

/** Flat listeyi parentId ile ağaca çevirir; isimlere göre TR sıralar. */
export const buildDepartmentTree = (nodes: DepartmentNode[]): DepartmentTreeNode[] => {
  const byId = new Map<string, DepartmentTreeNode>();

  for (const node of nodes) {
    if (!node.id || !node.name.trim()) continue;
    byId.set(node.id, {
      id: node.id,
      name: node.name.trim(),
      parentId: node.parentId,
      children: [],
      depth: 0,
    });
  }

  const roots: DepartmentTreeNode[] = [];

  for (const node of byId.values()) {
    const parentId = node.parentId;
    if (parentId && byId.has(parentId) && parentId !== node.id) {
      byId.get(parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortRecursive = (list: DepartmentTreeNode[]) => {
    list.sort((a, b) => a.name.localeCompare(b.name, "tr"));
    for (const child of list) sortRecursive(child.children);
  };
  sortRecursive(roots);

  const assignDepth = (list: DepartmentTreeNode[], depth: number) => {
    for (const node of list) {
      node.depth = depth;
      assignDepth(node.children, depth + 1);
    }
  };
  assignDepth(roots, 0);

  return roots;
};

/** Ağacı depth bilgisiyle düz listeye çevirir (UI render için). */
export const flattenDepartmentTree = (roots: DepartmentTreeNode[]): DepartmentTreeNode[] => {
  const result: DepartmentTreeNode[] = [];
  const walk = (nodes: DepartmentTreeNode[]) => {
    for (const node of nodes) {
      result.push(node);
      if (node.children.length > 0) walk(node.children);
    }
  };
  walk(roots);
  return result;
};

/** Seçilen departman + tüm alt departman isimleri. */
export const getSelfAndDescendantNames = (
  nodes: DepartmentNode[],
  selectedName: string,
): Set<string> => {
  const trimmed = selectedName.trim();
  if (!trimmed) return new Set();

  const roots = buildDepartmentTree(nodes);
  const matchSet = new Set<string>();

  const collect = (node: DepartmentTreeNode) => {
    matchSet.add(node.name);
    for (const child of node.children) collect(child);
  };

  const findAndCollect = (list: DepartmentTreeNode[]): boolean => {
    let found = false;
    for (const node of list) {
      if (node.name === trimmed) {
        collect(node);
        found = true;
      } else if (findAndCollect(node.children)) {
        found = true;
      }
    }
    return found;
  };

  if (!findAndCollect(roots)) {
    matchSet.add(trimmed);
  }

  return matchSet;
};

/**
 * Board'da görünen departman adlarını hiyerarşiye oturtur.
 * Üstü olmayan veya API'de olmayan isimler orphan root olarak eklenir.
 * Sadece board ile ilişkili düğümler + onların ataları tutulur.
 */
export const buildRelevantDepartmentNodes = (
  hierarchy: DepartmentNode[],
  boardDepartmentNames: Iterable<string>,
): DepartmentNode[] => {
  const boardNames = new Set(
    Array.from(boardDepartmentNames)
      .map((n) => n.trim())
      .filter(Boolean),
  );

  if (boardNames.size === 0) return [];

  const byId = new Map(hierarchy.map((n) => [n.id, n]));
  const byName = new Map<string, DepartmentNode>();
  for (const node of hierarchy) {
    const name = node.name.trim();
    if (name && !byName.has(name)) byName.set(name, node);
  }

  const relevantIds = new Set<string>();

  for (const name of boardNames) {
    const node = byName.get(name);
    if (!node) continue;
    let current: DepartmentNode | undefined = node;
    while (current) {
      if (relevantIds.has(current.id)) break;
      relevantIds.add(current.id);
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }
  }

  const result: DepartmentNode[] = hierarchy.filter((n) => relevantIds.has(n.id));

  for (const name of boardNames) {
    if (!byName.has(name)) {
      result.push({ id: orphanId(name), name, parentId: null });
    }
  }

  return result;
};

/** Arama terimine göre eşleşen düğüm + atalarını koruyarak düz liste üretir. */
export const filterDepartmentTreeForSearch = (
  roots: DepartmentTreeNode[],
  query: string,
): DepartmentTreeNode[] => {
  const q = query.trim().toLowerCase();
  if (!q) return flattenDepartmentTree(roots);

  const keepIds = new Set<string>();

  const mark = (node: DepartmentTreeNode): boolean => {
    let keep = node.name.toLowerCase().includes(q);
    for (const child of node.children) {
      if (mark(child)) keep = true;
    }
    if (keep) keepIds.add(node.id);
    return keep;
  };

  for (const root of roots) mark(root);

  return flattenDepartmentTree(roots).filter((node) => keepIds.has(node.id));
};

/** Flatten tree list item'larında arama (eşleşen + ataları). */
export const searchDepartmentTreeListItems = (
  items: DepartmentTreeListItem[],
  query: string,
): DepartmentTreeListItem[] => {
  const q = query.trim().toLowerCase();
  if (!q) return items;

  const byId = new Map(items.map((item) => [item.id, item]));
  const keepIds = new Set<string>();

  for (const item of items) {
    if (!item.name.toLowerCase().includes(q)) continue;
    let current: DepartmentTreeListItem | undefined = item;
    while (current) {
      if (keepIds.has(current.id)) break;
      keepIds.add(current.id);
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }
  }

  return items.filter((item) => keepIds.has(item.id));
};
