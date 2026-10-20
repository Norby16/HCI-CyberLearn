import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, className, price, purchaseDate } = await request.json()

    // Format the receipt email
    const receiptHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Cyberlearn Purchase Receipt</h2>
        <p>Thank you for your purchase!</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Order Details</h3>
          <p><strong>Class:</strong> ${className}</p>
          <p><strong>Price:</strong> Rp${price.toLocaleString("id-ID")}</p>
          <p><strong>Purchase Date:</strong> ${new Date(purchaseDate).toLocaleDateString("id-ID")}</p>
          <p><strong>Status:</strong> <span style="color: #16a34a; font-weight: bold;">Completed</span></p>
        </div>
        
        <p>You now have access to this class. Log in to your Cyberlearn account to start learning!</p>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This is an automated email. Please do not reply to this message.
        </p>
      </div>
    `

    // Log the receipt (in production, integrate with email service like SendGrid, Resend, etc.)
    console.log(`[Receipt Email] Sent to ${email}:`, {
      className,
      price,
      purchaseDate,
    })

    // For now, we'll just return success
    // In production, you would integrate with an email service
    return NextResponse.json({
      success: true,
      message: "Receipt sent successfully",
    })
  } catch (error) {
    console.error("Error sending receipt:", error)
    return NextResponse.json({ error: "Failed to send receipt" }, { status: 500 })
  }
}
