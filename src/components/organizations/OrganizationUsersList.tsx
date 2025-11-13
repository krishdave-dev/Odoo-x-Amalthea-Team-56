"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Users, Search } from "lucide-react";

interface User {
  id: number;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  hourlyRate: number | null;
  createdAt: string;
  managedProjectsCount: number;
  assignedProjectsCount: number;
}

interface OrganizationUsersListProps {
  organizationId: number;
  onSelectUser?: (user: User) => void;
  roleFilter?: string;
}

export function OrganizationUsersList({
  organizationId,
  onSelectUser,
  roleFilter,
}: OrganizationUsersListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>(roleFilter || "all");

  useEffect(() => {
    fetchUsers();
  }, [organizationId]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, selectedRole]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/organizations/${organizationId}/users?activeOnly=true`,
        { credentials: "include" }
      );
      const data = await response.json();

      if (response.ok && data.success) {
        setUsers(data.data.users || []);
      } else {
        setError(data.error || "Failed to load users");
      }
    } catch (err: any) {
      setError("Failed to load organization users");
      console.error("Fetch users error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Filter by role
    if (selectedRole && selectedRole !== "all") {
      filtered = filtered.filter((u) => u.role === selectedRole);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name?.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term)
      );
    }

    setFilteredUsers(filtered);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-secondary text-secondary-foreground";
      case "manager":
        return "bg-secondary text-secondary-foreground";
      case "finance":
        return "bg-secondary text-secondary-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-gray-500">Loading users...</p>
        </CardContent>
      </Card>
    );
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
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Organization Users
        </CardTitle>
        <CardDescription>
          {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""} in
          your organization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Filter by Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger id="role">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Users List */}
        {filteredUsers.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No users found</p>
        ) : (
          <div className="space-y-2">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-medium text-gray-900">
                      {user.name || "Unnamed User"}
                    </h3>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {user.role}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <div className="flex gap-4 mt-1 text-xs text-gray-500">
                    {user.managedProjectsCount > 0 && (
                      <span>
                        Managing {user.managedProjectsCount} project
                        {user.managedProjectsCount !== 1 ? "s" : ""}
                      </span>
                    )}
                    {user.assignedProjectsCount > 0 && (
                      <span>
                        Assigned to {user.assignedProjectsCount} project
                        {user.assignedProjectsCount !== 1 ? "s" : ""}
                      </span>
                    )}
                    {user.hourlyRate && <span>${user.hourlyRate}/hr</span>}
                  </div>
                </div>
                {onSelectUser && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectUser(user)}
                  >
                    Select
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
