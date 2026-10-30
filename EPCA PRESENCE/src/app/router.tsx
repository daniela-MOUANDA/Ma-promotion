import { AdminLayout } from "@/layouts/AdminLayout";
import { PublicLayout } from "@/layouts/PublicLayout";
import { RequireAdmin } from "@/layouts/RequireAdmin";
import { AdminAlumniPage } from "@/pages/admin/AdminAlumniPage";
import { AdminCatalogPage } from "@/pages/admin/AdminCatalogPage";
import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage";
import { AdminGalleryPage } from "@/pages/admin/AdminGalleryPage";
import { AdminLoginPage } from "@/pages/admin/AdminLoginPage";
import { AdminPromotionsPage } from "@/pages/admin/AdminPromotionsPage";
import { AdminStudentsPage } from "@/pages/admin/AdminStudentsPage";
import { AlumniPage } from "@/pages/public/AlumniPage";
import { ContactPage } from "@/pages/public/ContactPage";
import { FaqPage } from "@/pages/public/FaqPage";
import { GalleryPage } from "@/pages/public/GalleryPage";
import { HomePage } from "@/pages/public/HomePage";
import { PromotionExplorePage } from "@/pages/public/PromotionExplorePage";
import { PromotionsPage } from "@/pages/public/PromotionsPage";
import { SchoolPage } from "@/pages/public/SchoolPage";
import { StudentProfilePage } from "@/pages/public/StudentProfilePage";
import { createBrowserRouter, Navigate } from "react-router-dom";

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/promotions", element: <PromotionsPage /> },
      { path: "/promotions/:promotionId", element: <PromotionExplorePage /> },
      { path: "/promotions/:promotionId/:categoryId", element: <PromotionExplorePage /> },
      { path: "/promotions/:promotionId/:categoryId/:filiereId", element: <PromotionExplorePage /> },
      {
        path: "/promotions/:promotionId/:categoryId/:filiereId/:studentId",
        element: <StudentProfilePage />,
      },
      { path: "/anciens", element: <AlumniPage /> },
      { path: "/galerie", element: <GalleryPage /> },
      { path: "/ecole", element: <SchoolPage /> },
      { path: "/faq", element: <FaqPage /> },
      { path: "/contact", element: <ContactPage /> },
      { path: "/concours", element: <Navigate to="/promotions" replace /> },
      { path: "/candidature", element: <Navigate to="/" replace /> },
      { path: "/candidature/suivi", element: <Navigate to="/anciens" replace /> },
      { path: "/listes", element: <Navigate to="/promotions" replace /> },
      { path: "/resultats", element: <Navigate to="/promotions" replace /> },
    ],
  },
  { path: "/administration", element: <AdminLoginPage /> },
  { path: "/admin/login", element: <Navigate to="/administration" replace /> },
  {
    element: <RequireAdmin />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: "/admin", element: <AdminDashboardPage /> },
          { path: "/admin/promotions", element: <AdminPromotionsPage /> },
          { path: "/admin/filieres", element: <AdminCatalogPage /> },
          { path: "/admin/etudiants", element: <AdminStudentsPage /> },
          { path: "/admin/anciens", element: <AdminAlumniPage /> },
          { path: "/admin/galerie", element: <AdminGalleryPage /> },
          { path: "/admin/candidatures", element: <Navigate to="/admin" replace /> },
          { path: "/admin/concours", element: <Navigate to="/admin/promotions" replace /> },
          { path: "/admin/appel", element: <Navigate to="/admin" replace /> },
        ],
      },
    ],
  },
]);
