import { create } from "zustand"
import { persist } from "zustand/middleware"

interface UserStore {
  purchasedClasses: number[]
  vouchers: number[]
  addPurchasedClass: (classId: number) => void
  addVoucher: (classId: number) => void
  redeemVoucher: (classId: number) => void
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      purchasedClasses: [],
      vouchers: [],
      addPurchasedClass: (classId) =>
        set((state) => ({
          purchasedClasses: [...new Set([...state.purchasedClasses, classId])],
        })),
      addVoucher: (classId) =>
        set((state) => ({
          vouchers: [...state.vouchers, classId],
        })),
      redeemVoucher: (classId) =>
        set((state) => ({
          vouchers: state.vouchers.filter((id) => id !== classId),
        })),
    }),
    {
      name: "cyberlearn-store",
    },
  ),
)
