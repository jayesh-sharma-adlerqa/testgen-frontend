import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";
import { http, getErrorMessage } from "../../api/http";
import { useAuthStore } from "../../store/AuthStore";

function formatMMSS(totalSeconds) {
    const s = Math.max(0, Number(totalSeconds) || 0);
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
}

function inferResendSeconds(resendInfo) {
    const candidates = [
        resendInfo?.cooldownSeconds,
        resendInfo?.nextAllowedInSeconds,
        resendInfo?.retryAfterSeconds,
    ];
    const n = candidates.find((v) => Number.isFinite(Number(v)));
    return n ? Number(n) : 60;
}

export default function VerifyOtpPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const setToken = useAuthStore((s) => s.setToken);
    const setUser = useAuthStore((s) => s.setUser);

    const { email, resendInfo, bootstrap } = location.state || {};

    const [loading, setLoading] = useState(false);
    const [errMsg, setErrMsg] = useState("");
    const [infoMsg, setInfoMsg] = useState("");

    const [digits, setDigits] = useState(["", "", "", "", "", ""]);
    const refs = useRef([]);

    const [resendSecondsLeft, setResendSecondsLeft] = useState(() =>
        inferResendSeconds(resendInfo)
    );

    const otp = useMemo(() => digits.join(""), [digits]);
    const canVerify = useMemo(() => otp.length === 6 && /^\d{6}$/.test(otp), [otp]);

    useEffect(() => {
        const el = refs.current?.[0];
        if (el && typeof el.focus === "function") el.focus();
    }, []);

    useEffect(() => {
        if (resendSecondsLeft <= 0) return;
        const t = setInterval(() => setResendSecondsLeft((s) => s - 1), 1000);
        return () => clearInterval(t);
    }, [resendSecondsLeft]);

    if (!email) {
        return <Navigate to="/login" replace />;
    }

    function focusIndex(i) {
        const el = refs.current?.[i];
        if (el && typeof el.focus === "function") el.focus();
    }

    function setDigitAt(i, val) {
        setDigits((prev) => {
            const next = [...prev];
            next[i] = val;
            return next;
        });
    }

    function onChangeDigit(i, raw) {
        const onlyDigits = String(raw || "").replace(/\D/g, "");
        if (!onlyDigits) {
            setDigitAt(i, "");
            return;
        }

        if (onlyDigits.length > 1) {
            const pasted = onlyDigits.slice(0, 6);
            const next = pasted.split("");
            setDigits([
                next[0] || "",
                next[1] || "",
                next[2] || "",
                next[3] || "",
                next[4] || "",
                next[5] || "",
            ]);
            focusIndex(Math.min(5, pasted.length - 1));
            return;
        }

        setDigitAt(i, onlyDigits[0]);
        if (i < 5) focusIndex(i + 1);
    }

    function onKeyDown(i, e) {
        if (e.key === "Backspace") {
            if (digits[i]) {
                setDigitAt(i, "");
            } else if (i > 0) {
                focusIndex(i - 1);
                setDigitAt(i - 1, "");
            }
        }

        if (e.key === "ArrowLeft" && i > 0) focusIndex(i - 1);
        if (e.key === "ArrowRight" && i < 5) focusIndex(i + 1);

        if (e.key === "Enter" && canVerify) onVerifyOtp();
    }

    function onPaste(e) {
        const text = e.clipboardData?.getData("text") || "";
        const onlyDigits = text.replace(/\D/g, "").slice(0, 6);
        if (!onlyDigits) return;

        e.preventDefault();
        const arr = onlyDigits.split("");
        setDigits([
            arr[0] || "",
            arr[1] || "",
            arr[2] || "",
            arr[3] || "",
            arr[4] || "",
            arr[5] || "",
        ]);
        focusIndex(Math.min(5, onlyDigits.length - 1));
    }

    async function onResendOtp() {
        if (loading || resendSecondsLeft > 0) return;

        setErrMsg("");
        setInfoMsg("");
        setLoading(true);

        try {
            const body = (await http.post("/auth/send-otp", { email: String(email).trim() })).data;
            if (!body?.ok) {
                throw new Error(body?.error?.message || "Failed to resend OTP");
            }

            const data = body.data || {};
            setResendSecondsLeft(inferResendSeconds(data.resend));
            setInfoMsg("OTP resent. Please check your email.");
        } catch (e) {
            setErrMsg(getErrorMessage(e));
        } finally {
            setLoading(false);
        }
    }

    async function onVerifyOtp() {
        if (!canVerify || loading) return;

        setErrMsg("");
        setInfoMsg("");
        setLoading(true);

        try {
            const body = (
                await http.post("/auth/verify-otp", { email: String(email).trim(), otp })
            ).data;

            if (!body?.ok) {
                throw new Error(body?.error?.message || "OTP verification failed");
            }

            const data = body.data || {};
            const token = data.token;
            if (!token) throw new Error("Token missing in verify response.");

            setToken(token);
            setUser(data.admin || null);

            navigate(bootstrap ? "/settings" : "/dashboard", { replace: true });
        } catch (e) {
            setErrMsg(getErrorMessage(e));
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthLayout
            title="Verification Code"
            subtitle="Enter the 6-digit code to verify (demo OTP: 123456)"
            cardClassName="max-w-xl px-8 py-12 md:px-12"
        >
            {errMsg ? <div className="mt-6 text-center text-sm text-red-200">{errMsg}</div> : null}
            {infoMsg ? <div className="mt-6 text-center text-sm text-emerald-200">{infoMsg}</div> : null}

            <div className="mx-auto mt-10 w-full max-w-lg">
                <div className="flex items-center justify-center gap-4" onPaste={onPaste}>
                    {digits.map((d, i) => (
                        <input
                            key={i}
                            ref={(el) => {
                                refs.current[i] = el;
                            }}
                            className="h-14 w-14 rounded-xl border border-white/15 bg-white/5 text-center text-lg font-semibold text-white outline-none transition focus:border-blue-400/60 focus:ring-4 focus:ring-blue-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                            value={d}
                            onChange={(e) => onChangeDigit(i, e.target.value)}
                            onKeyDown={(e) => onKeyDown(i, e)}
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={1}
                            disabled={loading}
                        />
                    ))}
                </div>

                <div className="mt-4 flex pr-10 justify-end">
                    <button
                        className={`flex text-sm text-[#718EBF] ${resendSecondsLeft === 0 && !loading ? "hover:font-bold" : ""} disabled:cursor-not-allowed disabled:opacity-60`}
                        onClick={onResendOtp}
                        disabled={loading || resendSecondsLeft > 0}
                        title={resendSecondsLeft > 0 ? "Please wait before resending" : "Resend OTP"}
                    >
                        Resend
                        <p className="text-white">
                            {resendSecondsLeft > 0 ? ` - ${formatMMSS(resendSecondsLeft)}` : ""}
                        </p>
                    </button>
                </div>

                <button
                    className="mx-auto mt-10 block w-full max-w-md rounded-xl bg-gradient-to-b from-blue-500 to-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(59,130,246,0.25)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={onVerifyOtp}
                    disabled={loading || !canVerify}
                >
                    {loading ? "Please wait..." : "Verify"}
                </button>
            </div>
        </AuthLayout>
    );
};