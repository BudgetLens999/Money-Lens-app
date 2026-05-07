import Head from 'next/head'
import Link from 'next/link'

export default function Home() {
  return (
    <>
      <Head>
        <title>MoneyLens — See exactly where your money goes</title>
        <meta name="description" content="AI-powered personal finance tracking. Upload your bank CSV, get instant insights, and take control of your spending." />
      </Head>

      <div className="min-h-screen bg-stone-50">
        {/* Nav */}
        <nav className="bg-white border-b border-stone-200 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
            <span className="font-serif text-xl text-stone-900">
              Money<span className="text-amber-700 italic">Lens</span>
            </span>
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm text-stone-600 hover:text-stone-900 font-medium">
                Sign in
              </Link>
              <Link href="/signup" className="btn-primary text-sm py-2 px-4">
                Start free trial
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5 text-sm text-amber-800 font-medium mb-6">
            30-day free trial · No credit card required
          </div>
          <h1 className="text-5xl font-serif font-medium text-stone-900 leading-tight mb-5">
            A clear lens into<br />your finances
          </h1>
          <p className="text-xl text-stone-500 max-w-2xl mx-auto mb-8 leading-relaxed">
            Upload your bank CSV, get instant spending insights, track budgets by category, 
            and let AI find where you can save — all in one beautifully simple dashboard.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/signup" className="btn-primary text-base py-3 px-8">
              Start your free month →
            </Link>
            <span className="text-stone-400 text-sm">then $20/mo · cancel anytime</span>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-5xl mx-auto px-6 pb-20">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: '📊',
                title: 'Instant budget reports',
                desc: 'Drop your CSV — see this week, this month, last month, or your full history in seconds. Drill into any category to see every transaction.',
              },
              {
                icon: '🤖',
                title: 'AI spending analysis',
                desc: 'Claude AI reads your spending patterns and gives personalized recommendations — where to cut, what looks unusual, and how to hit your goals.',
              },
              {
                icon: '🔗',
                title: 'Any bank, any format',
                desc: 'Works with Neontra, RBC, TD, Scotiabank, CIBC, BMO, or any CSV export. Drop multiple files at once to see your complete financial picture.',
              },
            ].map(f => (
              <div key={f.title} className="card p-6">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-stone-900 mb-2">{f.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-white border-t border-stone-100 py-20">
          <div className="max-w-md mx-auto px-6 text-center">
            <h2 className="text-3xl font-serif text-stone-900 mb-2">Simple pricing</h2>
            <p className="text-stone-500 mb-8">One plan. Everything included.</p>
            <div className="card p-8 text-left">
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-bold text-stone-900">$20</span>
                <span className="text-stone-500 mb-1">/month USD</span>
              </div>
              <p className="text-amber-700 font-medium text-sm mb-6">First 30 days completely free</p>
              <ul className="space-y-3 text-sm text-stone-600 mb-8">
                {[
                  'Unlimited CSV uploads',
                  'Budget tracking across all categories',
                  'AI spending analysis (powered by Claude)',
                  'Custom categories with merchant memory',
                  'Weekly email reports',
                  'Multi-bank support',
                  'Cancel anytime',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="btn-primary w-full text-center block text-sm py-3">
                Start free trial — no card needed
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-stone-200 py-8 text-center text-stone-400 text-sm">
          <p>© 2026 MoneyLens · Freedom Capital · <Link href="/privacy" className="hover:text-stone-600">Privacy</Link> · <Link href="/terms" className="hover:text-stone-600">Terms</Link></p>
        </footer>
      </div>
    </>
  )
}
