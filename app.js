//app.js
App({
  //创建towxml对象，供小程序页面使用
  globalData: {
    //1-src替换成你自己的
    mp3Src: 'cloud://demo-7gw2zmftf30332d0.6465-demo-7gw2zmftf30332d0-1302391005/MP3/laidanle.wav',
    //要设置的地方
    isNeedSaoMa: true, //是否需要扫码点餐： true需要，false不需要
    address: '', //isNeedSaoMa为true时是桌号，false时店内随意下单
    isNeedFenLei: true, //是否需要分类，true需要：适合菜品多的时候，false不需要：适合菜品少的时候
    userInfo: {},
    openid: null,
  },
  onLaunch: function () {
    //云开发初始化
    wx.cloud.init({
      env: 'xiaoshitou-0go20a09a67fc864', //2-src替换成你自己的云开发环境id
      traceUser: true,
    })
    this.getOpenid();
  },
  // 获取用户openid
  getOpenid: function () {
    var app = this;
    var openidStor = wx.getStorageSync('openid');
    if (openidStor) {
      console.log('本地获取openid:' + openidStor);
      app.globalData.openid = openidStor;
      app._getMyUserInfo();
    } else {
      wx.cloud.callFunction({
        name: 'getOpenid',
        success(res) {
          console.log('云函数获取openid成功', res.result.openid)
          var openid = res.result.openid;
          wx.setStorageSync('openid', openid)
          app.globalData.openid = openid;
          app._getMyUserInfo();
        },
        fail(res) {
          console.log('云函数获取失败', res)
        }
      })
    }
  },
  //获取自己后台的user信息
  _getMyUserInfo() {
    let app = this
    var userStor = wx.getStorageSync('user');
    if (userStor) {
      console.log('本地获取user', userStor)
      app.globalData.userInfo = userStor;
    }
    wx.request({
      url: app.globalData.baseUrl + '/user/getUserInfo',
      data: {
        openid: app.globalData.openid
      },
      success: function (res) {
        console.log("Java后台返回的用户信息", res.data)
        if (res && res.data && res.data.data) {
          app.globalData.userInfo.nickName = res.data.data.username;
          app.globalData.userInfo.realphone = res.data.data.phone;
          app.globalData.userInfo.realzhuohao = res.data.data.zhuohao;
          app.globalData.userInfo.realrenshu = res.data.data.renshu;
          console.log("===app.globalData===", app.globalData.userInfo)
          //缓存到sd卡里
          app._saveUserInfo(app.globalData.userInfo);
        }
      }
    })
  },
  _checkOpenid() {
    let app = this
    let openid = this.globalData.openid;
    if (!openid) {
      app.getOpenid();
      wx.showLoading({
        title: 'openid不能为空，请重新登录',
      })
      return null;
    } else {
      return openid;
    }
  },
  // 保存userinfo
  _saveUserInfo: function (user) {
    this.globalData.userInfo = user;
    wx.setStorageSync('user', user)
  },

  //获取今天是本月第几周
  _getWeek: function () {
    // 将字符串转为标准时间格式
    let date = new Date();
    let month = date.getMonth() + 1;
    let week = this.getWeekFromDate(date);
    if (week === 0) { //第0周归于上月的最后一周
      month = date.getMonth();
      let dateLast = new Date();
      let dayLast = new Date(dateLast.getFullYear(), dateLast.getMonth(), 0).getDate();
      let timestamp = new Date(new Date().getFullYear(), new Date().getMonth() - 1, dayLast);
      week = this.getWeekFromDate(new Date(timestamp));
    }
    let time = month + "月第" + week + "周";
    return time;
  },

  getWeekFromDate: function (date) {
    // 将字符串转为标准时间格式
    let w = date.getDay(); //周几
    if (w === 0) {
      w = 7;
    }
    let week = Math.ceil((date.getDate() + 6 - w) / 7) - 1;
    return week;
  },
  // 获取当前时间
  _getCurrentTime() {
    var d = new Date();
    var month = d.getMonth() + 1;
    var date = d.getDate();
    var day = d.getDay();
    var hours = d.getHours();
    var minutes = d.getMinutes();
    var seconds = d.getSeconds();
    var ms = d.getMilliseconds();

    var curDateTime = d.getFullYear() + '年';
    if (month > 9)
      curDateTime += month + '月';
    else
      curDateTime += month + '月';

    if (date > 9)
      curDateTime = curDateTime + date + "日";
    else
      curDateTime = curDateTime + date + "日";
    if (hours > 9)
      curDateTime = curDateTime + hours + "时";
    else
      curDateTime = curDateTime + hours + "时";
    if (minutes > 9)
      curDateTime = curDateTime + minutes + "分";
    else
      curDateTime = curDateTime + minutes + "分";
    return curDateTime;
  },
  // 获取当前的年月日
  _getNianYuiRi() {
    let date = new Date()
    let year = date.getFullYear()
    // 我们的月份是从0开始的 0代表1月份，11代表12月
    let month = date.getMonth() + 1
    let day = date.getDate()
    let key = '' + year + month + day
    console.log('当前的年月日', key)
    return key
  }
})