'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Mail, UserCheck } from 'lucide-react'

interface InvitationDetails {
  id: number
  email: string
  role: string
  organization: {
    id: number
    name: string
  }
  invitedBy: {
    name: string
    email: string
  }
  expiresAt: string
}

export default function AcceptInvitationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [invitation, setInvitation] = useState<InvitationDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('No invitation token provided')
      setLoading(false)
      return
    }

    fetchInvitation()
  }, [token])

  const fetchInvitation = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/invitations/token/${token}`)
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Invalid invitation')
      }

      setInvitation(data.data)
    } catch (err: any) {
      setError(err.message || 'Failed to load invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    if (!invitation) return

    setProcessing(true)
    setError('')

    try {
      const response = await fetch(`/api/invitations/${invitation.id}/accept`, {
        method: 'POST',
        credentials: 'include',
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to accept invitation')
      }

      setSuccess(true)
      
      // Redirect to signup page with pre-filled data
      setTimeout(() => {
        router.push(
          `/signup?token=${token}&email=${encodeURIComponent(invitation.email)}`
        )
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation')
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!invitation) return
    if (!confirm('Are you sure you want to reject this invitation?')) return

    setProcessing(true)
    setError('')

    try {
      const response = await fetch(`/api/invitations/${invitation.id}/reject`, {
        method: 'POST',
        credentials: 'include',
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to reject invitation')
      }

      setSuccess(true)
      
      // Redirect to login
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to reject invitation')
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="py-8">
            <p className="text-center text-gray-500">Loading invitation...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-4 text-red-600">
              <AlertCircle className="h-12 w-12" />
              <p className="text-center font-medium">{error}</p>
              <Button onClick={() => router.push('/login')} variant="outline">
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-4 text-green-600">
              <CheckCircle className="h-12 w-12" />
              <p className="text-center font-medium">
                Invitation accepted! Redirecting...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle>You're Invited!</CardTitle>
          <CardDescription>
            You've been invited to join an organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {invitation && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Organization:</span>
                <span className="font-medium">{invitation.organization.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Role:</span>
                <span className="font-medium capitalize">{invitation.role}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Email:</span>
                <span className="font-medium">{invitation.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Invited by:</span>
                <span className="font-medium">{invitation.invitedBy.name}</span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Button
              className="w-full"
              onClick={handleAccept}
              disabled={processing}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              {processing ? 'Processing...' : 'Accept & Create Account'}
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={handleReject}
              disabled={processing}
            >
              Decline Invitation
            </Button>
          </div>

          <p className="text-xs text-center text-gray-500">
            This invitation will expire in{' '}
            {invitation &&
              new Date(invitation.expiresAt).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
