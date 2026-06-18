import { useEffect, useState } from "react";

import {
  ProjectTasksApi,
  UserApi,
  UserAppDtoOnlyNameId,
  TicketDepartmensListDto,
  TicketDepartmentsApi,
} from "api/generated";
import getConfiguration from "confiuration";

export const useUserProjectsFilters = () => {
  const [userData, setUserData] = useState<UserAppDtoOnlyNameId[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserAppDtoOnlyNameId | null | undefined>(null);
  const [hasPerm, setHasPerm] = useState<boolean>();
  const [departmentsData, setDepartmentsData] = useState<TicketDepartmensListDto[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<
    TicketDepartmensListDto | null | undefined
  >(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchUsersData = async () => {
    try {
      const config = getConfiguration();
      const api = new UserApi(config);
      const response = await api.apiUserVesaUsersWithoutPhotoGet();
      setUserData(response.data);
    } catch (error) {
      console.log("error", error);
    }
  };

  const fetchUsersDataByDepartment = async (departmentId: string) => {
    try {
      const config = getConfiguration();
      const api = new UserApi(config);
      const response = await api.apiUserVesaUsersWithoutPhotoGet(departmentId);
      setUserData(response.data);
    } catch (error) {
      console.log("error", error);
    }
  };

  const fetchDepartmentsData = async () => {
    try {
      const config = getConfiguration();
      const api = new TicketDepartmentsApi(config);
      const response = await api.apiTicketDepartmentsGetOnlyVesaDepartmentsGet();
      setDepartmentsData(response.data);
    } catch (error) {
      console.log("error");
    }
  };

  const fetchHasPerm = async () => {
    try {
      const config = getConfiguration();
      const api = new ProjectTasksApi(config);
      const response = await api.apiProjectTasksHasPermGet();
      setHasPerm(response.data);

      if (response.data !== true) {
        const api2 = new UserApi(config);
        const response2 = await api2.apiUserGetLoginUserDetailGet();
        setSelectedUser(response2.data);
        const response3 = await api2.apiUserUserDepartmentGet();
        setSelectedDepartment(response3.data);
      }
    } catch (error) {
      console.log("error", error);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchHasPerm();
      await Promise.all([fetchUsersData(), fetchDepartmentsData()]);
      setIsInitialized(true);
    };
    init();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    if (selectedDepartment) {
      fetchUsersDataByDepartment(selectedDepartment.id);
    } else {
      fetchUsersData();
    }

    if (hasPerm === true) {
      setSelectedUser(null);
    }
  }, [selectedDepartment, isInitialized]);

  return {
    userData,
    selectedUser,
    setSelectedUser,
    hasPerm,
    departmentsData,
    selectedDepartment,
    setSelectedDepartment,
    isInitialized,
  };
};
