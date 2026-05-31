import { useEffect, useRef, useState } from "react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import getConfiguration from "confiuration";
import { OrgChartApi, OrgChartNodeDto } from "api/generated";
import vesaLogo from "assets/images/vesapng.png?inline";
import "./OrgChart/orgchart.css";
import { Loader2, AlertTriangle } from "lucide-react";

type BalkanNode = {
  id: string;
  pid?: string;
  name: string;
  departmentName?: string;
  title?: string;
  img?: string;
  expanded?: boolean;
  tags?: string[];
  className?: string;
};

type OrgChartTagConfig = {
  template?: string;
  subTreeConfig?: {
    layout?: unknown;
    template?: string;
  };
};

type OrgChartEditFormButtonConfig = {
  icon?: string;
  text?: string;
  hideIfEditMode?: boolean;
  hideIfDetailsMode?: boolean;
} | null;

type OrgChartEditFormElement = {
  type?: string;
  label?: string;
  binding?: string;
  options?: unknown[];
  btn?: string;
  vlidators?: {
    required?: string;
    email?: string;
  };
};

type OrgChartMenuConfig = Record<
  string,
  {
    text: string;
    icon?: string;
    onClick?: () => void;
  }
>;

declare global {
  type OrgChartControlMap = Record<
    string,
    {
      title: string;
      icon?: string;
      onClick?: () => void;
      isOn?: boolean;
      anchor?: unknown;
    }
  >;
  type OrgChartTemplate = Record<string, unknown>;

  interface OrgChartInstance {
    destroy?: () => void;
    exportToPDF?: (options: {
      format?: string;
      landscape?: boolean;
      margin?: number[];
      padding?: number;
      header?: string;
      footer?: string;
    }) => void;
    on?: (
      eventName: string,
      callback: (_sender: unknown, args: { node?: { id?: string }; id?: string }) => void
    ) => void;
    editUI?: {
      show?: (nodeId: string) => void;
    };
    load: (nodes: BalkanNode[]) => void;
    fit?: () => void;
    toggleFullScreen?: () => void;
  }

  interface OrgChartConstructorOptions {
    template?: string;
    layout?: unknown;
    align?: unknown;
    scaleInitial?: unknown;
    mouseScrool?: unknown;
    movable?: unknown;
    nodeMouseClick?: unknown;
    menu?: OrgChartMenuConfig;
    controls?: OrgChartControlMap;
    tags?: Record<string, OrgChartTagConfig>;
    editForm?: {
      readOnly?: boolean;
      titleBinding?: string;
      photoBinding?: string;
      focusBinding?: string;
      addMore?: string;
      addMoreBtn?: string;
      addMoreFieldName?: string;
      saveAndCloseBtn?: string;
      generateElementsFromFields?: boolean;
      buttons?: Record<string, OrgChartEditFormButtonConfig>;
      elements?: Array<OrgChartEditFormElement | OrgChartEditFormElement[]>;
    };
    nodeBinding: {
      field_0: string;
      field_1?: string;
      img_0?: string;
    };
    nodes?: BalkanNode[];
  }

  interface OrgChartStatic {
    new (element: HTMLElement, options: OrgChartConstructorOptions): OrgChartInstance;
    templates: Record<string, OrgChartTemplate>;
    layout: {
      tree: unknown;
    };
    match: {
      boundaryIfOutside: unknown;
    };
    action: {
      zoom: unknown;
      ctrlZoom?: unknown;
      none?: unknown;
    };
    movable: {
      node: unknown;
    };
    icon?: {
      pdf?: (width: number, height: number, color: string) => string;
    };
  }

  interface Window {
    OrgChart: OrgChartStatic;
  }
}

const ORGCHART_SCRIPT_SRC = "/vendor/balkan/orgchart.js";
const MANAGER_KEYWORDS = [
  "manager", "head", "lead", "director", "chief",
  "supervisor", "owner", "mudur", "mudir", "rehber", "rehberi",
];

let orgChartScriptPromise: Promise<void> | null = null;

