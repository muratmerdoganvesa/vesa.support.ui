# Vesa Danışmanlık – Ticket Sistemi

Kurumsal ölçekte bilet/talep yönetimi için geliştirilmiş, ölçeklenebilir ve genişletilebilir bir uygulama.  
Birimlerin taleplerini kaydetme, atama, izleme, onay akışı (workflow), e-posta entegrasyonu, iç/dış paylaşımlar ve raporlama/export ihtiyaçlarını tek bir yerde toplar.

---

## İçindekiler
- [Özellikler](#özellikler)
- [Mimari Genel Bakış](#mimari-genel-bakış)
- [Teknolojiler](#teknolojiler)
- [Hızlı Başlangıç](#hızlı-başlangıç)
  - [Ön Koşullar](#ön-koşullar)
  - [Kurulum (Docker)](#kurulum-docker)
  - [Yerel Çalıştırma (Geliştirme)](#yerel-çalıştırma-geliştirme)
- [Yapı ve Proje Dizini](#yapı-ve-proje-dizini)
- [Yapılandırma](#yapılandırma)
  - [Uygulama Değişkenleri](#uygulama-değişkenleri)
  - [appsettings örneği](#appsettings-örneği)
- [Veritabanı ve Migration](#veritabanı-ve-migration)
- [API Dokümantasyonu](#api-dokümantasyonu)
- [E-posta ve Bildirimler](#e-posta-ve-bildirimler)
- [Workflow](#workflow)
- [Loglama & İzleme](#loglama--i̇zleme)
- [Test](#test)
- [Sürümleme, Branch ve Commit Kuralları](#sürümleme-branch-ve-commit-kuralları)
- [CI/CD](#cicd)
- [Güvenlik](#güvenlik)
- [Lisans](#lisans)
- [İletişim](#i̇letişim)

---

## Özellikler

- 🎫 **Ticket Yönetimi**: Oluşturma, güncelleme, durum/öncelik yönetimi, etiketleme.
- 👥 **Atama & İzleme**: Sorumlu atama, izleyici ekleme, SLA/son tarih takibi.
- 💬 **Yorumlar & Ekler**: Zengin yorum alanı, dosya ekleri, geçmiş kayıtları.
- 📨 **E-posta Entegrasyonu**: Gelen e-postadan ticket üretme, yanıtları ticket’a işleme.
- ✅ **Workflow/Onay**: Esnek onay akışları (approve/reject), adım adım ilerleme.
- 📤 **Dışa Aktarım**: Excel/CSV/PDF çıktı alma, raporlama.
- 🔐 **Yetkilendirme**: Rol/izin bazlı erişim kontrolü.
- 📊 **Raporlama**: Durum, kişi, kategori, SLA vb. metrikler.
- 🧰 **Entegrasyon Hazır**: Webhook, olay tabanlı tetikleyiciler (n8n vb.).

---

## Mimari Genel Bakış

- **Backend (API)**: ASP.NET Core 7/8, Entity Framework Core, PostgreSQL
- **Frontend (opsiyonel)**: React (TypeScript) veya mevcut kurumsal portal modülü
- **Background İşleri**: Zamanlanmış e-posta okuma/yanıtlama, SLA kontrolü, kuyruk işlemleri
- **Depolama**: PostgreSQL (veri), MinIO/S3 (ek dosyalar)
- **Gözlemleme**: OpenSearch/Kibana veya alternatif log izleme
- **CI/CD**: Git tabanlı pipeline’lar (GitHub Actions / Azure DevOps / GitLab CI)

---

## Teknolojiler

- **Dil & Çatı**: .NET (ASP.NET Core), C#
- **ORM**: EF Core
- **DB**: PostgreSQL (pgvector desteği istenirse)
- **İletişim**: SMTP/IMAP (e-posta), REST
- **Depolama**: MinIO/S3 uyumlu dosya depolama
- **Test**: xUnit / NUnit, FluentAssertions
- **Araçlar**: Docker, Docker Compose, Swagger, Serilog

---

## Hızlı Başlangıç

### Ön Koşullar
- Docker & Docker Compose
- .NET 8 SDK (geliştirme için)
- Node.js 18+ (frontend geliştirilecekse)
- PostgreSQL bilgisi ve temel Git kullanımı

### Kurulum (Docker)

```bash
# 1) Ortam değişkenlerinizi oluşturun
cp .env.example .env

# 2) Docker ile ayağa kaldırın
docker compose up -d

# 3) İlk kurulumda migration ve seed otomatik/manuel uygulanabilir
# Manuel isterseniz bkz: "Veritabanı ve Migration"
