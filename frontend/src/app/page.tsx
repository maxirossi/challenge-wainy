'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { useRef, useState } from 'react'

export default function HomePage() {
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0]

    if (!file) {
      setMessage('Please select a file.')
      return
    }

    if (!file.name.endsWith('.txt')) {
      setMessage('Only .txt files are allowed.')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      setProgress(0)
      setMessage('Uploading...')

      const xhr = new XMLHttpRequest()
      xhr.open('POST', 'http://localhost:3000/upload')

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded * 100) / event.total)
          setProgress(percent)
        }
      }

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText)
          if (response.success) {
            setMessage('✅ File uploaded successfully.')
          } else {
            setMessage('❌ Upload failed: ' + (response.error || 'Unknown error'))
          }
        } else {
          setMessage('❌ Upload failed. Server error.')
        }
      }

      xhr.onerror = () => {
        setMessage('❌ Upload failed. Network error.')
      }

      xhr.send(formData)
    } catch (err) {
      setMessage('❌ Upload failed. Unexpected error.')
    }
  }

  return (
    <DashboardLayout>
      <h2 className="text-2xl font-semibold mb-4">Upload TXT File</h2>
      <div className="space-y-4">
        <div>
          <Label htmlFor="file">Select a .txt file</Label>
          <Input
            id="file"
            type="file"
            accept=".txt"
            ref={fileInputRef}
          />
        </div>
        <button
          onClick={handleUpload}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Upload
        </button>
        {progress > 0 && <Progress value={progress} />}
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    </DashboardLayout>
  )
}
