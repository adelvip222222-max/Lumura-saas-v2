import Link from "next/link";
import { getPublicPlansAction } from "@/actions/plans";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle2, Sparkles } from "lucide-react";

export async function PricingSection() {
  const result = await getPublicPlansAction();
  const plans = result.success && result.data ? result.data : [];

  return (
    <section id="pricing" className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            خطط <span className="text-orange-500">الاشتراك</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            اختر الخطة المناسبة لمتجرك — يمكنك الترقية في أي وقت
          </p>
        </div>

        {plans.length === 0 ? (
          <p className="text-center text-gray-500">جاري تجهيز خطط الأسعار...</p>
        ) : (
          <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan._id}
                className={`relative rounded-2xl border p-8 transition-shadow hover:shadow-xl ${
                  plan.isFeatured
                    ? "border-orange-500 shadow-lg ring-2 ring-orange-100 scale-[1.02]"
                    : "border-gray-200 shadow-md"
                }`}
              >
                {plan.isFeatured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-orange-500 px-4 py-1 text-xs font-semibold text-white">
                    <Sparkles className="h-3.5 w-3.5" />
                    الأكثر شيوعاً
                  </div>
                )}
                {(plan.promoLabelAr || plan.promoLabel) && (
                  <div className="mb-3 text-center">
                    <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      {plan.promoLabelAr || plan.promoLabel}
                    </span>
                  </div>
                )}

                <h3 className="text-xl font-bold text-gray-900 text-center">
                  {plan.nameAr}
                </h3>
                <p className="mt-1 text-center text-sm text-gray-500">
                  {plan.description}
                </p>

                <div className="my-6 text-center">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price === 0
                      ? "مجاني"
                      : formatCurrency(plan.price, plan.currency)}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-gray-500 text-sm"> / شهر</span>
                  )}
                  {plan.yearlyPrice > 0 && plan.price > 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      أو {formatCurrency(plan.yearlyPrice, plan.currency)} سنوياً
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {(plan.featuresAr?.length ? plan.featuresAr : plan.features).map(
                    (feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-orange-500" />
                        {feature}
                      </li>
                    )
                  )}
                </ul>

                <Link
                  href="/register"
                  className={`block w-full text-center rounded-xl py-3 font-semibold transition ${
                    plan.isFeatured
                      ? "bg-orange-500 text-white hover:bg-orange-600"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                >
                  {plan.price === 0 ? "ابدأ مجاناً" : "اشترك الآن"}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
