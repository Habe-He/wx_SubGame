var Tool = require('./Tool');

cc.Class({
    extends: cc.Component,

    properties: {
        place: cc.Sprite,
        headFrame: cc.Sprite,
        head: cc.Sprite,
        userName: cc.Label,
        indexID: cc.Label,
        Lv: cc.Sprite,
        star: cc.Label,
        starNode: cc.Node,
        starNum: cc.Label,
        itemID: 0,
    },
    
    onLoad: function () {
        var self = this;
        self.indexID.node.active = false;
    },

    // 更新界面内容
    // tmplId - 预制的7个显示内容, 复用到了第几个
    // itemId 当前显示到的第几个
    // type 0 = 好友金币，1 = 好友积分，2 = 国服金币，3 = 国服排位
    // dataArray 更新数据的数组
    updateItem: function(tmplId, itemId, type, dataArray) {
        var self = this;
        this.itemID = parseInt(itemId);
        if (this.itemID == 0) {
            self.place.node.active = true;
            self.indexID.node.active = false;
            cc.loader.loadRes("place_1", cc.SpriteFrame, function(error, spriteFrame) {
                self.place.spriteFrame = spriteFrame;
            });
        } else if (this.itemID == 1) {
            self.place.node.active = true;
            self.indexID.node.active = false;
            cc.loader.loadRes("place_2", cc.SpriteFrame, function(error, spriteFrame) {
                self.place.spriteFrame = spriteFrame;
            });
        } else if (this.itemID == 2) {
            self.place.node.active = true;
            self.indexID.node.active = false;
            cc.loader.loadRes("place_3", cc.SpriteFrame, function(error, spriteFrame) {
                self.place.spriteFrame = spriteFrame;
            });
        } else {
            self.place.node.active = false;
            self.indexID.node.active = true;
            self.indexID.string = (this.itemID + 1).toString();
        }

        if (type == 0) {
            let grade = dataArray.KVDataList.length != 0 ? dataArray.KVDataList[0].value : 0;
            this.weChatHeadFile(self.head, dataArray.avatarUrl);
            self.userName.string = Tool.InterceptDiyStr(Tool.encryptMoblieNumber(dataArray.nickname), 3);
            var mScore = Tool.goldSplit(grade);
            self.star.node.active = true;
            self.starNode.active = false;
            self.star.string = mScore.toString();

            cc.loader.loadRes("coin", cc.SpriteFrame, function(error, spriteFrame) {
                self.Lv.spriteFrame = spriteFrame;
            });

        } else if (type == 1) {
            if (typeof dataArray.KVDataList == 'undefined') {
                cc.warn("好友积分 msg");
                return;
            }
            let grade = dataArray.KVDataList.length != 0 ? dataArray.KVDataList[0].value : 0;
            this.weChatHeadFile(self.head, dataArray.avatarUrl);
            self.userName.string = Tool.InterceptDiyStr(Tool.encryptMoblieNumber(dataArray.nickname), 3);
            var mScore = Tool.getLevelInfo(grade);
            if (mScore.star == -1) {
                self.star.node.active = false;
                self.starNode.active = false;
            } else {
                self.star.node.active = false;
                self.starNode.active = true;
                self.starNum.string = mScore.star;
            }

            cc.loader.loadRes("Lv_" + mScore.bigLevel, cc.SpriteFrame, function(error, spriteFrame) {
                self.Lv.spriteFrame = spriteFrame;
            });

        } else if (type == 2) {
            this.weChatHeadFile(self.head, dataArray[itemId].u);
            self.userName.string = Tool.InterceptDiyStr(Tool.encryptMoblieNumber(dataArray[itemId].n), 3);

            var mScore = Tool.goldSplit(dataArray[itemId].g);
            self.star.node.active = true;
            self.starNode.active = false;
            self.star.string = mScore.toString();

            cc.loader.loadRes("coin", cc.SpriteFrame, function(error, spriteFrame) {
                self.Lv.spriteFrame = spriteFrame;
            });

        } else if (type == 3) {
            this.weChatHeadFile(self.head, dataArray[itemId].u);
            self.userName.string = Tool.InterceptDiyStr(Tool.encryptMoblieNumber(dataArray[itemId].n), 3);

            var mScore = Tool.getLevelInfo(dataArray[itemId].s);
            if (mScore.star == -1) {
                self.star.node.active = false;
                self.starNode.active = false;
            } else {
                self.star.node.active = false;
                self.starNode.active = true;
                self.starNode.string = mScore.star + "星";
            }

            cc.loader.loadRes("Lv_" + mScore.bigLevel, cc.SpriteFrame, function(error, spriteFrame) {
                self.Lv.spriteFrame = spriteFrame;
            });
        }
        
    },

    getCSize: function() {
        this.node.getContentSize();
    },

    getpoint: function() {
        this.node.getPosition();
    },

    weChatHeadFile (avatarImgSprite, avatarUrl) {

        if (avatarUrl == "") {
            cc.loader.loadRes("face", cc.SpriteFrame, function(error, spriteFrame) {
                avatarImgSprite.spriteFrame = spriteFrame;
            });
            return;
        }
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
});