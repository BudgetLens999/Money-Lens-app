// components/EmailReportModal.tsx
import { useState } from 'react';

type Category = {
  name: string;
  spent: number;
  budget: number;
};

type Props = {
  month: string;
  totalSpent: number;
  totalBudget: number;
  categories: Category[];
  userName?: string;
};

export default function EmailReportModal({
  month,
  totalSpent,
  totalBudget,
  categories,
  userName,
}: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSend = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    setStatus('sending');
    setErrorMsg('');

    try {
      const res = await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: email,
          userName,
          month,
          totalSpent,
          totalBudget,
          categories,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setStatus('error');
        setErrorMsg(data.error || 'Something went wrong. Please try again.');
      } else {
        setStatus('sent');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Network error. Please try again.');
    }
  };

  const handleClose = () => {
    setOpen(false);
    setStatus('idle');
    setEmail('');
    setErrorMsg('');
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          background: '#1e3a5f',
          color: '#ffffff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        ✉️ Email Report
      </button>

      {open && (
        <div
          onClick={handleClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '32px',
              width: '100%',
              maxWidth: '440px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
            }}
          >
            {status === 'sent' ? (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <p style={{ fontSize: '40px', margin: '0 0 12px' }}>✅</p>
                <p style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
                  Report sent!
                </p>
                <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#64748b' }}>
                  Check <strong>{email}</strong> — it should arrive within a minute.
                </p>
                <button
                  onClick={handleClose}
                  style={{
                    padding: '10px 24px',
                    background: '#1e3a5f',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '20px' }}>
