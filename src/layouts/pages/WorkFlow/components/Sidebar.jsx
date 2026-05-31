import React, { useState } from "react";
import { FaBookOpen, FaFile, FaVolumeUp, FaChevronRight, FaChevronDown } from "react-icons/fa";

const GROUPS = [
  {
    key: "smartOptions",
    label: "Karar Yapıları",
    icon: FaBookOpen,
    color: "bg-blue-600",
    items: [
      { type: "approverNode", label: "Onaycı" },
      { type: "sqlConditionNode", label: "Sql Koşul" },
    ],
  },
  {
    key: "documentOptions",
    label: "Scripts",
    icon: FaFile,
    color: "bg-purple-600",
    items: [{ type: "inputDataNode", label: "Api Call" }],
  },
  {
    key: "otherOptions",
    label: "Diğer",
    icon: FaVolumeUp,
    color: "bg-red-500",
    items: [
      { type: "startNode", label: "Start" },
      { type: "stopNode", label: "Stop" },
    ],
  },
];

const CustomMenuList = ({ disabled = false }) => {
  const [open, setOpen] = useState({
    smartOptions: false,
    documentOptions: false,
    otherOptions: false,
  });

  const handleClick = (group) => {
    setOpen((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      className={`flex w-full shrink-0 flex-col select-none ${
        disabled ? "pointer-events-none opacity-60" : ""
      }`}
      aria-disabled={disabled}
    >
      {GROUPS.map(({ key, label, icon: Icon, color, items }) => (
        <div key={key}>
          {/* Group header */}
          <button
            type="button"
            onClick={() => handleClick(key)}
            className={`flex items-center w-full gap-2.5 px-3 py-2.5 text-white text-sm font-medium transition-opacity hover:opacity-90 ${color}`}
          >
            <Icon className="size-4 shrink-0" />
            <span className="flex-1 text-left">{label}</span>
            {open[key]
              ? <FaChevronDown className="size-3 shrink-0" />
              : <FaChevronRight className="size-3 shrink-0" />}
          </button>

          {/* Collapsible items */}
          {open[key] && (
            <div className="flex flex-col">
              {items.map((item) => (
                <div
                  key={item.type}
                  draggable
                  onDragStart={(e) => onDragStart(e, item.type)}
                  className="pl-10 pr-3 py-2 text-sm text-gray-700 cursor-grab border-b border-gray-100 bg-white transition-colors hover:bg-gray-50 active:cursor-grabbing"
                >
                  {item.label}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CustomMenuList;
