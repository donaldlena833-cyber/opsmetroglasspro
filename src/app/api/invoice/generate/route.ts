import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { jsPDF } from 'jspdf'
import { format } from 'date-fns'
import { getServiceSupabaseEnv } from '@/lib/env'
import { buildJobInvoiceDescription } from '@/lib/invoice-builder'

interface LineItem {
  description: string
  qty: number
  unit_price: number
  line_total: number
}

function formatMoney(value: number) {
  return `$${Number(value).toFixed(2)}`
}

export async function POST(request: NextRequest) {
  try {
    const { url: supabaseUrl, serviceRoleKey: supabaseServiceKey } = getServiceSupabaseEnv()
    const { invoiceId } = await request.json()

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        jobs (
          job_name,
          address,
          scope_of_work,
          configuration,
          dimensions,
          glass_type,
          glass_thickness,
          hardware_finish
        )
      `)
      .eq('id', invoiceId)
      .single()

    if (error || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 16
    const contentWidth = pageWidth - margin * 2

    const charcoal = '#2D2926'
    const cream = '#F7F2EA'
    const bronze = '#B88A52'
    const sand = '#E9DECF'
    const muted = '#70665D'

    let yPos = 0

    const ensureSpace = (height: number) => {
      if (yPos + height <= pageHeight - 18) return
      doc.addPage()
      yPos = margin
    }

    const drawInfoCard = (x: number, y: number, width: number, title: string, lines: string[]) => {
      doc.setFillColor(247, 242, 234)
      doc.roundedRect(x, y, width, 30, 4, 4, 'F')
      doc.setDrawColor(233, 222, 207)
      doc.roundedRect(x, y, width, 30, 4, 4, 'S')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(bronze)
      doc.text(title.toUpperCase(), x + 4, y + 6)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(charcoal)

      let lineY = y + 12
      lines.forEach((line) => {
        if (!line) return
        const wrapped = doc.splitTextToSize(line, width - 8)
        doc.text(wrapped, x + 4, lineY)
        lineY += wrapped.length * 4.2
      })
    }

    const headerHeight = 48
    doc.setFillColor(247, 242, 234)
    doc.rect(0, 0, pageWidth, headerHeight, 'F')
    doc.setDrawColor(184, 138, 82)
    doc.setLineWidth(0.7)
    doc.line(0, headerHeight, pageWidth, headerHeight)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(24)
    doc.setTextColor(charcoal)
    doc.text('MetroGlass Pro', margin, 18)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(muted)
    doc.text('Custom shower glass installations', margin, 24)
    doc.text('operations@metroglasspro.com', margin, 29)
    doc.text('332-999-3846 • 646-520-5412', margin, 34)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(28)
    doc.setTextColor(charcoal)
    doc.text('INVOICE', pageWidth - margin, 18, { align: 'right' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(bronze)
    doc.text(`#${invoice.invoice_number}`, pageWidth - margin, 25, { align: 'right' })
    doc.setTextColor(muted)
    doc.text(`Created ${format(new Date(invoice.invoice_date), 'MMM d, yyyy')}`, pageWidth - margin, 31, { align: 'right' })

    yPos = headerHeight + 10

    const job = Array.isArray(invoice.jobs) ? invoice.jobs[0] : invoice.jobs
    const projectSummary = job ? buildJobInvoiceDescription(job) : null

    drawInfoCard(margin, yPos, 88, 'Bill To', [
      invoice.customer_name,
      invoice.customer_address || '',
    ])

    drawInfoCard(pageWidth - margin - 88, yPos, 88, 'Invoice Details', [
      `Invoice Date: ${format(new Date(invoice.invoice_date), 'MMM d, yyyy')}`,
      `Due Date: ${format(new Date(invoice.due_date), 'MMM d, yyyy')}`,
      job?.job_name ? `Project: ${job.job_name}` : '',
    ])

    yPos += 38

    if (projectSummary || job?.address) {
      ensureSpace(24)
      doc.setFillColor(255, 255, 255)
      doc.roundedRect(margin, yPos, contentWidth, 22, 4, 4, 'F')
      doc.setDrawColor(233, 222, 207)
      doc.roundedRect(margin, yPos, contentWidth, 22, 4, 4, 'S')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(bronze)
      doc.text('PROJECT SUMMARY', margin + 4, yPos + 6)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(charcoal)
      const summaryLines = [
        projectSummary || '',
        job?.address ? `Site Address: ${job.address}` : '',
      ].filter(Boolean)
      doc.text(doc.splitTextToSize(summaryLines.join(' • '), contentWidth - 8), margin + 4, yPos + 12)
      yPos += 28
    }

    const lineItems = invoice.line_items_json as LineItem[]

    ensureSpace(16)
    doc.setFillColor(45, 41, 38)
    doc.roundedRect(margin, yPos, contentWidth, 10, 3, 3, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(247, 242, 234)
    doc.text('Description', margin + 4, yPos + 6.5)
    doc.text('Qty', margin + 110, yPos + 6.5)
    doc.text('Unit', margin + 130, yPos + 6.5)
    doc.text('Amount', pageWidth - margin - 4, yPos + 6.5, { align: 'right' })
    yPos += 12

    lineItems.forEach((item, index) => {
      const descLines = doc.splitTextToSize(item.description, 100)
      const rowHeight = Math.max(10, descLines.length * 4.5 + 4)
      ensureSpace(rowHeight + 2)

      if (index % 2 === 0) {
        doc.setFillColor(247, 242, 234)
        doc.roundedRect(margin, yPos - 2, contentWidth, rowHeight, 2, 2, 'F')
      }

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(charcoal)
      doc.text(descLines, margin + 4, yPos + 2)
      doc.text(String(item.qty), margin + 112, yPos + 2)
      doc.text(formatMoney(item.unit_price), margin + 130, yPos + 2)
      doc.text(formatMoney(item.line_total), pageWidth - margin - 4, yPos + 2, { align: 'right' })
      yPos += rowHeight + 2
    })

    ensureSpace(46)
    const totalsX = pageWidth - margin - 64
    doc.setFillColor(247, 242, 234)
    doc.roundedRect(totalsX, yPos + 2, 64, 34, 4, 4, 'F')
    doc.setDrawColor(233, 222, 207)
    doc.roundedRect(totalsX, yPos + 2, 64, 34, 4, 4, 'S')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(muted)
    doc.text('Subtotal', totalsX + 4, yPos + 10)
    doc.setTextColor(charcoal)
    doc.text(formatMoney(Number(invoice.subtotal)), totalsX + 60, yPos + 10, { align: 'right' })

    let totalsLineY = yPos + 16
    if (invoice.discount_applied && Number(invoice.discount_amount) > 0) {
      doc.setTextColor(muted)
      doc.text(`Discount (${invoice.discount_percent}%)`, totalsX + 4, totalsLineY)
      doc.setTextColor('#B42318')
      doc.text(`-${formatMoney(Number(invoice.discount_amount))}`, totalsX + 60, totalsLineY, { align: 'right' })
      totalsLineY += 6
    }

    if (invoice.tax_applied && Number(invoice.tax) > 0) {
      doc.setTextColor(muted)
      doc.text(`Tax (${invoice.tax_rate}%)`, totalsX + 4, totalsLineY)
      doc.setTextColor(charcoal)
      doc.text(formatMoney(Number(invoice.tax)), totalsX + 60, totalsLineY, { align: 'right' })
      totalsLineY += 6
    }

    doc.setDrawColor(184, 138, 82)
    doc.line(totalsX + 4, totalsLineY + 1, totalsX + 60, totalsLineY + 1)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(charcoal)
    doc.text('TOTAL', totalsX + 4, totalsLineY + 7)
    doc.text(formatMoney(Number(invoice.total)), totalsX + 60, totalsLineY + 7, { align: 'right' })

    yPos = Math.max(yPos + 4, totalsLineY + 14)

    const notesBlocks = [
      invoice.notes ? { title: 'Notes & Terms', body: invoice.notes } : null,
      job?.scope_of_work ? { title: 'Scope of Work', body: job.scope_of_work } : null,
    ].filter(Boolean) as { title: string; body: string }[]

    notesBlocks.forEach((block) => {
      const wrapped = doc.splitTextToSize(block.body, contentWidth - 8)
      const blockHeight = Math.max(18, wrapped.length * 4.5 + 10)
      ensureSpace(blockHeight + 4)

      doc.setFillColor(255, 255, 255)
      doc.roundedRect(margin, yPos, contentWidth, blockHeight, 4, 4, 'F')
      doc.setDrawColor(233, 222, 207)
      doc.roundedRect(margin, yPos, contentWidth, blockHeight, 4, 4, 'S')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(bronze)
      doc.text(block.title.toUpperCase(), margin + 4, yPos + 6)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(charcoal)
      doc.text(wrapped, margin + 4, yPos + 12)

      yPos += blockHeight + 4
    })

    const footerY = pageHeight - 14
    doc.setDrawColor(233, 222, 207)
    doc.line(margin, footerY - 6, pageWidth - margin, footerY - 6)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(muted)
    doc.text('MetroGlass Pro Inc • NYC / NJ / CT', margin, footerY)
    doc.text('Thank you for your business.', pageWidth - margin, footerY, { align: 'right' })

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

    const {
      data: { publicUrl },
    } = supabase.storage.from('invoices').getPublicUrl(fileName)

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
