// src/app/dashboard/stores/new/page.tsx
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowRight, Store, Globe, Mail, Phone, MapPin, Image, Palette, Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createStoreAction } from "@/actions/stores";
import { ThemePresetSelector } from "@/components/admin/theme-preset-selector";
import { getDefaultTheme } from "@/config/store-themes";

// ✅ Schema التحقق
const createStoreSchema = z.object({
  name: z.string().min(2, "اسم المتجر يجب أن يكون على الأقل 2 أحرف").max(100, "اسم المتجر لا يمكن أن يتجاوز 100 حرف"),
  slug: z.string()
    .min(3, "رابط المتجر يجب أن يكون على الأقل 3 أحرف")
    .max(50, "رابط المتجر لا يمكن أن يتجاوز 50 حرف")
    .regex(/^[a-z0-9-]+$/, "يمكن استخدام الأحرف الصغيرة والأرقام والشرطات فقط"),
  description: z.string().min(10, "الوصف يجب أن يكون على الأقل 10 أحرف").max(500, "الوصف لا يمكن أن يتجاوز 500 حرف"),
  shortBio: z.string().max(160, "النص التعريفي لا يمكن أن يتجاوز 160 حرف").optional(),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  phone: z.string().optional(),
  address: z.string().max(200, "العنوان لا يمكن أن يتجاوز 200 حرف").optional(),
  logo: z.string().optional(),
  logoPublicId: z.string().optional(),
  coverImage: z.string().optional(),
  coverPublicId: z.string().optional(),
  coverImages: z
    .array(
      z.object({
        url: z.string(),
        publicId: z.string().optional(),
        alt: z.string().optional(),
      })
    )
    .max(3)
    .default([]),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "لون غير صالح (مثال: #f97316)").default("#f97316"),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "لون غير صالح (مثال: #10b981)").default("#10b981"),
  themePreset: z.string().default("modern"),
  productGridStyle: z.enum(["classic", "compact", "editorial", "masonry"]).default("classic"),
  filtersPlacement: z.enum(["top", "sidebar", "drawer"]).default("top"),
  heroStyle: z.enum(["split", "centered", "editorial"]).default("split"),
  iconStyle: z.enum(["outline", "solid", "duotone"]).default("duotone"),
  fontFamily: z.enum(["system", "cairo", "tajawal", "inter"]).default("system"),
  cornerRadius: z.enum(["sharp", "soft", "rounded"]).default("soft"),
});

type CreateStoreForm = z.infer<typeof createStoreSchema>;

