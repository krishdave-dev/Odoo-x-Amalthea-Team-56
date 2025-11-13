"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FinanceManagement } from "@/components/finance/FinanceManagement";
import { HourlyRateManager } from "@/components/settings/HourlyRateManager";
import { Building2, Shield, User, DollarSign } from "lucide-react";

export function SettingsPage() {
  const { user } = useAuth();

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'finance':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canManageFinance = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'finance';

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[#0A1931]">Settings</h1>
        <p className="mt-2 text-[#4A7FA7]">Manage your account, organization, and finance</p>
      </div>

      <div className="grid gap-6">
        {/* User Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#0A1931]">
              <User className="h-5 w-5" />
              User Profile
            </CardTitle>
            <CardDescription className="text-[#4A7FA7]">Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[#4A7FA7] mb-1">Name</p>
                <p className="font-medium text-[#0A1931]">{user?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-[#4A7FA7] mb-1">Email</p>
                <p className="font-medium text-[#0A1931]">{user?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-[#4A7FA7] mb-1">Role</p>
                <Badge className={getRoleBadgeColor(user?.role || 'member')}>
                  {user?.role || 'member'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Organization Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#0A1931]">
              <Building2 className="h-5 w-5" />
              Organization
            </CardTitle>
            <CardDescription className="text-[#4A7FA7]">Your organization details</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <p className="text-sm text-[#4A7FA7] mb-1">Organization Name</p>
              <p className="font-medium text-[#0A1931]">{user?.organizationName || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Permissions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#0A1931]">
              <Shield className="h-5 w-5" />
              Your Permissions
            </CardTitle>
            <CardDescription className="text-[#4A7FA7]">What you can do based on your role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {user?.role === 'admin' && (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span>Full system access</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span>Manage all projects</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span>Manage all tasks</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span>Approve expenses</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span>Manage financial documents</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span>Invite users</span>
                  </div>
                </>
              )}
              {user?.role === 'manager' && (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span>Create and edit projects</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span>Assign team members</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span>Manage tasks</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span>Approve expenses</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span>Trigger invoices</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span>Invite team members</span>
                  </div>
                </>
              )}
              {user?.role === 'finance' && (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span>Create sales orders</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span>Create purchase orders</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span>Manage invoices</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span>Manage vendor bills</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span>Create expenses</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span>Invite finance users</span>
                  </div>
                </>
              )}
              {user?.role === 'member' && (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span>View assigned tasks</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span>Update task status</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span>Log hours</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span>Submit expenses</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Hourly Rates Management - Admin only */}
        {user?.role === 'admin' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#0A1931]">
                <DollarSign className="h-5 w-5" />
                Employee Hourly Rates
              </CardTitle>
              <CardDescription className="text-[#4A7FA7]">
                Configure hourly rates for automatic expense creation from logged hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HourlyRateManager />
            </CardContent>
          </Card>
        )}

        {/* Finance Management - for admin, manager, and finance roles */}
        {canManageFinance && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#0A1931]">
                <DollarSign className="h-5 w-5" />
                Finance Management
              </CardTitle>
              <CardDescription className="text-[#4A7FA7]">
                Manage sales orders, purchase orders, invoices, bills, and expenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FinanceManagement />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

