"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Image from "next/image"

export function ClassCard({ classItem, isPurchased, onPurchase, onRedeemVoucher }) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48 bg-gray-200">
        <Image
          src={classItem.image_url || "/placeholder.svg?height=200&width=300"}
          alt={classItem.title}
          fill
          className="object-cover"
        />
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-bold text-gray-900 flex-1">{classItem.title}</h3>
          {isPurchased && (
            <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full ml-2">
              Purchased
            </span>
          )}
        </div>

        <p className="text-gray-600 text-sm mb-4">{classItem.description}</p>

        <div className="space-y-2 mb-4 text-sm text-gray-600">
          <p>
            <span className="font-semibold">Instructor:</span> {classItem.instructor}
          </p>
          <p>
            <span className="font-semibold">Duration:</span> {classItem.duration}
          </p>
          <p>
            <span className="font-semibold">Level:</span> {classItem.level}
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <span className="text-2xl font-bold text-blue-600">{formatPrice(classItem.price_rupiah)}</span>
          <div className="flex gap-2">
            {isPurchased ? (
              <Button disabled className="bg-gray-300 text-gray-600">
                Enrolled
              </Button>
            ) : (
              <>
                <Button onClick={onPurchase} className="bg-blue-600 hover:bg-blue-700 text-white flex-1">
                  Enroll Now
                </Button>
                <Button
                  onClick={onRedeemVoucher}
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 bg-transparent"
                >
                  Use Voucher
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
