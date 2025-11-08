'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Bell, Check, X, Mail, Building2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Invitation {
  id: number
  email: string
  role: string
  expiresAt: string
  createdAt: string
  organization: {
    id: number
    name: string
  }
  invitedBy: {
    id: number
    name: string
    email: string
  }
}

export function InvitationNotifications() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState<number | null>(null)

  useEffect(() => {
    fetchInvitations()
  }, [])

  const fetchInvitations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/invitations/my-invitations', {
        credentials: 'include',
      })
      const data = await response.json()

      if (response.ok && data.success) {
        setInvitations(data.data.invitations || [])
      } else {
        setError(data.error || 'Failed to load invitations')
      }
    } catch (err: any) {
      setError('Failed to load invitations')
      console.error('Fetch invitations error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (invitationId: number) => {
    setProcessing(invitationId)
    setError('')

    try {
      const response = await fetch(`/api/invitations/${invitationId}/accept-member`, {
        method: 'POST',
        credentials: 'include',
      })
      const data = await response.json()

      if (response.ok && data.success) {
        // Reload page to update user session with new organization
        window.location.href = '/dashboard/member?message=invitation_accepted'
      } else {
        setError(data.error || 'Failed to accept invitation')
        setProcessing(null)
      }
    } catch (err: any) {
      setError('Failed to accept invitation')
      setProcessing(null)
      console.error('Accept invitation error:', err)
    }
  }

  const handleReject = async (invitationId: number) => {
    if (!confirm('Are you sure you want to decline this invitation?')) return

    setProcessing(invitationId)
    setError('')

    try {
      const response = await fetch(`/api/invitations/${invitationId}/reject-member`, {
        method: 'POST',
        credentials: 'include',
      })
      const data = await response.json()

      if (response.ok && data.success) {
        // Remove from list
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId))
      } else {
        setError(data.error || 'Failed to reject invitation')
      }
    } catch (err: any) {
      setError('Failed to reject invitation')
      console.error('Reject invitation error:', err)
    } finally {
      setProcessing(null)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800'
      case 'manager':
        return 'bg-blue-100 text-blue-800'
      case 'finance':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-gray-500">Loading invitations...</p>
        </CardContent>
      </Card>
    )
  }

  if (invitations.length === 0) {
    return null // Don't show card if no invitations
  }

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Mail className="h-5 w-5" />
          Organization Invitations
        </CardTitle>
        <CardDescription className="text-blue-700">
          You have {invitations.length} pending invitation{invitations.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-start gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {invitations.map((invitation) => (
          <div
            key={invitation.id}
            className="bg-white border border-blue-200 rounded-lg p-4 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">
                    {invitation.organization.name}
                  </h3>
                </div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{invitation.invitedBy.name}</span> has invited
                  you to join as{' '}
                  <Badge className={getRoleBadgeColor(invitation.role)}>
                    {invitation.role}
                  </Badge>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Invited {formatDistanceToNow(new Date(invitation.createdAt), { addSuffix: true })}
                  {' • '}
                  Expires {formatDistanceToNow(new Date(invitation.expiresAt), { addSuffix: true })}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleAccept(invitation.id)}
                disabled={processing !== null}
                className="flex-1"
              >
                {processing === invitation.id ? (
                  'Accepting...'
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Accept
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleReject(invitation.id)}
                disabled={processing !== null}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-1" />
                Decline
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
