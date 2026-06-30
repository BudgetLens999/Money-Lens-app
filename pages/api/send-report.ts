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

  const { recipientEmail, userName, month, totalSpent, totalBudget, categories, fixedItems, overBudget } = req.body

  if (!recipientEmail || !month) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const overUnder = (totalBudget || 0) - (totalSpent || 0)
  const overUnderLabel = overUnder >= 0 ? 'Under budget' : 'Over budget'
  const overUnderColour = overUnder >= 0 ? '#166534' : '#991b1b'
  const overUnderBg = overUnder >= 0 ? '#dcfce7' : '#fee2e2'

  const overBudgetBanner = overBudget && overBudget.length > 0 ? `
    <tr>
      <td style="padding:0 32px 20px;">
        <div style="background:#fee2e2;border-left:4px solid #dc2626;border-radius:6px;padding:12px 16px;">
          <p style="margin:0;font-size:13px;color:#991b1b;"><strong>Over budget this month:</strong> ${overBudget.join(', ')}</p>
        </div>
      </td>
    </tr>` : ''

  const categoryRows = (categories || []).map((cat: { name: string; spent: number; budget: number }) => {
    const pct = cat.budget > 0 ? Math.min(Math.round((cat.spent / cat.budget) * 100), 100) : 0
    const barColour = pct >= 100 ? '#dc2626' : pct >= 85 ? '#d97706' : '#2563eb'
    const remaining = cat.budget - cat.spent
    const remainingStr = remaining >= 0 ? `$${remaining.toFixed(0)} left` : `$${Math.abs(remaining).toFixed(0)} over`
    const remainingColour = remaining >= 0 ? '#166534' : '#991b1b'
    return `<tr>
      <td style="padding:8px 12px;font-size:13px;color:#1e293b;border-bottom:1px solid #e2e8f0;">${cat.name}</td>
      <td style="padding:8px 12px;font-size:13px;color:#1e293b;border-bottom:1px solid #e2e8f0;text-align:right;">${cat.spent > 0 ? '$' + cat.spent.toLocaleString() : '-'}</td>
      <td style="padding:8px 12px;font-size:13px;color:#64748b;border-bottom:1px solid #e2e8f0;text-align:right;">${cat.budget > 0 ? '$' + cat.budget.toLocaleString() : '-'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;min-width:100px;">
        <div style="background:#e2e8f0;border-radius:4px;height:6px;width:100%;">
          <div style="background:${barColour};border-radius:4px;height:6px;width:${pct}%;"></div>
        </div>
      </td>
      <td style="padding:8px 12px;font-size:12px;color:${remainingColour};border-bottom:1px solid #e2e8f0;text-align:right;">${remainingStr}</td>
    </tr>`
  }).join('')

  const fixedRows = (fixedItems || []).map((f: { name: string; amount: number; paid: boolean }) => {
    return `<tr>
      <td style="padding:8px 12px;font-size:13px;color:#1e293b;border-bottom:1px solid #e2e8f0;">${f.name}</td>
      <td style="padding:8px 12px;font-size:13px;color:#1e293b;border-bottom:1px solid #e2e8f0;text-align:right;">$${f.amount.toLocaleString()}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">
        ${f.paid
          ? '<span style="background:#dcfce7;color:#166534;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;">Paid</span>'
          : '<span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;">Unpaid</span>'
        }
      </td>
    </tr>`
  }).join('')

  const totalFixed = (fixedItems || []).reduce((s: number, f: { amount: number }) => s + f.amount, 0)

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
          <td style="padding:24px 32px 16px;">
            <p style="margin:0;font-size:15px;color:#334155;">Hi${userName ? ' ' + userName : ''},</p>
            <p style="margin:8px 0 0;font-size:15px;color:#334155;">Here is your spending summary for <strong>${month}</strong>.</p>
          </td>
        </tr>

        <tr>
          <td style="padding:0 32px 20px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="32%" style="background:#f1f5f9;border-radius:8px;padding:14px;text-align:center;">
                  <p style="margin:0;font-size:11px;color:#64748b;">TOTAL SPENT</p>
                  <p style="margin:6px 0 0;font-size:20px;font-weight:700;color:#1e293b;">$${(totalSpent||0).toLocaleString()}</p>
                </td>
                <td width="4%"></td>
                <td width="32%" style="background:#f1f5f9;border-radius:8px;padding:14px;text-align:center;">
                  <p style="margin:0;font-size:11px;color:#64748b;">TOTAL BUDGET</p>
                  <p style="margin:6px 0 0;font-size:20px;font-weight:700;color:#1e293b;">$${(totalBudget||0).toLocaleString()}</p>
                </td>
                <td width="4%"></td>
                <td width="32%" style="background:${overUnderBg};border-radius:8px;padding:14px;text-align:center;">
                  <p style="margin:0;font-size:11px;color:${overUnderColour};">${overUnderLabel.toUpperCase()}</p>
                  <p style="margin:6px 0 0;font-size:20px;font-weight:700;color:${overUnderColour};">$${Math.abs(overUnder).toLocaleString()}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        ${overBudgetBanner}

        <tr>
          <td style="padding:0 32px 24px;">
            <p style="margin:0 0 10px;font-size:15px;font-weight:600;color:#1e293b;">Variable spending - ${month}</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
              <thead>
                <tr style="background:#f8fafc;">
                  <th style="padding:8px 12px;font-size:11px;color:#64748b;text-align:left;border-bottom:1px solid #e2e8f0;">Category</th>
                  <th style="padding:8px 12px;font-size:11px;color:#64748b;text-align:right;border-bottom:1px solid #e2e8f0;">Actual</th>
                  <th style="padding:8px 12px;font-size:11px;color:#64748b;text-align:right;border-bottom:1px solid #e2e8f0;">Target</th>
                  <th style="padding:8px 12px;font-size:11px;color:#64748b;border-bottom:1px solid #e2e8f0;">Progress</th>
                  <th style="padding:8px 12px;font-size:11px;color:#64748b;text-align:right;border-bottom:1px solid #e2e8f0;">Remaining</th>
                </tr>
              </thead>
              <tbody>${categoryRows}</tbody>
            </table>
          </td>
        </tr>

        ${fixedRows ? `
        <tr>
          <td style="padding:0 32px 28px;">
            <p style="margin:0 0 10px;font-size:15px;font-weight:600;color:#1e293b;">Fixed costs - ${month}</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
              <thead>
                <tr style="background:#f8fafc;">
                  <th style="padding:8px 12px;font-size:11px;color:#64748b;text-align:left;border-bottom:1px solid #e2e8f0;">Item</th>
                  <th style="padding:8px 12px;font-size:11px;color:#64748b;text-align:right;border-bottom:1px solid #e2e8f0;">Amount</th>
                  <th style="padding:8px 12px;font-size:11px;color:#64748b;border-bottom:1px solid #e2e8f0;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${fixedRows}
                <tr style="background:#f8fafc;">
                  <td style="padding:8px 12px;font-size:13px;font-weight:600;color:#1e293b;">Total fixed</td>
                  <td style="padding:8px 12px;font-size:13px;font-weight:600;color:#1e293b;text-align:right;">$${totalFixed.toLocaleString()}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>` : ''}

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
