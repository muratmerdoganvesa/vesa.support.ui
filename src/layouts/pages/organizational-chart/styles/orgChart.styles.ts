export const chartContainerStyle = {
  width: "100%",
  height: "75vh",
  overflow: "auto",
  position: "relative" as const,
  backgroundColor: "#fbfbfd",
  borderRadius: "12px",
};

export const getChartContentStyle = (zoom: number, x: number, y: number) => ({
  transform: `scale(${zoom / 100})`,
  transformOrigin: "0 0",
  position: "absolute" as const,
  left: `${x}px`,
  top: `${y}px`,
  padding: "30px",
  willChange: "transform, left, top",
});
