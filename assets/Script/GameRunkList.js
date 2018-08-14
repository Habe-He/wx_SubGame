cc.Class({
    extends: cc.Component,

    properties: {
        nodePB: cc.Prefab,
        scrollView: {
        	default: null,
        	type: cc.ScrollView
        },
        place: cc.Sprite,
        head: cc.Sprite,
        headFrame: cc.Sprite,
        indexName: cc.Label,
        userName: cc.Label,
        Lv: cc.Sprite,
        star: cc.Label
    },


    onLoad () {
        var self = this;
        cc.log("sub game onLoad");

        this.isShowSub = false;
        this.content = this.scrollView.content;
        // (614, 122)
        this.items = [];

        // 间距
        this.spacing = 10;

        // 所有数据的数量
        // TODO
        // 获取微信开放域的数据，根据数据内容计算总条数
        this.totalCount = 10;

        // how many items we actually spawn
        // 实际显示多少
        this.spawnCount = 10;

        this.updateTimer = 0;
        this.updateInterval = 0.2;

        // use this variable to detect if we are scrolling up or down
        this.lastContentPosY = 0;

        // when item is away from bufferZone, we relocate it
        this.bufferZone = 600;

        this.initialize();
    },

    initialize: function () {
        // 在初始化中不显示数据 - 根绝postMessage 来显示数据信息

        // get total content height
        cc.log("sub game initialize");
        this.content.height = this.totalCount * (122 + this.spacing) + this.spacing;
        cc.log("height = " + this.content.height);
        // for (var i = 0; i < this.spawnCount; ++i) {
        //     var item = cc.instantiate(this.nodePB);
        //     this.content.addChild(item);
        //     item.setPosition(0, -item.height * (0.5 + i) - this.spacing * (i + 1));
        //     item.getComponent('Item').updateItem(i, i);
        //     this.items.push(item);
        // }
    },

    getPositionInView: function (item) {
        // get item position in scrollview's node space
        let worldPos = this.content.convertToWorldSpaceAR(item.getComponent('Item').getpoint());
        let viewPos = this.scrollView.node.convertToNodeSpaceAR(worldPos);
        return viewPos;
    },

    start () {
        cc.log("sub game start");
        // 把主域里面 不涉及微信排行榜数据同样 发送到子域里面
        // 直接用来显示
        wx.onMessage(data => {
            cc.log("接收主域发送的消息 = " + data.messageType);
            cc.log("接收主域发送的消息 = " + data.messageData);
            this.isShowSub = true;
            if (data.messageType == 0) {
                if (data.messageData == 0) {
                    cc.log('显示好友 - 排位');
                    this.removeChild();
                    this.getFriendCloud("score");
                    
                } else if (data.messageData == 1) {
                    cc.log("显示好友 - 金币");
                    this.removeChild();
                    this.getFriendCloud("coin");

                } else {
                    cc.error("没有要显示的排位内容");
                }

            } else if (data.messageType == 1) {
                if (data.messageData == 0) {
                    cc.log('显示国服 - 排位');
                    this.removeChild();
                    this.showGuoFuRunk(0, data.messageArrar);

                } else if (data.messageData == 1) {
                    cc.log("显示国服 - 金币");
                    this.removeChild();
                    this.showGuoFuRunk(1, data.messageArrar);
                }

            } else if (data.messageType == 2) {
                // 提交段位积分
                this.commiteScore(data.messageData);

            } else if (data.messageType == 3) {
                // 提交金币数量
                this.commiteCoin(data.messageData);

            } else if (data.messageType == 4) {
                this.removeValue();
            }
        });
    },

    // 提交积分信息
    commiteScore (score) {
        var mKey = 'score';
        cc.log("提交的score = " + score);
        window.wx.getUserCloudStorage({
            keyList: [mKey],
            success: function (res) {
                cc.log("getUserCloudStorage success " + res);
                if (res.KVDataList.length != 0 && res.KVDataList[0].value >= score) {
                    cc.log("当前积分没有超过最高纪录");
                    return;
                }
                window.wx.setUserCloudStorage({
                    KVDataList: [{key: mKey, value: ""+ score}],
                    success: function(mRes) {
                        console.log('commiteScore setUserCloudStorage', 'success', mRes);
                    },

                    fail: function(mRes) {
                        console.log('commiteScore setUserCloudStorage', 'fail');
                    },
                    
                    complete: function(mRes) {
                        console.log('commiteScore setUserCloudStorage', 'complete');
                    },
                });
            },
            fail: function (res) {
                cc.error("提交 排位积分失败");
            },
            complete: function(res) {
                cc.log("提交 排位积分完成");
            },
        });
    },

    // 提交金币
    commiteCoin (msg) {
        var mKey = 'coin';
        window.wx.getUserCloudStorage({
            keyList: [mKey],
            success: function (res) {
                cc.log("getUserCloudStorage success " + res);
                if (res.KVDataList.length != 0 && res.KVDataList[0].value >= msg) {
                    cc.log("当前金币没有超过最高纪录");
                    return;
                }
                window.wx.setUserCloudStorage({
                    KVDataList: [{key: mKey, value: "" + msg}],
                    success: function(mRes) {
                        console.log('commiteCoin setUserCloudStorage', 'success', mRes);
                    },

                    fail: function(mRes) {
                        console.log('commiteCoin setUserCloudStorage', 'fail');
                    },
                    
                    complete: function(mRes) {
                        console.log('commiteCoin setUserCloudStorage', 'complete');
                    },
                });
            },
            fail: function (res) {
                cc.error("提交 金币失败");
            },
            complete: function(res) {
                cc.log("提交 金币完成");
            },
        });
    },

    // 清除之前上报的数据
    removeValue () {
        wx.removeUserCloudStorage({
            keyList: ['coin'],
            success: function (res) {
                cc.log("removeUserCloudStorage success " + res);
            },
            fail: function (res) {
                cc.error("删除 积分失败");
            },
            complete: function(res) {
                cc.log("删除 积分完成");
            },
        });
    },

    // 清空界面内容
    removeChild () {
        this.content.removeAllChildren();
    },

    // 获取好友榜
    getFriendCloud (mKey) {
        var self = this;
        wx.getUserInfo({
            openIdList: ['selfOpenId'],
            success: (userRes) => {
                cc.log("get openDataContext Success");
                let userData = userRes.data[0];
                // 取出所有好友数据 - 根据mKey
                wx.getFriendCloudStorage({
                    keyList: [mKey],
                    success: res => {
                        cc.log("getFriendCloudStorage success " + res);
                        let data = res.data;
                        data.sort((a, b) => {
                            if (a.KVDataList.length == 0 && b.KVDataList.length == 0) {
                                return 0;
                            }
                            if (a.KVDataList.length == 0) {
                                return 1;
                            }
                            if (b.KVDataList.length == 0) {
                                return -1;
                            }
                            return b.KVDataList[0].value - a.KVDataList[0].value;
                        });

                        for (let i = 0; i < data.length; i++) {
                            var playerInfo = data[i];
                            var item = cc.instantiate(this.nodePB);
                            this.content.addChild(item);
                            item.setPosition(0, -item.height * (0.5 + i) - this.spacing * (i + 1));
                            item.getComponent('Item').updateItem(i, playerInfo);
                            this.items.push(item);
                            if (data[i].avatarUrl == userData.avatarUrl) {
                                // 更新自己的
                                this.weChatHeadFile(this.head, userData.avatarUrl);
                                this.userName.string = userData.nickName;
                                if (i == 0) {
                                    this.place.node.active = true;
                                } else if (i == 1) {
                                    self.place.node.active = true;
                                    cc.loader.loadRes("place_2", cc.SpriteFrame, function(error, spriteFrame) {
                                        this.place.spriteFrame = spriteFrame;
                                    });
                                } else if (i == 2) {
                                    self.place.node.active = true;
                                    cc.loader.loadRes("place_3", cc.SpriteFrame, function(error, spriteFrame) {
                                        this.place.spriteFrame = spriteFrame;
                                    });
                                } else {
                                    self.place.node.active = false;
                                    this.indexName.node.active = true;
                                    this.indexName.string = i.toString();
                                    
                                }
                                let grade = playerInfo.KVDataList.length != 0 ? playerInfo.KVDataList[0].value : 0;
                                this.star.string = grade.toString() + "分";
                            }
                        }
                    },

                    fail: res => {
                        cc.log("wx.getFriendCloudStorage fail", res);
                    },
                });
            },
            
            fail: (res) => {
                cc.log("get openDataContext fail");
            },
        });
    },

    update (dt) {
        if (!this.isShowSub) return;

        this.updateTimer += dt;
        // we don't need to do the math every frame
        if (this.updateTimer < this.updateInterval) return;
        this.updateTimer = 0;
        let items = this.items;
        let buffer = this.bufferZone;
        // scrolling direction
        let isDown = this.scrollView.content.y < this.lastContentPosY;
        let offset = (122 + this.spacing) * items.length;
        for (let i = 0; i < items.length; ++i) {
            let viewPos = this.getPositionInView(items[i]);
            if (isDown) {
                // if away from buffer zone and not reaching top of content
                if (viewPos.y < -buffer && items[i].y + offset < 0) {
                    items[i].setPositionY(items[i].y + offset );
                    let item = items[i].getComponent('Item');
                    // update item id
                    let itemId = item.itemID - items.length;
                    item.updateItem(i, itemId);
                }
            } else {
                // if away from buffer zone and not reaching bottom of content
                if (viewPos.y > buffer && items[i].y - offset > -this.content.height) {
                    items[i].setPositionY(items[i].y - offset );
                    let item = items[i].getComponent('Item');
                    let itemId = item.itemID + items.length;
                    item.updateItem(i, itemId);
                }
            }
        }
        // update lastContentPosY
        this.lastContentPosY = this.scrollView.content.y;
    },

    weChatHeadFile (avatarImgSprite, avatarUrl) {
        try {
            let image = wx.createImage();
            image.onload = () => {
                try {
                    let texture = new cc.Texture2D();
                    texture.initWithElement(image);
                    texture.handleLoadedTexture();
                    avatarImgSprite.spriteFrame = new cc.SpriteFrame(texture);
                } catch (e) {
                    cc.log(e);
                    avatarImgSprite.node.active = false;
                }
            };
            image.src = avatarUrl;
        }catch (e) {
            cc.log(e);
            avatarImgSprite.node.active = false;
        }
    },

    // 显示国服榜
    showGuoFuRunk: function (type, data) {
        cc.log(data.list.length);
        this.totalCount = (data.list.length > this.spawnCount) ? data.list.length : this.spawnCount;
        // cc.log("this.totalCount = " + this.totalCount);
        // cc.log("this.spacing = " + this.spacing);
        this.content.height = this.totalCount * (122 + this.spacing) + this.spacing;
        // cc.log('height = ' + this.content.height);
        for (var i = 0; i < this.spawnCount; ++i) {
            var item = cc.instantiate(this.nodePB);
            this.content.addChild(item);
            item.setPosition(0, -item.height * (0.5 + i) - this.spacing * (i + 1));
            item.getComponent('Item').updateItem(i, i);
            this.items.push(item);
        }
    },
});
