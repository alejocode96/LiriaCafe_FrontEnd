import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem("pos_token"));

    useEffect(() => {
        if (token) {
            // acá puedes validar el token contra tu API
            // por ahora ponemos un usuario mock
            setUser({ name: "Admin", role: "admin" });
        }
    }, [token]);

    const login = (tokenRecibido, userData) => {
        localStorage.setItem("pos_token", tokenRecibido);
        setToken(tokenRecibido);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem("pos_token");
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);