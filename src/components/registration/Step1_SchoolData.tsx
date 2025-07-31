"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence, type Variants, type Transition } from "framer-motion";
import { useRegistrationStore } from "@/store/registrationStore";
import { SchoolDataSchema } from '@/types/registration';
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
import { Form } from "@/components/ui/form";
import { Loader2, ArrowRight, CheckCircle2, XCircle } from "lucide-react";

// Definisikan objek transisi dengan tipe eksplisit
const formItemTransition: Transition = {
  delay: 0, // Akan di-override oleh fungsi
  duration: 0.5,
  ease: "easeOut",
};

// Gunakan objek transisi di dalam variants dengan tipe eksplisit
const formItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      ...formItemTransition,
      delay: i * 0.1, // Override delay di sini
    },
  }),
};


export default function Step1_SchoolData() {
  const { setSchoolData, nextStep, formValues, updateSchoolDataField, setTempRegId } = useRegistrationStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSchool, setIsCheckingSchool] = useState(false);
  const [schoolAvailability, setSchoolAvailability] = useState<{
    available: boolean;
    message: string;
  } | null>(null);

  const form = useForm<z.infer<typeof SchoolDataSchema>>({
    resolver: zodResolver(SchoolDataSchema),
    defaultValues: formValues.schoolData,
    mode: "onChange",
  });
   const schoolPlaceholders = ["SMAN 1 Cianjur", "SMK Negeri 2 Pacet", "MAN 1 Cianjur", "SMPN 3 Karangtengah"];
  const coachPlaceholders = ["Budi Santoso", "Siti Aminah", "Asep Sunandar", "Dewi Lestari"];
  const waPlaceholders = ["081234567890", "089876543210", "087712345678", "085698765432"];
  const watchedValues = form.watch();
  const [debouncedValues] = useDebounce(watchedValues, 500);
  const [debouncedSchoolName] = useDebounce(watchedValues.schoolName, 800);

  useEffect(() => {
    Object.entries(debouncedValues).forEach(([key, value]) => {
      const fieldKey = key as keyof typeof formValues.schoolData;
      const validKeys: (keyof typeof formValues.schoolData)[] = ["schoolName", "coachName", "whatsappNumber", "category"];
      
      if (validKeys.includes(fieldKey)) {
        if (formValues.schoolData[fieldKey] !== value) {
          updateSchoolDataField(fieldKey, value);
        }
      }
    });
  }, [debouncedValues, updateSchoolDataField, formValues]);

  useEffect(() => {
    if (debouncedSchoolName && debouncedSchoolName.length > 3) {
      const checkSchoolName = async () => {
        setIsCheckingSchool(true);
        setSchoolAvailability(null);
        try {
          // NOTE: API ini bisa dipecah menjadi check-school-name jika diinginkan
          const response = await fetch('/api/registration/check-school-name', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ schoolName: debouncedSchoolName }),
          });
          const result = await response.json();
          setSchoolAvailability(result);

          if (!result.available) {
            form.setError("schoolName", { type: "manual", message: result.message });
          } else {
            if (form.formState.errors.schoolName?.type === "manual") {
              form.clearErrors("schoolName");
            }
          }
        } catch (error) {
          console.error("Failed to check school name:", error);
        } finally {
          setIsCheckingSchool(false);
        }
      };
      checkSchoolName();
    } else {
        setSchoolAvailability(null);
        if (form.formState.errors.schoolName?.type === "manual") {
            form.clearErrors("schoolName");
        }
    }
  }, [debouncedSchoolName, form]);

  async function onSubmit(values: z.infer<typeof SchoolDataSchema>) {
    if (schoolAvailability && !schoolAvailability.available) {
        toast.error("Nama sekolah sudah terdaftar", { description: "Harap gunakan nama sekolah yang lain." });
        return;
    }

    setIsLoading(true);

    try {
        const response = await fetch('/api/registration/create-temporary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Gagal memulai sesi pendaftaran");

        setSchoolData(values);
        setTempRegId(result.tempRegId);
        toast.success("Data sekolah terverifikasi!");
        nextStep();
    } catch (error: unknown) { // 1. Tangkap error sebagai 'unknown'
    let errorMessage = "Terjadi kesalahan yang tidak terduga.";
    
    // 2. Periksa apakah `error` adalah instance dari `Error`
    if (error instanceof Error) {
        // Jika ya, kita bisa dengan aman mengakses .message
        errorMessage = error.message;
    }
    
    // 3. Tampilkan pesan error yang sudah aman
    toast.error("Gagal melanjutkan", { description: errorMessage });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <motion.div initial="hidden" animate="visible" className="font-serif">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12 items-start">
              
              <motion.div layout variants={formItemVariants} custom={1}>
                  <label htmlFor="schoolName" className="text-xl text-pmi-dark mb-3 block">Nama Institusi Sekolah</label>
                  <div className="relative">
                    <Controller
                        name="schoolName"
                        control={form.control}
                        render={({ field }) => (
                            <PlaceholdersAndVanishInput
                                placeholders={schoolPlaceholders}
                                onChange={field.onChange}
                                value={field.value || ""}
                            />
                        )}
                    />
                     <div className="absolute top-1/2 right-4 -translate-y-1/2">
                        <AnimatePresence mode="wait">
                            {isCheckingSchool ? (
                                <motion.div key="loader" initial={{scale:0.5, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.5, opacity:0}}>
                                    <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                                </motion.div>
                            ) : schoolAvailability && schoolAvailability.available ? (
                                <motion.div key="success" initial={{scale:0.5, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.5, opacity:0}}>
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                </motion.div>
                            ) : schoolAvailability && !schoolAvailability.available ? (
                                <motion.div key="error" initial={{scale:0.5, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.5, opacity:0}}>
                                    <XCircle className="h-5 w-5 text-red-500" />
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </div>
                  </div>
                  <AnimatePresence>
                      {form.formState.errors.schoolName && (
                      <motion.p layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-2 font-sans text-sm text-red-500">{form.formState.errors.schoolName.message}</motion.p>
                      )}
                  </AnimatePresence>
              </motion.div>

              <motion.div layout variants={formItemVariants} custom={2}>
                  <label htmlFor="coachName" className="text-xl text-pmi-dark mb-3 block">Nama Pembina/Pelatih</label>
                   <Controller
                      name="coachName"
                      control={form.control}
                      render={({ field }) => (
                          <PlaceholdersAndVanishInput
                              placeholders={coachPlaceholders}
                              onChange={field.onChange}
                              value={field.value || ""}
                          />
                      )}
                  />
                  <AnimatePresence>
                      {form.formState.errors.coachName && (
                      <motion.p layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-2 font-sans text-sm text-red-500">{form.formState.errors.coachName.message}</motion.p>
                      )}
                  </AnimatePresence>
              </motion.div>

              <motion.div layout variants={formItemVariants} custom={3} className="md:col-span-2">
                  <label htmlFor="whatsappNumber" className="text-xl text-pmi-dark mb-3 block">Narahubung (WhatsApp)</label>
                   <Controller
                      name="whatsappNumber"
                      control={form.control}
                      render={({ field }) => (
                           <PlaceholdersAndVanishInput
                              placeholders={waPlaceholders}
                              onChange={field.onChange}
                              value={field.value || ""}
                              type="tel"
                          />
                      )}
                  />
                  <AnimatePresence>
                      {form.formState.errors.whatsappNumber && (
                      <motion.p layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-2 font-sans text-sm text-red-500">{form.formState.errors.whatsappNumber.message}</motion.p>
                      )}
                  </AnimatePresence>
              </motion.div>
          </div>
          
          <motion.div layout variants={formItemVariants} custom={4}>
            <div className="space-y-4">
              <label className="text-2xl font-serif text-center block text-pmi-dark">
                Pilih Kategori Unit PMR
              </label>
              <Controller
                name="category"
                control={form.control}
                render={({ field }) => (
                  <div className="relative w-full max-w-md mx-auto h-16 flex items-center justify-around p-2 rounded-full bg-gray-100 border border-gray-200">
                    <AnimatePresence>
                    {field.value && (
                      <motion.div
                        layoutId="active-category-background"
                        className="absolute inset-0 h-full w-1/2 bg-pmi-red rounded-full"
                        style={{ x: field.value === 'WIRA' ? '0%' : '100%' }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    </AnimatePresence>
                    <button type="button" onClick={() => field.onChange("WIRA")} className="relative z-10 w-1/2 h-full flex items-center justify-center rounded-full text-center font-bold font-serif transition-colors duration-300">
                      <motion.span animate={{ color: field.value === 'WIRA' ? '#FFFFFF' : '#1F2937' }} transition={{ duration: 0.3 }}>WIRA</motion.span>
                    </button>
                    <button type="button" onClick={() => field.onChange("MADYA")} className="relative z-10 w-1/2 h-full flex items-center justify-center rounded-full text-center font-bold font-serif transition-colors duration-300">
                      <motion.span animate={{ color: field.value === 'MADYA' ? '#FFFFFF' : '#1F2937' }} transition={{ duration: 0.3 }}>MADYA</motion.span>
                    </button>
                  </div>
                )}
              />
              <AnimatePresence>
                  {form.formState.errors.category && (
                  <motion.p layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-2 text-center font-sans text-sm text-red-500">{form.formState.errors.category.message}</motion.p>
                  )}
              </AnimatePresence>
            </div>
          </motion.div>

          <div className="flex justify-between items-center pt-8 border-t">
            <div></div> 
            <button
                type="submit"
                disabled={isLoading}
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-md px-8 py-3 font-sans font-medium text-pmi-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <div className="absolute inset-0 h-full w-0 bg-pmi-dark transition-all duration-300 ease-out group-hover:w-full group-disabled:w-0"></div>
                <span className="relative flex items-center gap-2 transition-colors duration-300 ease-out group-hover:text-white group-disabled:text-pmi-dark">
                    {isLoading ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Memproses...
                        </>
                    ) : (
                        <>
                            Lanjut ke Data Peserta
                            <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                        </>
                    )}
                </span>
            </button>
          </div>
        </form>
      </Form>
    </motion.div>
  );
}