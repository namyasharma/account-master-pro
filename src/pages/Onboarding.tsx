import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Building2, 
  Package, 
  Users, 
  BarChart3,
  FileText,
  ShoppingCart 
} from 'lucide-react';
import { businessSchema } from '@/lib/validation';

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [businessName, setBusinessName] = useState('');
  const [businessGSTIN, setBusinessGSTIN] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { user, refreshOnboardingStatus } = useAuth();
  const { setSelectedBusiness } = useBusiness();
  const { toast } = useToast();
  const navigate = useNavigate();

  const totalSteps = 6;

  const handleComplete = async () => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user?.id);

      if (error) throw error;

      // Ensure the updated onboarding status is reflected in auth context
      await refreshOnboardingStatus();

      toast({
        title: 'Welcome!',
        description: "You're all set to start using the app.",
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleCreateBusiness = async () => {
    if (!businessName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a business name',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      const validationResult = businessSchema.safeParse({
        name: businessName,
        gstin: businessGSTIN,
        email: '',
        phone: '',
        address: '',
      });

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(e => e.message).join(', ');
        toast({
          title: 'Validation Error',
          description: errors,
          variant: 'destructive',
        });
        return;
      }

      const { data, error } = await supabase
        .from('businesses')
        .insert({
          name: businessName,
          gstin: businessGSTIN || null,
          owner_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      await setSelectedBusiness(data);
      setStep(step + 1);
      
      toast({
        title: 'Success',
        description: 'Business created successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = async () => {
    if (!itemName.trim() || !itemPrice) {
      toast({
        title: 'Error',
        description: 'Please enter item name and price',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      const { data: businesses } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user?.id)
        .limit(1)
        .single();

      if (!businesses) {
        toast({
          title: 'Error',
          description: 'Please create a business first',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase
        .from('items')
        .insert({
          name: itemName,
          unit_price: parseFloat(itemPrice),
          business_id: businesses.id,
          owner_id: user?.id,
        });

      if (error) throw error;
      
      setStep(step + 1);
      toast({
        title: 'Success',
        description: 'Item created successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContact = async () => {
    if (!contactName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a contact name',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      const { data: businesses } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user?.id)
        .limit(1)
        .single();

      if (!businesses) {
        toast({
          title: 'Error',
          description: 'Please create a business first',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase
        .from('customers')
        .insert({
          name: contactName,
          email: contactEmail || null,
          business_id: businesses.id,
        });

      if (error) throw error;
      
      setStep(step + 1);
      toast({
        title: 'Success',
        description: 'Contact created successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Welcome to GST Billing</CardTitle>
              <p className="text-muted-foreground mt-2">
                Let's get you set up in just a few steps. You can skip any step and come back later.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => setStep(1)} className="w-full" size="lg">
                Get Started
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
              <Button onClick={handleComplete} variant="ghost" className="w-full">
                Skip Onboarding
              </Button>
            </CardContent>
          </Card>
        );

      case 1:
        return (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Create Your Business</CardTitle>
              <p className="text-sm text-muted-foreground">
                Set up your first business to start managing invoices and GST
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  placeholder="My Business Ltd."
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gstin">GSTIN (Optional)</Label>
                <Input
                  id="gstin"
                  placeholder="22AAAAA0000A1Z5"
                  value={businessGSTIN}
                  onChange={(e) => setBusinessGSTIN(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateBusiness} disabled={loading} className="flex-1">
                  {loading ? 'Creating...' : 'Create Business'}
                </Button>
                <Button onClick={handleSkip} variant="outline">
                  Skip
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-2">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Add Your First Item</CardTitle>
              <p className="text-sm text-muted-foreground">
                Items are products or services you sell
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="itemName">Item Name *</Label>
                <Input
                  id="itemName"
                  placeholder="Product or Service"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="itemPrice">Unit Price *</Label>
                <Input
                  id="itemPrice"
                  type="number"
                  placeholder="100.00"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateItem} disabled={loading} className="flex-1">
                  {loading ? 'Adding...' : 'Add Item'}
                </Button>
                <Button onClick={handleSkip} variant="outline">
                  Skip
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-2">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Add Your First Customer</CardTitle>
              <p className="text-sm text-muted-foreground">
                Keep track of who you're selling to
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">Customer Name *</Label>
                <Input
                  id="contactName"
                  placeholder="John Doe"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email (Optional)</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="john@example.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateContact} disabled={loading} className="flex-1">
                  {loading ? 'Adding...' : 'Add Customer'}
                </Button>
                <Button onClick={handleSkip} variant="outline">
                  Skip
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-2">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Your Dashboard</CardTitle>
              <p className="text-sm text-muted-foreground">
                Track your sales, purchases, and GST at a glance
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="flex items-start gap-3 p-3 rounded-lg border border-border/40 bg-card/50">
                  <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Financial Overview</h4>
                    <p className="text-xs text-muted-foreground">View total sales, purchases, and net GST</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg border border-border/40 bg-card/50">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Quick Actions</h4>
                    <p className="text-xs text-muted-foreground">Create invoices and manage items</p>
                  </div>
                </div>
              </div>
              <Button onClick={() => setStep(step + 1)} className="w-full">
                Continue
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-2">
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Manage Your Business</CardTitle>
              <p className="text-sm text-muted-foreground">
                Everything you need to run your business efficiently
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="flex items-start gap-3 p-3 rounded-lg border border-border/40 bg-card/50">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Create Invoices</h4>
                    <p className="text-xs text-muted-foreground">Generate GST-compliant invoices in seconds</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg border border-border/40 bg-card/50">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Track Items</h4>
                    <p className="text-xs text-muted-foreground">Manage your inventory and pricing</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg border border-border/40 bg-card/50">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Customers & Suppliers</h4>
                    <p className="text-xs text-muted-foreground">Keep all your contacts organized</p>
                  </div>
                </div>
              </div>
              <Button onClick={handleComplete} disabled={loading} className="w-full" size="lg">
                <Check className="mr-2 h-4 w-4" />
                {loading ? 'Setting up...' : 'Get Started'}
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full">
        {/* Progress indicator */}
        {step > 0 && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Step {step} of {totalSteps - 1}
              </span>
              {step > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(step - 1)}
                  disabled={loading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
            </div>
            <div className="w-full bg-border/40 h-2 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${(step / (totalSteps - 1)) * 100}%` }}
              />
            </div>
          </div>
        )}
        
        {renderStep()}
      </div>
    </div>
  );
}
