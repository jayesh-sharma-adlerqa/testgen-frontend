import { useEffect } from "react";
import { useThemeStore } from "./store/ThemeStore";
import AppRouter from "./routes/AppRouter";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function App() {
  const theme = useThemeStore((s) => s.theme);
  const themeHydrated = useThemeStore((s) => s.hasHydrated);

  useEffect(() => {
    if (!themeHydrated) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.dataset.theme = theme;
  }, [theme, themeHydrated]);

  return (
    <>
      <AppRouter />
      <ToastContainer
        position="top-right"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="dark"
      />
    </>
  );
}