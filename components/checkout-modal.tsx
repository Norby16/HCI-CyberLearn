"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

export function CheckoutModal({ classItem, user, onClose, onSuccess }) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price)
  }

  const handlePayment = async () => {
    setIsProcessing(true)
    setError(null)

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Create purchase record
      const { error: purchaseError } = await supabase.from("purchases").insert({
        user_id: user.id,
        class_id: classItem.id,
        price_paid_rupiah: classItem.price_rupiah,
      })

      if (purchaseError) throw purchaseError

      // 50% chance to earn a voucher
      if (Math.random() > 0.5) {
        const { data: allClasses } = await supabase.from("classes").select("id")
        if (allClasses && allClasses.length > 0) {
          const randomClass = allClasses[Math.floor(Math.random() * allClasses.length)]
          if (randomClass.id !== classItem.id) {
            const voucherCode = `VOUCHER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            await supabase.from("vouchers").insert({
              code: voucherCode,
              user_id: user.id,
              class_id: randomClass.id,
            })
          }
        }
      }

      // Send receipt email via API
      await fetch("/api/send-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          className: classItem.title,
          price: classItem.price_rupiah,
          purchaseDate: new Date().toISOString(),
        }),
      })

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed")
    } finally {
      setIsProcessing(false)
    }
  }

  const taxAmount = classItem.price_rupiah * 0.1
  const total = classItem.price_rupiah + taxAmount

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Complete Your Purchase</h2>

          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-600 mb-2">Class</p>
            <p className="font-semibold text-gray-900 mb-4">{classItem.title}</p>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Price</span>
                <span className="font-semibold">{formatPrice(classItem.price_rupiah)}</span>
              </div>
              <div className="flex justify-between mb-4">
                <span className="text-gray-600">Tax (10%)</span>
                <span className="font-semibold">{formatPrice(taxAmount)}</span>
              </div>
              <div className="border-t border-gray-200 pt-4 flex justify-between">
                <span className="font-bold text-lg">Total</span>
                <span className="font-bold text-lg text-blue-600">{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">Bonus:</span> You have a 50% chance to receive a voucher for another
              class! A receipt will be sent to {user.email}
            </p>
          </div>

          {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

          <div className="flex gap-3">
            <Button onClick={onClose} variant="outline" className="flex-1 bg-transparent" disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Pay Now"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
