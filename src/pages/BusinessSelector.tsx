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
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{t('business.select')}</h1>
          <Button variant="outline" onClick={handleLogout}>
            {t('common.logout')}
          </Button>
        </div>

        {!showCreate && (
          <Button onClick={() => setShowCreate(true)} className="mb-4">
            {t('business.create')}
          </Button>
        )}

        {showCreate && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t('business.create')}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateBusiness} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">{t('business.name')}</Label>
                  <Input
                    id="businessName"
                    value={newBusinessName}
                    onChange={(e) => setNewBusinessName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstin">{t('business.gstin')}</Label>
                  <Input
                    id="gstin"
                    value={newBusinessGSTIN}
                    onChange={(e) => setNewBusinessGSTIN(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">{t('common.save')}</Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                    {t('common.cancel')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {businesses.map((business) => (
            <Card key={business.id} className="cursor-pointer hover:bg-accent" onClick={() => handleSelectBusiness(business)}>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold">{business.name}</h2>
                {business.gstin && (
                  <p className="text-sm text-muted-foreground mt-2">GSTIN: {business.gstin}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}