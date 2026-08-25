import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '@/services/auth.service';
import { ProviderGuide } from './ProviderGuide';
import type { AIProviderConfig } from '@/types/auth';

const aiSettingsSchema = z.object({
  provider: z.enum(['claude', 'gemini', 'openai']),
  model: z.string().min(1, 'Select a model'),
  apiKey: z.string().min(1, 'API key is required'),
});

type AISettingsFormData = z.infer<typeof aiSettingsSchema>;

const AVAILABLE_MODELS: Record<string, string[]> = {
  claude: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
  gemini: ['gemini-pro', 'gemini-pro-vision'],
  openai: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
};

export function AISettingsPanel() {
  const [configs, setConfigs] = useState<AIProviderConfig[]>([]);
  const [activeConfig, setActiveConfig] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<AISettingsFormData>({
    resolver: zodResolver(aiSettingsSchema),
    defaultValues: {
      provider: 'claude',
    },
  });

  const selectedProvider = watch('provider');

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const data = await authService.getAIProviderConfigs();
      setConfigs(data);
      const active = data.find((c) => c.isActive);
      setActiveConfig(active?.id || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configs');
    }
  };

  const onSubmit = async (data: AISettingsFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const config = await authService.saveAIProviderConfig(
        data.provider,
        data.model,
        data.apiKey
      );

      setConfigs((prev) => [...prev, config]);
      setSuccess(true);
      reset();

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivate = async (configId: string) => {
    try {
      await authService.setActiveAIProvider(configId);
      setActiveConfig(configId);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate provider');
    }
  };

  const handleDelete = async (configId: string) => {
    try {
      await authService.deleteAIProviderConfig(configId);
      setConfigs((prev) => prev.filter((c) => c.id !== configId));
      if (activeConfig === configId) {
        setActiveConfig(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete config');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold mb-4">הגדרות AI</h2>
        <p className="text-gray-600 mb-6">
          בחר ספק AI ויעלה את שלך API Key כדי להתחיל. אנחנו לעולם לא חושפים מפתחות ל-client.
        </p>
      </div>

      {/* Add New Provider */}
      <form onSubmit={handleSubmit(onSubmit)} className="border rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold">הוסף ספק AI חדש</h3>

        <div>
          <label className="block text-sm font-medium mb-1">ספק</label>
          <select
            {...register('provider')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="claude">Claude (Anthropic)</option>
            <option value="gemini">Gemini (Google)</option>
            <option value="openai">OpenAI</option>
          </select>
          {errors.provider && <p className="text-red-600 text-sm mt-1">{errors.provider.message}</p>}
        </div>

        {/* Provider Guide */}
        <ProviderGuide provider={selectedProvider as 'claude' | 'gemini' | 'openai'} />

        <div>
          <label className="block text-sm font-medium mb-1">מודל</label>
          <select
            {...register('model')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {AVAILABLE_MODELS[selectedProvider]?.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
          {errors.model && <p className="text-red-600 text-sm mt-1">{errors.model.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">API Key</label>
          <input
            type="password"
            {...register('apiKey')}
            placeholder="Your API key (never logged or shared)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.apiKey && <p className="text-red-600 text-sm mt-1">{errors.apiKey.message}</p>}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
            ✓ הגדרות נשמרו בהצלחה
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : 'Save Settings'}
        </button>
      </form>

      {/* Active Providers */}
      {configs.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">שלך ספקים</h3>
          {configs.map((config) => (
            <div key={config.id} className="flex items-center justify-between border rounded p-4">
              <div>
                <p className="font-medium">
                  {config.provider.toUpperCase()} - {config.model}
                </p>
                <p className="text-sm text-gray-600">
                  {config.isActive ? '✓ Active' : 'Inactive'}
                </p>
              </div>
              <div className="space-x-2">
                {!config.isActive && (
                  <button
                    onClick={() => handleActivate(config.id)}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                  >
                    Activate
                  </button>
                )}
                <button
                  onClick={() => handleDelete(config.id)}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
