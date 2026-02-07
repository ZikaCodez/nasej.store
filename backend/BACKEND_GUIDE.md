1. Project Overview
This is a high-performance, scalable e-commerce API template designed for rapid development and easy customization.

Core Philosophy: Simplicity and Speed. Uses native drivers and avoids unnecessary abstractions.

Key Constraints: No ORMs, strict typing via TypeScript interfaces, and Google OAuth authentication.

2. Technical Stack
- Node.js (v18+)
- Express.js
- MongoDB (Native Driver)
- Passport.js (Google OAuth 2.0)
- express-session + connect-mongo
- JavaScript (Runtime) with TypeScript Interfaces

3. Architecture & Folder Structure
Modular "Controller-Service" pattern (without service layer bloat).

Folder Structure:
/backend
  /config           # Configuration files
  /controllers      # Business logic
  /core             # Database connection & shared utilities
  /middleware       # Route protection & validation
  /routes           # API endpoint definitions
  /types            # TypeScript interfaces
  /utils            # Utility functions
  app.js            # App entry point
  server.js         # Server listener
  .env              # Secrets and environment variables

4. Database Strategy
- Database name and URI are configured via process.env.MONGODB_URI.
- Connection is established once in core/db.js and reused throughout the app.
- No ORMs: Use native MongoDB driver (db.collection('products').find(...)).
- ID Schema: All _id fields are 6-digit integers (e.g., 104928). Check for collisions before insertion.

5. Data Models
Refer to /types for the exact shape.

Example User Interface (types/user.ts):
export interface IUser {
  _id: number;         // 6-digit integer
  googleId: string;    // From Google Profile
  email: string;
  name: string;
  phone?: string;
  role: "customer" | "admin" | "editor";
  addresses: IAddress[];
  createdAt: Date;
}

Example Product Variant Interface (types/product.ts):
export interface IVariant {
  sku: string;
  color: string;
  size: "S" | "M" | "L";
  priceModifier: number;
}

6. Authentication Strategy
Passwordless flow using Google OAuth.

Smart Redirect Flow:
- Frontend sends user to /auth/google?redirect=/cart.
- Backend captures req.query.redirect, encodes it, and passes it to Google via the state parameter.
- Backend callback decodes state and redirects user to ${CLIENT_URL}${decodedPath}.

User Creation Logic:
- Search for user by googleId.
- If found, update lastLogin and return user.
- If new, generate 6-digit _id, create user object, and insert into database.

7. Business Logic
A. Inventory Management
- Products are made-to-order; variants do not track stock.
B. Soft Deletes
- Never use deleteOne on Products or Users. Set isActive: false instead.
- All find queries should include { isActive: true } unless for admin views.
C. Phone Validation
- Middleware requirePhone enforces phone requirement for checkout.
- If user lacks phone, return 403 with code MISSING_PHONE.

8. Development Notes
- All environment-specific values are set via .env file.
- No brand or identity-specific logic is included; this template is fully generic.