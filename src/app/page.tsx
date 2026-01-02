import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import {
  Sparkles,
  Zap,
  Clock,
  TrendingUp,
  Video,
  Twitter,
  Linkedin,
  Instagram,
  MessageCircle,
  Mail,
  ArrowRight,
  Check,
  BarChart3
} from 'lucide-react';

export default function HomePage() {
  const { userId } = auth();

  // Redirect authenticated users to dashboard
  if (userId) {
    redirect('/dashboard');
  }

  const platforms = [
    { icon: Video, name: 'TikTok', color: 'text-pink-400' },
    { icon: Twitter, name: 'Twitter', color: 'text-sky-400' },
    { icon: Linkedin, name: 'LinkedIn', color: 'text-blue-400' },
    { icon: Instagram, name: 'Instagram', color: 'text-purple-400' },
    { icon: MessageCircle, name: 'Threads', color: 'text-gray-400' },
    { icon: Mail, name: 'Email', color: 'text-green-400' },
  ];

  const benefits = [
    {
      icon: Clock,
      title: 'Save 10+ Hours Per Week',
      description: 'Stop manually reformatting content for each platform. Generate optimized content for all 6 platforms in seconds.',
    },
    {
      icon: Sparkles,
      title: 'AI-Powered Adaptation',
      description: 'Our AI understands platform-specific best practices and adapts your content accordingly.',
    },
    {
      icon: TrendingUp,
      title: 'Consistent Brand Voice',
      description: 'Choose from 4 tone variations while maintaining your unique brand identity across all platforms.',
    },
    {
      icon: BarChart3,
      title: 'Maximize Your Reach',
      description: 'Turn one piece of content into 6+ platform-optimized posts to reach more people.',
    },
  ];

  const stats = [
    { label: 'Hours saved per creator monthly', value: '40+' },
    { label: 'Platforms supported', value: '6' },
    { label: 'Avg. generation time', value: '<30s' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          {/* Navigation */}
          <div className="mb-16 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-8 w-8 text-purple-400" />
              <span className="text-2xl font-bold text-white">ContentIQ</span>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/sign-in"
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Sign In
              </a>
              <a
                href="/sign-up"
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition-colors"
              >
                Get Started Free
              </a>
            </div>
          </div>

          {/* Hero Content */}
          <div className="text-center">
            <div className="inline-flex items-center rounded-full bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-300 ring-1 ring-purple-500/20 mb-8">
              <Zap className="mr-2 h-4 w-4" />
              Start your 3-day free trial with full access
            </div>

            <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Stop Wasting Time
              <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Repurposing Content
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-300">
              Turn your long-form content into platform-optimized posts for TikTok, Twitter, LinkedIn, Instagram, Threads, and Email in seconds — not hours.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex items-center justify-center gap-4">
              <a
                href="/sign-up"
                className="group inline-flex items-center rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:shadow-purple-500/50 transition-all"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="#benefits"
                className="inline-flex items-center rounded-lg border border-gray-600 bg-gray-800/50 px-8 py-4 text-lg font-semibold text-white hover:bg-gray-700/50 transition-colors"
              >
                Learn More
              </a>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
              {stats.map((stat, idx) => (
                <div key={idx} className="rounded-lg bg-white/5 p-6 backdrop-blur-sm">
                  <div className="text-4xl font-bold text-white">{stat.value}</div>
                  <div className="mt-2 text-sm text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Problem Statement */}
      <div className="relative bg-gray-900/50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              The Reality of Multi-Platform Content
            </h2>
            <p className="mt-4 text-xl text-gray-400">
              Creating content for each platform manually is a massive time sink
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl bg-gradient-to-br from-red-900/20 to-red-800/10 p-6 ring-1 ring-red-500/20">
              <Clock className="h-10 w-10 text-red-400" />
              <h3 className="mt-4 text-xl font-semibold text-white">2-3 hours per platform</h3>
              <p className="mt-2 text-gray-400">
                Average time spent adapting one piece of content for a single platform
              </p>
            </div>

            <div className="rounded-xl bg-gradient-to-br from-orange-900/20 to-orange-800/10 p-6 ring-1 ring-orange-500/20">
              <TrendingUp className="h-10 w-10 text-orange-400" />
              <h3 className="mt-4 text-xl font-semibold text-white">12-18 hours weekly</h3>
              <p className="mt-2 text-gray-400">
                Time wasted manually reformatting content across all platforms
              </p>
            </div>

            <div className="rounded-xl bg-gradient-to-br from-yellow-900/20 to-yellow-800/10 p-6 ring-1 ring-yellow-500/20">
              <Sparkles className="h-10 w-10 text-yellow-400" />
              <h3 className="mt-4 text-xl font-semibold text-white">Inconsistent quality</h3>
              <p className="mt-2 text-gray-400">
                Rush jobs lead to poor engagement and missed platform-specific best practices
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div id="benefits" className="relative py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              How ContentIQ Saves You Time
            </h2>
            <p className="mt-4 text-xl text-gray-400">
              AI-powered content adaptation that understands each platform
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-2">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <div key={idx} className="rounded-xl bg-white/5 p-8 backdrop-blur-sm ring-1 ring-white/10">
                  <Icon className="h-12 w-12 text-purple-400" />
                  <h3 className="mt-4 text-2xl font-semibold text-white">{benefit.title}</h3>
                  <p className="mt-2 text-gray-400">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Platforms Section */}
      <div className="relative bg-gray-900/50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              All Your Platforms, One Click
            </h2>
            <p className="mt-4 text-xl text-gray-400">
              Generate optimized content for all 6 platforms simultaneously
            </p>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
            {platforms.map((platform, idx) => {
              const Icon = platform.icon;
              return (
                <div
                  key={idx}
                  className="flex flex-col items-center rounded-xl bg-white/5 p-6 backdrop-blur-sm ring-1 ring-white/10 hover:bg-white/10 transition-colors"
                >
                  <Icon className={`h-10 w-10 ${platform.color}`} />
                  <span className="mt-3 text-sm font-medium text-gray-300">{platform.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pricing CTA */}
      <div className="relative py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-r from-purple-600/20 to-blue-600/20 p-12 ring-1 ring-white/10 backdrop-blur-sm">
            <h2 className="text-4xl font-bold text-white">
              Start Your Free Trial Today
            </h2>
            <p className="mt-4 text-xl text-gray-300">
              3 days of full access to all platforms. Then just $20/month for Pro.
            </p>
            <p className="mt-2 text-sm text-gray-400">
              Free tier: Threads & LinkedIn only (10 generations/month)
            </p>

            <div className="mt-8 flex flex-col items-center space-y-4">
              <a
                href="/sign-up"
                className="inline-flex items-center rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:shadow-purple-500/50 transition-all"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
              <p className="text-sm text-gray-400">
                No credit card required for trial
              </p>
            </div>

            <div className="mt-8 flex items-center justify-center space-x-6 text-sm text-gray-400">
              <span className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-400" />
                Cancel anytime
              </span>
              <span className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-400" />
                No setup fees
              </span>
              <span className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-400" />
                500 generations/mo
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-900/50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-6 w-6 text-purple-400" />
              <span className="text-xl font-bold text-white">ContentIQ</span>
            </div>
            <p className="text-sm text-gray-400">
              © 2025 ContentIQ. All rights reserved.
            </p>
            <div className="flex items-center space-x-6">
              <a href="/billing" className="text-sm text-gray-400 hover:text-white transition-colors">
                Pricing
              </a>
              <a href="/sign-in" className="text-sm text-gray-400 hover:text-white transition-colors">
                Sign In
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
