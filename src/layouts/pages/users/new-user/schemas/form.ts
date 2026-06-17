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

import checkout from "layouts/pages/users/new-user/schemas/form";

let form = {
  formId: "new-user-form",
  formField: {
    userName: {
      name: "userName",
      label: "User Name",
      type: "text",
      required: "@",
      errorMsg: "Kullanıcı Adı Zorunludur.",
      invalidMsg: "Lütfen geçerli bir kullanıcı adı girin",
    },
    firstName: {
      name: "firstName",
      label: "First Name",
      type: "text",
      errorMsg: "Adı Zorunludur",
    },
    lastName: {
      name: "lastName",
      label: "Last Name",
      type: "text",
      errorMsg: "Soyadı Zorunludur",
    },
    company: {
      name: "company",
      label: "Company",
      type: "text",
    },
    email: {
      name: "email",
      label: "Email Address",
      type: "email",
      errorMsg: "Email address is required.",
      invalidMsg: "Your email address is invalid",
    },
    password: {
      name: "password",
      label: "Password",
      type: "password",
      errorMsg: "Password is required.",
      invalidMsg: "Your password should be more than 6 characters.",
    },
    passwordRepeat: {
      name: "repeatPassword",
      label: "repeatPassword",
      type: "repeatPassword",
      errorMsg: "repeatPassword is required.",
      invalidMsg: "Your password should be more than 6 characters.",
    },
    department: {
      name: "department",
      label: "Department",
      type: "text",
      errorMsg: "Department is required.",
    },
    manager1: {
      name: "manager1",
      label: "First Manager",
      type: "text",
      errorMsg: "First Manager is required.",
    },
    manager2: {
      name: "manager2",
      label: "Second Manager",
      type: "text",
      errorMsg: "Second Manager is required.",
    },
    title: {
      name: "title",
      label: "Title",
      type: "text",
      errorMsg: "Title is required.",
    },
    linkedinUrl: {
      name: "linkedinUrl",
      label: "LinkedIn Profile",
      type: "url",
      errorMsg: "LinkedIn profile URL is required.",
    },
    cv: {
      name: "cv",
      label: "CV Upload",
      type: "file",
      errorMsg: "CV upload is required.",
    },
    skills: {
      name: "skills",
      label: "Technical Skills",
      type: "multiselect",
      errorMsg: "At least one skill is required.",
    },
    token: {
      name: "token",
      label: "Token",
      type: "text",
      errorMsg: "Token is required.",
    },
    isBlocked: {
      name: "isBlocked",
      label: "Is Blocked",
      type: "checkbox",
      errorMsg: "Blocked status is required.",
    },
      isTestData: {
      name: "isTestData",
      label: "Is Test Data?",
      type: "checkbox",
      errorMsg: "Test data status is required.",
    },
    vacationMode: {
      name: "vacationMode",
      label: "Vacation Mode",
      type: "checkbox",
      errorMsg: "Vacation mode status is required.",
    },
    isSystemAdmin: {
      name: "isSystemAdmin",
      label: "Sistem Yöneticisi",
      type: "checkbox",
      errorMsg: "Sistem Yöneticisi is required.",
    },
    profileInfo: {
      name: "profileInfo",
      label: "Profil yazı",
      type: "text",
      errorMsg: "Vacation mode status is required.",
    },
    photo: {
      name: "photo",
      label: "Profile Photo",
      type: "file",
      errorMsg: "Profile photo is required.",
    },
    canSsoLogin: {
      name: "canSsoLogin",
      label: "canSsoLogin",
      type: "checkbox",
      errorMsg: "canSsoLogin",
    },
    sapDepartmentText: {
      name: "SAPDepartmentText",
      label: "SAPDepartmentText",
      type: "text",
      errorMsg: "SAPDepartmentText",
    },
    sapPositionText: {
      name: "SAPPositionText",
      label: "SAPPositionText",
      type: "text",
      errorMsg: "SAPPositionText",
    },
    roleIds: {
      name: "roleIds",
      label: "roleIds",
      type: "multiselect",
      errorMsg: "roleIds",
    },
    ticketDepartmentId: {
      name: "ticketDepartmentId",
      label: "ticketDepartmentId",
      type: "text",
      errorMsg: "ticketDepartmentId",
    },
    workCompanyId: {
      name: "workCompanyId",
      label: "workCompanyId",
      type: "text",
      errorMsg: "workCompanyId",
    },
    hasTicketPermission: {
      name: "hasTicketPermission",
      label: "Başkası Adına Talep Oluşturma",
      type: "checkbox",
      errorMsg: "hasTicketPermission",
    },
    hasDepartmentPermission: {
      name: "hasDepartmentPermission",
      label: "Tüm departman taleplerini görüntüleme",
      type: "checkbox",
      errorMsg: "hasDepartmentPermission",
    },
    mainManagerUserAppId:{
      name: "mainManagerUserAppId",
      label: "Asıl Yönetici",
      type: "text",
      errorMsg: "Yönetici seçilmedi",
    },
    hasOtherCompanyPermission: {
      name: "hasOtherCompanyPermission",
      label: "Tüm şirket taleplerini görüntüleme",
      type: "checkbox",
      errorMsg: "hasOtherCompanyPermission",
    },
    hasOtherDeptCalendarPerm: {
      name: "hasOtherDeptCalendarPerm",
      label: "Ekip planlama departman seçebilme",
      type: "checkbox",
      errorMsg: "hasOtherDeptCalendarPerm",
    },
    canEditTicket: {
      name: "canEditTicket",
      label: "Oluşturulan talebi düzenleyebilme",
      type: "checkbox",
      errorMsg: "canEditTicket",
    },
    dontApplyDefaultFilters: {
      name: "dontApplyDefaultFilters",
      label: "Varsayılan filtreleri uygulama",
      type: "checkbox",
      errorMsg: "dontApplyDefaultFilters",
    },
    isMailSender: {
      name: "isMailSender",
      label: "Mail Gönderilsin mi",
      type: "checkbox",
      errorMsg: "isMailSender"
    },
    positionId: {
      name: "positionId",
      label: "Pozisyon",
      type: "text",
      errorMsg: "Pozisyon seçilmedi",
    },
    userLevel: {
      name: "userLevel",
      label: "userLevel",
      type: "select",
      errorMsg: "userLevel",
    },
    pCname: {
      name: "pCname",
      label: "PC Name",
      type: "text",
      errorMsg: "PC Name",
    },
    isTeamLeader: {
      name: "isTeamLeader",
      label: "Takım Lideri",
      type: "checkbox",
      errorMsg: "Takım Lideri ",
    },
    isKanbanAdmin: {
      name: "isKanbanAdmin",
      label: "Kanbanda Admin Yetkisi",
      type: "checkbox",
      errorMsg: "isKanbanAdmin",
    },
  

  },
};
export default form;
