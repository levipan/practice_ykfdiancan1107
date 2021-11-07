let app = getApp();
const db = wx.cloud.database()
const _ = db.command
Page({
  data: { //页面的初始数据   
    imgList: [],
    isShowMyAddress: false, //是否显示我的地址
    isShowAddressSetting: false, //授权失败再次授权的弹窗
    beizhu: "", // 备注信息
    cartList: [], // 购物车数据
    totalPrice: 0, //总价
    totalNum: 0, //总数量
    maskFlag: true, // 遮罩
    items: [{
        value: '公司人员',
        name: '公司人员',
        checked: 'true'
      },
      {
        value: '外部人员',
        name: '外部人员'
      }
    ]
  },
  onLoad() {
    //获取缓存地址
    this.getAddress(wx.getStorageSync('address'))
    //购物车的数据
    var arr = wx.getStorageSync('cart') || [];
    for (var i in arr) {
      this.data.totalPrice += arr[i].quantity * arr[i].price;
      this.data.totalNum += arr[i].quantity
    }
    this.setData({
      cartList: arr,
      totalPrice: this.data.totalPrice.toFixed(2),
      totalNum: this.data.totalNum
    })
  },
  // 上传照片
  ChooseImage() {
    let that = this;
    let openid = app.globalData.openid || wx.getStorageSync('openid');
    wx.chooseImage({
      sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
      success: function (res) {
        wx.showLoading({
          title: '上传中',
        });
        // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
        let filePath = res.tempFilePaths[0];
        const name = Math.random() * 1000000;
        const cloudPath = name + filePath.match(/\.[^.]+?$/)[0]
        wx.cloud.uploadFile({
          cloudPath, //云存储图片名字
          filePath, //临时路径
          success: res => {
            console.log('[上传图片] 成功：', res)
            that.setData({
              bigImg: res.fileID, //云存储图片路径,可以把这个路径存到集合，要用的时候再取出来
            });
            // let fileID = res.fileID;
            // //把图片存到order集合表
            // const db = wx.cloud.database();
            // db.collection("order").add({
            //   data: {
            //     img: fileID
            //   },
            //   success: function (res) {
            //     wx.showToast({
            //       title: '图片上传成功',
            //       'icon': 'none',
            //       duration: 3000
            //     })
            //   },
            //   fail: function () {
            //     wx.showToast({
            //       title: '图片上传失败',
            //       'icon': 'none',
            //       duration: 3000
            //     })
            //   }
            // });
          },
          fail: e => {
            console.error('[上传图片] 失败：', e)
          },
          complete: () => {
            wx.hideLoading()
          }
        });
      }
    })
  },
  // 获取备注信息
  radioChange: function (e) {
    console.log('radio发生change事件，携带value值为：', e.detail.value)
    this.setData({
      beizhu: e.detail.value
    })
  },
  //提交订单
  submitOrder(e) {

    let beizhu = this.data.beizhu
    let address =this.data.address
    let bigImg = this.data.bigImg
    console.log('类型', beizhu)
    if (!beizhu) {
      wx.showToast({
        title: '选择类型',
      })
      return
    }
    if (!address||!address.userName) {
      wx.showToast({
        title: '添加地址',
      })
      return
    }
    if (!bigImg) {
      wx.showToast({
        title: '选择图片',
      })
      return
    }
    let arr = wx.getStorageSync('cart') || [];
    let arrNew = []
    arr.forEach(item => {
      arrNew.push({
        _id: item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        name: item.name,
      })
    });

    if (!this.data.diner_num) {
      wx.showToast({
        icon: 'none',
        title: '请选择就餐人数',
      })
      return
    }
    db.collection("order").add({
      data: {
        name: this.data.address.userName,
        address: this.data.address.address,
        phone: this.data.address.phone,
        beizhu: this.data.beizhu,
        bigImg:bigImg,
        totalPrice: item.quantity * item.price, //总价钱
        good: item, //存json字符串
        status: 0, //-1订单取消,0新下单发货,1已收货待评价,2订单已完成
        _createTime: new Date().getTime(), //创建的时间
        orderList: arrNew, //存json字符串
        status: 0, //-1订单取消,0新下单待上餐,1待用户评价,2订单已完成
        // _createTime: db.serverDate() //创建的时间
        _createTime: new Date().getTime() //创建的时间
      }
    }).then(res => {
      console.log("支付成功", res)
      wx.showToast({
        title: '下单成功！',
      })
      //支付成功后，把购买的菜品销量增加
      // wx.cloud.callFunction({
      //   name: "addXiaoLiang",
      //   data: {
      //     id: res._id
      //   }
      // }).then(res => {
      //   console.log('添加销量成功', res)
      //   wx.setStorageSync('cart', "")
      //   wx.switchTab({
      //     url: '../me/me',
      //   })
      // }).catch(res => {
      //   console.log('添加销量失败', res)
      //   wx.showToast({
      //     icon: 'none',
      //     title: '支付失败',
      //   })
      // })

    }).catch(res => {
      wx.showToast({
        icon: 'none',
        title: '支付失败',
      })
      console.log("支付失败", res)
    })
    // let arr = wx.getStorageSync('cart') || [];
    // let arrNew = []
    // arr.forEach(item => {
    //   arrNew.push({
    //     _id: item._id,
    //     sellerId: item._openid, //卖家id
    //     name: item.name,
    //     price: item.price,
    //     beizhu: item.beizhu,
    //     quantity: item.quantity,
    //   })
    // });
    // //由于目前不存在店铺这一说，所以一件设备单独算一个订单
    // let proArr = []
    // let goods = []
    // arrNew.forEach(item => {
    //   let pro = db.collection("order").add({
    //     data: {
    //       name: this.data.address.userName,
    //       address: this.data.address.address,
    //       phone: this.data.address.phone,
    //       beizhu: this.data.beizhu,
    //       totalPrice: item.quantity * item.price, //总价钱
    //       good: item, //存json字符串
    //       status: 0, //-1订单取消,0新下单发货,1已收货待评价,2订单已完成
    //       _createTime: new Date().getTime() //创建的时间
    //     }
    //   })
    //   proArr.push(pro)
    //   goods.push({
    //     _id: item._id,
    //     quantity: -item.quantity
    //   })
    // })
    // Promise.all(proArr).then(res => {
    //   console.log("下单成功", res)
    //   wx.showToast({
    //     title: '下单成功！',
    //   })
    //   //确认成功后，把商品数量减少对应个数
    //   wx.cloud.callFunction({
    //     name: "addXiaoLiang",
    //     data: {
    //       goods: goods
    //     }
    //   }).then(res => {
    //     console.log('添加订单成功', res)
    //     wx.setStorageSync('cart', "")
    //     wx.navigateTo({
    //       url: '/pages/myOrder/myOrder',
    //     })
    //   }).catch(res => {
    //     console.log('添加订单失败', res)
    //     wx.showToast({
    //       icon: 'none',
    //       title: '下单失败',
    //     })
    //   })

    // }).catch(res => {
    //   wx.showToast({
    //     icon: 'none',
    //     title: '下单失败',
    //   })
    //   console.log("下单失败", res)
    // })
  },
  // 管理收获地址
  addAdress() {
    wx.chooseAddress({
      success: res => {
        console.log(res)
        app._saveAddress(res);
        this.getAddress(res)
      },
      //现在获取地址，不需要授权了
      fail: res => {
        console.log("获取地址失败", res)
        app.showErrorToastUtils('您取消了操作!，请重新获取地址');

      }
    })

  },
  getAddress(addressStro) {
    if (addressStro) {
      var address = app._getAddress(addressStro);
      var city = app._getCity(addressStro);
      console.log(city);
      if (address) {
        this.setData({
          isShowMyAddress: true,
          address: {
            userName: addressStro.userName,
            phone: addressStro.telNumber,
            city: city,
            address: address
          },
        })
      }
    }
  }
})