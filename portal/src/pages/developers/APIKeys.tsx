import { useState } from 'react';
import { Key, Eye, EyeOff, Copy, CheckCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { Card, Button, Modal, useToast } from '../../components/ui';
import { useAPIKeys } from '../../hooks';

export function APIKeys() {
  const { success } = useToast();
  const [revealedKey, setRevealedKey] = useState(false);
  const [copiedItem, setCopiedItem] = useState<'key' | 'secret' | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [newlyGeneratedKeys, setNewlyGeneratedKeys] = useState<{ api_key: string; api_secret: string } | null>(null);

  // Use SDK hook for API keys
  const { apiKey, apiSecret, hasKeys, generateKeys, generating, loading } = useAPIKeys();

  const toggleReveal = () => {
    setRevealedKey(!revealedKey);
  };

  const copyToClipboard = (text: string, type: 'key' | 'secret') => {
    navigator.clipboard.writeText(text);
    setCopiedItem(type);
    setTimeout(() => setCopiedItem(null), 2000);
    success(`API ${type} copied to clipboard`);
  };

  const handleGenerateKeys = async () => {
    try {
      // Hook returns the generation response including secret
      const result = await generateKeys();

      if (result && result.success) {
        setNewlyGeneratedKeys({
          api_key: result.api_key,
          api_secret: result.api_secret
        });
        setShowGenerateModal(false);
        setShowSecretModal(true);
      }
    } catch (err) {
      // Error already shown by hook
    }
  };

  const handleCloseSecretModal = () => {
    setShowSecretModal(false);
    setNewlyGeneratedKeys(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">API Keys</h2>
          <p className="text-sm text-slate-500 mt-1">Manage your API keys for authentication</p>
        </div>
        <Button onClick={() => setShowGenerateModal(true)}>
          <RefreshCw className="w-4 h-4" />
          {hasKeys ? 'Regenerate Keys' : 'Generate Keys'}
        </Button>
      </div>

      {hasKeys ? (
        <Card>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Key className="w-5 h-5 text-slate-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-slate-900">API Key</p>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <code className="text-sm font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded">
                    {revealedKey ? apiKey : `${apiKey?.substring(0, 8)}${'•'.repeat(24)}`}
                  </code>
                  <button
                    onClick={toggleReveal}
                    className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                  >
                    {revealedKey ? (
                      <EyeOff className="w-4 h-4 text-slate-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                  <button
                    onClick={() => copyToClipboard(apiKey!, 'key')}
                    className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                  >
                    {copiedItem === 'key' ? (
                      <CheckCircle className="w-4 h-4 text-success-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Use this key in the Authorization header for API requests
                </p>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="bg-slate-50 border-slate-200">
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Key className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-medium text-slate-900 mb-1">No API Keys Generated</h3>
            <p className="text-sm text-slate-500 mb-4">
              Generate your API keys to start making authenticated requests
            </p>
            <Button onClick={() => setShowGenerateModal(true)}>
              Generate API Keys
            </Button>
          </div>
        </Card>
      )}

      <Card className="bg-slate-50 border-slate-200">
        <h3 className="text-sm font-medium text-slate-900 mb-3">Quick Start</h3>
        <p className="text-sm text-slate-600 mb-4">
          Use your API key to authenticate requests. Include it in the Authorization header.
        </p>
        <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
          <pre className="text-sm text-slate-100 font-mono">
            {`curl https://setl.us/api/method/order \\
  -H "Authorization: Token {API_KEY}:{API_SECRET}" \\
  -H "Content-Type: application/json"`}
          </pre>
        </div>
      </Card>

      {/* Generate/Regenerate Warning Modal */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        title={hasKeys ? "Regenerate API Keys" : "Generate API Keys"}
        description={hasKeys ? "This will invalidate your current keys" : "Create new API keys for authentication"}
      >
        <div className="space-y-4">
          <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-warning-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-warning-800">
                  {hasKeys ? "This action will invalidate your current keys" : "Important: Save your API secret"}
                </p>
                <p className="text-sm text-warning-700 mt-1">
                  {hasKeys
                    ? "Any applications using the current keys will stop working immediately. Make sure to update your integrations with the new keys."
                    : "The API secret will only be shown once. Make sure to copy and save it securely before closing this dialog."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowGenerateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateKeys} disabled={generating}>
              {generating ? 'Generating...' : hasKeys ? 'Regenerate Keys' : 'Generate Keys'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* New Keys Display Modal (One-time secret display) */}
      <Modal
        isOpen={showSecretModal}
        onClose={handleCloseSecretModal}
        title="API Keys Generated Successfully"
        description="Save your API secret now - it won't be shown again"
      >
        <div className="space-y-4">
          <div className="p-4 bg-success-50 border border-success-200 rounded-lg">
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-success-800">
                  Your API keys have been generated
                </p>
                <p className="text-sm text-success-700 mt-1">
                  Make sure to copy your API secret now. You won't be able to see it again!
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">API Key</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono text-slate-600 bg-slate-100 px-3 py-2 rounded border border-slate-200">
                  {newlyGeneratedKeys?.api_key}
                </code>
                <button
                  onClick={() => copyToClipboard(newlyGeneratedKeys!.api_key, 'key')}
                  className="p-2 hover:bg-slate-100 rounded transition-colors"
                >
                  {copiedItem === 'key' ? (
                    <CheckCircle className="w-4 h-4 text-success-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">
                API Secret <span className="text-warning-600">(Save this now!)</span>
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono text-slate-600 bg-warning-50 px-3 py-2 rounded border border-warning-200">
                  {newlyGeneratedKeys?.api_secret}
                </code>
                <button
                  onClick={() => copyToClipboard(newlyGeneratedKeys!.api_secret, 'secret')}
                  className="p-2 hover:bg-slate-100 rounded transition-colors"
                >
                  {copiedItem === 'secret' ? (
                    <CheckCircle className="w-4 h-4 text-success-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </div>
              <p className="text-xs text-warning-600 mt-1">
                ⚠️ This secret will not be shown again. Copy it now!
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleCloseSecretModal}>
              I've Saved My Keys
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
