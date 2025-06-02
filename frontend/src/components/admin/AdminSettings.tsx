import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  RefreshCw,
  Mail,
  Server,
  Users,
  Bell,
  Database,
  AlertTriangle,
} from 'lucide-react';
import dashboardService, {
  type SystemSettings,
} from '../../services/dashboard.service';

interface SettingsSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  description,
  icon,
  children,
}) => (
  <div className="bg-card rounded-lg shadow-md border border-border">
    <div className="p-6 border-b border-border">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-primary/10 rounded-lg">{icon}</div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await dashboardService.getSystemSettings();
      setSettings(data);
    } catch (err) {
      setError('Failed to load system settings');
      console.error('Error fetching settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      await dashboardService.updateSystemSettings(settings);
      setSuccessMessage('Settings saved successfully');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to save settings');
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (
    key: keyof SystemSettings,
    value: string | number | boolean | string[]
  ) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  const updateEmailSetting = (
    key: string,
    value: string | number | boolean
  ) => {
    if (!settings) return;

    // Initialize emailSettings if it doesn't exist
    const currentEmailSettings = settings.emailSettings || {
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpSecure: false,
    };

    setSettings({
      ...settings,
      emailSettings: { ...currentEmailSettings, [key]: value },
    });
  };

  const updateSMSSetting = (key: string, value: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      smsSettings: { ...settings.smsSettings, [key]: value },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading settings...</span>
        </div>
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-card rounded-lg shadow-md p-6 border border-border"
          >
            <div className="h-6 bg-muted animate-pulse rounded mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-muted animate-pulse rounded"></div>
              <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <p className="text-destructive font-medium">
              Error loading settings
            </p>
          </div>
          <p className="text-destructive/80 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            System Settings
          </h2>
          <p className="text-muted-foreground">
            Configure system-wide settings and preferences
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={fetchSettings}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Save className={`h-4 w-4 ${isSaving ? 'animate-pulse' : ''}`} />
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <p className="text-destructive font-medium">{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Save className="h-5 w-5 text-green-600 dark:text-green-400" />
            <p className="text-green-800 dark:text-green-200 font-medium">
              {successMessage}
            </p>
          </div>
        </div>
      )}

      {/* General Settings */}
      <SettingsSection
        title="General Settings"
        description="Basic system configuration"
        icon={<Settings className="h-5 w-5 text-primary" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Site Name
            </label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => updateSetting('siteName', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Admin Email
            </label>
            <input
              type="email"
              value={settings.adminEmail}
              onChange={(e) => updateSetting('adminEmail', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-2">
              Site Description
            </label>
            <textarea
              value={settings.siteDescription}
              onChange={(e) => updateSetting('siteDescription', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            />
          </div>
        </div>
      </SettingsSection>

      {/* User Management Settings */}
      <SettingsSection
        title="User Management"
        description="Control user registration and access"
        icon={<Users className="h-5 w-5 text-primary" />}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">
                Enable Registration
              </label>
              <p className="text-sm text-muted-foreground">
                Allow new users to register
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.enableRegistration}
              onChange={(e) =>
                updateSetting('enableRegistration', e.target.checked)
              }
              className="rounded border-border"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">
                Two-Factor Authentication
              </label>
              <p className="text-sm text-muted-foreground">
                Require 2FA for enhanced security
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.enableTwoFactorAuth}
              onChange={(e) =>
                updateSetting('enableTwoFactorAuth', e.target.checked)
              }
              className="rounded border-border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Default User Role
            </label>
            <select
              value={settings.defaultUserRole}
              onChange={(e) => updateSetting('defaultUserRole', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              <option value="member">Member</option>
              <option value="secretary">Secretary</option>
              <option value="treasurer">Treasurer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Session Timeout (seconds)
            </label>
            <input
              type="number"
              value={settings.sessionTimeout}
              onChange={(e) =>
                updateSetting('sessionTimeout', parseInt(e.target.value))
              }
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            />
          </div>
        </div>
      </SettingsSection>

      {/* File Upload Settings */}
      <SettingsSection
        title="File Management"
        description="Configure file upload restrictions"
        icon={<Database className="h-5 w-5 text-primary" />}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Max File Upload Size (bytes)
            </label>
            <input
              type="number"
              value={settings.maxFileUploadSize}
              onChange={(e) =>
                updateSetting('maxFileUploadSize', parseInt(e.target.value))
              }
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Current: {(settings.maxFileUploadSize / 1024 / 1024).toFixed(1)}{' '}
              MB
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Allowed File Types (comma-separated)
            </label>
            <input
              type="text"
              value={settings.allowedFileTypes.join(', ')}
              onChange={(e) =>
                updateSetting(
                  'allowedFileTypes',
                  e.target.value.split(',').map((t) => t.trim())
                )
              }
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            />
          </div>
        </div>
      </SettingsSection>

      {/* Email Settings */}
      <SettingsSection
        title="Email Configuration"
        description="Configure SMTP settings for email notifications"
        icon={<Mail className="h-5 w-5 text-primary" />}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <label className="text-sm font-medium text-foreground">
                Enable Email Notifications
              </label>
              <p className="text-sm text-muted-foreground">
                Send system notifications via email
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.enableEmailNotifications}
              onChange={(e) =>
                updateSetting('enableEmailNotifications', e.target.checked)
              }
              className="rounded border-border"
            />
          </div>

          {settings.enableEmailNotifications && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  SMTP Host
                </label>
                <input
                  type="text"
                  value={settings.emailSettings?.smtpHost || ''}
                  onChange={(e) =>
                    updateEmailSetting('smtpHost', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  SMTP Port
                </label>
                <input
                  type="number"
                  value={settings.emailSettings?.smtpPort || ''}
                  onChange={(e) =>
                    updateEmailSetting('smtpPort', parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  SMTP Username
                </label>
                <input
                  type="text"
                  value={settings.emailSettings?.smtpUser || ''}
                  onChange={(e) =>
                    updateEmailSetting('smtpUser', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Use SSL/TLS
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Enable secure connection
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.emailSettings?.smtpSecure || false}
                  onChange={(e) =>
                    updateEmailSetting('smtpSecure', e.target.checked)
                  }
                  className="rounded border-border"
                />
              </div>
            </div>
          )}
        </div>
      </SettingsSection>

      {/* SMS Settings */}
      <SettingsSection
        title="SMS Configuration"
        description="Configure SMS notifications (optional)"
        icon={<Bell className="h-5 w-5 text-primary" />}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <label className="text-sm font-medium text-foreground">
                Enable SMS Notifications
              </label>
              <p className="text-sm text-muted-foreground">
                Send system notifications via SMS
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.enableSMSNotifications}
              onChange={(e) =>
                updateSetting('enableSMSNotifications', e.target.checked)
              }
              className="rounded border-border"
            />
          </div>

          {settings.enableSMSNotifications && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  SMS Provider
                </label>
                <select
                  value={settings.smsSettings.provider}
                  onChange={(e) => updateSMSSetting('provider', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                >
                  <option value="">Select Provider</option>
                  <option value="twilio">Twilio</option>
                  <option value="nexmo">Nexmo</option>
                  <option value="infobip">Infobip</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Sender ID
                </label>
                <input
                  type="text"
                  value={settings.smsSettings.senderId}
                  onChange={(e) => updateSMSSetting('senderId', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={settings.smsSettings.apiKey}
                  onChange={(e) => updateSMSSetting('apiKey', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>
            </div>
          )}
        </div>
      </SettingsSection>

      {/* System Status */}
      <SettingsSection
        title="System Status"
        description="System maintenance and status controls"
        icon={<Server className="h-5 w-5 text-primary" />}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">
                Maintenance Mode
              </label>
              <p className="text-sm text-muted-foreground">
                Put the system in maintenance mode
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={(e) =>
                updateSetting('maintenanceMode', e.target.checked)
              }
              className="rounded border-border"
            />
          </div>

          {settings.maintenanceMode && (
            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                  Maintenance mode is enabled. Only administrators can access
                  the system.
                </p>
              </div>
            </div>
          )}
        </div>
      </SettingsSection>
    </div>
  );
};

export default AdminSettings;
