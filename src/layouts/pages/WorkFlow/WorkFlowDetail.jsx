import React, { useState, useRef, createRef, useEffect, useCallback } from "react";
import ReactFlow, {
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  Panel,
  useReactFlow,
  SelectionMode,
} from "reactflow";

import "reactflow/dist/style.css";
import Sidebar from "./components/Sidebar.jsx";
import SmartMenuNode from "./components/SmartMenuNode.jsx";
import TeamNode from "./components/TeamNode.jsx";
import ApproverNode from "./components/ApproverNode.jsx";
import ServiceNoteNode from "./components/ServiceNoteNode.jsx";
import StartNode from "./components/StartNode.jsx";
import StopNode from "./components/StopNode.jsx";
import AudioMessageNode from "./components/AudioMessageNode.jsx";
import InputDataNode from "./components/InputDataNode.jsx";
import StartTab from "./propertiespanel/StartTab.jsx";
import StopTab from "./propertiespanel/StopTab.jsx";
import AprroveTab from "./propertiespanel/AprroveTab.jsx";
import SqlConditionNode from "./components/SqlConditionNode.jsx";
import SqlConditionTab from "./propertiespanel/SqlConditionTab.jsx";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAlert } from "../hooks/useAlert";
import { useBusy } from "../hooks/useBusy";
import { WorkFlowDefinationApi } from "api/generated";
import getConfiguration from "confiuration";
import CustomInputComponent from "./CustomInput";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";

// shadcn/ui
import { Button } from "components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "components/ui/alert-dialog";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "components/ui/resizable";

// Lucide
import { X, Save, Trash2, Loader2, Settings } from "lucide-react";
import DashboardNavbar from "examples/Navbars/DashboardNavbar/index.js";

// ─── Node type registry ────────────────────────────────────────────────────────

const nodeTypes = {
  smartMenuNode: SmartMenuNode,
  teamNode: TeamNode,
  approverNode: ApproverNode,
  serviceNoteNode: ServiceNoteNode,
  audioMessageNode: AudioMessageNode,
  inputDataNode: InputDataNode,
  startNode: StartNode,
  stopNode: StopNode,
  sqlConditionNode: SqlConditionNode,
};

const initialNodes = [
  {
    id: "1",
    type: "startNode",
    position: { x: 0, y: 0 },
    className: "noHaveEdges",
    data: { name: "Varsayılan İsim", text: "Varsayılan Metin" },
  },
];

const initialEdges = [];

let id = 1;
const getId = generateUUID();
const flowKey = "example-flow";
const txtname = createRef();

function generateUUID() {
  let d = new Date().getTime();
  const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
  return uuid;
}

var globalArray = [];

// ─── Render component for properties panel ────────────────────────────────────

const renderComponent = (type, data, node, handlePropertiesChange) => {
  switch (type) {
    case "startNode":
      return data ? (
        <StartTab
          key={node.id}
          initialValues={data}
          node={node}
          onButtonClick={handlePropertiesChange}
        />
      ) : null;
    case "stopNode":
      return data ? (
        <StopTab
          key={node.id}
          initialValues={data}
          node={node}
          onButtonClick={handlePropertiesChange}
        />
      ) : null;
    case "approverNode":
      return data ? (
        <AprroveTab
          key={node.id}
          initialValues={data}
          node={node}
          onButtonClick={handlePropertiesChange}
        />
      ) : null;
    case "sqlConditionNode":
      return data ? (
        <SqlConditionTab
          key={node.id}
          initialValues={data}
          node={node}
          onButtonClick={handlePropertiesChange}
        />
      ) : null;
    default:
      return null;
  }
};

// ─── Properties empty state ────────────────────────────────────────────────────

function PropertiesEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
        <Settings className="w-5 h-5 text-slate-300" />
      </div>
      <p className="text-sm font-medium">Bir node seçin</p>
      <p className="text-xs text-center max-w-[200px]">
        Özelliklerini düzenlemek için canvas üzerindeki bir node'a tıklayın
      </p>
    </div>
  );
}

// ─── Flow component ────────────────────────────────────────────────────────────
// The ResizablePanelGroup lives here so it has direct access to all node state

