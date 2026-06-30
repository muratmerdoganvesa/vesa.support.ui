/**
=========================================================
* Material Dashboard 2 PRO React TS - v1.0.2
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-2-pro-react-ts
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/



import CrmModulPage from "layouts/pages/crmModul";
import CrmModulDetailPage from "layouts/pages/crmModul/detail";
import {
  lazy,
  Suspense,
  useState,
  useEffect,
  JSXElementConstructor,
  Key,
  ReactElement,
} from "react";

// react-router components
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

// @mui material components

// Material Dashboard 2 PRO React TS themes



// RTL plugins

// Material Dashboard 2 PRO React TS routes
import routes from "routes";


const Logout = lazy(() => import("layouts/authentication/sign-in/cover/Logout"));
const PrivateRoute = lazy(() => import("layouts/authentication/sign-in/cover/PrivateRoute"));
const Cover = lazy(() => import("layouts/authentication/sign-in/cover"));
const ResetCover = lazy(() => import("layouts/authentication/reset-password/cover"));

// Users
const NewUser = lazy(() => import("layouts/pages/users/new-user"));
const UserDetail = lazy(() => import("layouts/pages/users/userDetail/settings/index"));

// Reports & Demos
const ActivityReports = lazy(() => import("layouts/pages/reports/activityReports/analytics/index"));

// Profile
const Overview = lazy(() => import("layouts/pages/profile/profile-overview"));
const AllProjects = lazy(() => import("layouts/pages/profile/all-projects"));




// Menu Management
const MenuList = lazy(() => import("layouts/pages/menuDefination/MenuList"));
const MenuDetail = lazy(() => import("layouts/pages/menuDefination/MenuDetail"));

// Form Management
const CreateForm = lazy(() => import("layouts/pages/FormManagement/ParamtetersDefination"));
const FormRoleList = lazy(() => import("layouts/pages/FormManagement/form-role/list"));
const FormRoleDetail = lazy(() => import("layouts/pages/FormManagement/form-role/detail"));
const FormAuth = lazy(() => import("layouts/pages/FormManagement/FormAuth/FormAuth"));
const FormAuthDetail = lazy(() => import("layouts/pages/FormManagement/FormAuth/FormAuthDetail"));
const FormList = lazy(() => import("layouts/pages/FormManagement/UsersForm/FormList"));

// Not Authorized
const NotAuthorizationPage = lazy(() => import("layouts/pages/notAuthorizationPage"));

// Dashboards
const Sales = lazy(() => import("layouts/dashboards/sales"));
const CustomerSales = lazy(() => import("layouts/dashboards/customer"));

// Query Builder
const QueryList = lazy(() => import("layouts/pages/queryBuild/queryList"));
const QueryDetail = lazy(() => import("layouts/pages/queryBuild/queryDetail/queryDetail"));

// Calendar
const CalendarPage = lazy(() => import("layouts/pages/calendar"));
const CalendarList = lazy(() => import("layouts/pages/calendar/list"));

// Position
const PositionPage = lazy(() => import("layouts/pages/position"));
const PositionDetailPage = lazy(() => import("layouts/pages/position/details"));

// Organizational Chart
const OrganizationalChart = lazy(() => import("layouts/pages/organizational-chart"));
const OrgChartPage = lazy(() => import("layouts/pages/org-chart"));

// Company Relation
const CompanyRelation = lazy(() => import("layouts/pages/companyRelation"));
const CompanyRelationDetail = lazy(() => import("layouts/pages/companyRelation/detail"));

// Project Management
const ProjectChart = lazy(() => import("layouts/pages/projectManagement/chart"));
const MainScreen = lazy(() => import("layouts/pages/projectManagement"));

// Tickets
const TicketProjects = lazy(() => import("layouts/pages/ticketProjects"));
const CreateTicketProject = lazy(() => import("layouts/pages/ticketProjects/createTicketProject"));
const TicketProjectProgress = lazy(() => import("layouts/pages/ticketProjectProgress"));

// PC Tracking
const PCTrackingManagement = lazy(() => import("layouts/pages/pcTracking"));



// User Tasks / Projects
const UserTasks = lazy(() => import("layouts/pages/userTasks"));
const UserProjects = lazy(() => import("layouts/pages/userProjects"));

// Kanban
const KanbanPage = lazy(() => import("layouts/pages/kanban"));

const ServiceEvaluationSurvey = lazy(() => import("layouts/pages/serviceEvaluationSurvey"));

const DonemTanimlamaMainView = lazy(() => import("layouts/pages/performanceModule/DonemTanimlama/DonemTanimlamaMainView"));
const DonemTanimlamaEditCreate = lazy(() => import("layouts/pages/performanceModule/DonemTanimlama/Edit-Create/DonemTanimlamaEditCreate"));
const SoruCevapTanimlamaMainView = lazy(() => import("layouts/pages/performanceModule/SoruCevapTanimlama/SoruCevapTanimlamaMainView"));
const SoruCevapTanimlamaEditCreate = lazy(() => import("layouts/pages/performanceModule/SoruCevapTanimlama/Edit-Create/SoruCevapTanimlamaEditCreate"));
const PerformanceModule = lazy(() => import("layouts/pages/performanceModule/FormEkrani"));
const FormEkrani = lazy(() => import("layouts/pages/performanceModule/FormEkrani/defaultView"));
const AllPerformanceForms = lazy(() => import("layouts/pages/performanceModule/getAllForms/allForms"));
const TeamFormEkrani = lazy(() => import("layouts/pages/performanceModule/FormEkrani/teamView"));
const AllManagerList = lazy(() => import("layouts/pages/performanceModule/allManager/AllManagerList"));
const ModuleDefinition = lazy(() => import("layouts/pages/moduleDefinition"));
const CareerPath = lazy(() => import("layouts/pages/performanceModule/CareerPath"));
const WebEvents = lazy(() => import("layouts/pages/webEvents"));
const WebEventsCE = lazy(() => import("layouts/pages/webEvents/ce"));
const ActivityCenterPage = lazy(() => import("layouts/pages/activity-center"));
const ActivityPeriodManagement = lazy(() => import("layouts/pages/activityPeriodManagement"));
const ActivityRuleManagement = lazy(() => import("layouts/pages/activityRuleManagement"));
const ChatHome = lazy(() => import("layouts/pages/ai-page/chat-home"));

// import GeneralSidenav from "./examples/Sidenav/components/GeneralSidenav/GeneralSidenav";

const RouteLoadingFallback = () => {
  const [percent, setPercent] = useState(10);

  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const schedule = (delayMs: number, value: number) => {
      timeouts.push(setTimeout(() => setPercent(value), delayMs));
    };

    schedule(180, 30);
    schedule(420, 70);
    schedule(680, 88);

    const intervalId = window.setInterval(() => {
      setPercent((prev) => (prev >= 97 ? prev : prev + 1));
    }, 130);

    return () => {
      timeouts.forEach(clearTimeout);
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-white dark:bg-slate-950"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {/* Üst ince NProgress tarzı şerit */}
      <div
        className="fixed top-0 left-0 right-0 h-[2px] bg-slate-100 dark:bg-slate-900"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="Sayfa yükleme ilerlemesi"
      >
        <div
          className="h-full bg-linear-to-r from-[#4263FF] via-[#6B87FF] to-[#4263FF] shadow-[0_0_14px_rgba(66,99,255,0.65)] transition-[width] duration-300 ease-out motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Merkez içerik */}
      <div className="flex flex-col items-center gap-10" aria-hidden>
        {/* Yüzde sayısı */}
        <div className="flex items-baseline leading-none">
          <span className="text-[3.75rem] font-light text-slate-900 dark:text-slate-900">%</span>
          <span className="tabular-nums text-[3.75rem] font-light tracking-tight text-slate-900 dark:text-white">
            {percent}
          </span>
        </div>

        {/* Alt ince çubuk */}
        <div className="h-px w-36 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-linear-to-r from-[#4263FF] to-[#6B87FF] transition-[width] duration-200 ease-out motion-reduce:transition-none"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Yazı */}
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-600">
          Yükleniyor
        </p>
      </div>
    </div>
  );
};

