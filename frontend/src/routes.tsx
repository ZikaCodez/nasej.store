import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Home from "@/pages/Home/Home";
import Shop from "@/pages/Shop/Shop";
import Product from "@/pages/Product/Product";
import CompleteRegister from "@/pages/Account/CompleteRegister";
import Account from "@/pages/Account/Account";
import Checkout from "@/pages/Checkout/Checkout";
import Orders from "@/pages/Orders/Orders";
import NotFound from "@/pages/NotFound/NotFound";
import Dashboard from "@/pages/Admin/Dashboard";
import AdminProducts from "@/pages/Admin/ProductsPage";
import AdminOrders from "@/pages/Admin/OrdersPage";
import AdminUsers from "@/pages/Admin/UsersPage";
import FAQ from "@/pages/Footer/FAQ";
import TermsOfService from "@/pages/Footer/TermsOfService";
import ReturnsPolicy from "@/pages/Footer/ReturnsPolicy";
import PrivacyPolicy from "@/pages/Footer/PrivacyPolicy";

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Layout>
            <Home />
          </Layout>
        }
      />
      <Route
        path="/shop"
        element={
          <Layout>
            <Shop />
          </Layout>
        }
      />
      <Route
        path="/product/:slug"
        element={
          <Layout>
            <Product />
          </Layout>
        }
      />
      <Route
        path="/cart"
        element={
          <Layout>
            <div>Cart Page</div>
          </Layout>
        }
      />
      <Route
        path="/faq"
        element={
          <Layout>
            <FAQ />
          </Layout>
        }
      />
      <Route
        path="/terms"
        element={
          <Layout>
            <TermsOfService />
          </Layout>
        }
      />
      <Route
        path="/returns-policy"
        element={
          <Layout>
            <ReturnsPolicy />
          </Layout>
        }
      />
      <Route
        path="/privacy"
        element={
          <Layout>
            <PrivacyPolicy />
          </Layout>
        }
      />
      <Route
        path="/complete-register"
        element={
          <ProtectedRoute>
            <Layout>
              <CompleteRegister />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <Layout>
              <Checkout />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <Layout>
              <Orders />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <Layout>
              <Account />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute minRole="editor">
            <Navigate to="/dashboard/overview" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/overview"
        element={
          <ProtectedRoute minRole="editor">
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/products"
        element={
          <ProtectedRoute minRole="editor">
            <Layout>
              <AdminProducts />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/orders"
        element={
          <ProtectedRoute minRole="admin">
            <Layout>
              <AdminOrders />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/users"
        element={
          <ProtectedRoute minRole="admin">
            <Layout>
              <AdminUsers />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="*"
        element={
          <Layout>
            <NotFound />
          </Layout>
        }
      />
    </Routes>
  );
}

export default AppRoutes;
