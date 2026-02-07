export type AuthUser = {
  _id: number;
  name: string;
  email: string;
  phone?: string;
  role?: "customer" | "admin" | "editor";
  googleId?: string;
  addresses?: Address[];
  cartItems?: import("@/types/cart").CartItem[];
};

export type Address = {
  label?: string;
  country?: string;
  city: string;
  area?: string;
  street: string;
  building?: string;
  apartment?: string;
  notes?: string;
};

export type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  sessionVerified?: boolean;
};

export type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  sessionVerified?: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  startGoogleLogin: (redirectPath?: string) => void;
  isLoggedIn: boolean;
};
