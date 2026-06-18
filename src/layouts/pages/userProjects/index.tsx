import { useState } from "react";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

import { ConsultantProjectsTab } from "./components/ConsultantProjectsTab";
import { UserProjectStatsTab } from "./components/UserProjectStatsTab";
import { UserProjectsTabSwitcher } from "./components/UserProjectsTabSwitcher";
import { useUserProjectsFilters } from "./hooks/useUserProjectsFilters";
import type { UserProjectsTab } from "./types";

function UserProjects() {
  const [activeTab, setActiveTab] = useState<UserProjectsTab>("consultant");

  const {
    userData,
    selectedUser,
    setSelectedUser,
    hasPerm,
    departmentsData,
    selectedDepartment,
    setSelectedDepartment,
    isInitialized,
  } = useUserProjectsFilters();

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="flex flex-col gap-6 px-1 py-2">
        <UserProjectsTabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === "consultant" && (
          <ConsultantProjectsTab
            departmentsData={departmentsData}
            selectedDepartment={selectedDepartment}
            onDepartmentChange={setSelectedDepartment}
            userData={userData}
            selectedUser={selectedUser}
            onUserChange={setSelectedUser}
            hasPerm={hasPerm}
            isInitialized={isInitialized}
          />
        )}

        {activeTab === "stats" && (
          <UserProjectStatsTab
            departmentsData={departmentsData}
            selectedDepartment={selectedDepartment}
            onDepartmentChange={setSelectedDepartment}
            userData={userData}
            selectedUser={selectedUser}
            onUserChange={setSelectedUser}
            hasPerm={hasPerm}
            isInitialized={isInitialized}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

export default UserProjects;
