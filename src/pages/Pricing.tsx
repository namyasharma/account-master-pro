import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Check,
    Crown,
    Sparkles,
    Zap,
    Users,
    ArrowLeft,
    Loader2,
    X,
    Barcode,
    TrendingUp,
    FileText,
    Package,
    Clock,
    Shield,
    Smartphone,
    MessageSquare,
    Infinity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PLANS = [
    {
        id: 'free',
        name: 'Free',
        price: 0,
        period: 'forever',
        icon: Sparkles,
        color: 'from-slate-500 to-slate-600',
        shadowColor: 'shadow-slate-500/30',
        popular: false,
        description: 'Perfect for trying out Account Master Pro',
        features: [
            { icon: FileText, text: '50 invoices per month', included: true },
            { icon: Package, text: '100 items', included: true },
            { icon: Users, text: '50 customers', included: true },
            { icon: Shield, text: 'Basic GST compliance', included: true },
            { icon: MessageSquare, text: 'Email support', included: true },
        ],
        notIncluded: [
            'Barcode scanning',
            'Advanced analytics',
            'WhatsApp integration',
            'Multi-user access',
        ],
        cta: 'Current Plan',
        trial: null,
    },
    {
        id: 'starter',
        name: 'Starter',
        price: 299,
        period: 'month',
        icon: Zap,
        color: 'from-purple-500 to-purple-600',
        shadowColor: 'shadow-purple-500/30',
        popular: true,
        description: 'Best for small businesses and freelancers',
        features: [
            { icon: Infinity, text: 'Unlimited invoices', included: true },
            { icon: Infinity, text: 'Unlimited items', included: true },
            { icon: Infinity, text: 'Unlimited customers', included: true },
            { icon: Barcode, text: 'Barcode scanning', included: true, highlight: true },
            { icon: Shield, text: 'Full GST compliance', included: true },
            { icon: FileText, text: 'Professional templates', included: true },
            { icon: MessageSquare, text: 'Priority email support', included: true },
        ],
        notIncluded: [
            'Advanced analytics',
            'Multi-user access',
            'Custom integrations',
        ],
        cta: 'Start 14-Day Trial',
        trial: '14 days',
    },
    {
        id: 'professional',
        name: 'Professional',
        price: 599,
        period: 'month',
        icon: Crown,
        color: 'from-blue-500 to-cyan-600',
        shadowColor: 'shadow-blue-500/30',
        popular: false,
        description: 'For growing businesses that need insights',
        features: [
            { icon: Check, text: 'Everything in Starter', included: true },
            { icon: TrendingUp, text: 'Advanced analytics & reports', included: true, highlight: true },
            { icon: FileText, text: 'Custom invoice templates', included: true },
            { icon: Clock, text: 'Inventory tracking', included: true },
            { icon: Zap, text: 'API access', included: true },
            { icon: Smartphone, text: 'WhatsApp notifications', included: true, highlight: true },
            { icon: MessageSquare, text: 'Phone support', included: true },
        ],
        notIncluded: [
            'Multi-user access',
            'Dedicated account manager',
        ],
        cta: 'Start 30-Day Trial',
        trial: '30 days',
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: 1499,
        period: 'month',
        icon: Users,
        color: 'from-emerald-500 to-teal-600',
        shadowColor: 'shadow-emerald-500/30',
        popular: false,
        description: 'For teams and large businesses',
        features: [
            { icon: Check, text: 'Everything in Professional', included: true },
            { icon: Users, text: 'Multi-user access (5 users)', included: true, highlight: true },
            { icon: Shield, text: 'Role-based permissions', included: true },
            { icon: Users, text: 'Team collaboration', included: true },
            { icon: MessageSquare, text: 'Priority phone support', included: true },
            { icon: Zap, text: 'Custom integrations', included: true },
            { icon: Crown, text: 'Dedicated account manager', included: true, highlight: true },
        ],
        notIncluded: [],
        cta: 'Start 60-Day Trial',
        trial: '60 days',
    },
];

// const Package = Infinity;

