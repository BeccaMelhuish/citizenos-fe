'use strict';

angular
    .module('citizenos')
    .controller('TopicCtrl', ['$scope', '$state', '$stateParams', '$timeout', '$q', '$log', '$sce', 'ngDialog', 'sAuth', 'Topic', 'TopicMemberGroup', 'TopicMemberUser', 'TopicComment', 'TopicVote', 'Mention', 'rTopic', function ($scope, $state, $stateParams, $timeout, $q, $log, $sce, ngDialog, sAuth, Topic, TopicMemberGroup, TopicMemberUser, TopicComment, TopicVote, Mention, rTopic) {
        $log.debug('TopicCtrl', $scope);

        $scope.topic = rTopic;

        $scope.COMMENT_TYPES = TopicComment.COMMENT_TYPES;
        $scope.generalInfo = {
            isVisible: true
        };

        $scope.voteResults = {
            isVisible: false,
            countTotal: 0
        };

        $scope.groupList = {
            isVisible: false,
            isSearchVisible: false,
            searchFilter: '',
            searchOrderBy: {
                property: 'name'
            }
        };

        $scope.userList = {
            isVisible: false,
            isSearchVisible: false,
            searchFilter: '',
            searchOrderBy: {
                property: 'name'
            }
        };

        $scope.topicComments = {
            rows: [],
            count: {
                pro: 0,
                con: 0
            },
            orderBy: TopicComment.COMMENT_ORDER_BY.date,
            orderByOptions: TopicComment.COMMENT_ORDER_BY

        };
        $scope.hashtagForm = {
            hashtag: null,
            errors: null,
            bytesLeft: 59
        };

        $scope.topic.padUrl = $sce.trustAsResourceUrl($scope.topic.padUrl);
        $scope.app.editMode = ($stateParams.editMode && $stateParams.editMode === 'true') || false;
        $scope.showInfoEdit = $scope.app.editMode;
        $scope.showVoteArea = false;

        $scope.STATUSES = Topic.STATUSES;

        if ($scope.topic.voteId || $scope.topic.vote) {
            $scope.topic.vote = new TopicVote({id: $scope.topic.voteId, topicId: $scope.topic.id});
            $scope.topic.vote.$get();
        }

        if ($scope.topic.voteId || $scope.topic.vote) {
            $scope.topic.vote = new TopicVote({id: $scope.topic.voteId, topicId: $scope.topic.id});
            $scope.topic.vote.$get();
        }

        $scope.showVoteCreate = function () {
            $scope.showVoteCreateForm = !$scope.showVoteCreateForm;
        };

        $scope.sendToVote = function () {
            ngDialog
                .openConfirm({
                    template: '/views/modals/topic_send_to_vote_confirm.html'
                }).then(function () {
                if (!$scope.topic.voteId && !$scope.topic.vote) {
                    $scope.app.topics_settings = false;
                    $state.go('topics.view.votes.create', {topicId: $scope.topic.id});
                } else if (($scope.topic.voteId || ($scope.topic.vote && $scope.topic.vote.id)) && $scope.topic.status !== $scope.STATUSES.voting) {
                    $log.debug('sendToVote');
                    $scope.topic.status = $scope.STATUSES.voting;
                    $scope.topic
                        .$patch()
                        .then(function () {
                            $scope.app.topics_settings = false;
                            if ($state.is('topics.view')) {
                                $state.go('topics.view.votes.view', {topicId: $scope.topic.id, voteId: $scope.topic.vote.id, editMode: null}, {reload: true});
                            }
                        });
                }
            }, angular.noop);
        };

        $scope.sendToFollowUp = function () {
            ngDialog
                .openConfirm({
                    template: '/views/modals/topic_send_to_followUp_confirm.html'
                }).then(function () {
                $scope.topic.status = $scope.STATUSES.followUp;
                $scope.topic
                    .$patch()
                    .then(function () {
                        $scope.app.topics_settings = false;
                        if ($state.is('topics.view.votes.view')) {
                            $state.go('topics.view', {topicId: $scope.topic.id, editMode: null}, {reload: true});
                        }
                    })
            }, angular.noop);
        };

        $scope.closeTopic = function () {
            ngDialog
                .openConfirm({
                    template: '/views/modals/topic_close_confirm.html'
                }).then(function () {
                $scope.topic.status = $scope.STATUSES.closed;
                $scope.topic.$patch();
                $scope.app.topics_settings = false;
                if ($state.is('topics.view.votes.view')) {
                    $state.go('topics.view', {topicId: $scope.topic.id}, {reload: true});
                }
            }, angular.noop);
        };

        $scope.loadTopicSocialMentions = function () {
            if ($scope.topic.hashtag) {
                $scope.topicSocialMentions = Mention.query({topicId: $scope.topic.id});
            }
        };

        $scope.loadTopicSocialMentions();

        $scope.app.dotoggleEditMode = function () {
            $log.debug($scope.app.editMode);
            $scope.app.editMode = !$scope.app.editMode;
            $scope.app.topics_settings = false;
            if ($scope.app.editMode === true) {
                $state.go('topics.view', {topicId: $scope.topic.id, editMode: $scope.app.editMode});
            } else {
                $state.go('topics.view', {topicId: $scope.topic.id, editMode: null}, {reload: true});
            }
        };

        $scope.hideInfoEdit = function () {
            $scope.showInfoEdit = false
        };

        $scope.loadTopicComments = function (orderBy) {
            $scope.topicComments.rows = [];
            $scope.topicComments.count = {
                pro: 0,
                con: 0
            };

            TopicComment.query({topicId: $scope.topic.id, orderBy: $scope.topicComments.orderBy}).$promise
                .then(function (comments) {
                    if (comments) {
                        $scope.topicComments.count.pro = _.filter(comments, {type: TopicComment.COMMENT_TYPES.pro}).length;
                        $scope.topicComments.count.con = _.filter(comments, {type: TopicComment.COMMENT_TYPES.con}).length;
                        $scope.topicComments.rows = comments;
                        $scope.topicComments.rows.forEach(function (comment, key) {
                            comment.replies.rows.forEach( function (reply,rkey) {
                                reply = new TopicComment(reply);
                                $scope.topicComments.rows[key].replies.rows[rkey] = reply;
                            })
                        });
                    } else {
                        $scope.topicComments.rows = [];
                        $scope.topicComments.count = {
                            pro: 0,
                            con: 0
                        };
                    }
                });
        };

        $scope.orderComments = function (order) {
            $scope.topicComments.orderBy = order;
            $scope.loadTopicComments();
        };

        $scope.doCommentVote = function (commentId, value) {
            if (!$scope.app.user.loggedIn) return;

            var topicComment = new TopicComment({id: commentId, topicId: $scope.topic.id});
            topicComment.value = value;
            topicComment.$vote()
                .then(function (data) {
                    $scope.loadTopicComments();
                });
        };

        $scope.doCommentReport = function (comment) {
            ngDialog
                .open({
                    template: '/views/modals/topic_comment_report.html',
                    data: {
                        comment: comment,
                        topic: $scope.topic
                    }
                });
        };

        $scope.loadTopicComments();

        $scope.doDeleteTopic = function () {
            $log.debug('doDeleteTopic');

            ngDialog
                .openConfirm({
                    template: '/views/modals/topic_delete_confirm.html'
                })
                .then(function () {
                    $scope.topic
                        .$delete()
                        .then(function () {
                            $state.go('my.topics', null, {reload: true});
                        });
                }, angular.noop);
        };

        $scope.doLeaveTopic = function () {
            ngDialog
                .openConfirm({
                    template: '/views/modals/topic_member_user_leave_confirm.html',
                    data: {
                        topic: $scope.topic
                    }
                })
                .then(function () {
                    var topicMemberUser = new TopicMemberUser({id: sAuth.user.id});
                    topicMemberUser
                        .$delete({topicId: $scope.topic.id})
                        .then(function () {
                            $state.go('my.topics', null, {reload: true});
                        });
                });
        };

        $scope.doSetTopicStatus = function (status) {
            if (status !== $scope.topic.status) {
                $scope.topic.status = status;
                $scope.topic.$update(function (data) {
                    $scope.topic = Topic.get({topicId: $stateParams.topicId});
                });
            }
        };

        $scope.doShowVoteResults = function () {
            if (!$scope.voteResults.isVisible) {
                $scope.topic.vote
                    .$get({topicId: $scope.topic.id})
                    .then(function (topicVote) {
                        $scope.topic.vote = topicVote;
                        var voteCount = 0;
                        topicVote.options.rows.forEach(function (voteOption) {
                            voteCount += voteOption.voteCount || 0;
                        });
                        $scope.voteResults.countTotal = voteCount;
                        $scope.voteResults.isVisible = true;
                    });
            }
        };

        $scope.doToggleVoteResults = function () {
            if ($scope.voteResults.isVisible) {
                $scope.voteResults.isVisible = false;
            } else {
                $scope.doShowVoteResults();
            }
        };

        $scope.doSaveVoteEndsAt = function () {
            return $scope.topic.vote
                .$update({topicId: $scope.topic.id})
                .then(function (vote) {
                    // TODO: Reload from server until GET /:voteId and PUT /:voteId return the same output
                    return vote.$get({topicId: $scope.topic.id});
                });
        };

        $scope.TopicMemberGroup = TopicMemberGroup;

        $scope.doToggleMemberGroupList = function () {
            if ($scope.groupList.isVisible) {
                $scope.groupList.isVisible = false;
            } else {
                $scope.doShowMemberGroupList();
            }
        };

        $scope.doShowMemberGroupList = function () {
            if (!$scope.groupList.isVisible) {
                TopicMemberGroup
                    .query({topicId: $scope.topic.id}).$promise
                    .then(function (groups) {
                        $scope.topic.members.groups.rows = groups;
                        $scope.topic.members.groups.count = groups.length;
                        $scope.groupList.isVisible = true;
                        $scope.app.scrollToAnchor('group_list');
                    });
            } else {
                $scope.app.scrollToAnchor('group_list');
            }
        };

        $scope.doUpdateMemberGroup = function (topicMemberGroup, level) {
            $log.debug('doUpdateMemberGroup', topicMemberGroup, level);

            if (topicMemberGroup.level !== level) {
                var oldLevel = topicMemberGroup.level;
                topicMemberGroup.level = level;
                topicMemberGroup
                    .$update({topicId: $scope.topic.id})
                    .then(
                        function () {
                            if ($scope.userList.isVisible) { // Reload User list when Group permissions change as User permissions may also change
                                loadTopicMemberUserList();
                            }
                        },
                        function () {
                            topicMemberGroup.level = oldLevel;
                        }
                    );
            }
        };

        $scope.doDeleteMemberGroup = function (topicMemberGroup) {
            $log.debug('doDeleteMemberGroup', topicMemberGroup);

            ngDialog
                .openConfirm({
                    template: '/views/modals/topic_member_group_delete_confirm.html',
                    data: {
                        group: topicMemberGroup
                    }
                })
                .then(function () {
                    topicMemberGroup
                        .$delete({topicId: $scope.topic.id})
                        .then(function () {
                            $scope.topic.members.groups.rows.splice($scope.topic.members.groups.rows.indexOf(topicMemberGroup), 1);
                            $scope.topic.members.groups.count = $scope.topic.members.groups.rows.length;
                        });
                }, angular.noop);
        };

        $scope.TopicMemberUser = TopicMemberUser;

        var loadTopicMemberUserList = function () {
            return TopicMemberUser
                .query({topicId: $scope.topic.id}).$promise
                .then(function (users) {
                    $scope.topic.members.users.rows = users;
                    $scope.topic.members.users.count = users.length;
                    $scope.userList.isVisible = true;
                });
        };

        $scope.doShowMemberUserList = function () {
            if (!$scope.userList.isVisible) {
                loadTopicMemberUserList()
                    .then(function () {
                        $scope.app.scrollToAnchor('user_list');
                    });
            } else {
                $scope.app.scrollToAnchor('user_list');
            }
        };

        $scope.doToggleMemberUserList = function () {
            if ($scope.userList.isVisible) {
                $scope.userList.isVisible = false;
            } else {
                $scope.doShowMemberUserList();
            }
        };

        $scope.doUpdateMemberUser = function (topicMemberUser, level) {
            if (topicMemberUser.level !== level) {
                var oldLevel = topicMemberUser.level;
                topicMemberUser.level = level;
                topicMemberUser
                    .$update({topicId: $scope.topic.id})
                    .then(
                        function () {
                            topicMemberUser.levelUser = level;
                        },
                        function (res) {
                            topicMemberUser.level = oldLevel;
                        });
            }
        };

        $scope.doDeleteMemberUser = function (topicMemberUser) {
            ngDialog
                .openConfirm({
                    template: '/views/modals/topic_member_user_delete_confirm.html',
                    data: {
                        user: topicMemberUser
                    }
                })
                .then(function () {
                    topicMemberUser
                        .$delete({topicId: $scope.topic.id})
                        .then(function () {
                            return loadTopicMemberUserList(); // Good old topic.members.users.splice wont work due to group permission inheritance
                        });
                }, angular.noop);
        };

        $scope.updateComment = function (comment, editType) {
            console.log(editType);
            if(comment.editType != comment.type || comment.subject != comment.editSubject || comment.text != comment.editText){
                comment.subject = comment.editSubject;
                comment.text = comment.editText;

                if (editType) {
                    comment.type = editType;
                }
                console.log(comment.type);
                comment.topicId = $scope.topic.id;

                comment
                    .$update()
                    .then(function (res) {
                        console.log(res);
                        $scope.commentEditMode(comment);
                    }, function (err) {
                        console.log('err', err)
                    });
            } else {
                $scope.commentEditMode(comment);
            }
        };

        $scope.commentEditMode = function (comment) {
            comment.editSubject = comment.subject;
            comment.editText = comment.text;
            comment.showEdit = !comment.showEdit;
        };

        $scope.getParentAuthor = function (rootComment, parentId) {
            if(parentId === rootComment.id) {
                return rootComment.creator.name;
            } else {
                for(var i = 0; i < rootComment.replies.rows.length; i++) {
                    if(rootComment.replies.rows[i].id === parentId) {
                        return rootComment.replies.rows[i].creator.name;
                        break;
                    }
                }
            }


        };

        $scope.doShowDeleteComment = function (comment) {
            $log.debug('TopicCtrl.doShowDeleteComment()');

            ngDialog.openConfirm({
                template: '/views/modals/topic_delete_comment.html',
                data: {
                    comment: comment,
                    topic: $scope.topic
                }
            })
            .then(function () {
                comment.topicId = $scope.topic.id;
                comment.$delete()
                    .then(function () {
                        $scope.loadTopicComments($scope.topicComments.orderBy);
                    }, angular.noop);
            });
        };

        $scope.goToParentComment = function (rootComment, parent) {

            if(!parent.id || !parent.hasOwnProperty('version')) {
                return
            }

            var comment = angular.element(document.getElementById(parent.id+parent.version));
            console.log(comment);

        };

        function djb2(str){
          var hash = 5381;
          for (var i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i); /* hash * 33 + c */
          }
          return hash;
        }

        $scope.hashStringToColor = function (str) {
          var hash = djb2(str);
          var r = (hash & 0xFF0000) >> 16;
          var g = (hash & 0x00FF00) >> 8;
          var b = hash & 0x0000FF;
          return "#" + ("0" + r.toString(16)).substr(-2) + ("0" + g.toString(16)).substr(-2) + ("0" + b.toString(16)).substr(-2);
        }

    }]);
