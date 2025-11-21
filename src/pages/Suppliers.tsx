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
    <div className="p-responsive space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h1 className="font-bold">Suppliers</h1>
      </div>

      <div className="space-y-4">
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="mb-4 w-full sm:w-auto" size="default">
            Add Supplier
          </Button>
        )}

        {showForm && (
          <Card className="mb-6 card-responsive border-primary/20">
            <CardHeader className="p-4 md:p-6">
              <CardTitle>Add New Supplier</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
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
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button type="submit" size="default">{t('common.save')}</Button>
                  <Button type="button" variant="outline" size="default" onClick={() => setShowForm(false)} className="border-primary/30">
                    {t('common.cancel')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-3 md:gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {suppliers.map((supplier) => (
            <Card key={supplier.id} className="card-responsive hover:shadow-lg hover:scale-[1.01] transition-all duration-200 border-primary/10">
              <CardContent className="p-4 md:p-6">
                <div>
                  <h3 className="text-base md:text-lg font-semibold">{supplier.name}</h3>
                  {supplier.gstin && (
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">GSTIN: {supplier.gstin}</p>
                  )}
                  {supplier.phone && (
                    <p className="text-xs md:text-sm text-muted-foreground">Phone: {supplier.phone}</p>
                  )}
                  {supplier.email && (
                    <p className="text-xs md:text-sm text-muted-foreground">Email: {supplier.email}</p>
                  )}
                  {supplier.address && (
                    <p className="text-xs md:text-sm text-muted-foreground">Address: {supplier.address}</p>
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
