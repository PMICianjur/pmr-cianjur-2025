"use client";

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { BIAYA_PESERTA, BIAYA_PENDAMPING } from '@/config/fees';
// --- IMPOR YANG DIPERLUKAN SAJA ---
// Impor tipe-tipe yang benar-benar kita gunakan dari file terpusat
import {
    type ProcessedParticipant,
    type CompanionExcelRow,
    type SchoolData,
} from '@/types/registration';

// Interface untuk Form Values yang disimpan secara real-time
interface FormValuesState {
  schoolData: Partial<SchoolData>;
}

// Interface untuk state di dalam store
interface RegistrationState {
  tempRegId: string | null;
  step: number;
  schoolData: SchoolData | null;
  excelData: {
    participants: ProcessedParticipant[];
    companions: CompanionExcelRow[];
  } | null;
  tentChoice: {
    type: 'bawa_sendiri' | 'sewa_panitia';
    capacity: number;
    cost: number;
  } | null;
  kavling: {
    number: number;
    capacity: number;
  } | null;
  costs: {
    participants: number;
    companions: number;
    total: number;
  };
  formValues: FormValuesState;
}

// Interface untuk semua fungsi (actions)
interface RegistrationActions {
  setTempRegId: (id: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  setSchoolData: (data: SchoolData) => void;
  setExcelData: (data: RegistrationState['excelData']) => void;
  setTentChoice: (choice: RegistrationState['tentChoice']) => void;
  setKavling: (kavling: RegistrationState['kavling']) => void;
  calculateTotal: () => void;
  reset: () => void;
  // --- PERBAIKAN TIPE 'any' DI SINI ---
  updateSchoolDataField: (
    field: keyof FormValuesState['schoolData'],
    value: SchoolData[keyof SchoolData] // Gunakan tipe yang lebih spesifik
  ) => void;
  setFormValues: (values: FormValuesState) => void;
}

const initialState: RegistrationState = {
  tempRegId: null,
  step: 1,
  schoolData: null,
  excelData: null,
  tentChoice: null,
  kavling: null,
  costs: {
    participants: 0,
    companions: 0,
    total: 0,
  },
  formValues: {
    schoolData: {},
  },
};

export const useRegistrationStore = create<RegistrationState & RegistrationActions>()(
  persist(
    devtools(
      (set, get) => ({
        ...initialState,

        updateSchoolDataField: (field, value) => {
          set((state) => ({
            formValues: {
              ...state.formValues,
              schoolData: {
                ...state.formValues.schoolData,
                [field]: value,
              },
            },
          }));
        },

        setFormValues: (values) => {
            set({ formValues: values });
        },
        
        setSchoolData: (data) => {
          set((state) => ({
            schoolData: data,
            formValues: {
              ...state.formValues,
              schoolData: data,
            }
          }));
        },

        setTempRegId: (id: string) => {
          set({ tempRegId: id });
        },

        nextStep: () => {
          set((state) => ({ step: state.step + 1 }));
        },

        prevStep: () => set((state) => ({ step: state.step - 1 })),

        goToStep: (step: number) => {
          set({ step });
        },

       setExcelData: (data) => {
  if (data === null) {
      set({ 
          excelData: null,
          costs: initialState.costs,
      });
      // PANGGIL INI AGAR TOTAL TETAP MEMPERHITUNGKAN BIAYA TENDA
      get().calculateTotal(); 
          } else {
              const participantCost = data.participants.length * BIAYA_PESERTA;
              const companionCost = data.companions.length * BIAYA_PENDAMPING;
              set({ 
                excelData: data, 
                costs: { 
                  participants: participantCost,
                  companions: companionCost,
                  total: participantCost + companionCost
                },
              });
              get().calculateTotal();
          }
        },

        setTentChoice: (choice) => {
          set({ tentChoice: choice });
          get().calculateTotal();
        },

        setKavling: (kavling) => set({ kavling }),

        calculateTotal: () => {
          const state = get();
          const baseCost = state.costs.participants + state.costs.companions;
          const tentCost = state.tentChoice?.cost || 0;
          set({ costs: { ...state.costs, total: baseCost + tentCost } });
        },

       reset: () => {
          set(initialState);
          localStorage.removeItem('registration-storage');
        },
      }),
      { name: 'registration-store' }
    ),
    { name: 'registration-storage' }
  )
);