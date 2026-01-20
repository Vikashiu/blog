
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Key, User, Bell, Shield, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';

interface SettingsPageProps {
  onViewChange: (view: string) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onViewChange }) => {
  const { user } = useStore();
  const [activeTab, setActiveTab] = useState('account');
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // In a real app, don't expose env vars to client input state like this usually
    // But this allows user to override
    const storedKey = localStorage.getItem('GEMINI_API_KEY');
    if (storedKey) setApiKey(storedKey);
  }, []);

  const handleSaveKey = () => {
    setIsSaving(true);
    setTimeout(() => {
        if (apiKey.trim()) {
            localStorage.setItem('GEMINI_API_KEY', apiKey);
        } else {
            localStorage.removeItem('GEMINI_API_KEY');
        }
        setIsSaving(false);
        alert('Configuration saved.');
    }, 800);
  };

  const tabs = [
    { id: 'account', label: 'General', icon: User },
    { id: 'api', label: 'API Configuration', icon: Key },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#050505] text-neutral-900 dark:text-white p-6 md:p-12 transition-colors duration-300">
        <div className="max-w-4xl mx-auto">
             <div className="flex items-center gap-4 mb-10">
                <button 
                    onClick={() => onViewChange('dashboard')} 
                    className="p-2 rounded-lg bg-neutral-200 dark:bg-white/5 hover:bg-neutral-300 dark:hover:bg-white/10 transition-colors text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">Settings</h1>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar */}
                <div className="w-full md:w-64 flex-shrink-0 space-y-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                                activeTab === tab.id ? 'bg-white dark:bg-white/10 text-orange-600 dark:text-white shadow-sm dark:shadow-none' : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'
                            }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-white/5 rounded-2xl p-8 min-h-[400px] shadow-sm dark:shadow-none">
                    
                    {activeTab === 'account' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-bold mb-1 text-neutral-900 dark:text-white">Profile Information</h3>
                                <p className="text-sm text-neutral-500">Update your public profile details.</p>
                            </div>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Display Name</label>
                                        <input 
                                            type="text" 
                                            defaultValue={user.name} 
                                            className="w-full bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-white/10 rounded-lg p-3 text-sm focus:border-orange-500 outline-none text-neutral-900 dark:text-white" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Email</label>
                                        <input 
                                            type="email" 
                                            defaultValue={user.email} 
                                            disabled 
                                            className="w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 rounded-lg p-3 text-sm text-neutral-500 cursor-not-allowed" 
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Bio</label>
                                    <textarea 
                                        className="w-full bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-white/10 rounded-lg p-3 text-sm focus:border-orange-500 outline-none h-32 resize-none text-neutral-900 dark:text-white"
                                        placeholder="Tell the world about yourself..."
                                    ></textarea>
                                </div>
                                <div className="pt-4">
                                    <button className="px-6 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black font-bold rounded hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors">
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'api' && (
                        <div className="space-y-6">
                             <div>
                                <h3 className="text-xl font-bold mb-1 text-neutral-900 dark:text-white">Model Configuration</h3>
                                <p className="text-sm text-neutral-500">Manage your connection to the Gemini engine.</p>
                            </div>

                            <div className="p-4 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-lg flex items-start gap-3">
                                <Shield className="text-orange-600 dark:text-orange-500 mt-0.5" size={20} />
                                <div>
                                    <h4 className="font-bold text-orange-600 dark:text-orange-500 text-sm">Secure Storage</h4>
                                    <p className="text-neutral-600 dark:text-neutral-400 text-xs mt-1 leading-relaxed">
                                        Your API key is stored locally in your browser and is never sent to our servers. 
                                        It is used directly to authenticate requests to Google's GenAI API.
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Gemini API Key</label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
                                    <input 
                                        type="password" 
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder="sk-..." 
                                        className="w-full bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-white/10 rounded-lg py-3 pl-10 pr-4 text-sm focus:border-orange-500 outline-none font-mono text-neutral-900 dark:text-white" 
                                    />
                                </div>
                                <p className="text-xs text-neutral-600 mt-2">
                                    Required for Pro features like Image Generation 2.0 and Deep Reasoning.
                                </p>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button 
                                    onClick={handleSaveKey}
                                    disabled={isSaving}
                                    className="px-6 py-2 bg-orange-500 text-white dark:text-black font-bold rounded hover:bg-orange-600 transition-colors flex items-center gap-2"
                                >
                                    {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                    Save Configuration
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="text-center py-20">
                            <Bell size={48} className="mx-auto text-neutral-300 dark:text-neutral-800 mb-4" />
                            <h3 className="text-lg font-bold text-neutral-500">Notifications are managed system-wide.</h3>
                        </div>
                    )}

                </div>
            </div>
        </div>
    </div>
  );
};

export default SettingsPage;
