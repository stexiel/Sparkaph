import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Code, Zap, Globe, Server, Book, Home } from "lucide-react";
import { Helmet } from "react-helmet";

export default function PublicDocs() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("getting-started");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { id: "getting-started", label: "Getting Started", icon: Book },
    { id: "hosted", label: "Hosted Apps", icon: Globe },
    { id: "external", label: "External Apps", icon: Server },
    { id: "api", label: "API Reference", icon: Code },
    { id: "examples", label: "Examples", icon: Zap },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Helmet>
        <title>Sparkaph Developer Documentation - Build Apps on Sparkaph Platform</title>
        <meta name="description" content="Complete developer documentation for Sparkaph platform. Learn how to build HOSTED and EXTERNAL apps, use our API, and deploy your applications." />
        <meta name="keywords" content="Sparkaph, developer, API, documentation, hosted apps, external apps, web platform, app development" />
        <meta property="og:title" content="Sparkaph Developer Documentation" />
        <meta property="og:description" content="Build amazing apps on Sparkaph platform. Complete API documentation and examples." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://sparkaph.com/docs" />
      </Helmet>

      <div className="min-h-screen bg-[var(--color-background)]">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-[var(--color-glass-strong)] backdrop-blur-xl border-b border-[var(--color-separator)] shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-4">
                <button
                  onClick={() => navigate("/")}
                  className="p-2 hover:bg-[var(--color-glass-medium)] rounded-xl transition-colors"
                  aria-label="Go home"
                >
                  <Home size={20} />
                </button>
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold">Developer Docs</h1>
                  <p className="hidden sm:block text-xs sm:text-sm text-[var(--color-secondary-text)]">
                    Build amazing apps on Sparkaph
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate("/login")}
                className="btn-glass-primary px-3 sm:px-4 py-2 text-xs sm:text-sm"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Mobile Menu Button */}
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-[var(--color-glass-strong)] rounded-xl border border-[var(--color-separator)]"
              >
                <span className="font-medium">
                  {tabs.find(t => t.id === activeTab)?.label}
                </span>
                <span className="text-xl">{mobileMenuOpen ? '×' : '☰'}</span>
              </button>
              
              {mobileMenuOpen && (
                <div className="mt-2 space-y-2 bg-[var(--color-glass-strong)] rounded-xl border border-[var(--color-separator)] p-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          activeTab === tab.id
                            ? "bg-[var(--color-ios-blue)] text-white"
                            : "hover:bg-[var(--color-glass-medium)] text-[var(--color-text)]"
                        }`}
                      >
                        <Icon size={20} />
                        <span className="font-medium">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="sticky top-24 space-y-2 max-h-[calc(100vh-120px)] overflow-y-auto pr-2 scrollbar-thin">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        activeTab === tab.id
                          ? "bg-[var(--color-ios-blue)] text-white shadow-lg"
                          : "hover:bg-[var(--color-glass-medium)] text-[var(--color-text)]"
                      }`}
                    >
                      <Icon size={20} />
                      <span className="font-medium text-sm">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="lg:col-span-3">
              <div className="bg-[var(--color-glass-strong)] rounded-2xl sm:rounded-3xl border border-[var(--color-separator)] p-4 sm:p-6 lg:p-8 shadow-xl">
                <div className="prose prose-invert max-w-none">
                  {activeTab === "getting-started" && <GettingStarted />}
                  {activeTab === "hosted" && <HostedApps />}
                  {activeTab === "external" && <ExternalApps />}
                  {activeTab === "api" && <APIReference />}
                  {activeTab === "examples" && <Examples />}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Custom scrollbar styles */}
        <style>{`
          .scrollbar-thin::-webkit-scrollbar {
            width: 6px;
          }
          .scrollbar-thin::-webkit-scrollbar-track {
            background: transparent;
          }
          .scrollbar-thin::-webkit-scrollbar-thumb {
            background: var(--color-separator);
            border-radius: 3px;
          }
          .scrollbar-thin::-webkit-scrollbar-thumb:hover {
            background: var(--color-ios-blue);
          }
          
          .prose {
            scroll-behavior: smooth;
          }
          
          .prose h2 {
            scroll-margin-top: 100px;
          }
          
          .prose h3 {
            scroll-margin-top: 100px;
          }
          
          .prose pre {
            overflow-x: auto;
            max-width: 100%;
          }
          
          .prose code {
            word-break: break-word;
          }
        `}</style>
      </div>
    </>
  );
}