const escapeXml = (value?: string | null): string =>
  (value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const normalizePhotoSrc = (photo?: string | null): string | undefined => {
  if (!photo) return undefined;
  return photo.startsWith("data:image") ? photo : `data:image/jpeg;base64,${photo}`;
};

const hasImage = (photo?: string | null): boolean => Boolean(photo?.trim());

const configureOrgChartTemplates = (): void => {
  const orgChart = window.OrgChart;
  const baseTemplate = orgChart.templates.vesaIsla || orgChart.templates.isla;

  if (!baseTemplate) {
    return;
  }

  if (!orgChart.templates.vesaIsla) {
    orgChart.templates.vesaIsla = {
      ...orgChart.templates.isla,
      size: [180, 140],
      field_1:
        '<text data-width="165" data-text-overflow="multiline-3-ellipsis" style="font-size: 11px; font-weight: 500;" fill="#039BE5" x="90" y="54" text-anchor="middle">{val}</text>',
    };
  }

  if (orgChart.templates.departmentPill) {
    return;
  }

  const departmentTemplate = {
    ...baseTemplate,
    size: [240, 56],
    node: (_node: unknown, data: { tags?: string[] }, template: { size?: number[] }) => {
      const isHighlighted = data.tags?.includes("highlight-department");
      const width = template.size?.[0] ?? 240;
      const height = template.size?.[1] ?? 56;
      const fill = isHighlighted ? "#eef4ff" : "#ffffff";
      const stroke = isHighlighted ? "#5b8def" : "#d7def0";
      const strokeWidth = isHighlighted ? "1.6" : "1.2";
      return `
        <g filter="url(#department-pill-shadow)">
          <rect x="0" y="0" width="${width}" height="${height}" rx="14" ry="14" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"></rect>
        </g>
      `;
    },
    img_0: "",
    field_0: (_node: unknown, data: { tags?: string[]; name?: string }, template: { size?: number[] }) => {
      const isHighlighted = data.tags?.includes("highlight-department");
      const width = template.size?.[0] ?? 240;
      const textColor = isHighlighted ? "#2346a0" : "#3a4256";
      const label = escapeXml(data.name);
      return `
        <text data-width="210" x="${width / 2}" y="34" text-anchor="middle" fill="${textColor}"
          style="font-size: 13px; font-weight: 600; font-family: Arial, sans-serif;">
          ${label}
        </text>
      `;
    },
    field_1: "",
    defs: `
      <filter id="department-pill-shadow" x="-20%" y="-40%" width="160%" height="220%">
        <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#25324d" flood-opacity="0.12"></feDropShadow>
      </filter>
    `,
    plus: `
      <circle cx="15" cy="15" r="14" fill="#ffffff" stroke="#d7def0" stroke-width="1"></circle>
      <line x1="8" y1="15" x2="22" y2="15" stroke-width="1.5" stroke="#7c8aa5"></line>
      <line x1="15" y1="8" x2="15" y2="22" stroke-width="1.5" stroke="#7c8aa5"></line>
    `,
    minus: `
      <circle cx="15" cy="15" r="14" fill="#ffffff" stroke="#d7def0" stroke-width="1"></circle>
      <line x1="8" y1="15" x2="22" y2="15" stroke-width="1.5" stroke="#7c8aa5"></line>
    `,
  };

  orgChart.templates.departmentPill = departmentTemplate;
};

const loadOrgChartScript = (): Promise<void> => {
  if (window.OrgChart) return Promise.resolve();
  if (orgChartScriptPromise) return orgChartScriptPromise;

  orgChartScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector(
      `script[src="${ORGCHART_SCRIPT_SRC}"]`
    ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("OrgChart script failed to load.")), { once: true });
      if (window.OrgChart) resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = ORGCHART_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("OrgChart script failed to load."));
    document.body.appendChild(script);
  });

  return orgChartScriptPromise;
};

const isDepartmentNode = (node: OrgChartNodeDto): boolean => node.type === "department";

const hasManagerSignal = (value?: string | null): boolean => {
  if (!value) return false;
  const normalizedValue = value.toLocaleLowerCase("tr-TR");
  return MANAGER_KEYWORDS.some((keyword) => normalizedValue.includes(keyword));
};

const isManagerCandidate = (node: OrgChartNodeDto): boolean =>
  !isDepartmentNode(node) &&
  (hasManagerSignal(node.className) || hasManagerSignal(node.title) || hasManagerSignal(node.name));

const buildNodeTags = (node: OrgChartNodeDto, extraTags: string[] = []): string[] => {
  const tags = new Set<string>(extraTags);
  if (isDepartmentNode(node)) tags.add("department");
  if (node.className) tags.add(node.className);
  return Array.from(tags);
};

const createBalkanNode = (
  node: OrgChartNodeDto,
  parentId?: string,
  extraTags: string[] = [],
  departmentName?: string
): BalkanNode | null => {
  if (!node.id) return null;
  const tags = buildNodeTags(node, extraTags);
  return {
    id: node.id,
    ...(parentId ? { pid: parentId } : {}),
    name: node.name || "Unnamed",
    ...(departmentName ? { departmentName } : {}),
    ...(node.title ? { title: node.title } : {}),
    ...(normalizePhotoSrc(node.photo) ? { img: normalizePhotoSrc(node.photo) } : {}),
    ...(typeof node.expanded === "boolean" ? { expanded: node.expanded } : {}),
    ...(tags.length > 0 ? { tags } : {}),
    ...(node.className ? { className: node.className } : {}),
  };
};

