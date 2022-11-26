using Emby.Notifications;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Model.Plugins;
using System.Collections.Generic;
using System;

namespace MediaBrowser.Plugins.PushBulletNotifications
{
    /// <summary>
    /// Class PluginConfiguration
    /// </summary>
    public class NotificationsConfigurationFactory : IConfigurationFactory
    {
        public IEnumerable<ConfigurationStore> GetConfigurations()
        {
            return new[]
            {
                new ConfigurationStore
                {
                     ConfigurationType = typeof(PushbulletNotificationsOptions),
                     Key = "pushbulletnotifications"
                }
            };
        }
    }
    public static class NotificationsConfigExtension
    {
        public static PushbulletNotificationsOptions GetNotificationsOptions(this IConfigurationManager config)
        {
            return config.GetConfiguration<PushbulletNotificationsOptions>("pushbulletnotifications");
        }

        public static NotificationInfo[] GetConfiguredNotifications(this IConfigurationManager config)
        {
            return config.GetNotificationsOptions().Notifications;
        }

        public static void SaveNotificationsConfiguration(this IConfigurationManager config, PushbulletNotificationsOptions options)
        {
            config.SaveConfiguration("pushbulletnotifications", options);
        }
    }

    public class PushbulletNotificationsOptions
    {
        public PushbulletNotificationInfo[] Notifications { get; set; } = Array.Empty<PushbulletNotificationInfo>();
    }

    public class PushbulletNotificationInfo : NotificationInfo
    {
        public string Token { get; set; }
        public string ChannelTag { get; set; }
        public string DeviceId { get; set; }
    }
}
