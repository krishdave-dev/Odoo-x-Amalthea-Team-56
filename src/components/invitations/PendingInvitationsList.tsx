'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Mail, Trash2, UserCheck, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Invitation {
  id: number
  email: string
  role: string
  status: string
  token: string
  expiresAt: string
  createdAt: string
  invitedBy: {
    name: string
    email: string
  }
}

export function PendingInvitationsList() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchInvitations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/invitations', {
        credentials: 'include',
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch invitations')
      }

      setInvitations(data.data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load invitations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvitations()
  }, [])

  const handleRevoke = async (id: number) => {
    if (!confirm('Are you sure you want to revoke this invitation?')) return

    try {
      const response = await fetch(`/api/invitations/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to revoke invitation')
      }

      await fetchInvitations()
    } catch (err: any) {
      alert(err.message || 'Failed to revoke invitation')
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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'accepted':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'expired':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date()

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-gray-500">Loading invitations...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const pendingInvitations = invitations.filter((inv) => inv.status === 'pending')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Pending Invitations
        </CardTitle>
        <CardDescription>
          Users you've invited to join your organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pendingInvitations.length === 0 ? (
          <p className="text-center text-gray-500 py-4">
            No pending invitations
          </p>
        ) : (
          <div className="space-y-3">
            {pendingInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-medium">{invitation.email}</p>
                    <Badge className={getRoleBadgeColor(invitation.role)}>
                      {invitation.role}
                    </Badge>
                    {isExpired(invitation.expiresAt) && (
                      <Badge className="bg-red-100 text-red-800">
                        <Clock className="h-3 w-3 mr-1" />
                        Expired
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    Invited by {invitation.invitedBy.name} •{' '}
                    {formatDistanceToNow(new Date(invitation.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                  {!isExpired(invitation.expiresAt) && (
                    <p className="text-xs text-gray-500 mt-1">
                      Expires{' '}
                      {formatDistanceToNow(new Date(invitation.expiresAt), {
                        addSuffix: true,
                      })}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRevoke(invitation.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
