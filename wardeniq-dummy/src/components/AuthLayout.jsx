import { useThemeStore } from "../store/ThemeStore";

export default function AuthLayout({ title, subtitle, children }) {
  const theme = useThemeStore((s) => s.theme);
  const bgUrl = theme === "dark" ? "/auth-bs-dark.png" : "/auth-bs-light.png";

  return (
    <div
      className="relative min-h-screen max-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url('${bgUrl}')` }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/45 to-black/55" />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-950/35 p-10 shadow-[0_30px_80px_rgba(0,0,0,0.65)] backdrop-blur-2xl">
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
            {subtitle ? <p className="mt-2 text-sm text-slate-300">{subtitle}</p> : null}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
};