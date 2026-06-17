import EmailReportModal from '../components/EmailReportModal';

<EmailReportModal
  month="June 2026"
  totalSpent={totalSpent}
  totalBudget={totalBudget}
  categories={categoryArray}   // [{ name, spent, budget }]
  userName={user?.name}        // optional
/>
