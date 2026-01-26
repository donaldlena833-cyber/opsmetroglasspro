import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { jsPDF } from 'jspdf'
import { format } from 'date-fns'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface LineItem {
  description: string
  qty: number
  unit_price: number
  line_total: number
}

export async function POST(request: NextRequest) {
  try {
    const { invoiceId } = await request.json()

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`*, jobs (job_name, address)`)
      .eq('id', invoiceId)
      .single()

    if (error || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    const contentWidth = pageWidth - margin * 2
    let yPos = margin

    const navyColor = '#1B2B5A'
    const orangeColor = '#F5A623'
    const grayColor = '#6B7280'

    doc.setFontSize(24)
    doc.setTextColor(navyColor)
    doc.setFont('helvetica', 'bold')
    doc.text('MetroGlass', margin, yPos)
    doc.setTextColor(orangeColor)
    doc.text('Pro', margin + 46, yPos)
    
    yPos += 8
    doc.setFontSize(9)
    doc.setTextColor(grayColor)
    doc.setFont('helvetica', 'normal')
    doc.text('Custom Shower Glass Installation', margin, yPos)
    
    yPos += 5
    doc.text('operations@metroglasspro.com', margin, yPos)
    doc.text('Phone: 332-999-3846 | 646-520-5412', margin, yPos + 4)

    doc.setFontSize(28)
    doc.setTextColor(navyColor)
    doc.setFont('helvetica', 'bold')
    doc.text('INVOICE', pageWidth - margin, margin, { align: 'right' })
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`#${invoice.invoice_number}`, pageWidth - margin, margin + 10, { align: 'right' })

    yPos += 20

    doc.setDrawColor(navyColor)
    doc.setLineWidth(0.5)
    doc.line(margin, yPos, pageWidth - margin, yPos)

    yPos += 10

    doc.setFontSize(9)
    doc.setTextColor(grayColor)
    doc.text('Invoice Date', margin, yPos)
    doc.text('Due Date', margin + 50, yPos)
    
    yPos += 5
    doc.setTextColor(navyColor)
    doc.setFont('helvetica', 'bold')
    doc.text(format(new Date(invoice.invoice_date), 'MMM d, yyyy'), margin, yPos)
    doc.text(format(new Date(invoice.due_date), 'MMM d, yyyy'), margin + 50, yPos)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(grayColor)
    doc.text('Bill To', pageWidth - margin - 70, yPos - 5, { align: 'left' })
    
    doc.setTextColor(navyColor)
    doc.setFont('helvetica', 'bold')
    doc.text(invoice.customer_name, pageWidth - margin - 70, yPos)
    
    if (invoice.customer_address) {
      doc.setFont('helvetica', 'normal')
      const addressLines = invoice.customer_address.split('\n')
      addressLines.forEach((line: string, i: number) => {
        doc.text(line, pageWidth - margin - 70, yPos + 5 + (i * 4))
      })
    }

    yPos += 25

    doc.setFillColor(27, 43, 90)
    doc.rect(margin, yPos, contentWidth, 8, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Description', margin + 3, yPos + 5.5)
    doc.text('Qty', margin + 100, yPos + 5.5)
    doc.text('Price', margin + 120, yPos + 5.5)
    doc.text('Amount', pageWidth - margin - 3, yPos + 5.5, { align: 'right' })

    yPos += 12

    const lineItems = invoice.line_items_json as LineItem[]
    doc.setTextColor(navyColor)
    doc.setFont('helvetica', 'normal')
    
    lineItems.forEach((item, index) => {
      if (index % 2 === 0) {
        doc.setFillColor(247, 241, 230)
        doc.rect(margin, yPos - 4, contentWidth, 8, 'F')
      }
      
      doc.text(item.description.substring(0, 50), margin + 3, yPos)
      doc.text(item.qty.toString(), margin + 100, yPos)
      doc.text(`$${item.unit_price.toFixed(2)}`, margin + 120, yPos)
      doc.text(`$${item.line_total.toFixed(2)}`, pageWidth - margin - 3, yPos, { align: 'right' })
      
      yPos += 8
    })

    yPos += 5

    const totalsX = pageWidth - margin - 60
    
    doc.setDrawColor(200, 200, 200)
    doc.line(totalsX, yPos, pageWidth - margin, yPos)
    yPos += 6

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(grayColor)
    doc.text('Subtotal', totalsX, yPos)
    doc.setTextColor(navyColor)
    doc.text(`$${Number(invoice.subtotal).toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' })
    yPos += 6

    if (invoice.discount_applied && invoice.discount_amount > 0) {
      doc.setTextColor(grayColor)
      doc.text(`Discount (${invoice.discount_percent}%)`, totalsX, yPos)
      doc.setTextColor('#DC2626')
      doc.text(`-$${Number(invoice.discount_amount).toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' })
      yPos += 6
    }

    if (invoice.tax_applied && invoice.tax > 0) {
      doc.setTextColor(grayColor)
      doc.text(`Tax (${invoice.tax_rate}%)`, totalsX, yPos)
      doc.setTextColor(navyColor)
      doc.text(`$${Number(invoice.tax).toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' })
      yPos += 6
    }

    doc.setDrawColor(navyColor)
    doc.line(totalsX, yPos, pageWidth - margin, yPos)
    yPos += 8
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(navyColor)
    doc.text('TOTAL', totalsX, yPos)
    doc.text(`$${Number(invoice.total).toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' })

    yPos += 20

    if (invoice.notes) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(grayColor)
      doc.text('Notes', margin, yPos)
      yPos += 5
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(navyColor)
      
      const noteLines = doc.splitTextToSize(invoice.notes, contentWidth)
      doc.text(noteLines, margin, yPos)
    }

    const footerY = doc.internal.pageSize.getHeight() - 15
    doc.setFontSize(8)
    doc.setTextColor(grayColor)
    doc.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' })
    doc.text('MetroGlass Pro Inc • NYC/NJ/CT', pageWidth / 2, footerY + 4, { align: 'center' })

    const pdfBuffer = doc.output('arraybuffer')

    const fileName = `invoice_${invoice.invoice_number}_${Date.now()}.pdf`
    const { error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload PDF' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from('invoices')
      .getPublicUrl(fileName)

    await supabase
      .from('invoices')
      .update({ pdf_url: publicUrl })
      .eq('id', invoiceId)

    return NextResponse.json({ success: true, pdfUrl: publicUrl })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}
