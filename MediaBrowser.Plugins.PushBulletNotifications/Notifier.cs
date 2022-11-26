using System.Collections.Generic;
using System.Text;
using MediaBrowser.Common.Net;
using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Notifications;
using MediaBrowser.Model.Logging;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Emby.Notifications;
using MediaBrowser.Controller.Configuration;

namespace MediaBrowser.Plugins.PushBulletNotifications
{
    public class Notifier : INotifier
    {
        private IServerConfigurationManager _config;
        private ILogger _logger;
        private IHttpClient _httpClient;

        public static string TestNotificationId = "system.pushbulletnotificationtest";
        public Notifier(IServerConfigurationManager config, ILogger logger, IHttpClient httpClient)
        {
            _config = config;
            _logger = logger;
            _httpClient = httpClient;
        }

        public string Name
        {
            get { return Plugin.StaticName; }
        }

        public NotificationInfo[] GetConfiguredNotifications()
        {
            return _config.GetConfiguredNotifications();
        }

        public async Task SendNotification(InternalNotificationRequest request, CancellationToken cancellationToken)
        {
            var options = request.Configuration as PushbulletNotificationInfo;

            var parameters = new Dictionary<string, string>
                {
                   // {"device_iden", options.DeviceId},
                    {"type", "note"},
                    {"title", request.Title},
                    {"body", request.Description},
                    {"channel_tag", options.ChannelTag}
                };

            _logger.Debug("PushBullet to Token : {0} - {1} - {2} - {3}", options.Token, options.DeviceId, request.Description, options.ChannelTag);
            var _httpRequest = new HttpRequestOptions();
            string authInfo = options.Token;
            authInfo = Convert.ToBase64String(Encoding.UTF8.GetBytes(authInfo));

            _httpRequest.RequestHeaders["Authorization"] = "Basic " + authInfo;

            _httpRequest.Url = "https://api.pushbullet.com/v2/pushes";

            _httpRequest.SetPostData(parameters);

            using (await _httpClient.Post(_httpRequest).ConfigureAwait(false))
            {

            }
        }
    }
}
