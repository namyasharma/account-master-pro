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

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [createdSupplierId, setCreatedSupplierId] = useState<string | null>(null);
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
    fetchSuppliers();
  }, [selectedBusiness]);

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('business_id', selectedBusiness?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSuppliers(data || []);
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
      // Validate supplier data
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

      const { data: newSupplier, error } = await supabase
        .from('suppliers')
        .insert({
          ...formData,
          business_id: selectedBusiness?.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Supplier added successfully',
      });

      setShowForm(false);
      setCreatedSupplierId(newSupplier.id);
      setShowWorkflowModal(true);

      setFormData({
        name: '',
        gstin: '',
        phone: '',
        email: '',
        address: '',
      });
      fetchSuppliers();
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
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Suppliers</h1>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="mb-4">
            Add Supplier
          </Button>
        )}

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Supplier</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Supplier Name *</Label>
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
                <div className="flex gap-2">
                  <Button type="submit">{t('common.save')}</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    {t('common.cancel')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {suppliers.map((supplier) => (
            <Card key={supplier.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{supplier.name}</h3>
                    {supplier.gstin && (
                      <p className="text-sm text-muted-foreground">GSTIN: {supplier.gstin}</p>
                    )}
                    {supplier.phone && (
                      <p className="text-sm text-muted-foreground">Phone: {supplier.phone}</p>
                    )}
                    {supplier.email && (
                      <p className="text-sm text-muted-foreground">Email: {supplier.email}</p>
                    )}
                    {supplier.address && (
                      <p className="text-sm text-muted-foreground">Address: {supplier.address}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <WorkflowShortcutModal
          open={showWorkflowModal}
          onOpenChange={(open) => {
            setShowWorkflowModal(open);
            if (!open) setCreatedSupplierId(null);
          }}
          title="Supplier created successfully!"
          description="What would you like to do next?"
          actions={[
            {
              label: 'Create Purchase',
              path: `/purchases/create?prefillSupplierId=${createdSupplierId}`,
            },
          ]}
        />
      </div>
    </div>
  );
}
