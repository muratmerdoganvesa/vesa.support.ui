import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { TrendingUp, ArrowRight, ArrowLeft, Briefcase, Award, Users, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface CareerStage {
  title: string;
  gorevTanimi: string[];
  yetkinlikler: string[];
}

interface ManagementRole {
  title: string;
  rolunAmaci: string;
  temelSorumluluklar: string[];
  yetkiAlani: string[];
}

const careerStages: CareerStage[] = [
  {
    title: "L1 - Junior",
    gorevTanimi: [
      "Proje ve destek çalışmalarında danışmanlara yardımcı olur",
      "Dokümantasyon, test, veri kontrolü gibi operasyonel görevleri yürütür",
      "Sistem öğrenme ve temel konfigürasyonlara destek olur",
    ],
    yetkinlikler: [
      "SAP / iş süreçlerine temel ilgi ve öğrenme isteği",
      "Analitik düşünme ve dikkatli çalışma",
      "Ekip çalışmasına yatkınlık",
      "Temel İngilizce",
    ],
  },
  {
    title: "L2 - Consultant",
    gorevTanimi: [
      "Tanımlı süreçlerde konfigürasyon ve test faaliyetlerini yürütür",
      "Müşteri taleplerini analiz ederek çözüm üretir",
      "Canlıya geçiş ve destek süreçlerine aktif katılım sağlar",
    ],
    yetkinlikler: [
      "İlgili SAP modülünde temel–orta seviye bilgi",
      "İş süreçlerini anlayabilme",
      "Müşteri iletişimi kurabilme",
      "Dokümantasyon disiplinine sahip",
    ],
  },
  {
    title: "L3 - Senior",
    gorevTanimi: [
      "Uçtan uca süreç tasarımında aktif rol alır",
      "Junior ve Consultant seviyesindeki ekip üyelerine mentorluk yapar",
      "Müşteri toplantılarında teknik ve fonksiyonel liderlik sağlar",
    ],
    yetkinlikler: [
      "İlgili modülde güçlü fonksiyonel bilgi",
      "Problem çözme ve karar alma becerisi",
      "Etkili iletişim ve sunum yeteneği",
      "Proje deneyimi ve sorumluluk alma",
    ],
  },
  {
    title: "L4 - Expert",
    gorevTanimi: [
      "Karmaşık iş süreçleri ve entegrasyon senaryolarını yönetir",
      "Best practice ve çözüm mimarisi oluşturur",
      "Kritik müşteri konularında referans noktasıdır",
    ],
    yetkinlikler: [
      "Derin modül bilgisi ve sektör deneyimi",
      "Entegrasyon ve uçtan uca süreç hakimiyeti",
      "Risk analizi ve çözüm geliştirme becerisi",
      "Güçlü danışmanlık bakış açısı",
    ],
  },
  {
    title: "L5 - Senior Expert",
    gorevTanimi: [
      "Birden fazla projede teknik/fonksiyonel otorite rolü üstlenir",
      "Standartlar, metodolojiler ve şablonlar geliştirir",
      "Stratejik müşteri toplantılarına katkı sağlar",
    ],
    yetkinlikler: [
      "Uzmanlık alanında derin teknik ve fonksiyonel bilgi",
      "Koçluk ve mentorluk yetkinliği",
      "Stratejik düşünme",
      "Yüksek müşteri güveni oluşturabilme",
    ],
  },
  {
    title: "L6 - Principal",
    gorevTanimi: [
      "Proje ve çözüm mimarisinin genel sorumluluğunu üstlenir",
      "Büyük ölçekli ve kritik projelerde yönlendirici rol oynar",
      "Satış öncesi, teklif ve çözüm tasarım süreçlerine katkı sağlar",
    ],
    yetkinlikler: [
      "Kurumsal ölçekte çözüm mimarisi deneyimi",
      "Liderlik ve yönlendirme becerisi",
      "Ticari farkındalık",
      "Üst düzey müşteri iletişimi",
    ],
  },
  {
    title: "L7 - Senior Principal",
    gorevTanimi: [
      "Organizasyon genelinde stratejik danışmanlık sağlar",
      "Ürünleşme, metodoloji ve büyüme stratejilerine katkı sunar",
      "Kritik müşteriler ve üst yönetimle ilişki yönetir",
    ],
    yetkinlikler: [
      "Stratejik vizyon ve sektör liderliği",
      "Yüksek karar alma ve yön verme yetkinliği",
      "Marka ve güven temsilcisi olma",
      "Uzun vadeli iş değeri yaratma",
    ],
  },
];

const managementRoles: ManagementRole[] = [
  {
    title: "Proje Yönetimi",
    rolunAmaci:
      "Projelerin kapsam, zaman, bütçe ve kalite hedeflerine uygun şekilde; müşteri, ekip ve paydaşlar arasında koordinasyonu sağlayarak başarıyla teslim edilmesini sağlamak.",
    temelSorumluluklar: [
      "Proje planını (kapsam, zaman çizelgesi, bütçe) oluşturur ve yönetir",
      "Kaynak planlamasını ve kapasite kullanımını koordine eder",
      "Proje risklerini ve bağımlılıkları yönetir",
      "Müşteri ve iç paydaşlarla düzenli iletişim sağlar",
      "Proje ilerleme, durum ve bütçe raporlamasını yapar",
      "Değişiklik taleplerini (change request) yönetir",
      "Canlıya geçiş ve stabilizasyon süreçlerini koordine eder",
    ],
    yetkiAlani: [
      "Proje içi önceliklendirme ve planlama kararları",
      "Proje kaynak planlamasının takibi",
      "Proje kapsamı ve zaman planı önerileri",
      "Eskalasyon ve risk yönetimi",
    ],
  },
  {
    title: "Ekip Lideri",
    rolunAmaci:
      "Belirli bir ekip veya proje kapsamında günlük operasyonları yönetmek, teknik/fonksiyonel kaliteyi sağlamak.",
    temelSorumluluklar: [
      "Ekip iş dağılımını ve günlük ilerlemeyi yönetir",
      "Teknik/fonksiyonel kararları alır",
      "Junior ve Consultant seviyelerine mentorluk yapar",
      "Proje teslimat kalitesinden sorumludur",
    ],
    yetkiAlani: [
      "Ekip içi görev atamaları",
      "Teknik/fonksiyonel çözüm onayı",
      "Günlük planlama ve önceliklendirme",
    ],
  },
  {
    title: "Müşteri Çözüm Mimarı",
    rolunAmaci:
      "Müşteri ilişkilerini uçtan uca yönetmek, müşteri memnuniyetini ve iş hacmini artırmak.",
    temelSorumluluklar: [
      "Ana müşteri temas noktasıdır",
      "Müşteri beklenti ve ihtiyaçlarını yönetir",
      "Yeni fırsatları (upsell / cross-sell) belirler",
      "Sözleşme, yenileme ve ticari süreçleri yönetir",
    ],
    yetkiAlani: [
      "Ticari teklif ve fiyatlandırma önerisi",
      "Müşteri eskalasyon yönetimi",
      "Satış ve teslimat ekipleri arasında köprü rolü",
    ],
  },
  {
    title: "Grup Yöneticisi",
    rolunAmaci:
      "Birden fazla ekip veya proje grubunun operasyonel, finansal ve insan kaynağı yönetimini sağlamak.",
    temelSorumluluklar: [
      "Birden fazla ekibin performansını yönetir",
      "Kaynak planlaması ve kapasite yönetimi yapar",
      "Proje kârlılığı ve verimliliğini takip eder",
      "Ekip liderlerini yönlendirir ve geliştirir",
    ],
    yetkiAlani: [
      "Ekip ve proje bazlı kaynak tahsisi",
      "Performans geri bildirimi ve terfi önerisi",
      "Operasyonel önceliklendirme kararları",
    ],
  },
];

const CareerPath = () => {
  const navigate = useNavigate();
  const [selectedStage, setSelectedStage] = useState<CareerStage | null>(null);
  const [selectedManagementRole, setSelectedManagementRole] = useState<ManagementRole | null>(null);

  // VESACONS gradient renkleri: Mor → Mavi → Cyan → Teal
  const getBoxColors = (index: number) => {
    const colors = [
      { from: "#9257CB", to: "#835ECF", border: "#A78BFA", ring: "#DDD6FE" }, // L1 - Mor
      { from: "#835ECF", to: "#6E6ED6", border: "#8B5CF6", ring: "#C4B5FD" }, // L2 - Mor-Mavi
      { from: "#6E6ED6", to: "#5481D9", border: "#818CF8", ring: "#C7D2FE" }, // L3 - İndigo
      { from: "#5481D9", to: "#2B9EDC", border: "#60A5FA", ring: "#BFDBFE" }, // L4 - Mavi
      { from: "#2B9EDC", to: "#2DBCAE", border: "#38BDF8", ring: "#BAE6FD" }, // L5 - Sky Blue
      { from: "#2DBCAE", to: "#2FCBA0", border: "#2FCBA0", ring: "#A5F3FC" }, // L6 - Cyan
      { from: "#2FCBA0", to: "#2ECA9F", border: "#2DD4BF", ring: "#99F6E4" }, // L7 - Teal
    ];
    return colors[index] || colors[0];
  };

  const handleStageClick = (stage: CareerStage) => {
    setSelectedStage(stage);
    setSelectedManagementRole(null);
  };

  const handleManagementRoleClick = (role: ManagementRole) => {
    setSelectedManagementRole(role);
    setSelectedStage(null);
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
        <div className="mx-auto space-y-8">
          {/* Header Section */}
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold text-slate-800 mb-1">Kariyer Yolu</h1>
              <p className="text-md text-slate-600">Kariyer gelişim basamaklarınızı inceleyin</p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-sm border border-slate-200 hover:border-slate-300 hover:shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri Dön
            </button>
          </div>

          {/* Career Path Content */}
          <div className="bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-8 py-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Kariyer Gelişim Haritası</h2>
                  <p className="text-slate-600 text-sm mt-1">
                    Detayları görmek için bir basamağa tıklayın
                  </p>
                </div>
              </div>
            </div>

            <div className="py-12 px-6 bg-gradient-to-br from-slate-50 to-white overflow-x-auto">
              <div className="flex items-center justify-center flex-nowrap min-w-max">
                {careerStages.map((stage, index) => {
                  const colors = getBoxColors(index);
                  const isSelected = selectedStage?.title === stage.title;

                  return (
                    <div key={stage.title} className="flex items-center flex-shrink-0">
                      <div
                        className="flex flex-col items-center cursor-pointer group"
                        onClick={() => handleStageClick(stage)}
                      >
                        <div
                          className={`w-36 h-28 rounded-xl shadow-lg flex items-center justify-center text-white font-semibold text-sm text-center px-3 transition-all duration-300 border-2 
                            ${
                              isSelected
                                ? "shadow-xl scale-105 ring-4"
                                : "group-hover:shadow-xl group-hover:scale-105"
                            }`}
                          style={{
                            background: `linear-gradient(135deg, ${colors.from} 0%, ${colors.to} 100%)`,
                            borderColor: colors.border,
                            ...(isSelected && { boxShadow: `0 0 0 4px ${colors.ring}` }),
                          }}
                        >
                          {stage.title}
                        </div>
                        <div
                          className={`mt-3 w-3 h-3 rounded-full transition-opacity 
                            ${isSelected ? "opacity-100" : "opacity-50 group-hover:opacity-100"}`}
                          style={{ backgroundColor: colors.from }}
                        ></div>
                      </div>
                      {index < careerStages.length - 1 && (
                        <div className="flex items-center mx-3 flex-shrink-0">
                          <div className="w-6 h-0.5 bg-slate-300"></div>
                          <ArrowRight className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selected Stage Details */}
          {selectedStage && (
            <div className="bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-5">
                <h3 className="text-xl font-bold text-white">{selectedStage.title}</h3>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Görev Tanımı */}
                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Briefcase className="w-5 h-5 text-blue-600" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-lg">Görev Tanımı</h4>
                    </div>
                    <ul className="space-y-3">
                      {selectedStage.gorevTanimi.map((item, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-slate-700 leading-relaxed flex items-start gap-3"
                        >
                          <span className="text-blue-500 mt-0.5 text-lg">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Yetkinlikler */}
                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-emerald-100 p-2 rounded-lg">
                        <Award className="w-5 h-5 text-emerald-600" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-lg">Yetkinlikler</h4>
                    </div>
                    <ul className="space-y-3">
                      {selectedStage.yetkinlikler.map((item, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-slate-700 leading-relaxed flex items-start gap-3"
                        >
                          <span className="text-emerald-500 mt-0.5 text-lg">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Management Roles Section */}
          <div className="bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-8 py-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">İdari Roller</h2>
                  <p className="text-slate-600 text-sm mt-1">
                    Detayları görmek için bir role tıklayın
                  </p>
                </div>
              </div>
            </div>

            <div className="py-12 px-6 bg-gradient-to-br from-slate-50 to-white">
              <div className="flex items-center justify-center gap-8 flex-wrap">
                {managementRoles.map((role) => (
                  <div
                    key={role.title}
                    className="flex flex-col items-center cursor-pointer group"
                    onClick={() => handleManagementRoleClick(role)}
                  >
                    <div
                      className={`w-48 h-28 rounded-xl shadow-lg flex items-center justify-center text-white font-semibold text-sm text-center px-4 transition-all duration-300 border-2 
                        ${
                          selectedManagementRole?.title === role.title
                            ? "bg-gradient-to-br from-purple-600 to-purple-700 border-purple-300 shadow-xl scale-105 ring-4 ring-purple-200"
                            : "bg-gradient-to-br from-purple-500 to-purple-600 border-purple-400 group-hover:shadow-xl group-hover:scale-105 group-hover:from-purple-600 group-hover:to-purple-700"
                        }`}
                    >
                      {role.title}
                    </div>
                    <div
                      className={`mt-3 w-3 h-3 rounded-full transition-opacity 
                        ${
                          selectedManagementRole?.title === role.title
                            ? "bg-purple-600 opacity-100"
                            : "bg-purple-500 opacity-50 group-hover:opacity-100"
                        }`}
                    ></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Selected Management Role Details */}
          {selectedManagementRole && (
            <div className="bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-8 py-5">
                <h3 className="text-xl font-bold text-white">{selectedManagementRole.title}</h3>
              </div>

              <div className="p-8">
                {/* Rolün Amacı */}
                <div className="bg-purple-50 rounded-xl p-6 border border-purple-200 mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <Target className="w-5 h-5 text-purple-600" />
                    </div>
                    <h4 className="font-bold text-slate-800 text-lg">Rolün Amacı</h4>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {selectedManagementRole.rolunAmaci}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Temel Sorumluluklar */}
                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Briefcase className="w-5 h-5 text-blue-600" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-lg">Temel Sorumluluklar</h4>
                    </div>
                    <ul className="space-y-3">
                      {selectedManagementRole.temelSorumluluklar.map((item, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-slate-700 leading-relaxed flex items-start gap-3"
                        >
                          <span className="text-blue-500 mt-0.5 text-lg">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Yetki Alanı */}
                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-emerald-100 p-2 rounded-lg">
                        <Award className="w-5 h-5 text-emerald-600" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-lg">Yetki Alanı</h4>
                    </div>
                    <ul className="space-y-3">
                      {selectedManagementRole.yetkiAlani.map((item, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-slate-700 leading-relaxed flex items-start gap-3"
                        >
                          <span className="text-emerald-500 mt-0.5 text-lg">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
    </DashboardLayout>
  );
};

export default CareerPath;
