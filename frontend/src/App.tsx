import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/layout/Layout";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Layout>
              <div>Home Page Content</div>
            </Layout>
          }
        />
        <Route
          path="/shop"
          element={
            <Layout>
              <div>Shop Page Content</div>
            </Layout>
          }
        />
        <Route
          path="/product/:slug"
          element={
            <Layout>
              <div>Product Page Content</div>
            </Layout>
          }
        />
        <Route
          path="/cart"
          element={
            <Layout>
              <div>Cart Page Content</div>
            </Layout>
          }
        />
        <Route
          path="/checkout"
          element={
            <Layout>
              <div>Checkout Page Content</div>
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
