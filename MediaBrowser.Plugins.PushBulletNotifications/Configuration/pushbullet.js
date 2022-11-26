define(['baseView', 'dom', 'globalize', 'require', 'emby-linkbutton', 'emby-button', 'listViewStyle', 'paper-icon-button-light'], function (BaseView, dom, globalize, require) {
    'use strict';

    function onCancelled() {
        // Just to avoid a console message about the promise being rejected
    }

    function onEntrySaved() {
        var view = this.closest('.page');

        loadEntries(view);
    }

    function getEntryEditorJsPath() {
        return Dashboard.getConfigurationResourceUrl('pushbulletnotificationeditorjs');
    }

    function getDefaultEntry() {
        return ApiClient.getJSON(ApiClient.getUrl('PushbulletNotifications/Default'));
    }

    function addEntry() {

        var button = this;

        require([getEntryEditorJsPath()], function (EntryEditor) {

            getEventTypes(ApiClient).then(function (allEventTypes) {

                getDefaultEntry().then(function (defaultEntry) {

                    new EntryEditor().show({
                        entry: defaultEntry,
                        apiClient: ApiClient,
                        eventTypes: allEventTypes

                    }).then(onEntrySaved.bind(button), onCancelled);
                });
            });
        });
    }

    function getConfiguredNotifications() {
        return ApiClient.getNamedConfiguration('pushbulletnotifications').then(function (config) {
            return config.Notifications;
        });
    }

    function getEntry(id) {

        return getConfiguredNotifications().then(function (notifications) {

            return notifications.filter(function (w) {
                return w.Id === id;
            })[0];
        });
    }

    function editEntry(button) {
        var id = button.getAttribute('data-id');

        getEntry(id).then(function (entry) {

            require([getEntryEditorJsPath()], function (EntryEditor) {

                getEventTypes(ApiClient).then(function (allEventTypes) {
                    new EntryEditor().show({
                        entry: entry,
                        apiClient: ApiClient,
                        eventTypes: allEventTypes

                    }).then(onEntrySaved.bind(button), onCancelled);
                });
            });
        });
    }

    function deleteEntry(view, button) {

        return require(['confirm']).then(function (responses) {

            var confirm = responses[0];

            return confirm({

                text: globalize.translate('DeleteNotificationConfirmation'),
                title: globalize.translate('DeleteNotification'),
                confirmText: globalize.translate('Delete'),
                primary: 'cancel'

            }).then(function () {

                var id = button.getAttribute('data-id');

                ApiClient.ajax({
                    url: ApiClient.getUrl('PushbulletNotifications', { Id: id }),
                    type: 'DELETE'
                }).then(function () {

                    loadEntries(view);
                });
            });
        });
    }

    function getEventTypes(apiClient) {

        return apiClient.getNotificationTypes(globalize.getCurrentLocale());
    }

    function getDescriptions(entry, allEventTypes) {

        var html = '<div class="listItemBodyText-secondary listItemBodyText flex">';

        html += allEventTypes.filter(function (eventInfo) {

            var subEvents = eventInfo.Events.filter(function (subEvent) {

                return entry.EventIds.includes(subEvent.Id);

            });

            if (!subEvents.length) {
                return false;
            }

            return true;

        }).map(function (eventInfo) {

            return eventInfo.Name;

        }).join(', ');

        html += '</div>';

        return html;
    }

    function getEntryHtml(entry, allEventTypes) {

        var html = '';

        html += '<div class="listItem listItem-border">';

        html += '<a is="emby-linkbutton" class="listItemBody btnEditEntry" style="display:block;text-align:left;" data-id="' + entry.Id + '">';

        html += '<h3 class="listItemBodyText">' + (entry.FriendlyName || 'My Pushbullet') + '</h3>';

        html += getDescriptions(entry, allEventTypes);

        html += '</a>';

        html += '<button type="button" class="btnEditEntry flex-shrink-zero" is="paper-icon-button-light" data-id="' + entry.Id + '"><i class="md-icon">edit</i></button>';
        html += '<button type="button" class="btnDeleteEntry flex-shrink-zero" is="paper-icon-button-light" data-id="' + entry.Id + '"><i class="md-icon">delete</i></button>';

        html += '</div>';

        return html;
    }

    function loadEntries(view) {

        return getConfiguredNotifications().then(function (notifications) {

            getEventTypes(ApiClient).then(function (allEventTypes) {
                view.querySelector('.entries').innerHTML = notifications.map(function (i) {

                    return getEntryHtml(i, allEventTypes);

                }).join('');
            });
        });
    }

    function View(view, params) {
        BaseView.apply(this, arguments);

        view.querySelector('.btnAddEntry').addEventListener('click', addEntry);

        view.querySelector('.entries').addEventListener('click', function (e) {

            var btnEditEntry = e.target.closest('.btnEditEntry');
            if (btnEditEntry) {
                editEntry(btnEditEntry);
                return;
            }

            var btnDeleteEntry = e.target.closest('.btnDeleteEntry');
            if (btnDeleteEntry) {
                deleteEntry(view, btnDeleteEntry);
                return;
            }
        });
    }

    Object.assign(View.prototype, BaseView.prototype);

    View.prototype.onResume = function (options) {

        BaseView.prototype.onResume.apply(this, arguments);

        loadEntries(this.view);
    };

    return View;
});