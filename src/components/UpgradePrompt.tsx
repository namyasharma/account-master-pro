import { useNavigate } from 'react-router-dom';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Sparkles,
    Zap,
    CheckCircle,
    ArrowRight,
    Crown,
    Lock,
    ClipboardList
} from 'lucide-react';

interface UpgradePromptProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    feature: 'barcode_scanning' | 'unlimited_invoices' | 'unlimited_items' | 'advanced_analytics' | 'multi_user';
    featureName?: string;
    featureDescription?: string;
}

const FEATURE_DETAILS = {
    barcode_scanning: {
        name: 'Barcode Scanner',
        description: 'Quickly add items by scanning product barcodes with your camera',
        icon: Sparkles,
        benefits: [
            'Scan any EAN-13, UPC, or Code-128 barcode',
            'Auto-populate product details',
            'Save time on inventory entry',
            'Works on mobile and desktop',
        ],
    },
    unlimited_invoices: {
        name: 'Unlimited Invoices',
        description: 'Create unlimited invoices without any monthly restrictions',
        icon: Zap,
        benefits: [
            'No limits on invoice creation',
            'Professional invoice templates',
            'Automatic numbering',
            'PDF generation',
        ],
    },
    unlimited_items: {
        name: 'Unlimited items',
        description: 'Add unlimited items without any monthly restrictions',
        icon: ClipboardList,
        benefits: [
            'No limits on item creation',
            'Professional item templates',
            'Automatic numbering',
            'PDF generation',
        ],
    },
    advanced_analytics: {
        name: 'Advanced Analytics',
        description: 'Get insights into your business performance',
        icon: Crown,
        benefits: [
            'Sales trend analysis',
            'Customer insights',
            'Product performance',
            'Custom reports',
        ],
    },
    multi_user: {
        name: 'Multi-User Access',
        description: 'Collaborate with your team members',
        icon: Crown,
        benefits: [
            'Multiple user accounts',
            'Role-based permissions',
            'Team collaboration',
            'Activity tracking',
        ],
    },
};

export const UpgradePrompt = ({
    open,
    onOpenChange,
    feature,
    featureName,
    featureDescription,
}: UpgradePromptProps) => {
    const navigate = useNavigate();
    const details = FEATURE_DETAILS[feature];
    const Icon = details.icon;

    const handleUpgrade = () => {
        onOpenChange(false);
        navigate('/pricing');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                            <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Lock className="h-5 w-5 text-purple-600" />
                            <span className="text-sm font-semibold text-purple-600 uppercase tracking-wide">
                                Premium Feature
                            </span>
                        </div>
                    </div>
                    <DialogTitle className="text-2xl">
                        {featureName || details.name}
                    </DialogTitle>
                    <DialogDescription className="text-base">
                        {featureDescription || details.description}
                    </DialogDescription>
                </DialogHeader>

                <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50/50 to-blue-50/50">
                    <CardContent className="pt-6 space-y-3">
                        <p className="font-semibold text-slate-800 flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-purple-500" />
                            What you'll get:
                        </p>
                        <ul className="space-y-2">
                            {details.benefits.map((benefit, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                                    <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                    <span>{benefit}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                <DialogFooter className="flex-col sm:flex-col gap-2">
                    <Button
                        onClick={handleUpgrade}
                        className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-lg shadow-purple-500/30"
                        size="lg"
                    >
                        <Crown className="mr-2 h-5 w-5" />
                        View Plans & Pricing
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="w-full"
                    >
                        Maybe Later
                    </Button>
                </DialogFooter>

                <p className="text-xs text-center text-slate-500">
                    Starting from just ₹299/month • 14-day free trial
                </p>
            </DialogContent>
        </Dialog>
    );
};