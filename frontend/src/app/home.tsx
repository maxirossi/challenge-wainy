// app/page.tsx
'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { useState } from 'react'

export default function HomePage() {
  const [progress, setProgress] = useState(0)

  const simulateUpload = () => {
    setProgress(0)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  return (
    <DashboardLayout>
      <h2 className="text-2xl font-semibold mb-4">Home</h2>
      <div className="space-y-4">
        <div>
          <Label htmlFor="file">Upload File</Label>
          <Input id="file" type="file" />
        </div>
        <button
          onClick={simulateUpload}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Upload your txt file
        </button>
        <Progress value={progress} />
      </div>
    </DashboardLayout>
  )
}
