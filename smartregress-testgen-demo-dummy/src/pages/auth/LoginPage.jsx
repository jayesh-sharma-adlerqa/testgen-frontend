import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";
import { http, getErrorMessage } from "../../api/http";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(() => location.state?.email || "");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  const canSend = useMemo(() => email.trim().includes("@"), [email]);

  async function onSendOtp() {
    if (!canSend || loading) return;

    setErrMsg("");
    setInfoMsg("");
    setLoading(true);

    try {
      const body = (await http.post("/auth/send-otp", { email: email.trim() })).data;

      if (!body?.ok) {
        throw new Error(body?.error?.message || "Failed to send OTP");
      }

      const data = body.data || {};
      navigate("/verify-otp", {
        replace: true,
        state: {
          email: email.trim(),
          expiresInMinutes: data.expiresInMinutes ?? null,
          resendInfo: data.resend ?? null,
          bootstrap: Boolean(data.bootstrap),
        },
      });
    } catch (e) {
      setErrMsg(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Log in to your account" subtitle="Please enter your details.">
      {errMsg ? (
        <div className="mt-6 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errMsg}
        </div>
      ) : null}

      {infoMsg ? (
        <div className="mt-6 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {infoMsg}
        </div>
      ) : null}

      <div className="mt-6 rounded-lg border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
        Demo mode is enabled. Enter any email and use OTP <span className="font-semibold">123456</span>.
      </div>

      <div className="mx-auto mt-8 w-full max-w-md space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">Email</label>
          <input
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-blue-400/50 focus:ring-4 focus:ring-blue-500/15 disabled:cursor-not-allowed disabled:opacity-60"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@gmail.com"
            disabled={loading}
            autoComplete="email"
            onKeyDown={(e) => {
              if (e.key === "Enter") onSendOtp();
            }}
          />
        </div>

        <button
          className="mt-2 w-full rounded-xl bg-gradient-to-b from-blue-500 to-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(59,130,246,0.25)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onSendOtp}
          disabled={loading || !canSend}
        >
          {loading ? "Please wait..." : "Sign in"}
        </button>
      </div>
    </AuthLayout>
  );
};