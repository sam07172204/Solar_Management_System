/*server設定*/
const Influx = require('influx');
const express = require('express');
const cors = require('cors');
var test = []
var app = express();
app.use(cors());
//http的前端和後端來源不同的話，javascript會被瀏覽器阻擋，cors()可以解除這限制
app.use(express.json()); //這行目前不影響
app.use(express.urlencoded({ extended: true })); //用來解析application/x-www-form-urlencoded
//influxDB伺服器建立
const influx= new Influx.InfluxDB( {
  host: 'localhost', //本地端填localhost
  database: 'FerryBits', //選擇measurement(table)
  port:8086 //influx預設的port
})
//讓伺服器監聽8080port
var server = app.listen(8080, function() {
    var host = server.address().address
    var port = server.address().port
    console.log("建立伺服器 %s:%s", host, port)
})


/*######################################page1#################################*/
app.post('/page1', function(req, res) {
    var zone = JSON.stringify(req.body).split('"')[1];
    var check = zone.split(',')[0]//前端傳過來的check
    var z = zone.split(',')[1]//前端傳過來的ZONE
    var z_number = zone.split(',')[2]//前端傳過來ZONE NUMBER
    var start_time =new Date(zone.split(',')[3])//前端傳過來start_time
    var end_time = new Date(zone.split(',')[4])//前端傳過來end_time

    // start_time = (start_time.getTime()+8000*60*60)*1000000
    // end_time = (end_time.getTime()+8000*60*60)*1000000
    start_time = start_time.getTime()*1000000
    end_time = end_time.getTime()*1000000
    // console.log("start_time:",start_time," end_time:",end_time);
    // console.log("z:",z,"  z_number:",z_number);
//--------------------------------------------------------
    if(check == "bu") {
      zone2arr(z_number,start_time,end_time).then(results =>
      { //利用Promise的then方法，確保非同步執行時的順序
        console.log(results)
        res.json(results); //res有end,send,json三種方式可以回傳資料到前端，json為傳json格式用
      })
    }
    if(check == "up")
    {

      update2arr(z_number,start_time,end_time).then(results =>
      { //利用Promise的then方法，確保非同步執行時的順序
        console.log(results)
        res.json(results); //res有end,send,json三種方式可以回傳資料到前端，json為傳json格式用
      })
    }
    if(check == "new")
    {
  
      new2arr().then(results =>
      { //利用Promise的then方法，確保非同步執行時的順序
        console.log(results)
        res.json(results); //res有end,send,json三種方式可以回傳資料到前端，json為傳json格式用
      })
    }

})

//--------------------------------------------------------
//自定義的function，用來查詢資料庫
function zone2arr(buffer)
{
  return new Promise(function(resolve, reject) {
  console.log("select * from nckues1 where zone = '" + buffer +"'" +" and time = '2020-07-01 00:00:00'  " )
  if(buffer) {
    influx.query("select * from nckues1 where zone = '" + buffer +"'" +" and time = '2020-07-01 00:00:00' ").then(results => {
      var result = results.map(obj=>{return{zone:obj.zone, array:obj.array, string:obj.string, number:obj.number}});
      resolve(result);
    })
  }
 });
}
//--------------------------------------------------------
//自定義的function，用來查詢資料庫，目前用I來做代表
function update2arr(buffer,start,end)
{
  return new Promise(function(resolve, reject) {
  console.log("select MEAN(power),SUM(rate) from nckues1 where zone = '" + buffer +"'" +" and time >= " + start + " and time <= " + end)
  if(buffer) {
    influx.query("select MEAN(power),SUM(rate) from nckues1 where zone = '" + buffer + "'" +" and time >= " + start + " and time <= " + end).then(results => {
      var result = results.map(obj=>{return{time:obj.time,mean:obj.mean,rate:obj.sum}});
      resolve(result);
    })
  }
 });
}
//------------------------------------------------------
//資料庫撈環境與Power資料
function new2arr() {
  return new Promise(function(resolve, reject) {
  console.log("select * from nckues1" )
  influx.query("select MEAN(environment),SUM(rate) from nckues1").then(results => {
      var result = results.map(obj=>{return{environment:obj.mean,rate:obj.sum}});
      console.log(result);
      resolve(result);
    })
  });
 }


