import { useEffect, useState } from "react";
import { Search, Plus, Trash2, TrendingDown, UserCog, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminAPI } from "@/services/api";

interface UserRow {
  _id: string;
  name: string;
  email: string;
  status: string;
  subscription: {
    plan: string | null;
    status: string;
    minutesRemaining: number;
  };
}

const AdminDashboard = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPlan, setFilterPlan] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"add" | "downgrade" | "delete" | null>(null);
  const [creditsToAdd, setCreditsToAdd] = useState("");
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 25;

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit, search: searchQuery };
      const data = await adminAPI.getUsers(params);
      setUsers(data.users);
      setTotal(data.pagination.total);
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to load users', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [page]);
  useEffect(() => { const t = setTimeout(() => { setPage(1); loadUsers(); }, 300); return () => clearTimeout(t); /* search debounce */ }, [searchQuery]);

  // Filter users based on search and plan filter
  const filteredUsers = users.filter((user) => {
    const matchesPlan = filterPlan === "all" || (filterPlan === "paid" ? (user.subscription.plan && user.subscription.plan !== 'Free') : (!user.subscription.plan || user.subscription.plan === 'Free'));
    return matchesPlan;
  });

  const handleAddCredits = (user: UserRow) => {
    setSelectedUser(user);
    setDialogType("add");
    setDialogOpen(true);
  };

  const handleDowngrade = (user: UserRow) => {
    setSelectedUser(user);
    setDialogType("downgrade");
    setDialogOpen(true);
  };

  const handleDelete = (user: UserRow) => {
    setSelectedUser(user);
    setDialogType("delete");
    setDialogOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedUser) return;

    if (dialogType === "add") {
      const creditsNum = parseInt(creditsToAdd);
      if (isNaN(creditsNum) || creditsNum <= 0) {
        toast({
          title: "Invalid Input",
          description: "Please enter a valid number of credits.",
          variant: "destructive",
        });
        return;
      }
      try {
        await adminAPI.updateSubscription(selectedUser._id, { minutesRemaining: (selectedUser.subscription.minutesRemaining || 0) + creditsNum });
        toast({ title: 'Credits Added', description: `${creditsNum} credits added to ${selectedUser.name}'s account.` });
        await loadUsers();
      } catch {
        toast({ title: 'Error', description: 'Failed to add credits', variant: 'destructive' });
      }
    } else if (dialogType === "downgrade") {
      const current = selectedUser.subscription.plan || 'Free';
      const newPlan = current === "Enterprise" ? "Pro" : "Free";
      try {
        await adminAPI.updateSubscription(selectedUser._id, { plan: newPlan });
        toast({ title: 'Plan Updated', description: `${selectedUser.name}'s plan changed to ${newPlan}.` });
        await loadUsers();
      } catch {
        toast({ title: 'Error', description: 'Failed to update plan', variant: 'destructive' });
      }
    } else if (dialogType === "delete") {
      // Soft delete is not implemented; for now, set inactive
      try {
        await adminAPI.updateUserStatus(selectedUser._id, 'inactive');
        toast({ title: 'User Deactivated', description: `${selectedUser.name} set to inactive.` });
        await loadUsers();
      } catch {
        toast({ title: 'Error', description: 'Failed to update user', variant: 'destructive' });
      }
    }

    setDialogOpen(false);
    setSelectedUser(null);
    setCreditsToAdd("");
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-success/20 text-success",
      cancelled: "bg-destructive/20 text-destructive",
      past_due: "bg-yellow-500/20 text-yellow-500",
    };
    return styles[status as keyof typeof styles] || "";
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === "active").length,
    paid: users.filter(u => u.subscription.plan && u.subscription.plan !== "Free").length,
    revenue: users.filter(u => u.subscription.plan && u.subscription.plan !== "Free").reduce((sum, u) => {
      const prices: any = { Pro: 999, Enterprise: 1999, Free: 0 };
      return sum + (prices[u.subscription.plan || 'Free'] || 0);
    }, 0),
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        onSignInClick={() => {}} 
        onSignUpClick={() => {}}
        onBookDemoClick={() => {}}
      />
      
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage all subscribers and their accounts</p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="border-border bg-card/30 backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/30 backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Subscribers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-success">{stats.active}</div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/30 backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Paid Plans
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{stats.paid}</div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/30 backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Monthly Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">₹{stats.revenue.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card/30 border-border"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={filterPlan === "all" ? "default" : "outline"}
                onClick={() => setFilterPlan("all")}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                All
              </Button>
              <Button
                variant={filterPlan === "free" ? "default" : "outline"}
                onClick={() => setFilterPlan("free")}
              >
                Free
              </Button>
              <Button
                variant={filterPlan === "paid" ? "default" : "outline"}
                onClick={() => setFilterPlan("paid")}
              >
                Paid
              </Button>
            </div>
          </div>

          {/* Users Table */}
          <Card className="border-border bg-card/30 backdrop-blur-xl">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading users…</TableCell></TableRow>
                    ) : filteredUsers.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No users found</TableCell></TableRow>
                    ) : filteredUsers.map((user) => (
                      <TableRow key={user._id} className="border-border hover:bg-muted/30">
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.subscription.plan === "Enterprise" ? "bg-primary/20 text-primary" :
                            user.subscription.plan === "Pro" ? "bg-secondary/20 text-secondary" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {user.subscription.plan || 'Free'}
                          </span>
                        </TableCell>
                        <TableCell>{user.subscription.minutesRemaining}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(user.status)}`}>
                            {user.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleAddCredits(user)}
                              className="hover:bg-success/10 hover:text-success"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDowngrade(user)}
                              className="hover:bg-yellow-500/10 hover:text-yellow-500"
                              disabled={!user.subscription.plan || user.subscription.plan === "Free"}
                            >
                              <TrendingDown className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(user)}
                              className="hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          {/* Simple pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">Total: {total}</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page<=1} onClick={() => setPage(p => Math.max(p-1,1))}>Prev</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p+1)}>Next</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Action Dialogs */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>
              {dialogType === "add" && "Add Credits"}
              {dialogType === "downgrade" && "Downgrade Plan"}
              {dialogType === "delete" && "Delete User"}
            </DialogTitle>
            <DialogDescription>
              {dialogType === "add" && `Add credits to ${selectedUser?.name}'s account`}
              {dialogType === "downgrade" && `Downgrade ${selectedUser?.name}'s subscription plan`}
              {dialogType === "delete" && `Remove ${selectedUser?.name} from the system`}
            </DialogDescription>
          </DialogHeader>

          {dialogType === "add" && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="credits">Number of Credits</Label>
                <Input
                  id="credits"
                  type="number"
                  placeholder="100"
                  value={creditsToAdd}
                  onChange={(e) => setCreditsToAdd(e.target.value)}
                  className="bg-background border-border"
                />
              </div>
            </div>
          )}

          {dialogType === "downgrade" && (
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                This will change {selectedUser?.name}'s plan from <strong>{selectedUser?.subscription.plan || 'Free'}</strong> to{" "}
                <strong>{(selectedUser?.subscription.plan || 'Free') === "Enterprise" ? "Pro" : "Free"}</strong>.
              </p>
            </div>
          )}

          {dialogType === "delete" && (
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                This action cannot be undone. All data for {selectedUser?.name} will be permanently removed.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              variant={dialogType === "delete" ? "destructive" : "default"}
            >
              {dialogType === "add" && "Add Credits"}
              {dialogType === "downgrade" && "Downgrade"}
              {dialogType === "delete" && "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer onBookDemoClick={() => {}} />
    </div>
  );
};

export default AdminDashboard;
