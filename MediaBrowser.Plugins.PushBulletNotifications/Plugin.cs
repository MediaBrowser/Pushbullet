using System;
using System.Collections.Generic;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Common.Plugins;
using MediaBrowser.Model.Plugins;
using MediaBrowser.Model.Serialization;
using MediaBrowser.Model.Drawing;
using System.IO;
using System.Linq;

namespace MediaBrowser.Plugins.PushBulletNotifications
{
    public class Plugin : BasePlugin, IHasWebPages, IHasThumbImage, IHasTranslations
    {
        public IEnumerable<PluginPageInfo> GetPages()
        {
            return new[]
            {
                new PluginPageInfo
                {
                    Name = "pushbulletnotifications",
                    EmbeddedResourcePath = GetType().Namespace + ".Configuration.pushbullet.html",
                    EnableInMainMenu = true,
                    MenuIcon = "notifications"
                },
                new PluginPageInfo
                {
                    Name = "pushbulletnotificationsjs",
                    EmbeddedResourcePath = GetType().Namespace + ".Configuration.pushbullet.js"
                },
                new PluginPageInfo
                {
                    Name = "pushbulletnotificationeditorjs",
                    EmbeddedResourcePath = GetType().Namespace + ".Configuration.pushbulleteditor.js"
                },
                new PluginPageInfo
                {
                    Name = "pushbulleteditortemplate",
                    EmbeddedResourcePath = GetType().Namespace + ".Configuration.pushbulleteditor.template.html"
                }
            };
        }

        public TranslationInfo[] GetTranslations()
        {
            var basePath = GetType().Namespace + ".strings.";

            return GetType()
                .Assembly
                .GetManifestResourceNames()
                .Where(i => i.StartsWith(basePath, StringComparison.OrdinalIgnoreCase))
                .Select(i => new TranslationInfo
                {
                    Locale = Path.GetFileNameWithoutExtension(i.Substring(basePath.Length)),
                    EmbeddedResourcePath = i

                }).ToArray();
        }

        public override string Description
        {
            get
            {
                return "Sends notifications via Pushbullet Service.";
            }
        }

        private Guid _id = new Guid("de228f12-e43e-4bd9-9fc0-2830819c3b92");
        public override Guid Id
        {
            get { return _id; }
        }

        public static string StaticName = "Pushbullet Notifications";

        /// <summary>
        /// Gets the name of the plugin
        /// </summary>
        /// <value>The name.</value>
        public override string Name
        {
            get { return StaticName; }
        }

        public Stream GetThumbImage()
        {
            var type = GetType();
            return type.Assembly.GetManifestResourceStream(type.Namespace + ".thumb.jpg");
        }

        public ImageFormat ThumbImageFormat
        {
            get
            {
                return ImageFormat.Jpg;
            }
        }
    }
}
