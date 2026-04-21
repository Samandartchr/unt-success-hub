import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";

// ─── Firebase init (singleton) ────────────────────────────────────────────────

const firebaseConfig = {
  apiKey: "AIzaSyA7k5-JTJLdLsYsL4ntaG2Z1_KZ3UqMzD8",
  authDomain: "ubtprep-site.firebaseapp.com",
  projectId: "ubtprep-site",
  storageBucket: "ubtprep-site.firebasestorage.app",
  messagingSenderId: "982606249616",
  appId: "1:982606249616:web:d19c6e0342c9aff5a7a215",
  measurementId: "G-D0HBJKQG76"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

// ─── Helper ───────────────────────────────────────────────────────────────────

async function getToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) {
    console.log("No user signed in");
    return null;
  }
  return user.getIdToken();
}

async function GetUser() {
  try {
    const userPublicInfo = await fetch("https://api-service-xy2qzucrkq-uc.a.run.app/api/auth/getuser", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${await getToken()}`,
        "Content-Type": "application/json",
      },
    }).then((r) => r.json());
    console.log(userPublicInfo);
    return userPublicInfo;
  } catch (error) {
    alert(error);
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mirrors login() from auth.js
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);

      const user = auth.currentUser;

      if (!user) {
        alert("Пайдаланушы табылмады.");
        return;
      }

      if (!user.emailVerified) {
        alert("Электрондық поштаңызды растаңыз.");
        // NOTE: matching original — we do NOT sign out here, just warn
      }

      // Check existence in backend DB
      const token = await getToken();
      const exists = await fetch("https://api-service-982606249616.us-central1.run.app/api/auth/checkuserexistence", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const userExists = await exists.json();
      console.log(userExists);

      if (userExists === true) 
      {
        const userPublicInfo = await GetUser();
        sessionStorage.setItem("userPublicInfo", JSON.stringify(userPublicInfo));
        navigate(`/${userPublicInfo.role.toLowerCase()}home`);
      } 
      else if (!userExists && user.emailVerified) 
      {
        // Redirect to registration profile form (step 2)
        alert("Мәліметтерді толтырыңыз");
        navigate("/register", { state: { step2: true, email: user.email } });
      }
      else {window.location.reload();}
      
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An error occurred";
      alert(message);
    } finally {
      setLoading(false);
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
          <h1 className="text-2xl font-bold text-foreground">UBTprep</h1>
          
        </div>

        <Card className="shadow-lg border-border/60">
          <CardHeader className="pb-2">
            <p className="text-xl font-bold text-foreground">Кіру</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">

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

              <Button type="submit" className="w-full mt-1" disabled={loading}>
                {loading ? "Жүктелуде..." : "Кіру"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                <Link to="/register" className="text-primary font-medium hover:underline">
                  Тіркелу
                </Link>
              </p>

            </form>
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
      `}</style>
    </div>
  );
}