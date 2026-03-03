import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBusiness } from "@/contexts/BusinessContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, Plus, Building2 } from "lucide-react";
import { businessSchema } from "@/lib/validation";
import { IndustryType } from "@/config/industryTemplates";

interface Business {
  id: string;
  name: string;
  gstin?: string;
  industry: IndustryType;
  state_code: string;
}

export default function BusinessSwitcher() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBusinessName, setNewBusinessName] = useState("");
  const [newBusinessGSTIN, setNewBusinessGSTIN] = useState("");
  const [creating, setCreating] = useState(false);
  const { selectedBusiness, setSelectedBusiness, refreshBusinessData } =
    useBusiness();
  const [newBusinessIndustry, setNewBusinessIndustry] =
    useState<IndustryType>("general");

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBusinesses();
  }, [user]);

  const fetchBusinesses = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBusinesses(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBusiness = async (business: Business) => {
    await setSelectedBusiness(business);
    await refreshBusinessData();

    // Refresh current page if on a business-scoped route
    const currentPath = window.location.pathname;
    if (
      [
        "/dashboard",
        "/items",
        "/invoices",
        "/purchases",
        "/suppliers",
        "/customers",
      ].includes(currentPath)
    ) {
      window.location.reload();
    }
  };

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setCreating(true);

      const validationResult = businessSchema.safeParse({
        name: newBusinessName,
        gstin: newBusinessGSTIN,
        email: "",
        phone: "",
        address: "",
      });

      if (!validationResult.success) {
        const errors = validationResult.error.errors
          .map((e) => e.message)
          .join(", ");
        toast({
          title: "Validation Error",
          description: errors,
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from("businesses")
        .insert({
          name: newBusinessName,
          gstin: newBusinessGSTIN || null,
          owner_id: user?.id,
          industry: newBusinessIndustry,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Business created successfully",
      });

      setBusinesses([data, ...businesses]);
      setShowCreateModal(false);
      setNewBusinessName("");
      setNewBusinessGSTIN("");
      setNewBusinessIndustry("general");

      // Auto-select the new business
      await handleSelectBusiness(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const getBusinessInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!selectedBusiness && businesses.length === 0 && !loading) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="h-10 gap-2 border-primary/30 hover:bg-primary/10 hover:border-primary"
          >
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs bg-primary/20 text-primary">
                {selectedBusiness ? (
                  getBusinessInitials(selectedBusiness.name)
                ) : (
                  <Building2 className="h-3 w-3" />
                )}
              </AvatarFallback>
            </Avatar>
            <span className="hidden md:inline-block max-w-[150px] truncate">
              {selectedBusiness?.name || "Select Business"}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[280px] bg-card">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Your Businesses
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {loading ? (
            <div className="p-4 text-sm text-center text-muted-foreground">
              Loading...
            </div>
          ) : businesses.length === 0 ? (
            <div className="p-4 text-sm text-center text-muted-foreground">
              No businesses yet
            </div>
          ) : (
            businesses.map((business) => (
              <DropdownMenuItem
                key={business.id}
                onClick={() => handleSelectBusiness(business)}
                className={`cursor-pointer ${
                  selectedBusiness?.id === business.id ? "bg-primary/10" : ""
                }`}
              >
                <div className="flex items-center gap-3 w-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/20 text-primary">
                      {getBusinessInitials(business.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {business.name}
                    </p>
                    {business.gstin && (
                      <p className="text-xs text-muted-foreground truncate">
                        GSTIN: {business.gstin}
                      </p>
                    )}
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowCreateModal(true)}
            className="cursor-pointer text-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Business
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Business</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateBusiness} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name *</Label>
              <Input
                id="businessName"
                value={newBusinessName}
                onChange={(e) => setNewBusinessName(e.target.value)}
                placeholder="Enter business name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gstin">GSTIN (Optional)</Label>
              <Input
                id="gstin"
                value={newBusinessGSTIN}
                onChange={(e) => setNewBusinessGSTIN(e.target.value)}
                placeholder="Enter GSTIN"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? "Creating..." : "Create Business"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog> */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Business</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateBusiness} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name *</Label>
              <Input
                id="businessName"
                value={newBusinessName}
                onChange={(e) => setNewBusinessName(e.target.value)}
                placeholder="Enter business name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gstin">GSTIN (Optional)</Label>
              <Input
                id="gstin"
                value={newBusinessGSTIN}
                onChange={(e) => setNewBusinessGSTIN(e.target.value)}
                placeholder="Enter GSTIN"
              />
            </div>

            {/* NEW: Industry Selection */}
            <div className="space-y-2">
              <Label htmlFor="industry">Industry Type *</Label>
              <Select
                value={newBusinessIndustry}
                onValueChange={(value) =>
                  setNewBusinessIndustry(value as IndustryType)
                }
              >
                <SelectTrigger id="industry">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Business</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="restaurant">
                    Restaurant / Food Service
                  </SelectItem>
                  <SelectItem value="services">
                    {" "}
                    Professional Services
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose your industry to customize GST rates and dashboard
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? "Creating..." : "Create Business"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