const selectDepartmentManager = (members: OrgChartNodeDto[]): OrgChartNodeDto | null => {
  const explicitManager = members.find(isManagerCandidate);
  if (explicitManager) return explicitManager;
  if (members.length === 1) return members[0];
  return null;
};

const flattenOrganizationTree = (
  node: OrgChartNodeDto,
  parentId?: string,
  inheritedTags: string[] = [],
  inheritedDepartmentName?: string
): BalkanNode[] => {
  const currentDepartmentName = isDepartmentNode(node) ? node.name || inheritedDepartmentName : inheritedDepartmentName;
  const currentNode = createBalkanNode(node, parentId, inheritedTags, currentDepartmentName);

  if (!currentNode) return [];

  const children = node.children || [];

  if (!isDepartmentNode(node)) {
    const childNodes = children.flatMap((child) =>
      flattenOrganizationTree(child, currentNode.id, ["employee"], currentDepartmentName)
    );
    return [currentNode, ...childNodes];
  }

  const departmentChildren = children.filter(isDepartmentNode);
  const departmentMembers = children.filter((child) => !isDepartmentNode(child));
  const managerNode = selectDepartmentManager(departmentMembers);
  const employeeChildren = departmentMembers.filter((child) => child.id !== managerNode?.id);
  const nodes: BalkanNode[] = [currentNode];
  let memberParentId = currentNode.id;
  let branchParentId = currentNode.id;

  if (managerNode) {
    const managerNodes = flattenOrganizationTree(managerNode, currentNode.id, ["manager"], currentDepartmentName);
    nodes.push(...managerNodes);
    memberParentId = managerNode.id || currentNode.id;
    branchParentId = memberParentId;
  } else if (employeeChildren.length > 0) {
    const fallbackManagerId = `${currentNode.id}__manager`;
    nodes.push({
      id: fallbackManagerId,
      pid: currentNode.id,
      name: `${currentNode.name} Manager`,
      departmentName: currentDepartmentName,
      title: "Department Manager",
      tags: ["manager", "manager-placeholder"],
    });
    memberParentId = fallbackManagerId;
    branchParentId = fallbackManagerId;
  }

  const childDepartmentNodes = departmentChildren.flatMap((child) =>
    flattenOrganizationTree(child, branchParentId, [], currentDepartmentName)
  );
  const employeeNodes = employeeChildren.flatMap((child) =>
    flattenOrganizationTree(child, memberParentId, ["employee"], currentDepartmentName)
  );

  return [...nodes, ...childDepartmentNodes, ...employeeNodes];
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) return error.message;
  return "Organizasyon yapısı yüklenemedi.";
};

const orgChartApi = new OrgChartApi(getConfiguration());

const fetchOrganizationTree = async (departmentId?: string): Promise<OrgChartNodeDto> => {
  if (departmentId) {
    const response = await orgChartApi.apiOrgChartDepartmentDepartmentIdGet(departmentId, true);
    return response.data;
  }
  const response = await orgChartApi.apiOrgChartGet(true);
  return response.data;
};

const extractUserIdFromNodeId = (nodeId?: string): string | null => {
  if (!nodeId) return null;
  const managerMatch = nodeId.match(/^mgr_[^_]+_(.+)$/);
  if (managerMatch?.[1]) return managerMatch[1];
  const userMatch = nodeId.match(/^usr_[^_]+_(.+)$/);
  if (userMatch?.[1]) return userMatch[1];
  return null;
};

const refreshOpenDetailsPhoto = (
  nodeId: string,
  photoSrc: string,
  host: HTMLDivElement | null,
  retries = 8
) => {
  if (!host || !photoSrc) return;
  const doc = host.ownerDocument;
  const formImages = doc.querySelectorAll(
    '[data-boc-right] img, [data-boc-left] img, .boc-edit-form img, [data-boc-content] img'
  );
  formImages.forEach((img) => {
    const imageElement = img as HTMLImageElement;
    const width = imageElement.naturalWidth || imageElement.width;
    const height = imageElement.naturalHeight || imageElement.height;
    if (width >= 48 && height >= 48) imageElement.src = photoSrc;
  });
  if (retries <= 0) return;
  setTimeout(() => refreshOpenDetailsPhoto(nodeId, photoSrc, host, retries - 1), 80);
};

