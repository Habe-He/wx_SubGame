var LevelConfig = require("./config.js");

var Tool = Tool || {};


Tool.getLevelInfo = function(score){
    for( var i = 0 ; i < LevelConfig.g_levelScore.length - 1 ; i++){
        var data = LevelConfig.g_levelScore[i];
        if( score >= data.minScore && score <= data.maxScore){
            var finallyData = {
                bigLevel:data.big_level,
                star:data.star,
                name:data.desc,
                index_id: data.index_id
            }
            return finallyData;
        }
    }
    var data = LevelConfig.g_levelScore[LevelConfig.g_levelScore.length - 1];
    var star = 0;
    if( score >= data.minScore){
        star = parseInt ((score - data.minScore) /1000000);
    }

    var finallyData = {
        bigLevel: data.big_level,
        star: star,
        name: data.desc,
        index_id: data.index_id
    }
    return finallyData;
};

// 金币 -> 万
Tool.goldSplit = function(money) {
    var str = "";
    if (money <= 10000) {
        return money.toString();
    } else {
        if (money % 10000 == 0) {
            str = money / 10000 + "万"
            return str.toString();
        } else {
            var wan = parseInt(money / 10000);
            var don = parseInt((money - wan * 10000) / 1000);
            str = wan + "." + don + "万"
            return str.toString();
        }
    }
};

Tool.InterceptDiyStr = function(sName, nShowCount) {
    if (sName == "") {
        return sName;
    }
    var showName = ""
    var nLenInByte = sName.length;

    for (var i = 0; i < nLenInByte; ++i) {
        if (nShowCount <= 0) {
            showName += "...";
            break;
        }
        var once = sName.substring(i, i + 1)
        if (/.*[\u4e00-\u9fa5]+.*$/.test(once)) {
            //中文
            nShowCount -= 1;
            var char = sName.substring(i, i + 1);
            showName += char;
        } else {
            nShowCount -= 0.5;
            var char = sName.substring(i, i + 1);
            showName += char;
        }
    }

    return showName;
};

Tool.isMoblieNumber = function (str) {
    if (typeof str != 'string') {
        return false;
    }
    return /^1[34578]\d{9}$/.test(str);
};

Tool.encryptMoblieNumber = function (str) {
    if (!Tool.isMoblieNumber(str)) {
        return str;
    }
    return str.substring(0, 3) + "****" + str.substring(7);
};

module.exports = Tool;