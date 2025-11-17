import AsyncStorage from "@react-native-async-storage/async-storage"; //npx expo install @react-native-async-storage/async-storage
import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";


// Typ użytkownika — na razie podstawowy.
// Później mti nam powie jakie pola ma user i wtedy to zmienimy.
export type User = {
  id: number;
  email: string;
  token: string; // na razie fake token, później prawdziwy z API
};

// Co nasz kontekst udostępnia reszcie aplikacji.
type AuthContextType = {
  isAuthenticated: boolean; // czy ktoś jest zalogowany
  user: User | null;        // dane użytkownika (albo null)
  login: (email: string, password: string) => Promise<void>; // logowanie
  logout: () => Promise<void>;                               // wylogowanie
};

// Tworzymy kontekst mozna sie odwlowywac z kazdego poziomu 
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider owija całą aplikację w _layout.tsx
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Tu trzymamy info o aktualnie zalogowanym użytkowniku.
  const [user, setUser] = useState<User | null>(null);

  
  // login (na razie działa „udawane”)
  // Później tutaj podmienimy na prawdziwe zapytanie do API.
  const login = async (email: string, password: string) => {
    // Udajemy, że backend zwrócił takie dane.
    const fakeUser: User = {
      id: 1,
      email,
      token: "fake-token-123", 
    };

    setUser(fakeUser);

    // Token zapisujemy, żeby po restarcie aplikacji dalej być zalogowanym.
    // Później zostanie tak samo, tylko token będzie prawdziwy.
    await AsyncStorage.setItem("token", fakeUser.token);
  };

  // logout
  // Później to zostanie prawie takie samo ↴
  const logout = async () => {
    setUser(null); // wylogowanie
    await AsyncStorage.removeItem("token"); // usunięcie tokenu
  };

  // true = ktoś jest zalogowany
  const isAuthenticated = !!user;

  // ŁADOWANIE USERA PRZY STARCIE APLIKACJI
  // Po backendzie podmienimy tylko środek funkcji.
  useEffect(() => {
    const loadUser = async () => {
      const token = await AsyncStorage.getItem("token");

      if (!token) return;

      // Udajemy, że backend zweryfikował token i zwrócił dane usera.
      setUser({
        id: 1,
        email: "test@example.com",
        token: token,
      });
    };

    loadUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Prosty hook do pobrania auth w dowolnym miejscu.
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
