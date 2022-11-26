using System;
using System.Collections.Generic;
using System.Text;
using System.Linq;
using MediaBrowser.Controller.Net;
using MediaBrowser.Model.Services;
using MediaBrowser.Controller.Configuration;
using MediaBrowser.Model.Serialization;
using MediaBrowser.Model.Logging;
using System.Threading.Tasks;
using System.Threading;
using MediaBrowser.Model.Net;
using MediaBrowser.Controller;
using MediaBrowser.Common.Net;
using Emby.Model.ProcessRun;
using System.Net.Http;
using System.IO;
using MediaBrowser.Controller.Entities;
using Emby.Notifications;

namespace MediaBrowser.Plugins.PushBulletNotifications
{
    [Route("/PushbulletNotifications", "POST", Summary = "Saves a notification", IsHidden = true)]
    [Authenticated(Roles = "Admin")]
    public class SaveNotification : PushbulletNotificationInfo, IReturnVoid
    {
    }

    [Route("/PushbulletNotifications/Default", "GET", Summary = "Gets default notification info", IsHidden = true)]
    [Authenticated(Roles = "Admin")]
    public class GetDefaultNotificationInfo : IReturn<PushbulletNotificationInfo>
    {
    }

    [Route("/PushbulletNotifications/Send/Test", "POST", Summary = "Sends a notification request, for testing only", IsHidden = true)]
    [Authenticated(Roles = "Admin")]
    public class SendNotificationTest : PushbulletNotificationInfo
    {
    }

    [Route("/PushbulletNotifications", "DELETE", Summary = "Deletes a notification", IsHidden = true)]
    [Authenticated(Roles = "Admin")]
    public class DeleteNotification : IReturnVoid
    {
        public string Id { get; set; }
    }

    public class BodyPartInfo
    {
        public string ContentType { get; set; }
        public string Data { get; set; }
    }

    public class NotificationsApi : IService, IRequiresRequest
    {
        private IServerConfigurationManager _config;
        private IJsonSerializer _json;
        private IHttpClient _httpClient;
        private readonly IServerApplicationHost _appHost;
        private ILogger _logger;

        public NotificationsApi(IServerConfigurationManager config, ILogger logger, IJsonSerializer jsonSerializer, IHttpClient httpClient, IServerApplicationHost appHost)
        {
            _config = config;
            _json = jsonSerializer;
            _httpClient = httpClient;
            _appHost = appHost;
            _logger = logger;
        }

        public IRequest Request { get; set; }

        public object Get(GetDefaultNotificationInfo request)
        {
            return new PushbulletNotificationInfo();
        }

        public void Delete(DeleteNotification request)
        {
            var config = _config.GetNotificationsOptions();

            config.Notifications = config.Notifications
                .Where(i => !string.Equals(i.Id, request.Id, StringComparison.OrdinalIgnoreCase))
                .ToArray();

            _config.SaveNotificationsConfiguration(config);
        }

        private async Task<string> GetData(HttpContent content)
        {
            var contentType = content.Headers.ContentType.ToString() ?? string.Empty;

            if (contentType.StartsWith("application/json", StringComparison.OrdinalIgnoreCase))
            {
                using (var ms = new MemoryStream())
                {
                    await content.CopyToAsync(ms).ConfigureAwait(false);

                    ms.Position = 0;

                    var bytes = ms.ToArray();

                    return Encoding.UTF8.GetString(bytes);
                }
            }

            return null;
        }

        public void Post(SaveNotification request)
        {
            var config = _config.GetNotificationsOptions();

            var notifications = config.Notifications.ToList();

            var updatedNotification = _json.DeserializeFromString<PushbulletNotificationInfo>(_json.SerializeToString(request));

            if (string.IsNullOrEmpty(updatedNotification.Id))
            {
                updatedNotification.Id = Guid.NewGuid().ToString("N");

                notifications.Add(updatedNotification);
            }
            else
            {
                for (var i = 0; i < notifications.Count; i++)
                {
                    if (string.Equals(notifications[i].Id, updatedNotification.Id, StringComparison.OrdinalIgnoreCase))
                    {
                        notifications[i] = updatedNotification;
                    }
                }
            }

            config.Notifications = notifications
                .ToArray();

            _config.SaveNotificationsConfiguration(config);
        }

        private InternalNotificationRequest GetSampleNotificationRequest(PushbulletNotificationInfo request)
        {
            return new InternalNotificationRequest
            {
                Event = Notifier.TestNotificationId,
                Configuration = request,
                Server = new NotificationServerInfo
                {
                    Id = _appHost.SystemId,
                    Name = _appHost.FriendlyName,
                    Version = _appHost.ApplicationVersion.ToString()
                },
                CancellationToken = Request.CancellationToken,
                Title = "Test Notification",
                Description = "Test Notification Description"
            };
        }

        public Task Post(SendNotificationTest request)
        {
            return new Notifier(_config, _logger, _httpClient).SendNotification(GetSampleNotificationRequest(request), Request.CancellationToken);
        }
    }
}
