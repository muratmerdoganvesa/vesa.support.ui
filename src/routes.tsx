
import { lazy } from "react";

const Sales = lazy(() => import("layouts/dashboards/sales"));
const ProfileOverview = lazy(() => import("layouts/pages/profile/profile-overview"));
const AllProjects = lazy(() => import("layouts/pages/profile/all-projects"));
const NewUser = lazy(() => import("layouts/pages/users/new-user"));
const ListUser = lazy(() => import("layouts/pages/users/list-user"));

const SignInCover = lazy(() => import("layouts/authentication/sign-in/cover"));

const ResetCover = lazy(() => import("layouts/authentication/reset-password/cover"));
const Logout = lazy(() => import("layouts/authentication/sign-in/cover/Logout"));
const EditProject = lazy(() => import("layouts/pages/profile/all-projects/edit-product"));
const CreateRequest = lazy(() => import("layouts/pages/talepYonetimi/createTicket"));
const AllTickets = lazy(() => import("layouts/pages/talepYonetimi/allTickets"));
const Departmens = lazy(() => import("layouts/pages/users/departments"));
const CreateDepartment = lazy(() => import("layouts/pages/users/departments/createDepartment"));
const MenuList = lazy(() => import("layouts/pages/menuDefination/MenuList"));
const MenuDetail = lazy(() => import("layouts/pages/menuDefination/MenuDetail"));
const ListForm = lazy(() => import("layouts/pages/FormManagement/listForm"));
const CreateForm = lazy(() => import("layouts/pages/FormManagement/ParamtetersDefination"));
const ParameterEdit = lazy(() => import("layouts/pages/FormManagement/ParameterEdit"));
const UserFormList = lazy(() => import("layouts/pages/FormManagement/UsersForm/UserForms"));
const Teams = lazy(() => import("layouts/pages/teams"));
const CreateTeams = lazy(() => import("layouts/pages/teams/createTeam"));
const RolesDefination = lazy(() => import("layouts/pages/roles/RoleList"));
const RoleScreenDefination = lazy(() => import("layouts/pages/roles/RoleScreen"));
const RolesList = lazy(() => import("layouts/pages/roles/RoleList"));
const NotAuthorizationPage = lazy(() => import("layouts/pages/notAuthorizationPage"));
const DataTables = lazy(() => import("layouts/pages/users/list-user"));
const Settings = lazy(() => import("layouts/pages/users/userDetail/settings/index"));
const WorkCompanyCE = lazy(() => import("layouts/pages/workCompany/ce"));
const WorkCompany = lazy(() => import("layouts/pages/workCompany"));
const WorkCompanySystem = lazy(() => import("layouts/pages/workCompanySystem"));
const WorkCompanySystemCE = lazy(() => import("layouts/pages/workCompanySystem/ce"));
const SolveTicket = lazy(() => import("layouts/pages/talepYonetimi/solveTicket"));
const SolveAllTicket = lazy(() => import("layouts/pages/talepYonetimi/solveAllTicket"));
const WorkFlowList = lazy(() => import("layouts/pages/WorkFlow/WorkFlowList"));
const WorkFlowDetail = lazy(() => import("layouts/pages/WorkFlow/WorkFlowDetail.jsx"));
const ApproveList = lazy(() => import("layouts/pages/WorkFlow/ApproveList"));
const ParameterView = lazy(() => import("layouts/pages/FormManagement/listForm/ParameterView"));
const OrgChart = lazy(() => import("layouts/pages/org-chart"));
const ActivityCenter = lazy(() => import("layouts/pages/activity-center"));
const ActivityRuleManagement = lazy(() => import("layouts/pages/activityRuleManagement"));
const ActivityPeriodManagement = lazy(() => import("layouts/pages/activityPeriodManagement"));

// const { userAppDto } = useUser(); // Context'ten veriyi alıyoruz

