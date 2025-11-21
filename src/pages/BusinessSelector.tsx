import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { businessSchema } from '@/lib/validation';

export default function BusinessSelector() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newBusinessName, setNewBusinessName] = useState('');
  const [newBusinessGSTIN, setNewBusinessGSTIN] = useState('');
  const { user, signOut } = useAuth();
  const { setSelectedBusiness } = useBusiness();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchBusinesses();
  }, [user]);

  const fetchBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBusinesses(data || []);
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

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate business data
      const validationResult = businessSchema.safeParse({
        name: newBusinessName,
        gstin: newBusinessGSTIN,
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
          name: newBusinessName,
          gstin: newBusinessGSTIN || null,
          owner_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Business created successfully',
      });
      
      setBusinesses([data, ...businesses]);
      setShowCreate(false);
      setNewBusinessName('');
      setNewBusinessGSTIN('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSelectBusiness = (business: any) => {
    setSelectedBusiness(business);
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t('business.select')}</h1>
          <Button variant="outline" onClick={handleLogout} size="sm">
            {t('common.logout')}
          </Button>
        </div>

        {!showCreate && (
          <Button onClick={() => setShowCreate(true)} className="w-full" size="sm">
            {t('business.create')}
          </Button>
        )}

        {showCreate && (
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-lg">{t('business.create')}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <form onSubmit={handleCreateBusiness} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="businessName" className="text-sm">{t('business.name')}</Label>
                  <Input
                    id="businessName"
                    value={newBusinessName}
                    onChange={(e) => setNewBusinessName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="gstin" className="text-sm">{t('business.gstin')}</Label>
                  <Input
                    id="gstin"
                    value={newBusinessGSTIN}
                    onChange={(e) => setNewBusinessGSTIN(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm">{t('common.save')}</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowCreate(false)}>
                    {t('common.cancel')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {businesses.map((business) => (
            <Card key={business.id} className="cursor-pointer hover:bg-accent" onClick={() => handleSelectBusiness(business)}>
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold">{business.name}</h2>
                {business.gstin && (
                  <p className="text-sm text-muted-foreground mt-1">GSTIN: {business.gstin}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}