// src/context/AuthContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import api from "./api";
import { useNavigate } from "react-router-dom";

type User = { id: string; email: string; name?: string; role?: string };

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const baseURL = import.meta.env.VITE_API_URL || "https://api.foliomax.in";

  // Restore session on refresh
  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");
    const raw = sessionStorage.getItem("user");

    if (token && raw) {
      try {
        const parsedUser = JSON.parse(raw) as User;
        setUser(parsedUser);
        // Set auth header on reload as well
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      } catch {
        // if parsing fails, clear bad data
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("user");
      }
    }

    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post(`${baseURL}/foliomax/auth/login`, {
      email,
      password,
    });

    const accessToken: string | undefined =
      data?.accessToken || data?.token || data?.data?.accessToken;

    let userFromApi: User | null =
      data?.user || data?.data?.user || null;

    if (!accessToken) {
      throw new Error("No access token returned");
    }

    if (!userFromApi) {
      userFromApi = { id: "self", email };
    }

    // 🔐 Store in sessionStorage instead of localStorage
    sessionStorage.setItem("accessToken", accessToken);
    sessionStorage.setItem("user", JSON.stringify(userFromApi));

    // Set default Authorization header for future requests
    api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

    setUser(userFromApi);

    navigate("/", { replace: true });
  };

  const logout = () => {
    // Clear session storage
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("user");

    // Remove auth header
    delete api.defaults.headers.common["Authorization"];

    setUser(null);
    navigate("/signin", { replace: true });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
