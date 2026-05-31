import { MenuListDto } from "api/generated";

export const orgChartMenuItem: MenuListDto = {
  id: "org-chart-local",
  name: "OrgChart",
  href: "/orgChart",
  route: "/orgChart",
  icon: "sitemap",
  parentMenuId: "0",
  isActive: true,
  order: 1000,
};
