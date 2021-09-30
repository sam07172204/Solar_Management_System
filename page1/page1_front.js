const btn = document.getElementsByClassName('button');
const start_time = document.getElementById('start_datepicker');
const end_time = document.getElementById('end_datepicker');
const update = document.getElementsByClassName('update');
const place = document.getElementById('place');
const all_power_value = document.getElementById('all_power_value');
const search_btn = document.getElementById('search_btn');
const update_time_value = document.getElementById('update_time_value');

var update_data;
var update_data_array =[];
var rate = [];
//---------------------------------------------------------------

window.onload = main(); //網頁載入完成後執行main
function main() {
  //將現在的標準時間+8小時候記錄起來，變成台灣時區當前時間
  var nowtime = new Date(new Date()+ 8*3600*1000).toISOString().substring(0, 16);
  start_datepicker.min = "2020-07-01T00:00"; //將左側時間選單最早限制在 7/1 00:00
  end_datepicker.min = start_datepicker.value; //將結束時間選單的最早時間限制在開始時間選單的值
  start_datepicker.max = nowtime; //將開始與結束選單的值限制最晚設在當下
  end_datepicker.max = nowtime;
  //看class有幾個，可以讓每個按鈕都有功能
  for(let i = 0; i < btn.length; i++) {
    btn[i].addEventListener("click", function() {
      POSTquery(btn[i].value +","+start_time.value+","+end_time.value )
      console.log("start_time:",btn[i].value +","+start_time.value+","+end_time.value)
    })
  }
  POSTstart();
  start_alert();
  load_zone_data();

  search_btn.addEventListener("click", function() {
    load_zone_data();
  })


}

//----------------------------------------------

start_datepicker.addEventListener('click', function() { //監聽開始時間選單按下
  start_datepicker.max = end_datepicker.value; //開始時間選單時間最晚只能到結束時間選單的值
});

end_datepicker.addEventListener('click', function() { //監聽結束時間選單按下
  end_datepicker.min = start_datepicker.value; //結束時間選單最早只能到開始時間選單的值
});

//AJAX按下按鈕才會有動作，回傳 ZONE ARRAY STRING NUMBER
function POSTquery(btn_name) {
  $.ajax({
    url: "http://localhost:8080/page1",
    type: "POST",
    dataType: 'json',
    data:btn_name,
    success: function(returnData) {
      jsonObjStr = JSON.stringify(returnData);
      console.log(jsonObjStr);
      localStorage.setItem('place', place.value)//傳送地點
      localStorage.setItem('key', jsonObjStr)//傳送資料庫數值
      localStorage.setItem('start_time',start_time.value)//傳送開始時間
      localStorage.setItem('end_time',end_time.value )//傳送結束時間
      document.location.href='../page2/page2.html';//按下按鈕跳轉到頁面2

    },
    error: function() {
      console.log("ajax fail");
    }
  });
}
//-------------------------------------------------
//自動抓資料
function POSTload(value)
{


  return new Promise((resolve, reject) => {

  $.ajax({
    url: "http://localhost:8080/page1",
    type: "POST",
    dataType: 'json',
    data:value,
    success: function(returnData) {
      console.log("----------------------------");

      update_data_array.push(returnData[0]["mean"]);
      rate.push(returnData[0]["rate"])
      // console.log(update_data_array)
      // console.log(rate)
      up_0 = parseFloat(update_data_array[0]/100*60*60)//還沒加上時間，先假設一秒為一筆資料算發電量，如果有正確資料再修正
      up_1 = parseFloat(update_data_array[1]/100*60*60)
      up_2 = parseFloat(update_data_array[2]/100*60*60)
      up_3 = parseFloat(update_data_array[3]/100*60*60)
      let all_power = up_0 + up_1 + up_2 + up_3//把每個ZONE的發電量加起來為總發電量
      let money = parseInt(rate[0])+ parseInt(rate[1])+ parseInt(rate[2])+ parseInt(rate[3])//把每個ZONE的獲利加總起來
      localStorage.setItem('all_power', all_power)//把值傳給後面頁面
      $("#update_"+[0]).html("ZONE A <br>太陽能板數量: 8<br>太陽能陣列數量: 2<br>發電量:"+ parseFloat(up_0.toFixed(2)) + "KWh");//前端顯示
      $("#update_"+[1]).html("ZONE B <br>太陽能板數量: 8<br>太陽能陣列數量: 2<br>發電量:"+parseFloat(up_1.toFixed(2))+ "KWh");//前端顯示
      $("#update_"+[2]).html("ZONE C <br>太陽能板數量: 8<br>太陽能陣列數量: 2<br>發電量:"+parseFloat(up_2.toFixed(2))+  "KWh");//前端顯示
      $("#update_"+[3]).html("ZONE D <br>太陽能板數量: 8<br>太陽能陣列數量: 2<br>發電量:"+parseFloat(up_3.toFixed(2))+ "KWh");//前端顯示
      $("#all_power_value").html( parseFloat(all_power.toFixed(2))+ "KWh");//前端顯示
      $("#all_money_value").html(money+ "元");//前端顯示
        resolve('Success!');
    },

    error: function() {
        console.log("ajax fail");
        //alert('失敗');
    }
  });

  });


}
//---------------------------------------------------------------
//這邊的ajax是要讓開始資料欄位有環境貢獻及獲利
function POSTstart() {
$.ajax({
  url: "http://localhost:8080/page1",
  type: "POST",
  dataType: 'json',
  data:"new",
  success: function(returnData)
  {
    let money = returnData[0]["rate"]
    localStorage.setItem('environment', returnData[0]["environment"])//傳送環境
    localStorage.setItem('money', parseInt(returnData[0]["rate"]))//傳送金額
  },
  error: function()
  {
      console.log("ajax fail");
  }
}); // end of detecting the HTTP code from ptt and fb
}


