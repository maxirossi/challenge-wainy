// app/about/page.tsx
import DashboardLayout from '@/components/layout/DashboardLayout'

export default function AboutPage() {
  return (
    <DashboardLayout>
      <h2 className="text-2xl font-semibold mb-4">About</h2>
      <p className="text-gray-700">This is the About section of your dashboard.</p>
    </DashboardLayout>
  )
}
