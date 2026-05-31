import React, { memo } from "react";
import { Handle, Position } from "reactflow";
import { FaCheckCircle, FaCog, FaDatabase } from "react-icons/fa";

const SqlConditionNode = ({ data, isConnectable }) => {
  return (
    <div
      style={{
        opacity: 1,
        pointerEvents: "all",
        position: "relative",
        zIndex: 5,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: "#555",
          width: "12px",
          height: "12px",
          zIndex: 10,
        }}
        isConnectable={isConnectable}
      />

      <div
        style={{
          background: "#ffcc00",
          padding: "10px",
          borderRadius: "8px",
          border: "2px solid #ddd",
          minWidth: "200px",
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          cursor: "move",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #ddd",
            paddingBottom: "8px",
            marginBottom: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <FaDatabase style={{ color: "green", marginRight: "8px" }} />
            <span style={{ fontWeight: "bold" }}>SQL Koşul</span>
          </div>
          <FaCog style={{ cursor: "pointer", color: "#666" }} />
        </div>

        <div style={{ fontSize: "14px", color: "#333" }}>{data?.name || "Yeni Koşul"}</div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="yes"
        style={{
          left: "30%",
          background: "#555",
          width: "12px",
          height: "12px",
          zIndex: 10,
        }}
        isConnectable={isConnectable}
      >
        <div style={{ position: "absolute", top: "14px", left: "-10px", fontSize: "12px" }}>
          Evet
        </div>
      </Handle>

      <Handle
        type="source"
        position={Position.Bottom}
        id="no"
        style={{
          left: "70%",
          background: "#555",
          width: "12px",
          height: "12px",
          zIndex: 10,
        }}
        isConnectable={isConnectable}
      >
        <div style={{ position: "absolute", top: "14px", left: "-10px", fontSize: "12px" }}>
          Hayır
        </div>
      </Handle>
    </div>
  );
};

export default memo(SqlConditionNode);