export default function App() {


  const [rtlCache, setRtlCache] = useState(null);
  const { pathname } = useLocation();



  // // Open sidenav when mouse enter on mini sidenav
  // const handleOnMouseEnter = () => {
  //   if (miniSidenav && !onMouseEnter) {
  //     setMiniSidenav(dispatch, false);
  //     setOnMouseEnter(true);
  //   }
  // };

  // // Close sidenav when mouse leave mini sidenav
  // const handleOnMouseLeave = () => {
  //   if (onMouseEnter) {
  //     setMiniSidenav(dispatch, true);
  //     setOnMouseEnter(false);
  //   }
  // };



  // Setting page scroll to 0 when changing the route
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
  }, [pathname]);

  const getRoutes = (allRoutes: any[]): any =>
    allRoutes.map(
      (route: {
        collapse: any;
        route: string;
        component: ReactElement<any, string | JSXElementConstructor<any>>;
        key: Key;
      }) => {
        if (route.collapse) {
          return getRoutes(route.collapse);
        }

        if (route.route) {
          return <Route path={route.route} element={route.component} key={route.key} />;
        }

        return null;
      }
    );

  // const configsButton = (
  //   // <MDBox
  //   //   display="flex"
  //   //   justifyContent="center"
  //   //   alignItems="center"
  //   //   width="3.25rem"
  //   //   height="3.25rem"
  //   //   bgColor="white"
  //   //   shadow="sm"
  //   //   borderRadius="50%"
  //   //   position="fixed"
  //   //   right="2rem"
  //   //   bottom="2rem"
  //   //   zIndex={99}
  //   //   color="dark"
  //   //   sx={{ cursor: "pointer" }}
  //   //   onClick={handleConfiguratorOpen}
  //   // >
  //   //   {/* <Icon fontSize="small" color="inherit">
  //   //     settings
  //   //   </Icon> */}
  //   // </MDBox>
  // );

  return(
      <>
 

      {/* {layout === "vr" && <Configurator />} */}

      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          {/* Login Sayfası (Herkese Açık) */}
          <Route path="/authentication/sign-in/cover" element={<Cover />} />
          <Route path="/LogOut" element={<Logout />} />
          <Route path="/authentication/reset-password" element={<ResetCover />} />
          <Route path="/tickets/customer" element={<CustomerSales />} />
          <Route path="/NotAuthorization" element={<NotAuthorizationPage />} />
          <Route path="/tickets/statistic" element={<Sales />} />
          <Route path="/profile/profile-overview" element={<Overview />} />
          <Route path="/profile/all-projects" element={<AllProjects />} />
      
          <Route path="/" element={<Navigate to="/profile/profile-overview" replace />} />
          <Route path="*" element={<Navigate to="/profile/profile-overview" replace />} />
          <Route path="/activityCenter" element={<ActivityCenterPage />} />
          <Route path="/activityRuleManagement" element={<ActivityRuleManagement />} />
          <Route path="/activityPeriodManagement" element={<ActivityPeriodManagement />} />
             <Route path="/crmModul" element={<CrmModulPage />} />
            <Route path="/crmModul/detail" element={<CrmModulDetailPage />} />
            <Route path="/crmModul/detail/:id" element={<CrmModulDetailPage />} />

          {/* Private Routes */}
           <Route element={<PrivateRoute />}>  
            {getRoutes(routes)} {/* Tüm özel rotaları ekler */}
            
            {/* <Route path="/documentation" element={<DocumentationModule />} />
            <Route path="/documentation/create/department" element={<DocumentationModule />} />
            <Route path="/documentation/create/library" element={<DocumentationModule />} />
            <Route path="/documentation/create/page" element={<DocumentationModule />} />
            <Route path="/documentation/library/:libraryId" element={<DocumentationModule />} />
            <Route path="/documentation/page/:pageId" element={<DocumentationModule />} />
            <Route path="/documentation/templates" element={<DocumentationModule />} /> */}
            <Route path="/webEvents" element={<WebEvents />} />
            <Route path="/webEvents/detail" element={<WebEventsCE />} />
            <Route path="/webEvents/detail/:id" element={<WebEventsCE />} />

            <Route path="/users/detail" element={<UserDetail />} />
            <Route path="/ActivityReports" element={<ActivityReports />} />
            {/* <Route path="/Messages" element={<MessagePage />} /> */}
            <Route path="/Menus" element={<MenuList />} />
            <Route path="/MenuDetail" element={<MenuDetail />} />
            <Route path="/parameters" element={<CreateForm />} />
            <Route path="/queryBuild" element={<QueryList />} />
            <Route path="/queryBuild/detail" element={<QueryDetail />} />
            <Route path="/queryBuild/detail/:id" element={<QueryDetail />} />
            <Route path="/calendar" element={<CalendarList />} />
            <Route path="/calendar/detail" element={<CalendarPage />} />
            <Route path="/calendar/detail/:id" element={<CalendarPage />} />
            <Route path="/position" element={<PositionPage />} />
            <Route path="/position/detail" element={<PositionDetailPage />} />
            <Route path="/position/detail/:id" element={<PositionDetailPage />} />
            <Route path="/org-chart" element={<OrgChartPage />} />
            <Route path="/organizationalChart" element={<OrganizationalChart />} />
            
            
            <Route path="/form-role" element={<FormRoleList />} />
            <Route path="/form-role/detail" element={<FormRoleDetail />} />
            <Route path="/form-role/detail/:id" element={<FormRoleDetail />} />
            <Route path="/companyRelation" element={<CompanyRelation />} />
            <Route path="/companyRelation/detail" element={<CompanyRelationDetail />} />
            <Route path="/companyRelation/detail/:id" element={<CompanyRelationDetail />} />
            {/* <Route path="/inventory" element={<Inventory />} />
            <Route path="/inventory/detail" element={<CreateInventory />} />
            <Route path="/inventory/detail/:id" element={<CreateInventory />} /> */}
            {/* <Route path="/resumeBuild" element={<ResumeBuild />} /> */}
            <Route path="/pcTracking" element={<PCTrackingManagement />} />
            <Route path="/userTasks" element={<UserTasks />} />
            <Route path="/userProjects" element={<UserProjects />} />
            <Route path="/kanban" element={<KanbanPage />} />
            <Route path="/ticketProjectProgress" element={<TicketProjectProgress />} />
            <Route path="/formAuth" element={<FormAuth />} />
            <Route path="/formAuth/detail" element={<FormAuthDetail />} />
            <Route path="/formAuth/detail/:id" element={<FormAuthDetail />} />
            <Route path="/formlist/:formId" element={<FormList />} />
            <Route path="/allManagerList" element={<AllManagerList />} />
            <Route path="/donemTanimlama" element={<DonemTanimlamaMainView />} />
            <Route path="/donemTanimlama/detail" element={<DonemTanimlamaEditCreate />} />
            <Route path="/donemTanimlama/detail/:id" element={<DonemTanimlamaEditCreate />} />
            <Route path="/questionDefination" element={<SoruCevapTanimlamaMainView />} />
            <Route path="/questionDefination/detail" element={<SoruCevapTanimlamaEditCreate />} />
            <Route
              path="/questionDefination/detail/:id"
              element={<SoruCevapTanimlamaEditCreate />}
            />
            <Route path="/performanceModule/form" element={<PerformanceModule />} />
            <Route path="/performanceModule" element={<FormEkrani />} />
            <Route path="/AllPerformanceList" element={<AllPerformanceForms />} />
            <Route path="/performanceModuleTeam" element={<TeamFormEkrani />} />
            <Route path="/careerPath" element={<CareerPath />} />
            <Route path="/ticketProjects" element={<TicketProjects />} />
            <Route path="/ticketProjects/detail" element={<CreateTicketProject />} />
            <Route path="/ticketProjects/detail/:id" element={<CreateTicketProject />} />
            <Route path="/modules" element={<ModuleDefinition />} />
            <Route path="/projectmanagement" element={<MainScreen />} />
            <Route path="/projectmanagement/chart" element={<ProjectChart />} />
            <Route path="/service-evaluation-survey" element={<ServiceEvaluationSurvey />} />
            <Route path="/chat-home" element={<ChatHome />} />
          </Route> 

          {/* <Route path="/mmessages" element={<ChatPage />} /> */}
          {/* </Route> */}

          {/* Tüm Eşleşmeyen URL'ler için Yönlendirme */}
          {/* <Route path="*" element={<Navigate to="/dashboards/analytics" replace />} /> */}
        </Routes>
      </Suspense>

    </>
  );
}
