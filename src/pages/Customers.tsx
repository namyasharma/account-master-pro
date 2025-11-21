import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '@/contexts/BusinessContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { WorkflowShortcutModal } from '@/components/WorkflowShortcutModal';
import { logWorkflowShortcut } from '@/lib/telemetry';
import { customerSupplierSchema } from '@/lib/validation';

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [createdCustomerId, setCreatedCustomerId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    gstin: '',
    phone: '',
    email: '',
    address: '',
  });
  const { selectedBusiness } = useBusiness();
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!selectedBusiness) {
      navigate('/businesses');
      return;
    }
    fetchCustomers();
  }, [selectedBusiness]);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('business_id', selectedBusiness?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate customer data
      const validationResult = customerSupplierSchema.safeParse(formData);

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(e => e.message).join(', ');
        toast({
          title: 'Validation Error',
          description: errors,
          variant: 'destructive',
        });
        return;
      }

      const { data: newCustomer, error } = await supabase
        .from('customers')
        .insert({
          ...formData,
          business_id: selectedBusiness?.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Customer added successfully',
      });

      setShowForm(false);
      setCreatedCustomerId(newCustomer.id);
      setShowWorkflowModal(true);

      setFormData({
        name: '',
        gstin: '',
        phone: '',
        email: '',
        address: '',
      });
      fetchCustomers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container-responsive py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h1 className="font-bold">Customers</h1>
          <Button onClick={() => navigate('/dashboard')} size="default">Back to Dashboard</Button>
        </div>
      </div>

      <div className="container-responsive p-responsive">
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="mb-4 w-full sm:w-auto" size="default">
            Add Customer
          </Button>
        )}

        {showForm && (
          <Card className="mb-6 card-responsive">
            <CardHeader className="p-4 md:p-6">
              <CardTitle>Add New Customer</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Customer Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gstin">GSTIN</Label>
                    <Input
                      id="gstin"
                      value={formData.gstin}
                      onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button type="submit" size="default">{t('common.save')}</Button>
                  <Button type="button" variant="outline" size="default" onClick={() => setShowForm(false)}>
                    {t('common.cancel')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-3 md:gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {customers.map((customer) => (
            <Card key={customer.id} className="card-responsive">
              <CardContent className="p-4 md:p-6">
                <div>
                  <h3 className="text-base md:text-lg font-semibold">{customer.name}</h3>
                  {customer.gstin && (
                    <p className="text-xs md:text-sm text-muted-foreground">GSTIN: {customer.gstin}</p>
                  )}
                  {customer.phone && (
                    <p className="text-xs md:text-sm text-muted-foreground">Phone: {customer.phone}</p>
                  )}
                  {customer.email && (
                    <p className="text-xs md:text-sm text-muted-foreground">Email: {customer.email}</p>
                  )}
                  {customer.address && (
                    <p className="text-xs md:text-sm text-muted-foreground">Address: {customer.address}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <WorkflowShortcutModal
          open={showWorkflowModal}
          onOpenChange={(open) => {
            setShowWorkflowModal(open);
            if (!open) setCreatedCustomerId(null);
          }}
          title="Customer created successfully!"
          description="What would you like to do next?"
          actions={[
            {
              label: 'Create Invoice',
              path: `/invoices/create?prefillCustomerId=${createdCustomerId}`,
            },
          ]}
        />
      </div>
    </div>
  );
}
