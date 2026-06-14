"use client";

import { useEffect, useState } from "react";
import { Download, Share, X, Smartphone } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showiOSModal, setShowiOSModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isInStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone ||
      document.referrer.includes("android-app://");
    
    setIsStandalone(!!isInStandaloneMode);

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // If it's iOS and not already standalone, we can show the install option
    if (isIOSDevice && !isInStandaloneMode) {
      setIsInstallable(true);
    }

    // Capture standard install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowiOSModal(true);
      return;
    }

    if (!deferredPrompt) return;

    // Show the browser install prompt
    await deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA install user choice: ${outcome}`);

    // Clear the deferred prompt variable
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  // If already installed or not installable, don't show
  if (!isInstallable || isStandalone) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-2 rounded-full bg-slate-900 hover:bg-slate-800 px-4 py-2 text-sm font-bold text-white transition-all duration-200 shadow-md hover:scale-105"
        title="تنزيل التطبيق | Download App"
      >
        <Download className="h-4 w-4 text-white" />
        <span className="hidden sm:inline">تحميل التطبيق</span>
      </button>

      {/* iOS Guide Modal */}
      <AnimatePresence>
        {showiOSModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 text-right shadow-2xl border border-slate-100 font-sans"
              dir="rtl"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowiOSModal(false)}
                className="absolute left-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex flex-col items-center text-center mt-2">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-50 text-amber-500 mb-4 shadow-inner">
                  <Smartphone className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900">تثبيت التطبيق على الآيفون</h3>
                <p className="mt-2 text-sm text-slate-500 max-w-xs leading-relaxed">
                  يمكنك تثبيت متجرنا على شاشتك الرئيسية لتصفح أسرع وتجربة تطبيق متكاملة.
                </p>
              </div>

              <div className="mt-6 space-y-4 text-right">
                <div className="flex items-start gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-900 text-sm font-bold text-white">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800 flex items-center gap-1 justify-start">
                      اضغط على زر المشاركة <Share className="h-4 w-4 text-blue-500 inline" /> في متصفح Safari.
                    </p>
                    <p className="text-xs text-slate-500 mt-1">يوجد زر المشاركة عادة في شريط الأدوات بالأسفل أو بالأعلى.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-900 text-sm font-bold text-white">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800">
                      مرر للأسفل في الخيارات واختر "إضافة إلى الشاشة الرئيسية".
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      ستظهر لك أيقونة المتجر على شاشة هاتفك مباشرة كأي تطبيق آخر.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowiOSModal(false)}
                className="mt-6 w-full rounded-2xl bg-slate-900 py-3 text-center text-sm font-bold text-white hover:bg-slate-800 transition"
              >
                حسنًا، فهمت
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
