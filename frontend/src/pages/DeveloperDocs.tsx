import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function DeveloperDocs() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Header */}
      <div className="bg-[var(--color-glass-strong)] backdrop-blur-xl border-b border-[var(--color-separator)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/developer")}
              className="p-2 hover:bg-[var(--color-glass-medium)] rounded-xl transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Developer Documentation</h1>
              <p className="text-sm text-[var(--color-secondary-text)]">
                Build amazing apps on Sparkaph
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="glass rounded-2xl p-6 md:p-8 space-y-8">
          <section>
            <h2 className="text-3xl font-bold mb-4">Getting Started</h2>
            <p className="text-[var(--color-secondary-text)] mb-4">
              Welcome to Sparkaph! Build and deploy mini-apps in minutes.
            </p>
            <div className="space-y-4">
              <div className="bg-[var(--color-glass-medium)] p-4 rounded-xl">
                <h3 className="font-semibold mb-2">1. Create an App</h3>
                <p className="text-sm text-[var(--color-secondary-text)]">
                  Go to Developer Dashboard and click "Create New App"
                </p>
              </div>
              <div className="bg-[var(--color-glass-medium)] p-4 rounded-xl">
                <h3 className="font-semibold mb-2">2. Choose App Type</h3>
                <p className="text-sm text-[var(--color-secondary-text)]">
                  Select HOSTED for static files or EXTERNAL for API integration
                </p>
              </div>
              <div className="bg-[var(--color-glass-medium)] p-4 rounded-xl">
                <h3 className="font-semibold mb-2">3. Deploy</h3>
                <p className="text-sm text-[var(--color-secondary-text)]">
                  Upload your ZIP file (HOSTED) or configure your API endpoint (EXTERNAL)
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">HOSTED Apps</h2>
            <p className="text-[var(--color-secondary-text)] mb-4">
              Deploy static web applications directly on Sparkaph servers.
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">File Structure</h3>
                <div className="bg-[var(--color-glass-strong)] p-4 rounded-xl font-mono text-sm">
                  <pre className="text-[var(--color-text)]">{`myapp.zip
├── index.html    (required)
├── styles.css
├── script.js
└── assets/
    ├── logo.png
    └── icon.svg`}</pre>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Deployment Steps</h3>
                <ol className="list-decimal list-inside space-y-2 text-[var(--color-secondary-text)] ml-4">
                  <li>Create your app files (HTML, CSS, JS)</li>
                  <li>Compress all files into a ZIP archive</li>
                  <li>Go to Developer Dashboard → Your App → Deploy</li>
                  <li>Upload the ZIP file</li>
                  <li>Wait for deployment to complete</li>
                </ol>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">EXTERNAL Apps</h2>
            <p className="text-[var(--color-secondary-text)] mb-4">
              Connect your own server to Sparkaph using our API.
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">Setup</h3>
                <ol className="list-decimal list-inside space-y-2 text-[var(--color-secondary-text)] ml-4">
                  <li>Create an EXTERNAL app in Developer Dashboard</li>
                  <li>Set your app URL (where your app is hosted)</li>
                  <li>Generate an API token</li>
                  <li>Use the token to authenticate API requests</li>
                </ol>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">API Token</h3>
                <div className="bg-[var(--color-glass-strong)] p-4 rounded-xl">
                  <pre className="text-sm"><code>{`Authorization: Bearer YOUR_API_TOKEN`}</code></pre>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">API Reference</h2>
            <p className="text-[var(--color-secondary-text)] mb-4">
              Complete API documentation for Sparkaph platform.
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">Base URL</h3>
                <div className="bg-[var(--color-glass-strong)] p-4 rounded-xl">
                  <code className="text-[var(--color-ios-blue)]">https://api.sparkaph.com</code>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Endpoints</h3>
                <div className="space-y-3">
                  <div className="border border-[var(--color-separator)] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-green-500/20 text-green-500 rounded text-sm font-mono">GET</span>
                      <code className="text-[var(--color-text)]">/api/public/user</code>
                    </div>
                    <p className="text-sm text-[var(--color-secondary-text)]">Get current user information</p>
                  </div>
                  <div className="border border-[var(--color-separator)] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-500 rounded text-sm font-mono">POST</span>
                      <code className="text-[var(--color-text)]">/api/public/messages/send</code>
                    </div>
                    <p className="text-sm text-[var(--color-secondary-text)]">Send a message to a user</p>
                  </div>
                  <div className="border border-[var(--color-separator)] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-500 rounded text-sm font-mono">POST</span>
                      <code className="text-[var(--color-text)]">/api/public/storage/save</code>
                    </div>
                    <p className="text-sm text-[var(--color-secondary-text)]">Save data to app storage</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">Examples</h2>
            <p className="text-[var(--color-secondary-text)] mb-4">
              Real-world examples to get you started quickly.
            </p>
            <div className="space-y-4">
              <div className="bg-[var(--color-glass-medium)] p-4 rounded-xl">
                <h3 className="font-semibold mb-2">🎮 Game</h3>
                <p className="text-sm text-[var(--color-secondary-text)]">
                  Simple browser game with leaderboard
                </p>
              </div>
              <div className="bg-[var(--color-glass-medium)] p-4 rounded-xl">
                <h3 className="font-semibold mb-2">📝 Notes App</h3>
                <p className="text-sm text-[var(--color-secondary-text)]">
                  Note-taking app with cloud sync
                </p>
              </div>
              <div className="bg-[var(--color-glass-medium)] p-4 rounded-xl">
                <h3 className="font-semibold mb-2">🛒 E-commerce</h3>
                <p className="text-sm text-[var(--color-secondary-text)]">
                  Mini shop with Sparks payments
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