/*######################################page2#################################*/
app.post('/page2', function(req, res) {
  var buffer;
  var start;
  var end;
  var arrnum;
  var strnum;
  console.log("前端傳來的資料: ", req.body);
  console.log("資料長度 : ", JSON.stringify(req.body).split(',').length); //4,5,6,
  buffer = JSON.stringify(req.body).split(',')[0].split('"')[1];
  start = JSON.stringify(req.body).split(',')[1];
  end = JSON.stringify(req.body).split(',')[2].split('"')[0];
  arrnum = JSON.stringify(req.body).split(',')[3].split('"')[0];
  if (JSON.stringify(req.body).split(',').length==5) {
    strnum = JSON.stringify(req.body).split(',')[4].split('"')[0];
  }
  else if (JSON.stringify(req.body).split(',').length==6) {
    strnum = JSON.stringify(req.body).split(',')[4].split('"')[0];
    console.log("有拉strnum: ",strnum);
    num = JSON.stringify(req.body).split(',')[5].split('"')[0];
    console.log("有拉: ");
  }
  //時間換算成奈秒
  var start_time =new Date(start)//前端傳過來start_time
  var end_time = new Date(end)//前端傳過來end_time
  start_time = (start_time.getTime())*1000000
  end_time = (end_time.getTime())*1000000

  if (JSON.stringify(req.body).split(',').length==4) {
    get2array(buffer,arrnum,start_time,end_time).then(results =>
    { //利用Promise的then方法，確保非同步執行時的順序
        arr = results[0];
        time = results[1];
        console.log("回傳值:\n", arr);
        console.log("回傳時間:\n", time);
        console.log("--------------------------------------------------------");
        res.json([JSON.stringify(arr),JSON.stringify(time)]); //end,send,json
    })
  }
  else if (JSON.stringify(req.body).split(',').length==5) {
    get2str(buffer,arrnum,strnum,start_time,end_time).then(results =>
    { //利用Promise的then方法，確保非同步執行時的順序
        arr = results[0];
        time = results[1];
        console.log("回傳值:\n", arr);
        console.log("回傳時間:\n", time);
        console.log("--------------------------------------------------------");
        res.json([JSON.stringify(arr),JSON.stringify(time)]); //end,send,json
    })
  }
  else {
    get2num(buffer,arrnum,strnum,num,start_time,end_time).then(results =>
    { //利用Promise的then方法，確保非同步執行時的順序
        arr = results[0];
        time = results[1];
        console.log("回傳值:\n", arr);
        console.log("回傳時間:\n", time);
        console.log("--------------------------------------------------------");
        res.json([JSON.stringify(arr),JSON.stringify(time)]); //end,send,json
    })
  }
});

function get2array(zonenum,arrnum,start,end) {
  return new Promise(function(resolve, reject){
  console.log("select MEAN(power) from nckues1 where zone = '" + zonenum +"'" +" and array = '" + arrnum +"'" +" and time >= " + start + " and time <= " + end)
  if(zonenum) {
    influx.query("select MEAN(power) from nckues1 where zone = '" + zonenum +"'" +" and array = '" + arrnum +"'" +" and time >= " + start + " and time <= " + end).then(results => {
      var result = results.map(obj=>{return{time:obj.time,mean:obj.mean}});
      console.log(result);
      resolve(result);
    })
  }
 });
}

function get2str(zonenum,arrnum,strnum,start,end) {
  return new Promise(function(resolve, reject){
  console.log("select MEAN(power) from nckues1 where zone = '" + zonenum +"'" +" and array = '" + arrnum +"'" +" and string = '" + strnum +"'" +" and time >= " + start + " and time <= " + end)
  if(zonenum) {
    influx.query("select MEAN(power) from nckues1 where zone = '" + zonenum +"'" +" and array = '" + arrnum +"'" +" and string = '" + strnum +"'" +" and time >= " + start + " and time <= " + end).then(results => {
      var result = results.map(obj=>{return{time:obj.time,mean:obj.mean}});
      console.log(result);
      resolve(result);
    })
  }
 });
}

