import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import ProductInfo from "./components/ProductInfo";

function EditProject(): JSX.Element {
  const params = useParams();
  const { t } = useTranslation();

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <div className="px-1">
        <div className="mb-8">
          <h4 className="text-xl font-semibold tracking-tight text-foreground">
            {t("ns1:ProfilePage.EditProject.ProjeDetaylari")}
          </h4>
          <p className="mt-1 text-sm text-muted-foreground" />
        </div>
        <ProductInfo params={params} />
      </div>
    </DashboardLayout>
  );
}

export default EditProject;