export default function CreateStorePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const defaultTheme = getDefaultTheme();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateStoreForm>({
    resolver: zodResolver(createStoreSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      shortBio: "",
      email: "",
      phone: "",
      address: "",
      logo: "",
      logoPublicId: "",
      coverImage: "",
      coverPublicId: "",
      coverImages: [],
      primaryColor: defaultTheme.primaryColor,
      secondaryColor: defaultTheme.secondaryColor,
      themePreset: defaultTheme.id,
      productGridStyle: defaultTheme.productGridStyle,
      filtersPlacement: defaultTheme.filtersPlacement,
      heroStyle: defaultTheme.heroStyle,
      iconStyle: defaultTheme.iconStyle,
      fontFamily: defaultTheme.fontFamily,
      cornerRadius: defaultTheme.cornerRadius,
    },
  });

  const watchedLogo = watch("logo");
  const watchedCovers = watch("coverImages") ?? [];
  const watchedName = watch("name");

  // دالة رفع الصورة إلى Cloudinary
  const uploadImage = async (file: File, type: "logo" | "cover"): Promise<{ url: string; publicId?: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    formData.append("storeSlug", "temp"); // مؤقت حتى يتم إنشاء المتجر

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "فشل رفع الصورة");
    }

    const data = await response.json();
    return { url: data.url, publicId: data.publicId };
  };

  // معالجة رفع الشعار
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // التحقق من نوع الملف
    if (!file.type.startsWith("image/")) {
      toast.error("يرجى اختيار ملف صورة صحيح");
      return;
    }

    // التحقق من الحجم (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن يكون أقل من 5 ميجابايت");
      return;
    }

    setUploadingLogo(true);
    try {
      const result = await uploadImage(file, "logo");
      setValue("logo", result.url);
      setValue("logoPublicId", result.publicId || "");
      toast.success("تم رفع الشعار بنجاح");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل رفع الشعار");
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  // معالجة رفع صورة الغلاف
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const availableSlots = 3 - watchedCovers.length;
    if (availableSlots <= 0) {
      toast.error("يمكنك رفع 3 صور غلاف كحد أقصى");
      return;
    }

    const selectedFiles = files.slice(0, availableSlots);
    if (files.length > availableSlots) {
      toast.warning(`سيتم رفع ${availableSlots} صور فقط لأن الحد الأقصى 3 صور`);
    }

    if (selectedFiles.some((file) => !file.type.startsWith("image/"))) {
      toast.error("يرجى اختيار ملفات صور صحيحة");
      return;
    }

    if (selectedFiles.some((file) => file.size > 5 * 1024 * 1024)) {
      toast.error("حجم كل صورة يجب أن يكون أقل من 5 ميجابايت");
      return;
    }

    setUploadingCover(true);
    try {
      const uploaded = [];
      for (const file of selectedFiles) {
        const result = await uploadImage(file, "cover");
        uploaded.push({
          url: result.url,
          publicId: result.publicId || "",
          alt: "",
        });
      }

      const nextCovers = [...watchedCovers, ...uploaded].slice(0, 3);
      setValue("coverImages", nextCovers);
      setValue("coverImage", nextCovers[0]?.url || "");
      setValue("coverPublicId", nextCovers[0]?.publicId || "");
      toast.success(`تم رفع ${uploaded.length} صورة غلاف بنجاح`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل رفع صورة الغلاف");
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  // إزالة الشعار
  const removeLogo = () => {
    setValue("logo", "");
    setValue("logoPublicId", "");
  };

  // إزالة صورة الغلاف
  const removeCover = (index: number) => {
    const nextCovers = watchedCovers.filter((_, coverIndex) => coverIndex !== index);
    setValue("coverImages", nextCovers);
    setValue("coverImage", nextCovers[0]?.url || "");
    setValue("coverPublicId", nextCovers[0]?.publicId || "");
  };

  const onSubmit = async (data: CreateStoreForm) => {
    setLoading(true);
    try {
      const result = await createStoreAction({
        name: data.name,
        slug: data.slug,
        description: data.description,
        shortBio: data.shortBio || "",
        email: data.email,
        phone: data.phone || "",
        address: data.address || "",
        logo: data.logo || "",
        coverImage: data.coverImage || "",
        coverPublicId: data.coverPublicId || "",
        coverImages: data.coverImages || [],
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        themePreset: data.themePreset,
        productGridStyle: data.productGridStyle,
        filtersPlacement: data.filtersPlacement,
        heroStyle: data.heroStyle,
        iconStyle: data.iconStyle,
        fontFamily: data.fontFamily,
        cornerRadius: data.cornerRadius,
      });

      if (result.success) {
        toast.success("تم إنشاء المتجر بنجاح!");
        router.push(`/dashboard/stores/${data.slug}`);
      } else {
        toast.error(result.error || "حدث خطأ أثناء إنشاء المتجر");
      }
    } catch (error) {
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  // إنشاء رابط تلقائي من الاسم
  const generatedSlug = watchedName
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "";

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-3xl px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg mb-4">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">إنشاء متجر جديد</h1>
          <p className="text-gray-500">أدخل معلومات متجرك للبدء في البيع</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-white p-1 rounded-xl shadow-sm">
              <TabsTrigger value="basic" className="rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                معلومات أساسية
              </TabsTrigger>
              <TabsTrigger value="contact" className="rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                معلومات التواصل
              </TabsTrigger>
              <TabsTrigger value="branding" className="rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                العلامة التجارية
              </TabsTrigger>
            </TabsList>

            {/* تبويب المعلومات الأساسية */}
            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Globe className="w-5 h-5 text-orange-500" />
                    معلومات المتجر
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* اسم المتجر */}
                  <div>
                    <Label htmlFor="name" className="text-gray-700">
                      اسم المتجر <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      {...register("name")}
                      placeholder="مثال: متجر الإلكترونيات"
                      className={errors.name ? "border-red-500" : ""}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  {/* رابط المتجر */}
                  <div>
                    <Label htmlFor="slug" className="text-gray-700">
                      رابط المتجر <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-sm bg-gray-100 px-3 py-2 rounded-lg whitespace-nowrap">
                        {typeof window !== "undefined" ? `${window.location.host}/` : "your-domain.com/"}
                      </span>
                      <Input
                        id="slug"
                        {...register("slug")}
                        placeholder="store-name"
                        className={errors.slug ? "border-red-500 flex-1" : "flex-1"}
                      />
                    </div>
                    {!watch("slug") && watchedName && (
                      <p className="text-gray-400 text-xs mt-1">
                        المقترح:{" "}
                        <button
                          type="button"
                          onClick={() => setValue("slug", generatedSlug)}
                          className="text-orange-500 hover:underline"
                        >
                          {generatedSlug}
                        </button>
                      </p>
                    )}
                    {errors.slug && (
                      <p className="text-red-500 text-xs mt-1">{errors.slug.message}</p>
                    )}
                  </div>

                  {/* وصف المتجر */}
                  <div>
                    <Label htmlFor="description" className="text-gray-700">
                      وصف المتجر <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      {...register("description")}
                      placeholder="وصف كامل لمتجرك وما يقدمه..."
                      rows={4}
                      className={errors.description ? "border-red-500" : ""}
                    />
                    <p className="text-gray-400 text-xs mt-1">
                      {watch("description")?.length || 0}/500 حرف
                    </p>
                    {errors.description && (
                      <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
                    )}
                  </div>

                  {/* نبذة مختصرة */}
                  <div>
                    <Label htmlFor="shortBio" className="text-gray-700">نبذة مختصرة</Label>
                    <Textarea
                      id="shortBio"
                      {...register("shortBio")}
                      placeholder="نبذة قصيرة عن متجرك (تظهر في محركات البحث)"
                      rows={2}
                      className={errors.shortBio ? "border-red-500" : ""}
                    />
                    <p className="text-gray-400 text-xs mt-1">
                      {watch("shortBio")?.length || 0}/160 حرف
                    </p>
                    {errors.shortBio && (
                      <p className="text-red-500 text-xs mt-1">{errors.shortBio.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* تبويب معلومات التواصل */}
            <TabsContent value="contact" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Mail className="w-5 h-5 text-orange-500" />
                    معلومات التواصل
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-gray-700">
                      البريد الإلكتروني <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      placeholder="contact@store.com"
                      className={errors.email ? "border-red-500" : ""}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-gray-700">رقم الهاتف</Label>
                    <Input
                      id="phone"
                      {...register("phone")}
                      placeholder="0123456789"
                      className={errors.phone ? "border-red-500" : ""}
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="address" className="text-gray-700">العنوان</Label>
                    <Input
                      id="address"
                      {...register("address")}
                      placeholder="القاهرة، مصر"
                      className={errors.address ? "border-red-500" : ""}
                    />
                    {errors.address && (
                      <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* تبويب العلامة التجارية */}
            <TabsContent value="branding" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Palette className="w-5 h-5 text-orange-500" />
                    العلامة التجارية
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-gray-700">شكل المتجر الجاهز</Label>
                    <p className="mt-1 text-xs text-gray-500">اختر شكل الهيرو، شبكة المنتجات، مكان الفلاتر، الأيقونات، الفونت والألوان.</p>
                    <div className="mt-3">
                      <ThemePresetSelector
                        value={watch("themePreset")}
                        isAr
                        onChange={(theme) => {
                          setValue("themePreset", theme.id);
                          setValue("primaryColor", theme.primaryColor);
                          setValue("secondaryColor", theme.secondaryColor);
                          setValue("productGridStyle", theme.productGridStyle);
                          setValue("filtersPlacement", theme.filtersPlacement);
                          setValue("heroStyle", theme.heroStyle);
                          setValue("iconStyle", theme.iconStyle);
                          setValue("fontFamily", theme.fontFamily);
                          setValue("cornerRadius", theme.cornerRadius);
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="primaryColor" className="text-gray-700">اللون الأساسي</Label>
                      <div className="mt-2 flex items-center gap-3">
                        <input
                          id="primaryColor"
                          type="color"
                          value={watch("primaryColor")}
                          onChange={(e) => setValue("primaryColor", e.target.value)}
                          className="h-10 w-14 cursor-pointer rounded border p-0.5"
                        />
                        <Input {...register("primaryColor")} className="font-mono" dir="ltr" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="secondaryColor" className="text-gray-700">اللون الثانوي</Label>
                      <div className="mt-2 flex items-center gap-3">
                        <input
                          id="secondaryColor"
                          type="color"
                          value={watch("secondaryColor")}
                          onChange={(e) => setValue("secondaryColor", e.target.value)}
                          className="h-10 w-14 cursor-pointer rounded border p-0.5"
                        />
                        <Input {...register("secondaryColor")} className="font-mono" dir="ltr" />
                      </div>
                    </div>
                  </div>

                  {/* رفع الشعار */}
                  <div>
                    <Label className="text-gray-700">شعار المتجر</Label>
                    <div className="mt-2">
                      {watchedLogo ? (
                        <div className="relative inline-block">
                          <img
                            src={watchedLogo}
                            alt="Logo preview"
                            className="w-24 h-24 object-contain border rounded-lg bg-white p-2"
                          />
                          <button
                            type="button"
                            onClick={removeLogo}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => logoInputRef.current?.click()}
                          className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 transition group bg-gray-50"
                        >
                          {uploadingLogo ? (
                            <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                          ) : (
                            <>
                              <Upload className="w-6 h-6 text-gray-400 group-hover:text-orange-500" />
                              <span className="text-xs text-gray-400 mt-1">رفع</span>
                            </>
                          )}
                        </div>
                      )}
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </div>
                    <p className="text-gray-400 text-xs mt-2">PNG, JPG, WEBP (حد أقصى 5MB)</p>
                  </div>

                  {/* رفع صورة الغلاف */}
                  <div>
                    <Label className="text-gray-700">صور الغلاف</Label>
                    <div className="mt-2">
                      {watchedCovers.length > 0 ? (
                        <div className="space-y-3">
                          <div className="grid gap-3 sm:grid-cols-3">
                            {watchedCovers.map((cover, index) => (
                              <div key={`${cover.url}-${index}`} className="relative overflow-hidden rounded-lg border bg-gray-50">
                                <img
                                  src={cover.url}
                                  alt={`Cover preview ${index + 1}`}
                                  className="h-28 w-full object-cover"
                                />
                                <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">
                                  {index + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeCover(index)}
                                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                          {watchedCovers.length < 3 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => coverInputRef.current?.click()}
                              disabled={uploadingCover}
                            >
                              {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Upload className="w-4 h-4 ml-2" />}
                              إضافة صورة غلاف
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div
                          onClick={() => coverInputRef.current?.click()}
                          className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 transition group bg-gray-50"
                        >
                          {uploadingCover ? (
                            <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                          ) : (
                            <>
                              <Upload className="w-6 h-6 text-gray-400 group-hover:text-orange-500" />
                              <span className="text-sm text-gray-400 mt-1">اضغط لرفع حتى 3 صور غلاف</span>
                            </>
                          )}
                        </div>
                      )}
                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleCoverUpload}
                        className="hidden"
                      />
                    </div>
                    <p className="text-gray-400 text-xs mt-2">يوصى بحجم 1600x600 بكسل. أول صورة تظهر كغلاف افتراضي والسلايدر يعرض الثلاثة.</p>
                  </div>

                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* أزرار التحكم */}
          <div className="flex justify-between gap-4 mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              إلغاء
            </Button>
            {activeTab !== "branding" ? (
              <Button
                type="button"
                onClick={() => setActiveTab(activeTab === "basic" ? "contact" : "branding")}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                التالي
                <ArrowRight className="w-4 h-4 mr-2" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={loading || uploadingLogo || uploadingCover}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                {loading ? "جاري الإنشاء..." : "إنشاء المتجر"}
                <Store className="w-4 h-4 mr-2" />
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
