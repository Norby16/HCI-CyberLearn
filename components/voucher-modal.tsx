"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

export function VoucherModal({ classItem, user, onClose, onSuccess }) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableVouchers, setAvailableVouchers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useState(() => {
    const fetchVouchers = async () => {
      try {
        const { data } = await supabase.from("vouchers").select("*").eq("user_id", user.id).eq("is_redeemed", false)

        setAvailableVouchers(data || [])
      } catch (err) {
        console.error("Error fetching vouchers:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchVouchers()
  })

  const handleRedeemVoucher = async () => {
    if (availableVouchers.length === 0) return

    setIsProcessing(true)
    setError(null)

    try {
      const voucher = availableVouchers[0]

      // Update voucher as redeemed
      const { error: updateError } = await supabase
        .from("vouchers")
        .update({ is_redeemed: true, redeemed_date: new Date().toISOString() })
        .eq("id", voucher.id)

      if (updateError) throw updateError

      // Create purchase record
      const { error: purchaseError } = await supabase.from("purchases").insert({
        user_id: user.id,
        class_id: classItem.id,
        price_paid_rupiah: 0,
      })

      if (purchaseError) throw purchaseError

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Redemption failed")
    } finally {
      setIsProcessing(false)
    }
  }

  const hasVoucher = availableVouchers.length > 0

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md">
          <div className="p-6 text-center">
            <p className="text-gray-600">Loading vouchers...</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Redeem Voucher</h2>

          {hasVoucher ? (
            <>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-900 mb-2">
                  <span className="font-semibold">Available Vouchers:</span> {availableVouchers.length}
                </p>
                <p className="text-sm text-green-800">You can use one voucher to get free access to this class!</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-gray-600 mb-2">Class</p>
                <p className="font-semibold text-gray-900 mb-4">{classItem.title}</p>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price</span>
                    <span className="font-semibold text-green-600">FREE</span>
                  </div>
                </div>
              </div>

              {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

              <div className="flex gap-3">
                <Button onClick={onClose} variant="outline" className="flex-1 bg-transparent" disabled={isProcessing}>
                  Cancel
                </Button>
                <Button
                  onClick={handleRedeemVoucher}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  disabled={isProcessing}
                >
                  {isProcessing ? "Redeeming..." : "Redeem Voucher"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <p className="text-gray-600 text-center">
                  You don't have any vouchers yet. Purchase a class to earn one!
                </p>
              </div>
              <Button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Close
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
