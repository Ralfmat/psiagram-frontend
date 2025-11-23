import AsyncStorage from "@react-native-async-storage/async-storage"; //npx expo install @react-native-async-storage/async-storage
import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";
import axios from "axios";
import { Alert } from "react-native";

const API_URL =" "; //adres serwera django???????

//zgodne z odpowiedzia django
type AuthResponse = {
  access: string;
  refresh: string;
};

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
  isLoading: boolean;
};

// Tworzymy kontekst mozna sie odwlowywac z kazdego poziomu 
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider owija całą aplikację w _layout.tsx
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Tu trzymamy info o aktualnie zalogowanym użytkowniku.
  const [user, setUser] = useState<User| null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // login (na razie działa „udawane”)
  // Później tutaj podmienimy na prawdziwe zapytanie do API.
  const login = async (email: string, password: string) => {
    try{
      const response=await axios.post(`${API_URL}/api/token/`, {
        email: email,
        password: password,
      });
      const data = response.data as AuthResponse;
      
      //tymczasowo id 1
      const loggedInUser: User = {
        id: 1, 
        email: email,
        token: data.access,
      };
      // Token zapisujemy, żeby po restarcie aplikacji dalej być zalogowanym.
      // Później zostanie tak samo, tylko token będzie prawdziwy.
      await AsyncStorage.setItem("token", data.access);
      await AsyncStorage.setItem("email", email);
    } catch(error){
      Alert.alert("Blad", "Niepoprawny email lub haslo");
      throw error;
    }
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
    const loadToken = async () => {
      try{
       const token = await AsyncStorage.getItem("token");
       const email = await AsyncStorage.getItem("email"); 

      if (token&&email){
        setUser({
          id:1,
          email: email,
          token: token         
        });
      }
    } catch (e) {
      console.log(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadToken();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated:!!user,
        user,
        login,
        logout,
        isLoading
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