function Flow(props) {
  const navigate = useNavigate();
  const dispatchBusy = useBusy();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const [isHovered, setIsHovered] = useState(false);
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [firstNode, setFirstNode] = useState(1);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  var [workflowName, setworkflowName] = useState("");
  const [selecteNodeType, setselecteNodeType] = useState({});
  const [selecteNodeData, setselecteNodeData] = useState(1);
  const [selectedNode, setselectedNode] = useState(1);
  const [isLoadingProperties, setisLoadingProperties] = useState(false);

  const [isEdit, setisEdit] = useState(false);
  const [msgOpen, setmsgOpen] = useState(false);

  const dispatchAlert = useAlert();
  const [count, setCount] = useState(0);
  const { setViewport } = useReactFlow();
  const { id } = useParams();

  useEffect(() => {
    if (!id) {
      return;
    }

    dispatchBusy({ isBusy: true });
    setisEdit(true);

    const conf = getConfiguration();
    const api = new WorkFlowDefinationApi(conf);

    void api
      .apiWorkFlowDefinationIdGet(id)
      .then((response) => {
        const flow = JSON.parse(response.data.defination);
        if (flow) {
          setworkflowName(response.data.workflowName);
          txtname.current?.setValue(response.data.workflowName);
          const { x = 0, y = 0, zoom = 1 } = flow.viewport ?? {};
          setNodes(flow.nodes ?? []);
          setEdges(flow.edges ?? []);
          setViewport({ x, y, zoom });
        }
      })
      .catch(() => {})
      .finally(() => dispatchBusy({ isBusy: false }));
  }, [id, setNodes, setViewport, dispatchBusy]);

  const handleWorkFlowName = (event) => {
    alert(txtname.current?.current);
    setworkflowName(event.target.value);
  };

  const handleUserInput = (e) => {
    setworkflowName(e.target.value);
    workflowName = e.target.value;
  };

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData("application/reactflow");

      if (typeof type === "undefined" || !type) {
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const id = generateUUID();
      const newNode = {
        id,
        type,
        position,
        className: "noHaveEdges",
        data: { name: "Varsayılan İsim", text: "Varsayılan Metin" },
      };

      if (id == 1) {
        props.parentCallback(false);
        setFirstNode(newNode);
      }

      console.log(globalArray);
      if (type === "startNode" && globalArray.some((node) => node.type === "startNode")) {
        // startNode only once
      }
      if (type === "stopNode" && globalArray.some((node) => node.type === "stopNode")) {
        // stopNode only once
      }

      globalArray.push(newNode);
      setNodes((nds) => [...nds, newNode]);
    },
    [reactFlowInstance]
  );

  const handlePropertiesChange = (newValue) => {
    let obje = nodes.find((o) => o.id === newValue.id);
    if (obje) {
      obje.data = newValue.data;
      updateNodeText("1", "Updated Node 1");
    }
  };

  const onDelete = (newValue) => {
    let index = nodes.findIndex((o) => o.id === selectedNode.id);
    if (index !== -1) {
      nodes.splice(index, 1);
    }
  };

  const onSave = useCallback(() => {
    const haveNodeWithoutEdge = reactFlowInstance
      .getNodes()
      .filter((node) => node.className.includes("noHaveEdges"));

    if (txtname.current?.current.toString().trim() == "") {
      dispatchAlert({ message: "Akış Adı Boş Bırakılamaz", type: "Error" });
      return;
    }

    if (reactFlowInstance && !haveNodeWithoutEdge.length) {
      const flow = { ...reactFlowInstance.toObject(), firstNode };
      if (isEdit) {
        var dto = {
          id: id,
          workflowName: txtname.current?.current,
          defination: JSON.stringify(flow),
          isActive: false,
          revision: 0,
        };

        var conf = getConfiguration();
        let api = new WorkFlowDefinationApi(conf);
        dto.workflowName = txtname.current?.current;

        var data = api
          .apiWorkFlowDefinationPut(dto)
          .then((response) => {
            dispatchAlert({ message: "Kayıt Güncelleme Başarılı", type: "Success" });
          })
          .catch((error) => {
            dispatchAlert({
              message: error.response?.data || "Bilinmeyen bir hata oluştu",
              type: "Error",
            });
          });
      } else {
        var dto = {
          workflowName: txtname.current?.current,
          defination: JSON.stringify(flow),
          isActive: false,
          revision: 0,
        };

        var conf = getConfiguration();
        let api = new WorkFlowDefinationApi(conf);
        dto.workflowName = txtname.current?.current;

        var data = api
          .apiWorkFlowDefinationPost(dto)
          .then((response) => {
            dispatchAlert({ message: "Kayıt Ekleme Başarılı", type: "Success" });
            navigate("/WorkFlowList");
          })
          .catch((error) => {
            dispatchAlert({
              message: error.response?.data || "Bilinmeyen bir hata oluştu",
              type: "Error",
            });
          });
      }
    }
  }, [reactFlowInstance]);

  const onRestore = useCallback(() => {
    globalArray.pop();
    const restoreFlow = async () => {
      const flow = JSON.parse(localStorage.getItem(flowKey));
      console.log(JSON.parse(localStorage.getItem(flowKey)));
      if (flow) {
        const { x = 0, y = 0, zoom = 1 } = flow.viewport;
        setNodes(flow.nodes || []);
        setEdges(flow.edges || []);

        var nodesCopy = JSON.parse(JSON.stringify(flow.nodes));
        nodesCopy.forEach(function (node) {
          globalArray.push(node);
        });
        setViewport({ x, y, zoom });
      }
    };
    restoreFlow();
  }, [setNodes, setViewport]);

  const updateNodeText = (id, newText) => {
    setNodes((els) =>
      els.map((el) => {
        if (el.id === id) {
          el.data = { ...el.data };
        }
        return el;
      })
    );
  };

  const onRefresh = useCallback(
    (nodes) => {
      const restoreFlow = async () => {
        console.log(JSON.stringify(nodes));
        let flow = JSON.parse(JSON.stringify(nodes));
        if (flow) {
          const { x = 0, y = 0, zoom = 1 } = flow.viewport;
          setNodes(flow.nodes || []);
          setEdges(flow.edges || []);
          setViewport({ x, y, zoom });

          var nodesCopy = JSON.parse(JSON.stringify(flow.nodes));
          nodesCopy.forEach(function (node) {
            globalArray.push(node);
          });
          setViewport({ x, y, zoom });
        }
      };
      restoreFlow();
    },
    [setNodes, setViewport]
  );

  const onEdgeClick = (event, edge) => {
    console.log("Tıklanan bağlantı:", edge);
  };

  const onNodeClick = (event, node) => {
    setisLoadingProperties(true);
    setselecteNodeType(node.type);
    setselecteNodeData(node.data);
    setselectedNode(node);
    setisLoadingProperties(false);
  };

  const onConnect = useCallback(
    (params) => {
      const getNodes = reactFlowInstance.getNodes();
      const sourceNode = getNodes.find((node) => node.id === params.source);
      const targetNode = getNodes.find((node) => node.id === params.target);

      if (sourceNode.type === "startNode" && targetNode.type === "stopNode") {
        return;
      }

      let flowNodes = getNodes.map((node) => {
        if (node.id === params.source || node.id === params.target) {
          node.className = "";
        }
        return node;
      });

      setNodes(flowNodes || []);
      params.animated = true;
      params.style = { stroke: "#000" };
      setEdges((eds) => addEdge(params, eds));
    },
    [setNodes, reactFlowInstance]
  );

  const handleMsgDialog = (confirmed) => {
    setmsgOpen(false);
    if (confirmed) {
      navigate("/WorkFlowList");
    }
  };

  // ── The ResizablePanelGroup lives here so it can access all state above ──

  return (
    <ResizablePanelGroup direction="vertical" className="h-full min-h-0 w-full">
      {/* ── Canvas panel ── */}
      <ResizablePanel defaultSize={60} minSize={20}>
        <div className="reactflow-wrapper h-full min-h-0 w-full relative" ref={reactFlowWrapper}>
          <ReactFlow
              className="h-full min-h-[200px] w-full"
              onMouseEnter={() => setIsHovered(true)}
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              selectionMode={SelectionMode.Full}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onNodeClick={onNodeClick}
              onEdgeClick={onEdgeClick}
          >
              {/* ── Floating toolbar ── */}
              <Panel position="top-right">
                <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg px-3 py-2.5 m-2">
                  <div className="flex items-center gap-1.5 mr-1">
                    <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                      Akış Adı
                    </span>
                    <div className="min-w-[160px]">
                      <CustomInputComponent ref={txtname} />
                    </div>
                  </div>

                  <div className="w-px h-6 bg-slate-200 mx-1" />

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setmsgOpen(true)}
                    className="gap-1.5 border-slate-300 text-slate-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    Vazgeç
                  </Button>

                  <Button
                    size="sm"
                    onClick={onSave}
                    className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Kaydet
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDelete}
                    className="gap-1.5 border-slate-300 text-slate-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Seçileni Sil
                  </Button>
                </div>
              </Panel>

              <Background variant="dots" gap={12} size={1} />
            </ReactFlow>

          {/* ── Discard confirmation dialog ── */}
          <AlertDialog open={msgOpen} onOpenChange={setmsgOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-amber-600 flex items-center gap-2">
                  <span>⚠</span> DİKKAT
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Verileriniz kaydedilmeyecektir, devam edilsin mi?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => handleMsgDialog(false)}>
                  Hayır
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleMsgDialog(true)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Evet, Vazgeç
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </ResizablePanel>

      {/* ── Resize handle ── */}
      <ResizableHandle
        withHandle
        className="bg-slate-100 hover:bg-violet-100 transition-colors data-resize-handle-active:bg-violet-200"
      />

      {/* ── Properties panel ── */}
      <ResizablePanel defaultSize={40} minSize={12}>
        <div className="h-full min-h-0 overflow-auto bg-white border-t border-slate-200">
          {/* Sticky header */}
          <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50/90 backdrop-blur-sm">
            <Settings className="w-4 h-4 text-violet-600" />
            <span className="text-sm font-semibold text-slate-700">Özellikler</span>
          </div>

          {/* Content */}
          <div className="p-4">
            {isLoadingProperties ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
              </div>
            ) : (
              renderComponent(
                selecteNodeType,
                selecteNodeData,
                selectedNode,
                handlePropertiesChange
              ) ?? <PropertiesEmptyState />
            )}
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

// ─── WorkFlowDetail (root) ─────────────────────────────────────────────────────

function WorkFlowDetail(props) {
  const [disabled, setDisabled] = useState(false);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <div className="flex min-h-0 flex-1 w-full flex-row gap-4">
        <aside
          className="flex h-full max-h-full w-52 shrink-0 flex-col overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm"
          aria-label="Akış node paleti"
        >
          <Sidebar disabled={disabled} />
        </aside>

        <ReactFlowProvider>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <Flow parentCallback={setDisabled} {...props} />
          </div>
        </ReactFlowProvider>
      </div>
    </DashboardLayout>
  );
}

export default WorkFlowDetail;
