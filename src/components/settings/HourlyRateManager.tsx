"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Save, Loader2, RefreshCw } from "lucide-react";

interface User {
  id: number;
  name: string | null;
  email: string;
  role: string;
  hourlyRate: number;
}

export function HourlyRateManager() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [saving, setSaving] = useState<{ [key: number]: boolean }>({});
  const [rates, setRates] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users/hourly-rates", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setUsers(data.data);
        // Initialize rates state with current values
        const initialRates: { [key: number]: string } = {};
        data.data.forEach((user: User) => {
          initialRates[user.id] = user.hourlyRate?.toString() || "0";
        });
        setRates(initialRates);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRateChange = (userId: number, value: string) => {
    // Allow empty, numbers, and decimals
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setRates({ ...rates, [userId]: value });
    }
  };

  const handleSaveRate = async (userId: number) => {
    setSaving({ ...saving, [userId]: true });

    try {
      const rateValue = parseFloat(rates[userId]) || 0;

      const response = await fetch(`/api/users/${userId}/hourly-rate`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ hourlyRate: rateValue }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update hourly rate");
      }

      const data = await response.json();

      // Update local state
      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, hourlyRate: rateValue } : user
        )
      );

      toast({
        title: "Success",
        description: `Hourly rate updated for ${
          data.data.name || data.data.email
        }`,
      });
    } catch (error: any) {
      console.error("Error updating hourly rate:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update hourly rate",
        variant: "destructive",
      });
    } finally {
      setSaving({ ...saving, [userId]: false });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800";
      case "manager":
        return "bg-blue-100 text-blue-800";
      case "finance":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleRecalculateAll = async () => {
    setRecalculating(true);
    try {
      const response = await fetch("/api/timesheets/recalculate-expenses", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to recalculate expenses");
      }

      const data = await response.json();
      toast({
        title: "Recalculation Complete",
        description: `Updated ${data.stats.timesheetsUpdated} timesheets, created ${data.stats.expensesCreated} expenses, updated ${data.stats.expensesUpdated} expenses (Total: ${data.stats.totalTimesheets} timesheets)`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to recalculate expenses",
        variant: "destructive",
      });
    } finally {
      setRecalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Hourly Rates</h3>
        </div>
        <Button
          onClick={handleRecalculateAll}
          disabled={recalculating}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={cn("mr-2 h-4 w-4", recalculating && "animate-spin")} />
          Recalculate All Expenses
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Set hourly rates for employees. When they log hours, expenses will be
        automatically created based on these rates.
      </p>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Hourly Rate (₹)</TableHead>
              <TableHead className="w-24">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.name || "N/A"}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge className={getRoleBadgeColor(user.role)}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Input
                    type="text"
                    value={rates[user.id] || "0"}
                    onChange={(e) => handleRateChange(user.id, e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleSaveRate(user.id);
                      }
                    }}
                    className="w-32"
                    placeholder="0.00"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    onClick={() => handleSaveRate(user.id)}
                    disabled={saving[user.id]}
                  >
                    {saving[user.id] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </>
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No users found in your organization
        </div>
      )}
    </div>
  );
}
