import type { NextApiRequest, NextApiResponse } from 'next'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'jamiesonjackson52@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { recipientEmail, userName, month, totalSpent, totalBudget, categories } = req.body

  if (!recipientEmail || !month) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const categoryRows = (categories || []).map((cat: { name: string; spent: number; budget: number }) => {
    const pct = cat.budget > 0 ? Math.min(Math.round((cat.spent / cat.budget) * 100), 100) : 0
    const barColour = pct >= 100 ? '#dc2626' : pct >= 85 ? '#d97706' : '#2563eb'
    return `<tr>
      <td style="padding:10px 12px;font-size:14px;color:#1e293b;border-bottom:1px solid #e2e8f0;">${cat.name}</td>
      <td style="padding:10px 12px;font-size:14px;color:#1e293b;border-bottom:1px solid #e2e8f0;text-align:right;">$${cat.spent}</td>
      <td style="padding:10px 12px;font-size:14px;color:#64748b;border-bottom:1px solid #e2e8f0;text-align:right;">$${cat.budget}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">
        <div style="background:#e2e8f0;border-radius:4px;height:8px;width:100%;">
          <div style="background:${barColour};border-radius:4px;height:8px;width:${pct}%;"></div>
        </div>
      </td>
    </tr>`
  }).join('')

  const overUnder = (totalBudget || 0) - (totalSpent || 0)
  const overUnderLabel = overUnder >= 0 ? 'Under budget' : 'Over budget'
  const overUnderColour = overUnder >= 0 ? '#166534' : '#991b1b'
  const overUnderBg = overUnder >= 0 ? '#dcfce7' : '#fee2e2'

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>BudgetPeriscope Report</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background:#1e3a5f;padding:28px 32px;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">BudgetPeriscope</p>
            <p style="margin:6px 0 0;font-size:14px;color:#93c5fd;">Monthly Budget Report - ${month}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px 0;">
            <p style="margin:0;font-size:15px;color:#334155;">Hi${userName ? ' ' + userName : ''},</p>
            <p style="margin:8px 0 0;font-size:15px;color:#334155;">Here is your spending summary for <strong>${month}</strong>.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="32%" style="background:#f1f5f9;border-radius:8px;padding:16px;text-align:center;">
                  <p style="margin:0;font-size:11px;color:#64748b;">TOTAL SPENT</p>
                  <p style="margin:6px 0 0;font-size:22px;font-weight:700;color:#1e293b;">$${totalSpent || 0}</p>
                </td>
                <td width="4%"></td>
                <td width="32%" style="background:#f1f5f9;border-radius:8px;padding:16px;text-align:center;">
                  <p style="margin:0;font-size:11px;color:#64748b;">TOTAL BUDGET</p>
                  <p style="margin:6px 0 0;font-size:22px;font-weight:700;color:#1e293b;">$${totalBudget || 0}</p>
                </td>
                <td width="4%"></td>
                <td width="32%" style="background:${overUnderBg};border-radius:8px;padding:16px;text-align:center;">
                  <p style="margin:0;font-size:11px;color:${overUnderColour};">${overUnderLabel.toUpperCase()}</p>
                  <p style="margin:6px 0 0;font-size:22px;font-weight:700;color:${overUnderColour};">$${Math.abs(overUnder)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">Sent by BudgetPeriscope - budgetperiscope.com</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  try {
    await transporter.sendMail({
      from: 'BudgetPeriscope <jamiesonjackson52@gmail.com>',
      to: recipientEmail,
      subject: `Your BudgetPeriscope Report - ${month}`,
      html,
    })
    return res.status(200).json({ success: true })
  } catch (error: any) {
    console.error('Mail error:', error)
    return res.status(500).json({ error: error.message || 'Failed to send email' })
  }
}