export default function Pricing() {
    const navigate = useNavigate();
    const { currentPlan, isTrialing, trialDaysRemaining, subscription } = useSubscription();
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const { toast } = useToast();

    const handleSelectPlan = async (planId: string) => {
        if (planId === 'free') {
            toast({
                title: 'Already on Free Plan',
                description: 'You are currently on the free plan. Choose a paid plan to unlock more features.',
            });
            return;
        }

        if (planId === currentPlan) {
            toast({
                title: 'Current Plan',
                description: 'You are already subscribed to this plan.',
            });
            return;
        }

        setLoadingPlan(planId);

        // TODO: Integrate Razorpay payment here (Day 3-4 of your launch plan)
        setTimeout(() => {
            toast({
                title: 'Coming Soon! 🚀',
                description: 'Payment integration will be available soon. For now, contact support to upgrade.',
            });
            setLoadingPlan(null);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 py-12 px-4 md:px-8">
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <div className="text-center space-y-6">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(-1)}
                        className="mb-4 hover:bg-white/50"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>

                    <div className="space-y-4">
                        <Badge className="bg-purple-100 text-purple-700 border-purple-300 px-4 py-1">
                            <Sparkles className="mr-2 h-3 w-3" />
                            Simple, Transparent Pricing
                        </Badge>

                        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-slate-800 via-purple-600 to-slate-800 bg-clip-text text-transparent">
                            Choose Your Plan
                        </h1>

                        <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
                            Start with a free trial on any paid plan. No credit card required.
                            Upgrade, downgrade, or cancel anytime.
                        </p>
                    </div>

                    {/* Current Plan Badge */}
                    {subscription && (
                        <div className="flex items-center justify-center gap-4 flex-wrap">
                            <Badge variant="outline" className="px-4 py-2 text-sm">
                                Current Plan: <span className="font-bold ml-1 capitalize">{currentPlan}</span>
                            </Badge>

                            {isTrialing && (
                                <Badge className="bg-amber-100 text-amber-700 border-amber-300 px-4 py-2 text-sm">
                                    <Clock className="mr-2 h-3 w-3" />
                                    {trialDaysRemaining} days left in trial
                                </Badge>
                            )}
                        </div>
                    )}
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                    {PLANS.map((plan) => {
                        const Icon = plan.icon;
                        const isCurrentPlan = currentPlan === plan.id;
                        const isPopular = plan.popular;

                        return (
                            <Card
                                key={plan.id}
                                className={`relative overflow-hidden transition-all duration-300 ${isPopular
                                    ? 'border-2 border-purple-300 shadow-2xl scale-105 lg:scale-110'
                                    : 'border border-slate-200 shadow-lg hover:shadow-xl'
                                    } ${isCurrentPlan ? 'ring-2 ring-purple-500 ring-offset-4' : ''
                                    }`}
                            >
                                {/* Popular Badge */}
                                {isPopular && (
                                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-bold text-center py-2 uppercase tracking-wider">
                                        ⭐ Most Popular
                                    </div>
                                )}

                                <CardHeader className={isPopular ? 'pt-12' : 'pt-6'}>
                                    {/* Icon */}
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center shadow-lg ${plan.shadowColor} mb-4`}>
                                        <Icon className="h-7 w-7 text-white" />
                                    </div>

                                    {/* Plan Name & Current Badge */}
                                    <div className="flex items-center gap-2 mb-2">
                                        <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                        {isCurrentPlan && (
                                            <Badge className="bg-purple-100 text-purple-700 border-purple-300 text-xs">
                                                Current
                                            </Badge>
                                        )}
                                    </div>

                                    <CardDescription className="text-sm h-10">
                                        {plan.description}
                                    </CardDescription>

                                    {/* Price */}
                                    <div className="mt-6 mb-4">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-5xl font-bold text-slate-800">
                                                ₹{plan.price}
                                            </span>
                                            <div className="flex flex-col">
                                                <span className="text-slate-500 text-sm">
                                                    /{plan.period}
                                                </span>
                                                {plan.trial && (
                                                    <span className="text-purple-600 text-xs font-semibold">
                                                        {plan.trial} free
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-4 pb-6">
                                    {/* CTA Button */}
                                    <Button
                                        onClick={() => handleSelectPlan(plan.id)}
                                        disabled={isCurrentPlan || loadingPlan !== null}
                                        className={`w-full h-12 text-base font-semibold ${isPopular
                                            ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-lg shadow-purple-500/30'
                                            : plan.id === 'free'
                                                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                : ''
                                            }`}
                                        variant={isPopular ? 'default' : plan.id === 'free' ? 'outline' : 'default'}
                                    >
                                        {loadingPlan === plan.id ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Processing...
                                            </>
                                        ) : isCurrentPlan ? (
                                            <>
                                                <Check className="mr-2 h-5 w-5" />
                                                Current Plan
                                            </>
                                        ) : (
                                            plan.cta
                                        )}
                                    </Button>

                                    {/* Features List */}
                                    <div className="space-y-3 pt-4 border-t border-slate-100">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            What's Included:
                                        </p>
                                        {plan.features.map((feature, index) => {
                                            const FeatureIcon = feature.icon;
                                            return (
                                                <div
                                                    key={index}
                                                    className={`flex items-start gap-3 ${feature.highlight ? 'bg-purple-50 -mx-2 px-2 py-1.5 rounded-lg' : ''}`}
                                                >
                                                    <div className={`flex-shrink-0 w-5 h-5 rounded-full ${feature.highlight ? 'bg-purple-500' : 'bg-emerald-500'} flex items-center justify-center`}>
                                                        <FeatureIcon className="h-3 w-3 text-white" />
                                                    </div>
                                                    <span className={`text-sm ${feature.highlight ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                                                        {feature.text}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Not Included */}
                                    {plan.notIncluded.length > 0 && (
                                        <div className="space-y-2 pt-4 border-t border-slate-100">
                                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                                Not Included:
                                            </p>
                                            {plan.notIncluded.map((item, index) => (
                                                <div key={index} className="flex items-start gap-3">
                                                    <X className="h-4 w-4 text-slate-300 flex-shrink-0 mt-0.5" />
                                                    <span className="text-sm text-slate-400">{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Feature Comparison Table */}
                <div className="mt-20">
                    <h2 className="text-3xl font-bold text-center mb-8 text-slate-800">
                        Compare All Features
                    </h2>

                    <Card className="border-0 shadow-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-slate-50 to-purple-50">
                                    <tr>
                                        <th className="text-left p-6 font-semibold text-slate-700">Feature</th>
                                        <th className="text-center p-6 font-semibold text-slate-700">Free</th>
                                        <th className="text-center p-6 font-semibold text-purple-700 bg-purple-50">
                                            Starter
                                            <Badge className="ml-2 bg-purple-500 text-white">Popular</Badge>
                                        </th>
                                        <th className="text-center p-6 font-semibold text-slate-700">Professional</th>
                                        <th className="text-center p-6 font-semibold text-slate-700">Enterprise</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-6 font-medium text-slate-700">Invoices per month</td>
                                        <td className="p-6 text-center text-slate-600">50</td>
                                        <td className="p-6 text-center bg-purple-50/50 font-semibold text-purple-700">Unlimited</td>
                                        <td className="p-6 text-center font-semibold text-purple-700">Unlimited</td>
                                        <td className="p-6 text-center font-semibold text-purple-700">Unlimited</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-6 font-medium text-slate-700">Items</td>
                                        <td className="p-6 text-center text-slate-600">100</td>
                                        <td className="p-6 text-center bg-purple-50/50 font-semibold text-purple-700">Unlimited</td>
                                        <td className="p-6 text-center font-semibold text-purple-700">Unlimited</td>
                                        <td className="p-6 text-center font-semibold text-purple-700">Unlimited</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-6 font-medium text-slate-700">Customers</td>
                                        <td className="p-6 text-center text-slate-600">50</td>
                                        <td className="p-6 text-center bg-purple-50/50 font-semibold text-purple-700">Unlimited</td>
                                        <td className="p-6 text-center font-semibold text-purple-700">Unlimited</td>
                                        <td className="p-6 text-center font-semibold text-purple-700">Unlimited</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 bg-purple-50/30">
                                        <td className="p-6 font-medium text-slate-700 flex items-center gap-2">
                                            <Barcode className="h-4 w-4 text-purple-600" />
                                            Barcode Scanning
                                        </td>
                                        <td className="p-6 text-center"><X className="h-5 w-5 text-slate-300 mx-auto" /></td>
                                        <td className="p-6 text-center bg-purple-50"><Check className="h-5 w-5 text-purple-600 mx-auto font-bold" /></td>
                                        <td className="p-6 text-center"><Check className="h-5 w-5 text-purple-600 mx-auto" /></td>
                                        <td className="p-6 text-center"><Check className="h-5 w-5 text-purple-600 mx-auto" /></td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-6 font-medium text-slate-700">GST Compliance</td>
                                        <td className="p-6 text-center"><Check className="h-5 w-5 text-emerald-500 mx-auto" /></td>
                                        <td className="p-6 text-center bg-purple-50/50"><Check className="h-5 w-5 text-emerald-500 mx-auto" /></td>
                                        <td className="p-6 text-center"><Check className="h-5 w-5 text-emerald-500 mx-auto" /></td>
                                        <td className="p-6 text-center"><Check className="h-5 w-5 text-emerald-500 mx-auto" /></td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-6 font-medium text-slate-700 flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-blue-600" />
                                            Advanced Analytics
                                        </td>
                                        <td className="p-6 text-center"><X className="h-5 w-5 text-slate-300 mx-auto" /></td>
                                        <td className="p-6 text-center bg-purple-50/50"><X className="h-5 w-5 text-slate-300 mx-auto" /></td>
                                        <td className="p-6 text-center"><Check className="h-5 w-5 text-blue-600 mx-auto" /></td>
                                        <td className="p-6 text-center"><Check className="h-5 w-5 text-blue-600 mx-auto" /></td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-6 font-medium text-slate-700 flex items-center gap-2">
                                            <Smartphone className="h-4 w-4 text-green-600" />
                                            WhatsApp Integration
                                        </td>
                                        <td className="p-6 text-center"><X className="h-5 w-5 text-slate-300 mx-auto" /></td>
                                        <td className="p-6 text-center bg-purple-50/50"><X className="h-5 w-5 text-slate-300 mx-auto" /></td>
                                        <td className="p-6 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                                        <td className="p-6 text-center"><Check className="h-5 w-5 text-green-600 mx-auto" /></td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-6 font-medium text-slate-700 flex items-center gap-2">
                                            <Users className="h-4 w-4 text-emerald-600" />
                                            Multi-User Access
                                        </td>
                                        <td className="p-6 text-center"><X className="h-5 w-5 text-slate-300 mx-auto" /></td>
                                        <td className="p-6 text-center bg-purple-50/50"><X className="h-5 w-5 text-slate-300 mx-auto" /></td>
                                        <td className="p-6 text-center"><X className="h-5 w-5 text-slate-300 mx-auto" /></td>
                                        <td className="p-6 text-center"><Check className="h-5 w-5 text-emerald-600 mx-auto" /></td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-6 font-medium text-slate-700">Support</td>
                                        <td className="p-6 text-center text-sm text-slate-600">Email</td>
                                        <td className="p-6 text-center bg-purple-50/50 text-sm text-slate-600">Priority Email</td>
                                        <td className="p-6 text-center text-sm text-slate-600">Phone + Email</td>
                                        <td className="p-6 text-center text-sm text-slate-600">Dedicated Manager</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* FAQ Section */}
                <div className="mt-20">
                    <h2 className="text-3xl font-bold text-center mb-12 text-slate-800">
                        Frequently Asked Questions
                    </h2>

                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                        <span className="text-purple-600 font-bold">1</span>
                                    </div>
                                    Can I cancel anytime?
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-600">
                                    Yes! You can cancel your subscription at any time with no questions asked. Your plan will remain active until the end of your current billing period.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                        <span className="text-purple-600 font-bold">2</span>
                                    </div>
                                    What happens after my trial?
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-600">
                                    After your free trial ends, you'll be charged for your chosen plan. You can cancel anytime before the trial ends to avoid charges.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                        <span className="text-purple-600 font-bold">3</span>
                                    </div>
                                    Can I upgrade or downgrade?
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-600">
                                    Absolutely! You can change your plan at any time. Upgrades take effect immediately, while downgrades occur at the end of your current billing cycle.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                        <span className="text-purple-600 font-bold">4</span>
                                    </div>
                                    What payment methods are accepted?
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-600">
                                    We accept all major credit/debit cards, UPI, net banking, and digital wallets through our secure payment partner Razorpay.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                        <span className="text-purple-600 font-bold">5</span>
                                    </div>
                                    Is my data secure?
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-600">
                                    Yes! We use bank-grade encryption and secure cloud infrastructure. Your data is backed up regularly and never shared with third parties.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                        <span className="text-purple-600 font-bold">6</span>
                                    </div>
                                    Do you offer refunds?
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-600">
                                    We offer a 7-day money-back guarantee on all paid plans. If you're not satisfied, contact us within 7 days for a full refund.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* CTA Section */}
                <Card className="mt-20 border-0 shadow-2xl bg-gradient-to-br from-purple-600 to-purple-500 text-white overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full -ml-48 -mb-48" />

                    <CardContent className="relative p-12 text-center space-y-6">
                        <Crown className="h-16 w-16 mx-auto text-white/90" />
                        <h2 className="text-3xl md:text-4xl font-bold">
                            Need a Custom Plan?
                        </h2>
                        <p className="text-lg text-purple-100 max-w-2xl mx-auto">
                            Large team? Special requirements? We'll create a custom plan tailored to your business needs.
                        </p>
                        <div className="flex gap-4 justify-center flex-wrap">
                            <Button
                                size="lg"
                                className="bg-white text-purple-600 hover:bg-purple-50 font-semibold"
                                onClick={() => window.location.href = 'mailto:support@accountmaster.pro'}
                            >
                                <MessageSquare className="mr-2 h-5 w-5" />
                                Contact Sales
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="border-2 border-white text-white hover:bg-white/10"
                                onClick={() => window.open('https://wa.me/1234567890', '_blank')}
                            >
                                <Smartphone className="mr-2 h-5 w-5" />
                                WhatsApp Us
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Trust Badges */}
                <div className="text-center space-y-4 py-8">
                    <p className="text-sm text-slate-500">Trusted by 1,000+ businesses across India</p>
                    <div className="flex items-center justify-center gap-8 flex-wrap grayscale opacity-50">
                        <Shield className="h-8 w-8" />
                        <span className="font-semibold text-slate-600">🔒 SSL Secured</span>
                        <span className="font-semibold text-slate-600">💳 PCI Compliant</span>
                        <span className="font-semibold text-slate-600">🇮🇳 Made in India</span>
                    </div>
                </div>
            </div>
        </div>
    );
}