export function HomeBottom() {
  return (
    <>
      <section className="py-16 bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {[
              { value: "+10K", label: "متجر إلكتروني" },
              { value: "+50K", label: "عميل سعيد" },
              { value: "+1M", label: "منتج مباع" },
              { value: "24/7", label: "دعم فني" },
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-3xl md:text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-orange-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer id="contact" className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                  <span className="font-bold text-xl">M</span>
                </div>
                <span className="font-bold text-xl">
                  MEMO<span className="text-orange-500">DEV</span>
                </span>
              </div>
              <p className="text-gray-400 text-sm">
                منصة متكاملة لإنشاء وإدارة المتاجر الإلكترونية
              </p>
              <p className="mt-3 text-sm text-gray-500">support@memodev.com</p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">روابط سريعة</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <a href="#features" className="hover:text-orange-400 transition">
                    المميزات
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-orange-400 transition">
                    الأسعار
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">الدعم</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <a href="mailto:support@memodev.com" className="hover:text-orange-400 transition">
                    تواصل معنا
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">ابدأ الآن</h4>
              <p className="text-sm text-gray-400">
                سجّل حسابك واختر الخطة المناسبة لمتجرك في دقائق.
              </p>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            © {new Date().getFullYear()} MEMO DEV. جميع الحقوق محفوظة
          </div>
        </div>
      </footer>
    </>
  );
}
