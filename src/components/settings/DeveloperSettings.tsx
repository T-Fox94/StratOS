import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Facebook, 
  Instagram, 
  Linkedin, 
  Twitter, 
  Save, 
  AlertCircle, 
  CheckCircle2,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { useAgencyStore } from '../../store/useAgencyStore';
import { cn, getApiUrl } from '../../lib/utils';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';

interface PlatformCredentials {
  clientId: string;
  clientSecret: string;
}

interface OAuthCredentials {
  [key: string]: PlatformCredentials;
}

export function DeveloperSettings() {
  const { theme } = useAgencyStore();
  const [credentials, setCredentials] = useState<OAuthCredentials>({
    facebook: { clientId: '', clientSecret: '' },
    instagram: { clientId: '', clientSecret: '' },
    linkedin: { clientId: '', clientSecret: '' },
    twitter: { clientId: '', clientSecret: '' },
    tiktok: { clientId: '', clientSecret: '' },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchCredentials = async () => {
      const path = 'settings/oauth_credentials';
      try {
        const docRef = doc(db, 'settings', 'oauth_credentials');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCredentials(prev => ({
            ...prev,
            ...docSnap.data()
          }));
        }
      } catch (error) {
        console.error("Error fetching credentials:", error);
        handleFirestoreError(error, OperationType.GET, path);
        toast.error("Failed to load existing credentials");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCredentials();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    const path = 'settings/oauth_credentials';
    try {
      // 1. Save to Firestore for client-side sync
      await setDoc(doc(db, 'settings', 'oauth_credentials'), credentials);
      
      // 2. Save to Prisma for server-side access (fixes PERMISSION_DENIED)
      await fetch(getApiUrl('/api/settings/oauth_credentials'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      toast.success("Credentials saved successfully! Your server will now use these for OAuth.");
    } catch (error) {
      console.error("Error saving credentials:", error);
      handleFirestoreError(error, OperationType.WRITE, path);
      toast.error("Failed to save credentials. Check your permissions.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateCredential = (platform: string, field: keyof PlatformCredentials, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: value
      }
    }));
  };

  const toggleSecret = (platform: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [platform]: !prev[platform]
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const platforms = [
    { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-600' },
    { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-600' },
    { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' },
    { id: 'twitter', label: 'Twitter', icon: Twitter, color: 'text-sky-500' },
    { id: 'tiktok', label: 'TikTok', icon: Shield, color: 'text-slate-900' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8 px-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Shield className="text-indigo-600" size={32} />
            Developer Settings
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Configure OAuth credentials for social media integrations</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg disabled:opacity-50"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save size={20} />
          )}
          Save Changes
        </button>
      </div>

      <div className={cn(
        "p-4 rounded-2xl border flex items-start gap-4",
        theme === 'dark' ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-300" : "bg-indigo-50 border-indigo-100 text-indigo-700"
      )}>
        <AlertCircle className="shrink-0 mt-0.5" size={20} />
        <div className="text-sm leading-relaxed">
          <p className="font-bold mb-1">Security Notice</p>
          <p>These credentials are stored in your database and used by the server to initiate OAuth flows. Ensure you only provide these to trusted administrators. If environment variables are set on the platform, they will take precedence over these values.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {platforms.map((platform) => (
          <div 
            key={platform.id}
            className={cn(
              "rounded-[32px] border p-8 transition-all",
              theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"
            )}
          >
            <div className="flex items-center gap-4 mb-8">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-100 dark:bg-slate-800")}>
                <platform.icon size={24} className={platform.color} />
              </div>
              <div>
                <h2 className={cn("text-xl font-bold", theme === 'dark' ? "text-white" : "text-slate-900")}>{platform.label}</h2>
                <p className="text-xs text-slate-500">Configure API access for {platform.label}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Client ID / App ID</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Key size={18} />
                  </div>
                  <input
                    type="text"
                    value={credentials[platform.id]?.clientId || ''}
                    onChange={(e) => updateCredential(platform.id, 'clientId', e.target.value)}
                    placeholder={`Enter ${platform.label} Client ID`}
                    className={cn(
                      "w-full pl-12 pr-4 py-3 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-indigo-500",
                      theme === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Client Secret / App Secret</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Shield size={18} />
                  </div>
                  <input
                    type={showSecrets[platform.id] ? "text" : "password"}
                    value={credentials[platform.id]?.clientSecret || ''}
                    onChange={(e) => updateCredential(platform.id, 'clientSecret', e.target.value)}
                    placeholder={`Enter ${platform.label} Client Secret`}
                    className={cn(
                      "w-full pl-12 pr-12 py-3 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-indigo-500",
                      theme === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    )}
                  />
                  <button
                    onClick={() => toggleSecret(platform.id)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showSecrets[platform.id] ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center pt-8">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <CheckCircle2 size={16} className="text-emerald-500" />
          <span>All changes are applied in real-time to the OAuth server.</span>
        </div>
      </div>
    </div>
  );
}