export default function OrgTreeChart(): JSX.Element {
  const pageContentRef = useRef<HTMLDivElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<OrgChartInstance | null>(null);
  const isMountedRef = useRef(true);
  const loadedPhotoUserIdsRef = useRef<Set<string>>(new Set());
  const pendingPhotoUserIdsRef = useRef<Set<string>>(new Set());
  const pendingPhotoPromisesRef = useRef<Map<string, Promise<string | null>>>(new Map());
  const nodeImageMapRef = useRef<Map<string, string>>(new Map());
  const [baseNodes, setBaseNodes] = useState<BalkanNode[]>([]);
  const [highlightedDepartment, setHighlightedDepartment] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartHeight, setChartHeight] = useState(600);

  const nodes = baseNodes.map((node) => {
    const tags = new Set(node.tags || []);
    if (
      highlightedDepartment &&
      tags.has("department") &&
      node.name.toLocaleLowerCase("tr-TR").includes(highlightedDepartment.toLocaleLowerCase("tr-TR"))
    ) {
      tags.add("highlight-department");
    } else {
      tags.delete("highlight-department");
    }
    return { ...node, ...(tags.size > 0 ? { tags: Array.from(tags) } : {}) };
  });

  useEffect(() => {
    const next = new Map<string, string>();
    baseNodes.forEach((node) => { if (node.img) next.set(node.id, node.img); });
    nodeImageMapRef.current = next;
  }, [baseNodes]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    const updateChartHeight = () => {
      if (!pageContentRef.current) return;
      const { top } = pageContentRef.current.getBoundingClientRect();
      const nextHeight = Math.max(window.innerHeight - top - 24, 320);
      setChartHeight(nextHeight);
    };
    updateChartHeight();
    window.addEventListener("resize", updateChartHeight);
    return () => { window.removeEventListener("resize", updateChartHeight); };
  }, []);

  const findCachedPhotoByUserId = (userId: string): string | null => {
    for (const [nodeId, image] of nodeImageMapRef.current.entries()) {
      if (extractUserIdFromNodeId(nodeId) === userId) return image;
    }
    return null;
  };

  const loadPhotoOnDemand = async (nodeId?: string): Promise<string | null> => {
    const userId = extractUserIdFromNodeId(nodeId);
    if (!userId) return null;

    const cachedPhoto = findCachedPhotoByUserId(userId);
    if (loadedPhotoUserIdsRef.current.has(userId) && cachedPhoto) return cachedPhoto;

    if (pendingPhotoUserIdsRef.current.has(userId)) {
      const pendingPromise = pendingPhotoPromisesRef.current.get(userId);
      return pendingPromise ? await pendingPromise : null;
    }

    pendingPhotoUserIdsRef.current.add(userId);

    const photoPromise = (async (): Promise<string | null> => {
      try {
        const response = await orgChartApi.apiOrgChartPhotoUserIdGet(userId);
        const normalizedPhoto = normalizePhotoSrc(response.data);
        loadedPhotoUserIdsRef.current.add(userId);
        if (!normalizedPhoto || !isMountedRef.current) return null;
        setBaseNodes((prev) =>
          prev.map((node) =>
            extractUserIdFromNodeId(node.id) === userId ? { ...node, img: normalizedPhoto } : node
          )
        );
        if (nodeId) refreshOpenDetailsPhoto(nodeId, normalizedPhoto, hostRef.current);
        return normalizedPhoto;
      } catch {
        loadedPhotoUserIdsRef.current.add(userId);
        return null;
      } finally {
        pendingPhotoUserIdsRef.current.delete(userId);
        pendingPhotoPromisesRef.current.delete(userId);
      }
    })();

    pendingPhotoPromisesRef.current.set(userId, photoPromise);
    return await photoPromise;
  };

  useEffect(() => {
    let isActive = true;
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const tree = await fetchOrganizationTree();
        if (!isActive) return;
        setBaseNodes(flattenOrganizationTree(tree));
      } catch (err) {
        if (!isActive) return;
        setBaseNodes([]);
        setError(getErrorMessage(err));
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    loadData();
    return () => { isActive = false; };
  }, []);

  useEffect(() => {
    let isActive = true;
    if (isLoading || error || !hostRef.current || chartRef.current || nodes.length === 0) {
      return () => { isActive = false; };
    }

    const initializeChart = async () => {
      try {
        await loadOrgChartScript();
        if (!isActive || !hostRef.current || !window.OrgChart) return;

        configureOrgChartTemplates();
        hostRef.current.innerHTML = "";

        const chart = new window.OrgChart(hostRef.current, {
          template: "vesaIsla",
          layout: window.OrgChart.layout.tree,
          scaleInitial: window.OrgChart.match.boundaryIfOutside,
          mouseScrool: window.OrgChart.action.zoom,
          movable: window.OrgChart.movable.node,
          menu: {
            pdf_export: {
              text: "PDF olarak dışa aktar",
              ...(window.OrgChart.icon?.pdf
                ? { icon: window.OrgChart.icon.pdf(24, 24, "#7A7A7A") }
                : {}),
              onClick: () => {
                chart.exportToPDF?.({
                  format: "A3",
                  landscape: true,
                  margin: [26, 20, 18, 20],
                  padding: 18,
                  header:
                    `<image x="36" y="5" width="56" height="18" preserveAspectRatio="xMidYMid meet" href="${vesaLogo}" xlink:href="${vesaLogo}"></image><text style="font-size:15px; font-weight:700;" fill="#2f92d0" x="595" y="19" text-anchor="middle">Vesa Danışmanlık Organizasyon Şeması</text>`,
                  footer:
                    '<text style="font-size:8px; font-weight:600;" fill="#7366ac" x="36" y="9">@Vesacons | Kurumsal Döküman</text><text style="font-size:8px; font-weight:600;" fill="#6b7280" x="1154" y="9" text-anchor="end">Bu belge gizlidir</text>',
                });
              },
            },
          },
          tags: {
            department: {
              template: "departmentPill",
              subTreeConfig: {
                layout: window.OrgChart.layout.tree,
                template: "vesaIsla",
              },
            },
          },
          editForm: {
            readOnly: true,
            titleBinding: "name",
            photoBinding: "img",
            focusBinding: "name",
            generateElementsFromFields: false,
            buttons: { edit: null, share: null, pdf: null, remove: null },
            elements: [
              { type: "textbox", label: "Departman", binding: "departmentName" },
              { type: "textbox", label: "İsim", binding: "name" },
            ],
          },
          controls: {
            layout_mixed: { title: "Mixed" },
            layout_normal: { title: "Normal" },
            layout_right_offset: { title: "Right Offset" },
            layout_left_offset: { title: "Left Offset" },
            layout_tree: { title: "Tree" },
            layout_grid: { title: "Grid" },
          },
          nodeBinding: {
            field_0: "name",
            field_1: "title",
            img_0: "img",
          },
        });

        chart.on?.("click", (_sender, args) => {
          const clickedNodeId = args?.node?.id || args?.id;
          if (!clickedNodeId) return;
          const cached = nodeImageMapRef.current.get(clickedNodeId);
          if (!hasImage(cached)) {
            (args as { cancel?: boolean }).cancel = true;
            void loadPhotoOnDemand(clickedNodeId);
            return false;
          }
          refreshOpenDetailsPhoto(clickedNodeId, cached, hostRef.current);
          void loadPhotoOnDemand(clickedNodeId);
        });

        chartRef.current = chart;
        chart.load(nodes);
      } catch (err) {
        if (!isActive) return;
        chartRef.current?.destroy?.();
        chartRef.current = null;
        setError(getErrorMessage(err));
      }
    };

    initializeChart();
    return () => { isActive = false; };
  }, [nodes, isLoading, error]);

  useEffect(() => {
    if (isLoading || error || !chartRef.current || nodes.length === 0) return;
    chartRef.current.load(nodes);
  }, [nodes, isLoading, error]);

  useEffect(() => {
    return () => {
      chartRef.current?.destroy?.();
      chartRef.current = null;
    };
  }, []);

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div ref={pageContentRef} className="orgchart-page">
        {/* Loading state */}
        {isLoading && (
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-xl bg-white border border-gray-100 shadow-sm"
            style={{ height: `${chartHeight}px` }}
          >
            <Loader2 className="size-8 animate-spin text-blue-400" />
            <p className="text-sm text-muted-foreground">Loading organization chart...</p>
          </div>
        )}

        {/* Error state */}
        {!isLoading && error && (
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-xl bg-white border border-red-100 shadow-sm"
            style={{ height: `${chartHeight}px` }}
          >
            <AlertTriangle className="size-8 text-red-400" />
            <p className="text-sm text-red-500 text-center max-w-sm px-4">{error}</p>
          </div>
        )}

        {/* Chart */}
        {!isLoading && !error && (
          <div
            id="tree"
            ref={hostRef}
            className="orgchart-container"
            style={{ height: `${chartHeight}px` }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
