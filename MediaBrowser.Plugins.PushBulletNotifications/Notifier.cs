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
using MediaBrowser.Controller;

namespace MediaBrowser.Plugins.PushBulletNotifications
{
    public class Notifier : IUserNotifier
    {
        private ILogger _logger;
        private IServerApplicationHost _appHost;
        private IHttpClient _httpClient;

        public Notifier(ILogger logger, IServerApplicationHost applicationHost, IHttpClient httpClient)
        {
            _logger = logger;
            _appHost = applicationHost;
            _httpClient = httpClient;
        }

        private Plugin Plugin => _appHost.Plugins.OfType<Plugin>().First();

        public string Name => Plugin.StaticName;

        public string Key => "pushbulletnotifications";

        public string SetupModuleUrl => Plugin.NotificationSetupModuleUrl;

        public async Task SendNotification(InternalNotificationRequest request, CancellationToken cancellationToken)
        {
            var options = request.Configuration.Options;

            options.TryGetValue("ChannelTag", out string channelTag);
            options.TryGetValue("Token", out string token);

            var parameters = new Dictionary<string, string>
                {
                   // {"device_iden", options.DeviceId},
                    {"type", "note"},
                    {"title", request.Title},
                    {"body", request.Description},
                    {"channel_tag", channelTag}
                };

            var _httpRequest = new HttpRequestOptions
            {
                CancellationToken = cancellationToken
            };
            string authInfo = token;
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
