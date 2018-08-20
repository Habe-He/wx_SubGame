var Tool = require('./Tool');

cc.Class({
    extends: cc.Component,

    properties: {
        itemTemplate: { // item template to instantiate other items
            default: null,
            type: cc.Node
        },
        scrollView: {
            default: null,
            type: cc.ScrollView
        },
        spawnCount: 0, // how many items we actually spawn
        totalCount: 0, // how many items we need for the whole list
        spacing: 0, // space between each item
        bufferZone: 0, // when item is away from bufferZone, we relocate it

        runkNum_0: cc.Sprite,
        head: cc.Sprite,
        headFrame: cc.Sprite,
        runkNum_1: cc.Label,
        userName: cc.Label,
        Lv: cc.Sprite,
        star: cc.Label,
        starNode: cc.Node,
        starNum: cc.Label,
    },

    // use this for initialization
    onLoad: function () {
        this.content = this.scrollView.content;
        this.items = []; // array to store spawned items
        this.initialize();
        this.updateTimer = 0;
        this.updateInterval = 0.2;
        this.lastContentPosY = 0; // use this variable to detect if we are scrolling up or down
        
        this.showType = 0;
        this.showData = [];
    },

    start() {
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
                    this.showType = 1;
                    this.getFriendCloud("score");

                } else if (data.messageData == 1) {
                    cc.log("显示好友 - 金币");
                    this.removeChild();
                    this.showType = 0;
                    this.getFriendCloud("coin");

                } else {
                    cc.error("没有要显示的排位内容");
                }

            } else if (data.messageType == 1) {
                if (data.messageData == 0) {
                    cc.log('显示国服 - 排位');
                    this.removeChild();
                    this.showType = 3;
                    this.showGuoFuRunk(0, data.messageArrar, data.messageName, data.messageUrl, data.messageScore, data.messageCoin);

                } else if (data.messageData == 1) {
                    cc.log("显示国服 - 金币");
                    this.removeChild();
                    this.showType = 2;
                    this.showGuoFuRunk(1, data.messageArrar, data.messageName, data.messageUrl, data.messageScore, data.messageCoin);
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

    initialize: function () {
        // get total content height
        this.content.height = this.totalCount * (this.itemTemplate.height + this.spacing) + this.spacing;
    },

    getPositionInView: function (item) { 
        // get item position in scrollview's node space
        let worldPos = this.content.convertToWorldSpaceAR(item.position);
        let viewPos = this.scrollView.node.convertToNodeSpaceAR(worldPos);
        return viewPos;
    },

    update: function (dt) {
        this.updateTimer += dt;
        if (this.updateTimer < this.updateInterval) return; // we don't need to do the math every frame
        this.updateTimer = 0;
        let items = this.items;
        let buffer = this.bufferZone;
        let isDown = this.scrollView.content.y < this.lastContentPosY; // scrolling direction
        let offset = (this.itemTemplate.height + this.spacing) * items.length;
        for (let i = 0; i < items.length; ++i) {
            let viewPos = this.getPositionInView(items[i]);
            if (isDown) {
                // if away from buffer zone and not reaching top of content
                if (viewPos.y < -buffer && items[i].y + offset < 0) {
                    items[i].setPositionY(items[i].y + offset);
                    let item = items[i].getComponent('Item');
                    let itemId = item.itemID - items.length; // update item id
                    item.updateItem(itemId, itemId, this.showType, this.showData);
                }
            } else {
                // if away from buffer zone and not reaching bottom of content
                if (viewPos.y > buffer && items[i].y - offset > -this.content.height) {
                    items[i].setPositionY(items[i].y - offset);
                    let item = items[i].getComponent('Item');
                    var itemId = item.itemID + items.length;
                    item.updateItem(itemId, itemId, this.showType, this.showData);
                }
            }
        }
        // update lastContentPosY
        this.lastContentPosY = this.scrollView.content.y;
    },

    // 提交积分信息
    commiteScore(score) {
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
                    KVDataList: [{
                        key: mKey,
                        value: "" + score
                    }],
                    success: function (mRes) {
                        console.log('commiteScore setUserCloudStorage', 'success', mRes);
                    },

                    fail: function (mRes) {
                        console.log('commiteScore setUserCloudStorage', 'fail');
                    },

                    complete: function (mRes) {
                        console.log('commiteScore setUserCloudStorage', 'complete');
                    },
                });
            },
            fail: function (res) {
                cc.error("提交 排位积分失败");
            },
            complete: function (res) {
                cc.log("提交 排位积分完成");
            },
        });
    },

    // 提交金币
    commiteCoin(msg) {
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
                    KVDataList: [{
                        key: mKey,
                        value: "" + msg
                    }],
                    success: function (mRes) {
                        console.log('commiteCoin setUserCloudStorage', 'success', mRes);
                    },

                    fail: function (mRes) {
                        console.log('commiteCoin setUserCloudStorage', 'fail');
                    },

                    complete: function (mRes) {
                        console.log('commiteCoin setUserCloudStorage', 'complete');
                    },
                });
            },
            fail: function (res) {
                cc.error("提交 金币失败");
            },
            complete: function (res) {
                cc.log("提交 金币完成");
            },
        });
    },

    // 清除之前上报的数据
    removeValue() {
        wx.removeUserCloudStorage({
            keyList: ['coin'],
            success: function (res) {
                cc.log("removeUserCloudStorage success " + res);
            },
            fail: function (res) {
                cc.error("删除 积分失败");
            },
            complete: function (res) {
                cc.log("删除 积分完成");
            },
        });
    },

    // 清空界面内容
    removeChild() {
        this.scrollView.scrollToTop();
        this.content.removeAllChildren();
    },

    // 获取好友榜
    getFriendCloud(mKey) {
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
                        cc.log("getFriendCloudStorage success", " Friend Length = " + res.data.length);
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
                        this.totalCount = data.length;
                        this.content.height = this.totalCount * (159 + this.spacing) + this.spacing;
                        for (let i = 0; i < data.length; i++) {
                            var playerInfo = data[i];
                            var item = cc.instantiate(this.itemTemplate);
                            this.content.addChild(item);
                            item.setPosition(0, -item.height * (0.5 + i) - this.spacing * (i + 1));
                            item.getComponent('Item').updateItem(i, i, this.showType, playerInfo);
                            this.items.push(item);
                            if (data[i].avatarUrl == userData.avatarUrl) {
                                // 更新自己的
                                this.weChatHeadFile(this.head, userData.avatarUrl);
                                this.userName.string = userData.nickName;
                                this.runkNum_1.node.active = false;
                                if (i == 0) {
                                    this.runkNum_0.node.active = true;
                                    cc.loader.loadRes("place_1", cc.SpriteFrame, function (error, spriteFrame) {
                                        self.runkNum_0.spriteFrame = spriteFrame;
                                    });
                                } else if (i == 1) {
                                    this.runkNum_0.node.active = true;
                                    cc.loader.loadRes("place_2", cc.SpriteFrame, function (error, spriteFrame) {
                                        self.runkNum_0.spriteFrame = spriteFrame;
                                    });
                                } else if (i == 2) {
                                    this.runkNum_0.node.active = true;
                                    cc.loader.loadRes("place_3", cc.SpriteFrame, function (error, spriteFrame) {
                                        self.runkNum_0.spriteFrame = spriteFrame;
                                    });
                                } else {
                                    this.runkNum_0.node.active = false;
                                    this.runkNum_1.node.active = true;
                                    this.runkNum_1.string = (i + 1).toString();
                                }

                                if (this.showType == 1 || this.showType == 3) {
                                    let grade = playerInfo.KVDataList.length != 0 ? playerInfo.KVDataList[0].value : 0;
                                    var mScore = Tool.getLevelInfo(grade);
                                    if (mScore.star == -1) {
                                        this.star.node.active = false;
                                        this.starNode.active = false;
                                    } else {
                                        this.star.node.active = false;
                                        this.starNode.active = true;
                                        this.starNum.string = mScore.star;
                                    }

                                    cc.loader.loadRes("Lv_" + mScore.bigLevel, cc.SpriteFrame, function(error, spriteFrame) {
                                        self.Lv.getComponent(cc.Sprite).spriteFrame = spriteFrame;
                                    });
                                } else {
                                    let grade = playerInfo.KVDataList.length != 0 ? playerInfo.KVDataList[0].value : 0;
                                    var mScore = Tool.goldSplit(grade);
                                    this.star.node.active = true;
                                    this.starNode.active = false;
                                    this.star.string = mScore.toString();
                                    cc.log("微信服务器通知的自己的金币 = " + grade);

                                    cc.loader.loadRes("coin", cc.SpriteFrame, function(error, spriteFrame) {
                                        self.Lv.getComponent(cc.Sprite).spriteFrame = spriteFrame;
                                    });
                                }
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
    showGuoFuRunk: function (type, data, messageName, messageUrl, messageScore, messageCoin) {
        var self = this;
        cc.log("data = " , data);
        this.items = [];
        this.showData = [];
        this.showData = data.list.sort((a, b) => {
            return (a.r - b.r)
        });

        cc.log('this.showData = ', this.showData);
        // this.showData = data.list;
        this.totalCount = data.list.length;
        this.content.height = this.totalCount * (159 + this.spacing) + this.spacing;
        for (var i = 0; i < this.spawnCount; ++i) {
            var item = cc.instantiate(this.itemTemplate);
            this.content.addChild(item);
            item.setPosition(0, -item.height * (0.5 + i) - this.spacing * (i + 1));
            item.getComponent('Item').updateItem(i, i, this.showType, data.list);
            this.items.push(item);
        }

        if (data.my == 0) {
            // 未上榜
            cc.loader.loadRes("un", cc.SpriteFrame, function(error, spriteFrame) {
                self.runkNum_1.node.active = false;
                self.runkNum_0.node.active = true;
                self.runkNum_0.getComponent(cc.Sprite).spriteFrame = spriteFrame;
            });
        } else {
            self.runkNum_0.node.active = false;
            self.runkNum_1.node.active = true;
            self.runkNum_1.string = data.my;
        }

        this.weChatHeadFile(this.head, messageUrl);
        this.userName.string = Tool.InterceptDiyStr(Tool.encryptMoblieNumber(messageName), 3);

        if (this.showType == 1 || this.showType == 3) {
            // 积分
            var mScore = Tool.getLevelInfo(messageScore);
            if (mScore.star == -1) {
                this.star.node.active = false;
                this.starNode.active = false;
            } else {
                this.star.node.active = false;
                this.starNode.active = true;
                this.starNum.string = mScore.star;
            }

            cc.loader.loadRes("Lv_" + mScore.bigLevel, cc.SpriteFrame, function(error, spriteFrame) {
                self.Lv.getComponent(cc.Sprite).spriteFrame = spriteFrame;
            });
        } else {
            var mScore = Tool.goldSplit(messageCoin);
            this.starNode.active = false;
            this.star.node.active = true;
            this.star.string = mScore.toString();

            cc.loader.loadRes("coin", cc.SpriteFrame, function(error, spriteFrame) {
                self.Lv.getComponent(cc.Sprite).spriteFrame = spriteFrame;
            });
        }
    },
});