//---------------------------------------------------------------
//在畫面開始畫面跑出資訊欄位
function start_alert() {
  swal.fire({
    title: "<i>律輝太陽能監控系統</i>",
    html: "<p class = 'sw_text'>地點：成大工科1</p> "+
          "<p class = 'sw_text'>市電併聯日：2020/06/01</p> "+
          "<p class = 'sw_text'>台電契約計算：1.7 新台幣/kWh 約期20年</p>"+
          "<p class = 'sw_text'>累計獲利 : 新台幣"+localStorage.getItem('money')+"元</p>"+
          "<p class = 'sw_text'>累計環境貢獻 : "+parseInt(localStorage.getItem('environment'))+"天份一般家庭用電</p>"+
          "<p class = 'sw_text'>軟體版本：0.1.1 專業版</p>"+
          "<p class = 'sw_text'>系統商：律輝科技</p>"+
          "<p class = 'sw_text'>聯絡電話： (02)2658-3302</p>"+
          "<p class = 'sw_text'>保固資訊：5年(2020/06/01-2025/06/01)</p>"+
          "<p class = 'sw_text'>歷史紀錄：2020/06/30	太陽能板清洗</p>",
    showConfirmButton: true ,
    confirmButtonText: '案場整體表現',
    confirmButtonColor: '#3085d6',
    showCancelButton: true,
    cancelButtonText: '案場細節展示',
    cancelButtonColor: '#F69500',
    customClass: 'swal-wide',
  }).then((result) => {
    if (result.value) {
      let chart_area = [{zone: "all"},
                        {zone: "A"},
                        {zone: "B"},
                        {zone: "C"},
                        {zone: "D"}];
      localStorage.setItem('chart_area', JSON.stringify(chart_area));
      document.location.href='../page3/page3.html';//這邊會跳轉到整個案場的資訊頁
    }
  })
}
// -------------------------------------------------------------
//自動去後端抓4個ZONE的相關資料來顯示
function load_zone_data() {
  localStorage.setItem('start_time',start_time.value)//傳送開始時間
  localStorage.setItem('end_time',end_time.value )//傳送結束時間
        //更新時間
  var dt = new Date().toLocaleString().replace(' ', '\n');
  //console.log(dt.toLocaleString());
  update_time_value.innerText = dt;//更新時間欄位
  localStorage.setItem('update_time', dt)//傳送更新時間



  for(let i = 0; i < update.length; i++) {

    update_data_array =[];
    rate = [];


    POSTload(update[i].getAttribute("value") +","+start_time.value+","+end_time.value).then(value => {
      console.log(update[i].getAttribute("value") +","+start_time.value+","+end_time.value )
      console.log(value); // Success!
    })


    // var delay = 500 // 凍結 0.1 秒
    // var end = +new Date() + delay//這邊作一個簡單的delay
    // while(new Date() < end) {
    //   }
  }
};

  //----------------------------------------------
