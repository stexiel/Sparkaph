import { useNavigate } from "react-router-dom";
import { Globe, Code, Zap, Users, Shield, Rocket, Home } from "lucide-react";
import { Helmet } from "react-helmet";

export default function About() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>About Sparkaph - Modern Web Platform for Developers and Users</title>
        <meta name="description" content="Sparkaph is a modern web platform combining social networking with powerful developer tools. Build apps, connect with people, and create amazing experiences." />
        <meta name="keywords" content="Sparkaph, web platform, social network, developer platform, app hosting, API, messenger, web apps" />
        <meta property="og:title" content="About Sparkaph - Modern Web Platform" />
        <meta property="og:description" content="Social networking meets developer tools. Build and deploy apps, connect with users, and create amazing experiences on Sparkaph." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://sparkaph.com/about" />
      </Helmet>

      <div className="min-h-screen bg-[var(--color-background)]">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-ios-blue)]/20 via-[var(--color-ios-purple)]/20 to-[var(--color-ios-pink)]/20"></div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
            <button
              onClick={() => navigate("/")}
              className="mb-6 sm:mb-8 p-2 hover:bg-[var(--color-glass-medium)] rounded-xl transition-colors inline-flex items-center gap-2 text-sm sm:text-base"
            >
              <Home size={18} />
              <span>Back to Home</span>
            </button>

            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 px-4">
                Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-ios-blue)] to-[var(--color-ios-purple)]">Sparkaph</span>
              </h1>
              <p className="text-lg sm:text-xl lg:text-2xl text-[var(--color-secondary-text)] max-w-3xl mx-auto mb-6 sm:mb-8 px-4">
                A modern web platform where social networking meets powerful developer tools
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center px-4">
                <button
                  onClick={() => navigate("/register")}
                  className="btn-glass-primary px-6 sm:px-8 py-3 text-base sm:text-lg w-full sm:w-auto"
                >
                  Get Started
                </button>
                <button
                  onClick={() => navigate("/docs")}
                  className="btn-glass px-6 sm:px-8 py-3 text-base sm:text-lg w-full sm:w-auto"
                >
                  View Documentation
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* What is Sparkaph */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <div className="bg-[var(--color-glass-strong)] rounded-2xl sm:rounded-3xl border border-[var(--color-separator)] p-6 sm:p-8 lg:p-12 shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">What is Sparkaph?</h2>
            <div className="space-y-3 sm:space-y-4 text-[var(--color-secondary-text)] text-base sm:text-lg">
              <p>
                <strong className="text-[var(--color-text)]">Sparkaph</strong> is a next-generation web platform that combines the best of social networking 
                with powerful developer tools. We provide a space where users can connect, communicate, and share experiences, 
                while developers can build and deploy applications seamlessly.
              </p>
              <p>
                Our platform offers two distinct experiences: a rich social environment for users with messaging, 
                profiles, and content sharing, and a comprehensive developer ecosystem with app hosting, API access, 
                and deployment tools.
              </p>
              <p>
                Think of Sparkaph as a hybrid between a social network like Twitter/Instagram and a developer platform 
                like Telegram Bot API or Vercel - all in one unified experience.
              </p>
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">Key Features</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <FeatureCard
              icon={<Users className="text-[var(--color-ios-blue)]" size={32} />}
              title="Social Networking"
              description="Connect with people, share content, send messages, and build your community on Sparkaph."
            />
            <FeatureCard
              icon={<Code className="text-[var(--color-ios-purple)]" size={32} />}
              title="Developer Platform"
              description="Build and deploy apps with our powerful API. Host static sites or create backend applications."
            />
            <FeatureCard
              icon={<Zap className="text-[var(--color-ios-orange)]" size={32} />}
              title="Real-time Updates"
              description="Long polling support for real-time communication between your apps and Sparkaph platform."
            />
            <FeatureCard
              icon={<Globe className="text-[var(--color-ios-green)]" size={32} />}
              title="App Hosting"
              description="Deploy static web apps instantly. Upload a ZIP file and your app goes live on sparkaph.com."
            />
            <FeatureCard
              icon={<Shield className="text-[var(--color-ios-red)]" size={32} />}
              title="Secure API"
              description="Token-based authentication, user data isolation, and secure communication for all apps."
            />
            <FeatureCard
              icon={<Rocket className="text-[var(--color-ios-pink)]" size={32} />}
              title="Fast Deployment"
              description="Deploy apps in seconds. No complex configuration, no server management needed."
            />
          </div>
        </div>

        {/* For Users */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">For Users</h2>
              <div className="space-y-4 text-[var(--color-secondary-text)]">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[var(--color-ios-blue)] flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--color-text)] mb-1">Real-time Messaging</h3>
                    <p>Chat with friends, create groups, and stay connected with instant messaging.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[var(--color-ios-blue)] flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--color-text)] mb-1">Personal Profiles</h3>
                    <p>Create your profile, share your story, and connect with like-minded people.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[var(--color-ios-blue)] flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--color-text)] mb-1">Discover Apps</h3>
                    <p>Explore apps built by developers on Sparkaph platform and enhance your experience.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[var(--color-ios-blue)] flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--color-text)] mb-1">Sparks Currency</h3>
                    <p>Use Sparks to support developers and unlock premium features in apps.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[var(--color-glass-strong)] rounded-3xl border border-[var(--color-separator)] p-8 h-full flex items-center justify-center">
              <div className="text-center">
                <Users size={120} className="text-[var(--color-ios-blue)] mx-auto mb-6 opacity-50" />
                <p className="text-[var(--color-secondary-text)] text-lg">
                  Join thousands of users on Sparkaph
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* For Developers */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="bg-[var(--color-glass-strong)] rounded-3xl border border-[var(--color-separator)] p-8 h-full flex items-center justify-center order-2 lg:order-1">
              <div className="text-center">
                <Code size={120} className="text-[var(--color-ios-purple)] mx-auto mb-6 opacity-50" />
                <p className="text-[var(--color-secondary-text)] text-lg">
                  Build the next great app on Sparkaph
                </p>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold mb-6">For Developers</h2>
              <div className="space-y-4 text-[var(--color-secondary-text)]">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[var(--color-ios-purple)] flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--color-text)] mb-1">Two App Types</h3>
                    <p>Choose HOSTED (static files) or EXTERNAL (your backend) based on your needs.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[var(--color-ios-purple)] flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--color-text)] mb-1">Powerful API</h3>
                    <p>Access user data, store app-specific data, and integrate with Sparkaph features.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[var(--color-ios-purple)] flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--color-text)] mb-1">Instant Deployment</h3>
                    <p>Upload a ZIP file and your app is live. No complex setup or configuration.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[var(--color-ios-purple)] flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--color-text)] mb-1">Monetization</h3>
                    <p>Earn Sparks from users who love your apps. Set your own pricing.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Technology Stack */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <div className="bg-[var(--color-glass-strong)] rounded-2xl sm:rounded-3xl border border-[var(--color-separator)] p-6 sm:p-8 lg:p-12 shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center">Built with Modern Technology</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">Frontend</h3>
                <ul className="space-y-2 text-[var(--color-secondary-text)]">
                  <li>• React + TypeScript</li>
                  <li>• Vite for fast development</li>
                  <li>• Modern CSS with custom properties</li>
                  <li>• Responsive design for all devices</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4">Backend</h3>
                <ul className="space-y-2 text-[var(--color-secondary-text)]">
                  <li>• Node.js + Express</li>
                  <li>• PostgreSQL database</li>
                  <li>• Socket.IO for real-time communication</li>
                  <li>• RESTful API architecture</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <div className="bg-gradient-to-r from-[var(--color-ios-blue)] to-[var(--color-ios-purple)] rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center text-white shadow-2xl">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">Ready to get started?</h2>
            <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 opacity-90 max-w-2xl mx-auto">
              Join Sparkaph today and experience the future of web platforms
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center">
              <button
                onClick={() => navigate("/register")}
                className="bg-white text-[var(--color-ios-blue)] px-6 sm:px-8 py-3 rounded-xl font-semibold hover:bg-opacity-90 transition-all w-full sm:w-auto"
              >
                Create Account
              </button>
              <button
                onClick={() => navigate("/docs")}
                className="bg-white/20 backdrop-blur-sm text-white px-6 sm:px-8 py-3 rounded-xl font-semibold hover:bg-white/30 transition-all border border-white/30 w-full sm:w-auto"
              >
                Read Documentation
              </button>
            </div>
          </div>
        </div>

        {/* Smooth scroll style */}
        <style>{`
          html {
            scroll-behavior: smooth;
          }
          
          @media (prefers-reduced-motion: reduce) {
            html {
              scroll-behavior: auto;
            }
          }
        `}</style>
      </div>
    </>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-[var(--color-glass-strong)] rounded-xl sm:rounded-2xl border border-[var(--color-separator)] p-4 sm:p-6 hover:border-[var(--color-ios-blue)]/50 transition-all shadow-lg hover:shadow-xl">
      <div className="mb-3 sm:mb-4">{icon}</div>
      <h3 className="text-lg sm:text-xl font-semibold mb-2">{title}</h3>
      <p className="text-sm sm:text-base text-[var(--color-secondary-text)]">{description}</p>
    </div>
  );
}