function get2num(zonenum,arrnum,strnum,num,start,end) {
  return new Promise(function(resolve, reject){
  console.log("select MEAN(power) from nckues1 where zone = '" + zonenum +"'" +" and array = '" + arrnum +"'" +" and string = '" + strnum +"'" +" and number = '" + num +"'" +" and time >= " + start + " and time <= " + end)
  if(zonenum) {
    influx.query("select MEAN(power) from nckues1 where zone = '" + zonenum +"'" +" and array = '" + arrnum +"'" +" and string = '" + strnum +"'" +" and number = '" + num +"'" +" and time >= " + start + " and time <= " + end).then(results => {
      var result = results.map(obj=>{return{time:obj.time,mean:obj.mean}});
      console.log(result);
      resolve(result);
    })
  }
 });
}


/*###################################page3####################################*/
app.post('/page3', function(req, res) {//收到路徑為8080/page3的請求
  console.log("前端傳來的資料: ", req.body); //將前端送來的資料印出做確認
  query2chart_json(req.body).then(results => {//將前端送來的json格式資料轉換成query結果
    //利用Promise的then方法，確保非同步執行時的順序，先將query完成再回傳前端
    res.json(results); //res有end,send,json三種方式可以回傳資料到前端，json為傳json格式用
  })
})

function query2chart_json(buffer) {//向influxDB query出要畫圖的資訊
  //創立Promise物件，確保搜尋完資料庫才進行下一步
  return new Promise(function(resolve, reject) {
    //組裝好query語法，SELECT填寫要query出的資訊(此處MEAN和SUM為暫定)
    query_str = "SELECT "+"MEAN(power), MEAN(voltage), MEAN(current), MEAN(contact_temperature),"
                +" MEAN(percentage_illuminance), SUM(rate), SUM(environment)"
                +" FROM nckues1" //FROM後面填寫資料庫的measurement
    if(buffer.zone === 'all') //若json格式中的Zone label為all，只需要加時間條件
      query_str += " WHERE";
    else if(buffer.zone !== undefined) //若zone有被定義，query條件增加zone
      query_str += " WHERE "+"zone='"+buffer.zone+"' AND";
    if(buffer.array !== undefined) //若array有被定義，query條件增加array
      query_str += " array='"+buffer.array+"' AND";
    if(buffer.string !== undefined) //若string有被定義，query條件增加string
      query_str += " string='"+buffer.string+"' AND";
    if(buffer.number !== undefined) //若number有被定義，query條件增加number
      query_str += " number='"+buffer.number+"' AND";
    //附註:資料庫內目前的資料包含時間為標準時間7/1 00:00~7/31 23:55
    //前端查詢的資料為台灣時間7/1 00:00開始，為標準時間6/30 14:00，因此前面8小時沒資料
    let start_time = new Date(buffer.start_time).getTime()*1000000; //influxDB是以奈秒為單位
    let end_time = new Date(buffer.end_time).getTime()*1000000;
    query_str += " time >="+start_time+" AND time <="+end_time
              +" GROUP BY time(24h)"
    console.log("資料庫語法: ", query_str) //確認下了什麼query
    console.log("start time: ", start_time)  //確認query時間
    console.log("end time: ", end_time)
    influx.query(query_str).then(results => {
      console.log("資料庫語法: ", query_str) //同步要注意的地方
      //將mean和sum語法被轉換的json格式key換回來
      let result = results.map(obj=> {
        return {time:obj.time, power:obj.mean, voltage:obj.mean_1, current:obj.mean_2,
                contact_temperature:obj.mean_3, percentage_illuminance:obj.mean_4,
                rate:obj.sum, environment:obj.sum_1}});
      //console.log("資料庫的東西:\n", results); //這邊可以觀察從資料庫query到的東西
      resolve(result); //query結果的promise物件回傳
    });
  });
 }
