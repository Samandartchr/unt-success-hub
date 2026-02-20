import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { GraduationCap, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  onAuthStateChanged,
} from "firebase/auth";

// ─── Firebase init (singleton) ────────────────────────────────────────────────

const firebaseConfig = {
  apiKey: "AIzaSyAVZ-AchG-qwZFItO7E3LwEjONF1jI_Vw0",
  authDomain: "ubtwebsite.firebaseapp.com",
  projectId: "ubtwebsite",
  storageBucket: "ubtwebsite.firebasestorage.app",
  messagingSenderId: "389268561038",
  appId: "1:389268561038:web:453dc4313a67d82a553ddf",
  measurementId: "G-9BS8WWSGMZ",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Firebase auth state changed: signed in as", user.email);
  } else {
    console.log("Firebase auth state changed: signed out");
  }
});


// ─── Types ────────────────────────────────────────────────────────────────────

interface UserPublicInfo {
  role: string;
  email: string;
  username: string;
  name: string;
  surname: string;
}

interface LocationState {
  step2?: boolean;
  email?: string;
}

interface ServerError {
  message?: string;
  error?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) {
    console.log("No user signed in");
    return null;
  }
  return user.getIdToken();
}

async function GetUser(): Promise<UserPublicInfo | null> {
  try {
    const userPublicInfo: UserPublicInfo = await fetch(
      "http://localhost:5275/api/auth/getuser",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${await getToken()}`,
          "Content-Type": "application/json",
        },
      }
    ).then((r) => r.json());
    console.log(userPublicInfo);
    return userPublicInfo;
  } catch (error) {
    alert(error instanceof Error ? error.message : String(error));
    return null;
  }
}

function validateUsername(value: string): "idle" | "valid" | "invalid" {
  if (!value) return "idle";
  return /^[a-z0-9._]{4,15}$/.test(value) ? "valid" : "invalid";
}

function validateUnicodeName(value: string): "idle" | "valid" | "invalid" {
  if (!value.trim()) return "idle";
  return /^[\p{L}]+$/u.test(value.trim()) ? "valid" : "invalid";
}

const usernameHints: Record<string, string> = {
  idle: "",
  valid: "✓ valid",
  invalid: "only a–z, 0–9, . _ (4–15 chars)",
};

const nameHints: Record<string, string> = {
  idle: "",
  valid: "✓ valid",
  invalid: "letters only",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as LocationState | null;
  const redirectedEmail = state?.email ?? "";
  const startAtStep2 = state?.step2 === true;

  // Step 1 state
  const [step, setStep] = useState<1 | 2>(startAtStep2 ? 2 : 1);
  const [email, setEmail] = useState(redirectedEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step1Loading, setStep1Loading] = useState(false);

  // Step 2 state
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [role, setRole] = useState("Student");
  const [step2Loading, setStep2Loading] = useState(false);

  // Derived validation states
  const usernameState = validateUsername(username);
  const nameState = validateUnicodeName(name);
  const surnameState = validateUnicodeName(surname);

  // ── Step 1: register in Firebase + send verification email ──────────────────
  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep1Loading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCred.user);
      alert("Растау хаты электрондық поштаңызға жіберілді. Тіркелу үшін растаңыз.");
      setStep(2);
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : String(error));
    } finally {
      setStep1Loading(false);
    }
  };

  // ── Step 2: create user record in backend DB ─────────────────────────────────
  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();

    if (usernameState !== "valid") {
      alert("Пайдаланушы аты дұрыс емес");
      return;
    }
    if (nameState !== "valid") {
      alert("Аты дұрыс емес. Тек әріптер қолданыңыз.");
      return;
    }
    if (surnameState !== "valid") {
      alert("Тегі дұрыс емес. Тек әріптер қолданыңыз.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      alert("Пайдаланушы табылмады. Қайта кіріңіз.");
      navigate("/login");
      return;
    }
    await user.reload();
    if (!auth.currentUser?.emailVerified) {
      alert("Электрондық поштаңызды растаңыз.");
      return;
    }

    const userRegister = {
      email: user.email,
      username: username.toLowerCase(),
      name: name.trim(),
      surname: surname.trim(),
      role,
    };

    console.log("Sending user data:", userRegister);

    const token = await getToken();
    console.log("Token:", token ? "✓ Obtained" : "✗ Missing");

    setStep2Loading(true);
    try {
      const response = await fetch("http://localhost:5275/api/auth/createuser", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userRegister),
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (response.ok) {
        const data: boolean = await response.json();
        console.log("Backend returned:", data);

        if (data === true) {
          console.log("✓ User created successfully! Redirecting...");
          const userPublicInfo = await GetUser();
          if (userPublicInfo) {
            sessionStorage.setItem("userPublicInfo", JSON.stringify(userPublicInfo));
            navigate(`/${userPublicInfo.role.toLowerCase()}home`);
          }
        } else {
          console.error("✗ Backend returned false");
          alert("Тіркеу сәтсіз аяқталды");
        }
      } else {
        const err: ServerError = await response.json();
        console.error("Server error:", err.message);
        alert(err.message ?? err.error ?? "Сервер қатесі");
      }
    } catch (error: unknown) {
      console.error("Fetch error:", error);
      alert(`Қате: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setStep2Loading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm animate-fade-in">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-primary mb-4">
            <GraduationCap className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">UNT Prep</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {step === 1 ? "Жаңа аккаунт жасаңыз" : "Мәліметтерді толтырыңыз"}
          </p>
        </div>

        <Card className="shadow-lg border-border/60">
          <CardHeader className="pb-2">
            <p className="text-xl font-bold text-foreground">
              {step === 1 ? "Тіркелу" : "Профиль"}
            </p>
          </CardHeader>
          <CardContent>

            {/* ── Step 1: email + password ── */}
            {step === 1 && (
              <form onSubmit={handleStep1} className="flex flex-col gap-3">

                <input
                  className="input-field"
                  type="email"
                  placeholder="Электрондық пошта"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <div className="relative">
                  <input
                    className="input-field pr-10"
                    type={showPassword ? "text" : "password"}
                    placeholder="Құпия сөз"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <Button type="submit" className="w-full mt-1" disabled={step1Loading}>
                  {step1Loading ? "Жүктелуде..." : "Тіркелу"}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  <Link to="/login" className="text-primary font-medium hover:underline">
                    Менің аккаунтым бар
                  </Link>
                </p>

              </form>
            )}

            {/* ── Step 2: username / name / surname / role ── */}
            {step === 2 && (
              <form onSubmit={handleStep2} className="flex flex-col gap-2">

                {/* Username */}
                <div>
                  <input
                    className={`input-field ${usernameState !== "idle" ? usernameState : ""}`}
                    type="text"
                    placeholder="Пайдаланушы аты"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    maxLength={15}
                  />
                  <small
                    className={`hint ${
                      usernameState === "valid"
                        ? "hint-valid"
                        : usernameState === "invalid"
                        ? "hint-invalid"
                        : ""
                    }`}
                  >
                    {usernameHints[usernameState]}
                  </small>
                </div>

                {/* Name */}
                <div>
                  <input
                    className={`input-field ${nameState !== "idle" ? nameState : ""}`}
                    type="text"
                    placeholder="Аты"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <small
                    className={`hint ${
                      nameState === "valid"
                        ? "hint-valid"
                        : nameState === "invalid"
                        ? "hint-invalid"
                        : ""
                    }`}
                  >
                    {nameHints[nameState]}
                  </small>
                </div>

                {/* Surname */}
                <div>
                  <input
                    className={`input-field ${surnameState !== "idle" ? surnameState : ""}`}
                    type="text"
                    placeholder="Тегі"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                  />
                  <small
                    className={`hint ${
                      surnameState === "valid"
                        ? "hint-valid"
                        : surnameState === "invalid"
                        ? "hint-invalid"
                        : ""
                    }`}
                  >
                    {nameHints[surnameState]}
                  </small>
                </div>

                {/* Role */}
                <div className="flex flex-col gap-1 mt-1">
                  <label className="text-sm text-muted-foreground">Рөліңізді таңдаңыз:</label>
                  <select
                    className="input-field"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="Student">Оқушы</option>
                    <option value="Teacher">Мұғалім</option>
                  </select>
                </div>

                <Button type="submit" className="w-full mt-2" disabled={step2Loading}>
                  {step2Loading ? "Жүктелуде..." : "Кіру"}
                </Button>

                {/* Only show back button if user came from step 1, not redirected from login */}
                {!startAtStep2 && (
                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:text-foreground text-center mt-1"
                    onClick={() => setStep(1)}
                  >
                    ← Артқа
                  </button>
                )}

              </form>
            )}

          </CardContent>
        </Card>
      </div>

      <style>{`
        .input-field {
          width: 100%;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid hsl(var(--border));
          font-size: 0.95rem;
          background: hsl(var(--background));
          color: hsl(var(--foreground));
          transition: border-color 0.15s;
          outline: none;
        }
        .input-field:focus {
          border-color: hsl(var(--primary));
        }
        .input-field.valid {
          border: 1px solid #16a34a;
        }
        .input-field.invalid {
          border: 1px solid #dc2626;
        }
        .hint {
          display: block;
          font-size: 0.75rem;
          margin-top: 3px;
          min-height: 16px;
          color: hsl(var(--muted-foreground));
        }
        .hint-valid  { color: #16a34a; }
        .hint-invalid { color: #dc2626; }
      `}</style>
    </div>
  );
}