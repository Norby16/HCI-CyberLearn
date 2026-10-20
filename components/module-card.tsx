"use client"

import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { CheckCircle2 } from "lucide-react"

interface ModuleCardProps {
  module: {
    id: string
    title: string
    description: string
    order_index: number
    image_url: string
  }
  isCompleted: boolean
  user: any
}

export function ModuleCard({ module, isCompleted, user }: ModuleCardProps) {
  const router = useRouter()

  const handleClick = () => {
    router.push(`/modules/${module.id}`)
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={handleClick}>
      <div className="relative h-40 bg-gray-200">
        <Image
          src={module.image_url || "/placeholder.svg?height=160&width=300&query=cybersecurity"}
          alt={module.title}
          fill
          className="object-cover"
        />
        <div className="absolute top-2 left-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
          Modul {module.order_index}
        </div>
        {isCompleted && user && (
          <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
            <CheckCircle2 size={20} />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{module.title}</h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{module.description}</p>
        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
          {user ? (isCompleted ? "Lihat Ulang" : "Mulai Belajar") : "Pelajari Lebih Lanjut"}
        </Button>
      </div>
    </Card>
  )
}