// Same content components as DeveloperDocs but with SEO optimization
function GettingStarted() {
  return (
    <div className="prose prose-invert max-w-none">
      <h2 className="text-3xl font-bold mb-6">Getting Started with Sparkaph Platform</h2>
      
      <div className="space-y-6">
        <section>
          <h3 className="text-xl font-semibold mb-3">What is Sparkaph?</h3>
          <p className="text-[var(--color-secondary-text)] mb-4">
            Sparkaph is a modern web platform that allows developers to build and deploy applications in two ways:
            HOSTED apps (static files) and EXTERNAL apps (backend applications with API access).
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            <div className="bg-[var(--color-glass-medium)] p-6 rounded-2xl border border-[var(--color-separator)]">
              <div className="flex items-center gap-3 mb-3">
                <Globe className="text-[var(--color-ios-blue)]" size={24} />
                <h4 className="font-semibold text-lg">HOSTED Apps</h4>
              </div>
              <p className="text-sm text-[var(--color-secondary-text)]">
                Upload your static HTML/CSS/JS files. We host them for you on Sparkaph servers.
              </p>
              <ul className="mt-3 space-y-1 text-sm text-[var(--color-secondary-text)]">
                <li>✓ Simple ZIP upload deployment</li>
                <li>✓ Free hosting on sparkaph.com</li>
                <li>✓ Perfect for frontend applications</li>
                <li>✓ No server management needed</li>
              </ul>
            </div>

            <div className="bg-[var(--color-glass-medium)] p-6 rounded-2xl border border-[var(--color-separator)]">
              <div className="flex items-center gap-3 mb-3">
                <Server className="text-[var(--color-ios-orange)]" size={24} />
                <h4 className="font-semibold text-lg">EXTERNAL Apps</h4>
              </div>
              <p className="text-sm text-[var(--color-secondary-text)]">
                Run your app on YOUR server. Use Sparkaph API like Telegram Bot API.
              </p>
              <ul className="mt-3 space-y-1 text-sm text-[var(--color-secondary-text)]">
                <li>✓ Full backend control</li>
                <li>✓ Use any programming language</li>
                <li>✓ Long polling for real-time updates</li>
                <li>✓ Secure API token authentication</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Quick Start Guide</h3>
          <ol className="space-y-3 text-[var(--color-secondary-text)]">
            <li><strong>1. Create Account:</strong> Register on Sparkaph platform</li>
            <li><strong>2. Enable Developer Mode:</strong> Go to Settings → Developer Mode</li>
            <li><strong>3. Create App:</strong> Visit Developer Dashboard and click "Create New App"</li>
            <li><strong>4. Choose Type:</strong> Select HOSTED (static) or EXTERNAL (backend)</li>
            <li><strong>5. Deploy:</strong> Upload ZIP or use API token</li>
          </ol>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Key Features</h3>
          <ul className="space-y-2 text-[var(--color-secondary-text)]">
            <li>🚀 <strong>Fast Deployment:</strong> Deploy apps in seconds</li>
            <li>🔒 <strong>Secure API:</strong> Token-based authentication</li>
            <li>📊 <strong>Real-time Updates:</strong> Long polling support</li>
            <li>💾 <strong>User Data Storage:</strong> Store user-specific data</li>
            <li>🌐 <strong>Custom Domains:</strong> Use your app handle as subdomain</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function HostedApps() {
  return (
    <div className="prose prose-invert max-w-none">
      <h2 className="text-3xl font-bold mb-6">HOSTED Apps Documentation</h2>
      
      <div className="space-y-6">
        <section>
          <h3 className="text-xl font-semibold mb-3">What are HOSTED apps?</h3>
          <p className="text-[var(--color-secondary-text)]">
            HOSTED apps are static web applications (HTML, CSS, JavaScript) that Sparkaph hosts on its servers.
            Perfect for frontend applications, landing pages, portfolios, and interactive web experiences.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Deployment Process</h3>
          <div className="bg-[var(--color-glass-medium)] p-6 rounded-2xl border border-[var(--color-separator)]">
            <p className="text-sm text-[var(--color-secondary-text)] mb-4">
              <strong>Step 1:</strong> Create a ZIP file with your application files:
            </p>
            <pre className="bg-black/50 p-4 rounded-xl overflow-x-auto text-sm">
{`my-app/
├── index.html    (required - entry point)
├── style.css
├── script.js
├── assets/
│   ├── logo.png
│   └── background.jpg
└── lib/
    └── framework.js`}
            </pre>
            <p className="text-sm text-[var(--color-secondary-text)] mt-4">
              <strong>Step 2:</strong> Upload ZIP in Developer Dashboard<br/>
              <strong>Step 3:</strong> Your app will be live at: <code className="text-[var(--color-ios-blue)]">https://sparkaph.com/your-handle</code>
            </p>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Technical Requirements</h3>
          <ul className="space-y-2 text-[var(--color-secondary-text)]">
            <li>✓ Must contain <code>index.html</code> file (in root or subdirectory)</li>
            <li>✓ Maximum ZIP file size: 50MB</li>
            <li>✓ Supported files: HTML, CSS, JS, images, fonts</li>
            <li>✓ No server-side code (PHP, Python, etc.)</li>
            <li>✓ All paths should be relative</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Best Practices</h3>
          <ul className="space-y-2 text-[var(--color-secondary-text)]">
            <li>📦 Keep ZIP file size small for faster deployment</li>
            <li>🖼️ Optimize images before uploading</li>
            <li>📱 Make your app responsive for mobile devices</li>
            <li>⚡ Minify CSS and JavaScript for better performance</li>
            <li>🔗 Use relative paths for all resources</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function ExternalApps() {
  return (
    <div className="prose prose-invert max-w-none">
      <h2 className="text-3xl font-bold mb-6">EXTERNAL Apps Documentation</h2>
      
      <div className="space-y-6">
        <section>
          <h3 className="text-xl font-semibold mb-3">What are EXTERNAL apps?</h3>
          <p className="text-[var(--color-secondary-text)]">
            EXTERNAL apps run on YOUR server (like Telegram Bots). Sparkaph provides an API token for authentication
            and access to platform features. Perfect for backend applications, bots, and complex services.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Getting Started</h3>
          <div className="bg-[var(--color-glass-medium)] p-6 rounded-2xl border border-[var(--color-separator)] space-y-4">
            <div>
              <p className="text-sm font-semibold mb-2">1. Create EXTERNAL app in Developer Dashboard</p>
              <p className="text-sm text-[var(--color-secondary-text)]">
                You'll automatically receive an API token for authentication
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">2. Use the API token in your application</p>
              <pre className="bg-black/50 p-4 rounded-xl overflow-x-auto text-sm mt-2">
{`const API_TOKEN = 'your-token-here';
const SPARKAPH_API = 'https://sparkaph.com/api';

// Make authenticated requests
fetch(\`\${SPARKAPH_API}/sdk/user/me\`, {
  headers: {
    'Authorization': \`Bearer \${API_TOKEN}\`
  }
})`}
              </pre>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Long Polling (Recommended)</h3>
          <p className="text-[var(--color-secondary-text)] mb-4">
            Get real-time updates from Sparkaph using long polling (similar to Telegram Bot API getUpdates):
          </p>
          <pre className="bg-black/50 p-6 rounded-xl overflow-x-auto text-sm">
{`// Long polling loop
let offset = 0;

while (true) {
  const response = await fetch(
    \`\${SPARKAPH_API}/polling/getUpdates?offset=\${offset}&timeout=30\`,
    { headers: { 'Authorization': \`Bearer \${API_TOKEN}\` } }
  );
  
  const { result } = await response.json();
  
  for (const update of result) {
    console.log('New update:', update);
    offset = update.update_id + 1;
    
    // Handle the update
    handleUpdate(update);
  }
}`}
          </pre>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Webhook (Optional)</h3>
          <p className="text-[var(--color-secondary-text)]">
            Alternatively, you can set a webhook URL to receive push notifications. Requires HTTPS and a public URL.
          </p>
        </section>
      </div>
    </div>
  );
}

function APIReference() {
  return (
    <div className="prose prose-invert max-w-none">
      <h2 className="text-3xl font-bold mb-6">Sparkaph API Reference</h2>
      
      <div className="space-y-6">
        <section>
          <h3 className="text-xl font-semibold mb-3">Base URL</h3>
          <pre className="bg-black/50 p-4 rounded-xl">
            https://sparkaph.com/api
          </pre>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Authentication</h3>
          <p className="text-[var(--color-secondary-text)] mb-4">
            All API requests require your API token in the Authorization header:
          </p>
          <pre className="bg-black/50 p-4 rounded-xl text-sm">
{`Authorization: Bearer YOUR_API_TOKEN`}
          </pre>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Available Endpoints</h3>
          
          <div className="space-y-4">
            {/* GET /sdk/user/me */}
            <div className="bg-[var(--color-glass-medium)] p-6 rounded-2xl border border-[var(--color-separator)]">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 bg-[var(--color-ios-green)] text-white text-xs font-semibold rounded-lg">GET</span>
                <code className="text-sm">/sdk/user/me</code>
              </div>
              <p className="text-sm text-[var(--color-secondary-text)] mb-3">
                Get information about the current authenticated user
              </p>
              <p className="text-xs text-[var(--color-tertiary-text)] mb-2">Response:</p>
              <pre className="bg-black/50 p-4 rounded-xl text-xs overflow-x-auto">
{`{
  "id": "user-id",
  "username": "john_doe",
  "nickname": "John Doe",
  "avatar": "https://...",
  "email": "john@example.com"
}`}
              </pre>
            </div>

            {/* GET /sdk/data */}
            <div className="bg-[var(--color-glass-medium)] p-6 rounded-2xl border border-[var(--color-separator)]">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 bg-[var(--color-ios-green)] text-white text-xs font-semibold rounded-lg">GET</span>
                <code className="text-sm">/sdk/data?key=posts</code>
              </div>
              <p className="text-sm text-[var(--color-secondary-text)] mb-3">
                Retrieve user-specific data stored for your app
              </p>
              <pre className="bg-black/50 p-4 rounded-xl text-xs overflow-x-auto">
{`{
  "key": "posts",
  "value": "[{\"id\":1,\"content\":\"Hello\"}]"
}`}
              </pre>
            </div>

            {/* POST /sdk/data */}
            <div className="bg-[var(--color-glass-medium)] p-6 rounded-2xl border border-[var(--color-separator)]">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 bg-[var(--color-ios-blue)] text-white text-xs font-semibold rounded-lg">POST</span>
                <code className="text-sm">/sdk/data</code>
              </div>
              <p className="text-sm text-[var(--color-secondary-text)] mb-3">
                Save user-specific data for your app
              </p>
              <p className="text-xs text-[var(--color-tertiary-text)] mb-2">Request Body:</p>
              <pre className="bg-black/50 p-4 rounded-xl text-xs overflow-x-auto">
{`{
  "key": "posts",
  "value": "[{\"id\":1,\"content\":\"Hello\"}]"
}`}
              </pre>
            </div>

            {/* GET /polling/getUpdates */}
            <div className="bg-[var(--color-glass-medium)] p-6 rounded-2xl border border-[var(--color-separator)]">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 bg-[var(--color-ios-green)] text-white text-xs font-semibold rounded-lg">GET</span>
                <code className="text-sm">/polling/getUpdates</code>
              </div>
              <p className="text-sm text-[var(--color-secondary-text)] mb-3">
                Long polling endpoint for receiving real-time updates
              </p>
              <p className="text-xs text-[var(--color-tertiary-text)] mb-2">Query Parameters:</p>
              <ul className="text-xs text-[var(--color-secondary-text)] space-y-1 mb-3">
                <li>• <code>offset</code> (number) - ID of last received update</li>
                <li>• <code>limit</code> (number) - Maximum updates to return (default: 100)</li>
                <li>• <code>timeout</code> (number) - Wait time in seconds (default: 30, max: 60)</li>
              </ul>
              <pre className="bg-black/50 p-4 rounded-xl text-xs overflow-x-auto">
{`{
  "ok": true,
  "result": [
    {
      "update_id": 1,
      "type": "message",
      "data": {...},
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  ]
}`}
              </pre>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Examples() {
  return (
    <div className="prose prose-invert max-w-none">
      <h2 className="text-3xl font-bold mb-6">Code Examples</h2>
      
      <div className="space-y-6">
        <section>
          <h3 className="text-xl font-semibold mb-3">Node.js / Express Example</h3>
          <pre className="bg-black/50 p-6 rounded-xl overflow-x-auto text-sm">
{`const express = require('express');
const app = express();

const API_TOKEN = 'your-api-token-here';
const SPARKAPH_API = 'https://sparkaph.com/api';

// Get current user
app.get('/api/user', async (req, res) => {
  const response = await fetch(\`\${SPARKAPH_API}/sdk/user/me\`, {
    headers: { 'Authorization': \`Bearer \${API_TOKEN}\` }
  });
  const user = await response.json();
  res.json(user);
});

// Save user data
app.post('/api/save', async (req, res) => {
  const { key, value } = req.body;
  
  const response = await fetch(\`\${SPARKAPH_API}/sdk/data\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${API_TOKEN}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ key, value })
  });
  
  res.json(await response.json());
});

app.listen(4000, () => {
  console.log('Server running on port 4000');
});`}
          </pre>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Python / Flask Example</h3>
          <pre className="bg-black/50 p-6 rounded-xl overflow-x-auto text-sm">
{`import requests
from flask import Flask, jsonify

app = Flask(__name__)

API_TOKEN = 'your-api-token-here'
SPARKAPH_API = 'https://sparkaph.com/api'
headers = {'Authorization': f'Bearer {API_TOKEN}'}

@app.route('/api/user')
def get_user():
    response = requests.get(
        f'{SPARKAPH_API}/sdk/user/me',
        headers=headers
    )
    return jsonify(response.json())

@app.route('/api/save', methods=['POST'])
def save_data():
    data = request.json
    response = requests.post(
        f'{SPARKAPH_API}/sdk/data',
        headers={**headers, 'Content-Type': 'application/json'},
        json=data
    )
    return jsonify(response.json())

if __name__ == '__main__':
    app.run(port=4000)`}
          </pre>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Simple HTML HOSTED App</h3>
          <pre className="bg-black/50 p-6 rounded-xl overflow-x-auto text-sm">
{`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Sparkaph App</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
        }
        h1 { color: #667eea; }
    </style>
</head>
<body>
    <h1>🚀 Hello from Sparkaph!</h1>
    <p>This is a HOSTED app running on Sparkaph platform.</p>
    <div id="content"></div>
    
    <script>
        // Your app logic here
        document.getElementById('content').innerHTML = 
            '<p>Build amazing things with Sparkaph!</p>';
    </script>
</body>
</html>`}
          </pre>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Long Polling Example</h3>
          <pre className="bg-black/50 p-6 rounded-xl overflow-x-auto text-sm">
{`// Long polling for real-time updates
async function startLongPolling() {
  let offset = 0;
  
  while (true) {
    try {
      const response = await fetch(
        \`\${SPARKAPH_API}/polling/getUpdates?offset=\${offset}&timeout=30\`,
        {
          headers: { 'Authorization': \`Bearer \${API_TOKEN}\` }
        }
      );
      
      const { result } = await response.json();
      
      for (const update of result) {
        console.log('New update:', update);
        offset = update.update_id + 1;
        
        // Process the update
        await handleUpdate(update);
      }
    } catch (error) {
      console.error('Polling error:', error);
      // Wait 5 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

function handleUpdate(update) {
  // Your update handling logic
  console.log('Processing update:', update.type, update.data);
}

// Start polling
startLongPolling();`}
          </pre>
        </section>
      </div>
    </div>
  );
}
