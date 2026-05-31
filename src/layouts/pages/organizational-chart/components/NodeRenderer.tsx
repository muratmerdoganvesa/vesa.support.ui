import React, { memo, Fragment, useRef } from "react";
import { TreeNode } from "react-organizational-chart";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "components/ui/tooltip";
import { OrgNode } from "../fakeData";
import { useZoom } from "../hooks/useZoom";
import { cn } from "lib/utils";

interface NodeRendererProps {
  node: OrgNode;
  isExpanded: (nodeId: string) => boolean;
  toggleNode: (nodeId: string) => void;
}

export const NodeRenderer = memo<NodeRendererProps>(({ node, isExpanded, toggleNode }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const { resetZoom } = useZoom({
    containerRef: chartContainerRef,
    contentRef: contentRef,
  });

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleNode(node.id);
    resetZoom();
    console.log("resetlenmeli");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleNode(node.id);
    }
  };

  if (node.type === "department") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="chart-node inline-block relative transition-all duration-200" tabIndex={0}>
              <div className="bg-[#f8f9fb] border border-[#e8eaef] rounded-[10px] px-4 py-2.5 min-w-[120px] mx-auto shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                <p className="font-semibold text-[#3a3a3a] text-[13px] text-center tracking-tight">
                  {node.name}
                </p>
              </div>

              {node.children?.length > 0 && (
                <button
                  type="button"
                  className="toggle-button absolute -bottom-3 left-1/2 -translate-x-1/2 size-6 rounded-full bg-white border border-[#e5e5e5] shadow-sm flex items-center justify-center z-10 transition-all duration-200 hover:bg-[#f5f7ff] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={handleToggle}
                  onKeyDown={handleKeyDown}
                  aria-label={`${isExpanded(node.id) ? "Collapse" : "Expand"} ${node.name}`}
                >
                  {isExpanded(node.id)
                    ? <ChevronDown className="size-3.5 text-[#5b6aff]" />
                    : <ChevronUp className="size-3.5 text-[#5b6aff]" />}
                </button>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            Department: {node.name}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const tooltipTitle = node.title ? `${node.name} - ${node.title}` : node.name;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="chart-node inline-block relative transition-all duration-200" tabIndex={0}>
            <div
              className={cn(
                "flex flex-row items-center bg-white rounded-xl border border-[#e8e8e8] w-[220px] mx-auto px-3 py-2 shadow-sm overflow-visible relative transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
                node.className === "ceo-node" && "border-l-4 border-l-[#5b6aff] bg-[#fafbff]",
                node.className === "executive-node" && "border-l-4 border-l-[#6c8aff] bg-[#fafbff]",
                node.className === "manager-node" && "border-l-4 border-l-[#7d9eff]",
              )}
            >
              {node.photo && (
                <div className="size-11 rounded-full overflow-hidden flex items-center justify-center bg-[#f1f3f9] mr-3 mt-1 mb-1 shrink-0 shadow-sm transition-all duration-200">
                  <img
                    src={`data:image/jpeg;base64,${node.photo.startsWith("data:image") ? node.photo.split(",")[1] : node.photo}`}
                    alt={`${node.name}'s photo`}
                    loading="lazy"
                    width="80"
                    height="80"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              )}

              <div className="flex-1 text-left min-w-0">
                <p
                  className={cn(
                    "font-semibold text-[#2c2c2c] text-sm mb-[3px] truncate max-w-full tracking-tight",
                    node.className === "ceo-node" && "text-[#4856e8] text-[15px]"
                  )}
                >
                  {node.name}
                </p>
                {node.title && (
                  <p className="text-[#6e6e6e] text-xs truncate max-w-full tracking-tight">
                    {node.title}
                  </p>
                )}
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          {tooltipTitle}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

NodeRenderer.displayName = "NodeRenderer";

interface RenderTreeNodesProps {
  nodes: OrgNode[];
  isExpanded: (nodeId: string) => boolean;
  toggleNode: (nodeId: string) => void;
}

export const RenderTreeNodes: React.FC<RenderTreeNodesProps> = memo(
  ({ nodes, isExpanded, toggleNode }) => {
    return (
      <Fragment>
        {nodes.map((node) => (
          <TreeNode
            key={node.id}
            label={<NodeRenderer node={node} isExpanded={isExpanded} toggleNode={toggleNode} />}
          >
            {node.children && isExpanded(node.id) && (
              <RenderTreeNodes
                nodes={node.children}
                isExpanded={isExpanded}
                toggleNode={toggleNode}
              />
            )}
          </TreeNode>
        ))}
      </Fragment>
    );
  }
);

RenderTreeNodes.displayName = "RenderTreeNodes";