const routes = [
  {
    type: "collapse",
    name: "User Form List",
    key: "userFormList",
  
    collapse: [
      {
        name: "userFormList",
        key: "userFormList",
        route: "/userFormList",
        component: <UserFormList />,
      },
    ],
  },
  {
    type: "collapse",
    name: "Work Company System",
    key: "workflowList",
    
    collapse: [
      {
        name: "workflowList",
        key: "workflowList",
        route: "/workflowList",
        component: <WorkFlowList />,
      },
    ],
  },
  {
    type: "collapse",
    name: "Work Company System",
    key: "workflowdetail",
    
    collapse: [
      {
        name: "workflowdetail",
        key: "workflowdetail",
        route: "/WorkFlowList/detail/:id",
        component: <WorkFlowDetail />,
      },
    ],
  },
  {
    type: "collapse",
    name: "Work Company System",
    key: "workflowdetailCreate",
    
    collapse: [
      {
        name: "workflowdetail",
        key: "workflowdetail",
        route: "/WorkFlowList/detail",
        component: <WorkFlowDetail />,
      },


    ],
  },

  {
    type: "collapse",
    name: "Onay",
    key: "approve",
    
    collapse: [
      {
        name: "approve",
        key: "approve",
        route: "/approve",
        component: <ApproveList />,
      },
    ],
  },
  {
    type: "collapse",
    name: "Work Company System",
    key: "workCompanySystemList",
    
    collapse: [
      {
        name: "workCompanySystemList",
        key: "workCompanySystemList",
        route: "/workCompanySystem",
        component: <WorkCompanySystem />,
      },
    ],
  },

  {
    type: "collapse",
    name: "Work Company System Edit Create",
    key: "workCompanySystemEditCreate",
    
    collapse: [
      {
        name: "Work Company System Edit Create",
        key: "workCompanySystemEditCreate",
        route: "/workCompanySystem/detail",
        component: <WorkCompanySystemCE />,
      },


    ],
  },
  {
    type: "collapse",
    name: "Work Company System Edit ",
    key: "workCompanySystemEdit",
    
    collapse: [
      {
        name: "Work Company System Edit ",
        key: "workCompanySystemEdit",
        route: "/workCompanySystem/detail/:id",
        component: <WorkCompanySystemCE />,

      },



    ],
  },
  {
    type: "collapse",
    name: "Work Company",
    key: "workCompany",
    
    collapse: [
      {
        name: "Work Company",
        key: "workCompany",
        route: "/workCompany",
        component: <WorkCompany />,
      },
    ],
  },
  {
    type: "collapse",
    name: "Work Company Edit Create",
    key: "workCompanyEditCreate",
    
    collapse: [
      {
        name: "Work Company Edit Create",
        key: "workCompanyEditCreate",
        route: "/workCompany/detail",
        component: <WorkCompanyCE />,
      },

    ],
  },
  {
    type: "collapse",
    name: "Work Company Edit Create",
    key: "workCompanyEditCreate",
    
    collapse: [
      {
        name: "Work Company Edit Create",
        key: "workCompanyEditCreate",
        route: "/workCompany/detail/:id",
        component: <WorkCompanyCE />,
      },
    ],
  },



  {
    type: "collapse",
    name: "My Profile",
    key: "my-profile",
    collapse: [
      {
        name: "My Profile",
        key: "my-profile",
        route: "/pages/profile/profile-overview",
        component: <ProfileOverview />,

      },
      {
        name: "Settings",
        key: "profile-settings",
        route: "/pages/account/settings",
        component: <Settings />,
      },
      {
        name: "Logout",
        key: "logout",
        route: "/LogOut",
        component: <Logout />,
      },
    ],
  },
  {
    type: "hidden",
    name: "Menüler",
    key: "menus",
    collapse: [
      {
        name: "Menü Listesi",
        key: "menu-list",
        route: "/menus",
        component: <MenuList />,
      },
    ],
  },
  {
    type: "hidden",
    name: "Menü Detayları",
    key: "menu-detail",
    collapse: [
      {
        name: "Menü Detayları",
        key: "menu-detail",
        route: "/menus/detail",
        component: <MenuDetail />,
      },
    ],
  },
  {
    type: "hidden",
    name: "Menü Detayları With Params",
    key: "menu-detail-with-params",
    collapse: [
      {
        name: "Menü Detayları With Params",
        key: "menu-detail-with-params",
        route: "/menus/detail/:id",
        component: <MenuDetail />,

      },
    ],
  },
  {
    type: "hidden",
    name: "OrgChart",
    key: "orgChart",
    collapse: [
      {
        name: "OrgChart",
        key: "orgChart",
        route: "/orgChart",
        component: <OrgChart />,
      },
    ],
  },
   {
    type: "hidden",
    name: "ActivityCenter",
    key: "activityCenter",
    collapse: [
      {
        name: "ActivityCenter",
        key: "activityCenter",
        route: "/activityCenter",
        component: <ActivityCenter />,
      },
    ],
  },
  {
   type: "hidden",
    name: "ActivityRuleManagement",
    key: "activityRuleManagement",
    collapse: [
      {
        name: "ActivityRuleManagement",
        key: "activityRuleManagement",
        route: "/activityRuleManagement",
        component: <ActivityRuleManagement />,
      },
    ],
  },
  {
   type: "hidden",
    name: "ActivityPeriodManagement",
    key: "activityPeriodManagement",
    collapse: [
      {
        name: "ActivityPeriodManagement",
        key: "activityPeriodManagement",
        route: "/activityPeriodManagement",
        component: <ActivityPeriodManagement />,
      },
    ],
  },
  {
    type: "hidden",
    name: "Projeler",
    key: "projects",
    
    collapse: [
      {
        name: "Proje Detayları",
        key: "edit-product",
        route: "/profile/all-projects/edit-project/:id", // Düzenleme rotası
    
        component: <EditProject />, // EditProduct bileşeni
      },
      {
        name: "Proje Detayları",
        key: "edit-product",
        route: "/profile/all-projects/edit-project/", // Düzenleme rotası
        component: <EditProject />, // EditProduct bileşeni
      },
    ],
  },
  {
    type: "hidden",
    name: "Roles List",
    key: "rolesList",
    collapse: [
      {
        name: "Roles List",
        key: "rolesList",
        route: "/roles",
        component: <RolesList />,
      },
    ],
  },
  {
    type: "hidden",
    name: "edit Roles",
    key: "editRoles",
    collapse: [
      {
        name: "edit Roles",
        key: "editRoles",
        route: "/roles/detail/:id",
        component: <RoleScreenDefination />,

      },
    ],
  },
  {
    type: "hidden",
    name: "Role Screen",
    key: "roleScreen",
    collapse: [
      {
        name: "Role Screen",
        key: "roleScreen",
        route: "/roles/detail",
        component: <RoleScreenDefination />,

      },
    ],
  },
  {
    type: "hidden",
    name: "Form Management",
    key: "formManagement",
    collapse: [
      {
        name: "List Parameters",
        key: "listParameters",
        route: "/parameters",
        component: <ListForm />,
      },
    ],
  },
  {
    type: "hidden",
    name: "Create Form",
    key: "createForm",
    collapse: [
      {
        name: "Create Form",
        key: "createForm",
        route: "/parameters/detail",
        component: <CreateForm />,

      },
    ],
  },

  {
    type: "hidden",
    name: "Create Form",
    key: "createForm",
    collapse: [
      {
        name: "Create Form",
        key: "createForm",
        route: "/ParameterEdit/",
        component: <ParameterEdit />,

      },
    ],
  },

  {
    type: "hidden",
    name: "Create Form",
    key: "createForm",
    collapse: [
      {
        name: "Create Form",
        key: "createForm",
        route: "/parameters/view/:formId/:formRunId?/:isVisibility?",
        component: <ParameterView />,

      },
    ],
  },
  {
    type: "hidden",
    name: "Create Form With Params",
    key: "createFormWithParams",
    collapse: [
      {
        name: "Create Form With Params",
        key: "createFormWithParams",
        route: "/parameters/detail/:id",
        component: <CreateForm />,

      },
    ],
  },
  {
    type: "hidden",
    name: "all Projects w/Params",
    key: "projectsID",
    collapse: [
      {
        name: "All Projects",
        key: "all-projects-id",
        route: "/profile/all-projects/:id",
        component: <AllProjects />,
      },
    ],
  },
  {
    type: "hidden",
    name: "Departments",
    key: "departments",
    collapse: [
      {
        name: "Departments",
        key: "departments",
        route: "/departments",
        component: <Departmens />,
      },
    ],
  },
  {
    type: "hidden",
    name: "Create Department",
    key: "createDepartment",
    collapse: [
      {
        name: "Create Department",
        key: "Create-Department",
        route: "/departments/detail",
        component: <CreateDepartment />,
      },
    ],
  },
  {
    type: "hidden",
    name: "Create Department",
    key: "createDepartmentWithParams",
    collapse: [
      {
        name: "Create Department",
        key: "Create-Department",
        route: "/departments/detail/:id",
        component: <CreateDepartment />,

      },
    ],
  },
  {
    type: "hidden",
    name: "Teams",
    key: "teams",
    collapse: [
      {
        name: "Teams",
        key: "teams",
        route: "/teams",
        component: <Teams />,
      },
    ],
  },

  {
    type: "hidden",
    name: "Create Team",
    key: "createTeam",
    collapse: [
      {
        name: "Create Team",
        key: "Create-Team",
        route: "/teams/createTeam",
        component: <CreateTeams />,
      },
    ],
  },
  {
    type: "hidden",
    name: "Create Team",
    key: "createTeamWithParams",
    collapse: [
      {
        name: "Create Team",
        key: "Create-Team",
        route: "/teams/createTeam/:id",
        component: <CreateTeams />,
      },
    ],
  },
  {
    type: "hidden",
    name: "Solve All Ticket",
    key: "solveAllTicket",
    collapse: [
      {
        name: "Solve All Ticket",
        key: "solveAllTicket",
        route: "/solveAllTicket/",
        component: <SolveAllTicket />,
      },
    ],
  },
  {
    type: "hidden",
    name: "Solve Ticket",
    key: "solveTicket",
    collapse: [
      {
        name: "Solve Ticket",
        key: "solveTicket",
        route: "/solveAllTicket/solveTicket/",
        component: <SolveTicket />,
      },
    ],
  },

  {
    type: "hidden",
    name: "Create Ticket",
    key: "createTicket",
    collapse: [
      {
        name: "Create Request",
        key: "Create-Request",
        route: "/tickets/detail",
        component: <CreateRequest />,
      },
    ],
  },
  {
    type: "hidden",
    name: "Edit Ticket",
    key: "editTicket",
    collapse: [
      {
        name: "Edit Ticket",
        key: "Edit-Ticket",
        route: "/tickets/detail/",
        component: <CreateRequest />,
      },
    ],
  },

  {
    type: "hidden",
    name: "All Tickets",
    key: "showTickets",
    collapse: [
      {
        name: "All Tickets",
        key: "All-Tickets",
        route: "/tickets/",
        component: <AllTickets />,


      },
    ],
  },
  {
    type: "hidden",
    name: "User List",
    key: "userList",
    collapse: [
      {
        name: "User List",
        key: "userList",
        route: "/users",
        component: <DataTables />,
      },
    ],
  },
  {
    type: "hidden",
    name: "User Create",
    key: "userCreate",

    collapse: [
      {
        name: "User Create",
        key: "userCreate",
        route: "/users/detail",
        component: <Settings />,
      },

    ],
  },
  {
    type: "hidden",
    name: "User Edit",
    key: "userEdit",

    collapse: [
      {
        name: "User Edit",
        key: "userEdit",
        route: "/users/detail/?id",
        component: <Settings />,

      },
    ],
  },


  {
    type: "collapse",


    name: "Dashboards",
    key: "dashboards",
    collapse: [
     
      {
        name: "Sales",
        key: "sales",
        route: "/dashboards/sales",
        component: <Sales />,
      },
    ],
  },


  {
    type: "collapse",
    name: "Vesa Destek Yönetim",
    key: "pages",   
    collapse: [
      {
        name: "Profile",
        key: "profile",
        collapse: [
          {
            name: "Profile Overview",
            key: "profile-overview",
            route: "/profile/profile-overview",
            component: <ProfileOverview />,
          },
          {
            name: "All Projects",
            key: "all-projects",
            route: "/profile/all-projects",
            component: <AllProjects />,
          },
        ],
      },
      {
        name: "Users",
        key: "users",
        collapse: [
          {
            name: "Kullanıcı Listesi",
            key: "users",
            route: "users",
            component: <ListUser />,
          },
        ],
      },
    ],
  },
];

export default routes;
