'use strict';

app.service('sUpload', ['$http', '$window', 'sLocation', function ($http, $window, sLocation) {

    var sUpload = this;

    sUpload.ALLOWED_FILE_TYPES = ['txt', 'pdf', 'doc', 'docx', 'ddoc', 'bdoc', 'odf', 'odt', 'jpg', 'jpeg', 'img', 'png', 'rtf', 'xls', 'xlsx', 'ppt', 'pptx', 'pps', 'xlt'];

    sUpload.upload = function (file, folder) {
        var path = sLocation.getAbsoluteUrlApi('/api/users/self/upload');

        var formData = new FormData();
        if (folder) {
            formData.append('folder', folder);
        }
        formData.append('file', file);

        return $http({
            url: path,
            method: 'POST',
            data: formData,
            headers: {'Content-Type': undefined}
        }).then(function (result) {
            return result.data;
        });
    };

    sUpload.delete = function(filepath, folder) {
        var path = sLocation.getAbsoluteUrlApi('/api/users/self/upload');
        var filename = filepath.split('/').pop();
        return $http.delete(path, {params: {'filename': filename, 'folder': folder}});
    };

    sUpload.download = function (topicId, attachmentId, userId) {
        var path = sLocation.getAbsoluteUrlApi('/api/topics/:topicId/attachments/:attachmentId');

        if (userId) {
            path = sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/attachments/:attachmentId')
        }
        path = path.replace(':topicId', topicId)
            .replace(':attachmentId', attachmentId);

        $window.location.href = path + '?download=true';
    };

}]);
