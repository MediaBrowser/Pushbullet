define(['dom', 'dialogHelper', 'loading', 'apphost', 'layoutManager', 'connectionManager', 'appRouter', 'globalize', 'emby-checkbox', 'emby-input', 'emby-select', 'paper-icon-button-light', 'emby-select', 'material-icons', 'formDialogStyle', 'emby-button', 'emby-linkbutton', 'flexStyles', 'emby-scroller'], function (dom, dialogHelper, loading, appHost, layoutManager, connectionManager, appRouter, globalize) {
    'use strict';

    function onSubmit(e) {

        loading.show();

        var form = e.target;

        var panel = form.closest('.dialog');

        var apiClient = this.options.apiClient;

        apiClient.ajax({

            url: ApiClient.getUrl('PushbulletNotifications'),
            type: 'POST',
            data: JSON.stringify(getEntry(this)),
            contentType: "application/json"

        }).then(onSubmitted.bind(this));

        e.preventDefault();
        return false;
    }

    function onTestSuccess() {
        loading.hide();
        require(['toast'], function (toast) {
            toast(globalize.translate('NotificationSent'));
        });
    }

    function onTestFail() {
        loading.hide();
        alertText(globalize.translate('ErrorSendingWebook'));
    }

    function alertText(options) {
        require(['alert'], function (alert) {
            alert(options);
        });
    }

    function sendEntryTest() {

        var instance = this;

        var apiClient = instance.options.apiClient;

        var dlg = instance.dlg;
        loading.show();
        apiClient.ajax({

            url: ApiClient.getUrl('PushbulletNotifications/Send/Test'),
            type: 'POST',
            data: JSON.stringify(getEntry(instance)),
            contentType: "application/json"

        }).then(onTestSuccess, onTestFail);
    }

    function getEntry(instance) {

        var obj = Object.assign({}, instance.options.entry);

        var dlg = instance.dlg;

        obj.Token = dlg.querySelector('.txtToken').value;
        obj.ChannelTag = dlg.querySelector('.txtChannelTag').value;
        obj.FriendlyName = dlg.querySelector('.txtFriendlyName').value;

        obj.UserIds = dlg.querySelector('.selectUser').getValues();
        obj.LibraryIds = dlg.querySelector('.selectLibrary').getValues();

        obj.EventIds = Array.prototype.map.call(dlg.querySelectorAll('.chkSubEvent:checked'), function (c) {
            return c.getAttribute('data-id');
        });

        return obj;
    }

    function onSubmitted() {

        loading.hide();

        this.submitted = true;

        dialogHelper.close(this.dlg);
    }

    function getEventHtml(info, entry) {

        var html = '';

        html += '<div class="checkboxList">';

        html += '<div style="margin-bottom:1em;">';
        html += '<label>';

        let isTopEventEnabled;

        var events = info.Events;
        var categoryId = info.Id;

        for (var i = 0, length = events.length; i < length; i++) {

            var currentEvent = events[i];
            var eventId = currentEvent.Id;

            if (entry.EventIds.includes(eventId)) {
                isTopEventEnabled = true;
                break;
            }
        }

        let isChecked = isTopEventEnabled;

        let checkedAttribute = isChecked ? ' checked="checked"' : '';

        html += '<input type="checkbox" is="emby-checkbox" class="chkEvent" data-id="' + categoryId + '"' + checkedAttribute + ' />';
        html += '<span>' + info.Name + '</span>';
        html += '</label>';

        for (var i = 0, length = events.length; i < length; i++) {

            var currentEvent = events[i];
            var eventId = currentEvent.Id;

            isChecked = entry.EventIds.includes(eventId);

            checkedAttribute = isChecked ? ' checked="checked"' : '';

            html += '<label style="margin: .35em 2.5em;"><input type="checkbox" is="emby-checkbox" class="chkSubEvent" data-categoryid="' + categoryId + '" data-id="' + eventId + '" ' + checkedAttribute + ' />';

            html += '<span class="flex" style="white-space:nowrap;">';

            html += '<div>';
            html += currentEvent.Name;
            html += '</div>';

            html += '</span>';
            html += '</label>';
        }

        html += '</div>';
        html += '</div>';

        return html;
    }

    function setSubEventsChecked(page, eventId, checked) {

        let elems = page.querySelectorAll('.chkSubEvent[data-categoryid="' + eventId + '"]');
        for (let i = 0, length = elems.length; i < length; i++) {

            elems[i].checked = checked;
        }
    }

    function setEventCheckedIfNeeded(page, eventId) {

        let elem = page.querySelector('.chkEvent[data-id="' + eventId + '"]');

        if (!elem) {
            return;
        }

        let elems = page.querySelectorAll('.chkSubEvent[data-categoryid="' + eventId + '"]');
        if (!elems.length) {
            return;
        }

        let numChecked = 0;
        let numUnchecked = 0;
        for (let i = 0, length = elems.length; i < length; i++) {

            if (elems[i].checked) {
                numChecked++;
            } else {
                numUnchecked++;
            }
        }

        if (numChecked || numChecked === elems.length) {
            elem.checked = true;
        }

        else if (numUnchecked === elems.length) {
            elem.checked = false;
        }
    }

    function onEventChange(e) {

        let target = e.target;
        let view = this.dlg;

        if (target.classList.contains('chkEvent')) {

            setSubEventsChecked(view, target.getAttribute('data-id'), target.checked);
        }
        else if (target.classList.contains('chkSubEvent')) {

            setEventCheckedIfNeeded(view, target.getAttribute('data-categoryid'));
        }
    }

    function EntryEditor() {

    }

    function onClosed() {

        this.options = null;
        this.dlg = null;

        if (this.submitted) {
            return Promise.resolve();
        }

        return Promise.reject();
    }

    function fillData(entry, dlg, apiClient) {

        dlg.querySelector('.txtToken').value = entry.Token || '';
        dlg.querySelector('.txtChannelTag').value = entry.ChannelTag || '';
        dlg.querySelector('.txtFriendlyName').value = entry.FriendlyName || '';

        fillUserSelect(entry, dlg, apiClient);
        fillSelectLibrary(entry, dlg, apiClient);
    }

    function getUsers(query) {

        let apiClient = this;

        query = Object.assign({

            SortBy: 'SortName',
            SortOrder: 'Ascending',
            EnableImages: false

        }, query);

        return apiClient.getUsersQueryResult(query);
    }

    function fillUserSelect(entry, dlg, apiClient) {

        var selectUser = dlg.querySelector('.selectUser');

        selectUser.getItems = getUsers.bind(apiClient);

        selectUser.setValues(entry.UserIds || [], true);
    }

    function getLibraries(query) {

        let apiClient = this;

        query = Object.assign({

            SortBy: 'SortName',
            SortOrder: 'Ascending',
            EnableImages: false

        }, query);

        return apiClient.getVirtualFolders(query);
    }

    function fillSelectLibrary(entry, dlg, apiClient) {

        var selectLibrary = dlg.querySelector('.selectLibrary');

        selectLibrary.getItems = getLibraries.bind(apiClient);
        selectLibrary.setAttribute('data-id-property', 'Guid');

        selectLibrary.setValues(entry.LibraryIds || [], true);
    }

    EntryEditor.prototype.show = function (options) {

        var dialogOptions = {
            removeOnClose: true,
            scrollY: false
        };

        if (layoutManager.tv) {
            dialogOptions.size = 'fullscreen';
        } else {
            dialogOptions.size = 'small';
        }

        var dlg = dialogHelper.createDialog(dialogOptions);

        dlg.classList.add('formDialog');

        this.options = options;
        this.dlg = dlg;

        const instance = this;

        return require(['text!' + Dashboard.getConfigurationResourceUrl('pushbulleteditortemplate')]).then(function (responses) {

            var isNew = options.entry.Id == null;

            var template = responses[0];
            dlg.innerHTML = globalize.translateDocument(template);

            dlg.querySelector('.formDialogHeaderTitle').innerHTML = isNew ? globalize.translate('AddNotification') : globalize.translate('EditNotification');

            dlg.querySelector('.eventList').innerHTML = options.eventTypes.map(function (i) {
                return getEventHtml(i, options.entry);
            }).join('');

            dlg.querySelector('.eventList').addEventListener('change', onEventChange.bind(instance));

            dlg.querySelector('.btnSubmit').innerHTML = isNew ? globalize.translate('AddNotification') : globalize.translate('Save');

            fillData(options.entry, dlg, options.apiClient);

            dlg.querySelector('form').addEventListener('submit', onSubmit.bind(instance));

            dlg.querySelector('.btnSendTest').addEventListener('click', sendEntryTest.bind(instance));

            dlg.querySelector('.btnCancel').addEventListener('click', function () {

                dialogHelper.close(dlg);
            });

            return dialogHelper.open(dlg).then(onClosed.bind(instance));
        });
    };

    return EntryEditor;
});