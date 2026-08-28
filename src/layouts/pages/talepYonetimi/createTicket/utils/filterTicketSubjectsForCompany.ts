/** Vesa Danışmanlık — yalnızca bu şirketin kullanıcıları "DB İşlemleri" konusunu görür. */
export const VESA_DANISMANLIK_COMPANY_ID =
  "2e5c2ba5-3eb8-414d-8bc7-08dd44716854";

/** TicketSubject.DatabaseUpdate */
export const DATABASE_UPDATE_SUBJECT_ID = 9;

export const isVesaDanismanlikCompany = (workCompanyId?: string | null): boolean =>
  workCompanyId?.trim().toLowerCase() === VESA_DANISMANLIK_COMPANY_ID;

export const filterTicketSubjectsForCompany = <T extends { id: number | string }>(
  subjects: T[],
  workCompanyId?: string | null,
): T[] => {
  if (isVesaDanismanlikCompany(workCompanyId)) {
    return subjects;
  }

  return subjects.filter((subject) => Number(subject.id) !== DATABASE_UPDATE_SUBJECT_ID);
};
