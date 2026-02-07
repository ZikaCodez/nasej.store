
Frontend Project Guide: E-Commerce Template
1. Project Vision
This frontend is a reusable e-commerce template designed for rapid development and easy customization.

Brand-specific content (name, logo) is managed via src/brand-config.json and public/logo.png. Theme and style customization can be handled using shadcn CLI or similar tools.

To set up a new project:
- Update src/brand-config.json with your brand name and logo path.
- Place your logo file in the public directory (e.g., public/logo.png).
- Set VITE_API_URL in .env to point to your backend API.

All other content is generic and ready for customization.

2. Technical Architecture
Framework: React (Vite)

Styling: Tailwind CSS

UI Library: Shadcn UI.

Icons: Lucide React.

Routing: React Router DOM (v6+).

State Management: React Context (for Auth/Cart) or Zustand.

Notifications: Sonner (Toaster).

Folder Structure
Plaintext
/src
  /assets        # Images, logos, fonts
  /components
    /ui          # Shadcn primitives (Button, Input, Sheet, etc.)
    /layout      # Layout.tsx, Navbar.tsx, Footer.tsx
    /product     # ProductCard.tsx, ProductGrid.tsx, ProductFilters.tsx
    /cart        # CartDrawer.tsx, CartItem.tsx
    /checkout    # CheckoutForm.tsx, OrderSummary.tsx
  /hooks         # Custom hooks (useCart, useProducts)
  /lib           # Utils, API configuration (axios setup)
  /pages         # One folder per route (Home, Shop, Product, Cart, etc.)
  /providers     # Context Providers (AuthProvider, CartProvider, ThemeProvider)
  /types         # TypeScript interfaces
  routes.tsx     # Centralized Route Definitions
  main.tsx       # Entry point with Provider wrappers

  7. API Client (Required)

  All frontend network requests must use the centralized API client at `src/lib/api.ts`.

  - Base URL: reads `VITE_API_URL` and falls back to `/api`, ensuring dev requests are proxied via Vite and production can point to a backend origin.
  - Axios instance: `api` with `withCredentials` enabled and a 30s timeout.
  - Interceptors: unified error handling (Sonner toasts) and helpful dev logs.

  Usage examples:

  ```ts
  import api from "@/lib/api";

  // List products (sorted by newest)
  const sort = JSON.stringify({ createdAt: -1 });
  const { data } = await api.get("/products", { params: { limit: 8, sort } });

  // Get one product by slug
  const { data: product } = await api.get(`/products`, { params: { filter: JSON.stringify({ slug }) } });
  ```

  Environment & Vite proxy:
  - Configure `VITE_API_URL` in your `.env` when pointing to a remote backend.
  - The dev server proxy in `vite.config.ts` forwards `/auth` and `/api` to `VITE_API_URL` (defaults to `http://localhost:3000`). Keep both in sync.
3. The Layout Pattern (Mandatory)
Rule: Every page in the application must be wrapped in a unified Layout.tsx component.

Implementation: The Layout component should NOT be manually imported in every page file. Instead, it should be applied as a wrapper inside routes.tsx.

Behavior: Sticky Navbar with backdrop blur, responsive mobile drawer, and consistent Footer.

Auth Awareness: The Navbar must change state based on useAuth (Show "Login" vs. "User Menu").

Toaster: The <Toaster /> component must be placed here or in the root provider.

4. Routing Strategy (New)
File: src/routes.tsx We utilize a centralized routing configuration to manage layouts, authentication guards, and page rendering.

Rules for routes.tsx:

Central Source of Truth: All application paths are defined here.

Layout Wrapping: Route elements should be wrapped in <Layout> (or a specific Layout wrapper component) within this file to ensure consistency.

Protected Routes: Use a ProtectedRoute wrapper for authenticated pages (e.g., /profile, /checkout).

Reference Implementation (routes.tsx):

TypeScript
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import ProtectedRoute from "@/components/auth/ProtectedRoute"; // You will create this
import { Home, Shop, ProductDetails, Cart, Checkout, Profile, Success, NotFound } from "@/pages";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes wrapped in Layout */}
      <Route element={<Layout><Home /></Layout>} path="/" />
      <Route element={<Layout><Shop /></Layout>} path="/shop" />
      <Route element={<Layout><ProductDetails /></Layout>} path="/product/:slug" />
      <Route element={<Layout><Cart /></Layout>} path="/cart" />
      
      {/* Protected Routes */}
      <Route 
        path="/checkout" 
        element={
          <ProtectedRoute>
             {/* Checkout might have a different minimal layout */}
             <Checkout /> 
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        } 
      />

      {/* Success & 404 */}
      <Route element={<Layout><Success /></Layout>} path="/success" />
      <Route element={<Layout><NotFound /></Layout>} path="*" />
    </Routes>
  );
}
Reference Implementation (main.tsx):

TypeScript
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes";
import { AuthProvider } from "./providers/AuthProvider";
import { CartProvider } from "./providers/CartProvider";
import "./index.css"; 

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
5. Detailed Page Specifications
(Refer to previous sections for Page Specs, UX Strategy, and User Flows)

6. Consistency Guidelines
Navigation: routes.tsx is the map. Layout.tsx is the frame.

Buttons: Use Shadcn Button component.

Typography: Unified font family (Inter or similar). Headings Bold/Semibold.