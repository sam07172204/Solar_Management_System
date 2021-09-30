const place_select = document.getElementById('place_select'); //地點選單
const start_datepicker = document.getElementById('start_datepicker'); //左側開始時間選單
const end_datepicker = document.getElementById('end_datepicker');  //左側結束時間選單
const search_btn = document.getElementById('search_btn'); //左側更新時間後搜尋按鈕
const selected_position = document.getElementById('selected_position'); //左側顯示被選取區域的區塊
const display_chart = document.getElementById('display_chart'); //右下的隱藏按鈕區域
const visible_btn = document.getElementsByClassName('visible_btn'); //右下6個讓canvas隱藏的按鈕
const canvas = document.getElementsByClassName('canvas'); //目前總共6個canvas
const update_time_value = document.getElementById('update_time_value'); //顯示數值更新時間

var chart_arr = []; //儲存從資料庫query下來的資料
var time = []; //儲存從資料庫query下來的時間
var chart_record = []; //儲存被渲染的chart物件(其實內容物包含了圖)
var p1_p2_data = []; //接收page1或page2傳來，要畫圖的區域資料
var start_time, end_time, place, update_time; //接收要共用的開始結束時間、地點資料、資訊更新時間
var ctx = []; //用來存取canvas上渲染的圖形
const chart_title = ["power", "voltage", "current", "contact_temperature",
                     "percentage_illuminance", "rate", "environment"]; //紀錄圖表的title
const color_select = [["rgba(220, 0, 120, 0.5)","rgba(220, 0, 160, 1)"], //pink
                      ["rgba(220, 120, 0, 0.5)","rgba(220, 160, 0, 1)"], //yellow
                      ["rgba(0, 220, 120, 0.5)","rgba(0, 220, 160, 1)"], //green
                      ["rgba(0, 120, 220, 0.5)","rgba(0, 160, 220, 1)"], //blue
                      ["rgba(120, 0, 220, 0.5)","rgba(160, 0, 220, 1)"], //purple
                      ["rgba(120, 120, 120, 0.5)","rgba(100, 100, 100, 1)"]]; //black
window.onload = main(); //網頁載入完成後執行main
function main() {
  //place = localStorage.getItem('place'); //取得共用的地點
  start_time = localStorage.getItem('start_time'); //取得共用的開始時間
  end_time = localStorage.getItem('end_time'); //取得共用的結束時間
  p1_p2_data = localStorage.getItem('chart_area'); //取得page1或page2傳來要繪圖的區域
  update_time = localStorage.getItem('update_time'); //取得共用的更新時間
  place_select.selectedIndex = 0;
  update_time_value.innerText = update_time;
  console.log(update_time)
  //將現在的標準時間+8小時候記錄起來，變成台灣時區當前時間
  var nowtime = new Date(new Date()+ 8*3600*1000).toISOString().substring(0, 16);
  start_datepicker.value = start_time; //將左側開始時間選的值設為共同值
  end_datepicker.value = end_time; //將左側結束選單的值設為共同值
  start_datepicker.min = "2020-07-01T00:00"; //將左側時間選單最早限制在 7/1 00:00
  end_datepicker.min = start_datepicker.value; //將結束時間選單的最早時間限制在開始時間選單的值
  start_datepicker.max = nowtime; //將開始與結束選單的值限制最晚設在當下
  end_datepicker.max = nowtime;
  p1_p2_data = JSON.parse(p1_p2_data); //解析page1或page2傳來的資料
  /*p1_p2_data的格式為[{zone: "A", array: "1", string: "1", number:1},
                          {zone: "A", array: "2"},...];最多目前可以6個區域*/
  console.log(p1_p2_data); //確認傳來的資料
  for(let i=0; i<p1_p2_data.length; i++) //根據收到的資料在左下角顯示繪圖區域
    add_position_selected(selected_position,i);
  for(let i=0; i<canvas.length; i++) //根據canvas給予ctx渲染的目標
    ctx[i] = canvas[i].getContext("2d"); //渲染為2d圖形
  generate_chart('set'); //根據解析完的資料進行畫圖
}

display_chart.addEventListener('click', function() { //監聽右下的canvas顯示區域按下
  chart_visible(); //每次有按到該區域則判斷哪些canvas要隱藏與顯示
});

start_datepicker.addEventListener('click', function() { //監聽開始時間選單按下
  start_datepicker.max = end_datepicker.value; //開始時間選單時間最晚只能到結束時間選單的值
});

end_datepicker.addEventListener('click', function() { //監聽結束時間選單按下
  end_datepicker.min = start_datepicker.value; //結束時間選單最早只能到開始時間選單的值
});

search_btn.addEventListener('click', function() { //監聽左側的查詢按鈕按下
  start_time = start_datepicker.value; //將開始時間記錄進start_time
  end_time = end_datepicker.value; //將結束時間記錄進end_time
  localStorage.setItem('start_time', start_datepicker.value) //更新共用開始時間
  localStorage.setItem('end_time', end_datepicker.value) //更新共用結束時間
  generate_chart('update'); //更新canvas內容
});

function generate_chart(set_or_update) { //設置或更新canvas的內容
  for(let i=0; i<p1_p2_data.length; i++)  //根據page1或page2傳來的資料的區域數量
  {
    p1_p2_data[i].start_time = start_time; //將page1或page2傳來的資料增加時間參數
    p1_p2_data[i].end_time = end_time;
    POSTquery_chart(p1_p2_data[i]); //根據該資料向後端拿取資料
    //避免後端較後面的任務先完成導致收到不屬於自己的資料，進行幾次延遲<此處同步機制還可加強>
    let delay = 100; //設置凍結0.1秒
    let end = +new Date() + delay; //這邊作一個簡單的delay
    while(new Date() < end)
      ;
  }
  //等待600毫秒後，已向後端取得需要繪圖的資料儲存在chart_arr中<此處同步機制可再加強>
  setTimeout(function() {
    chart_arr = matrix_reverse(chart_arr); //將矩陣轉置，改變為各個canvas的參數在同一row
    for(let i=0; i<chart_arr.length; i++) { //根據html的canvas, title, 畫圖資料 繪圖
      let dataset = generate_dataset(chart_arr[i]); //將query下來的資料轉變為繪圖的格式
      if (set_or_update === 'set') //如果是剛進來載入page3，就傳入繪圖需要的參數
        chart(ctx[i], chart_title[i], dataset);
      else if (set_or_update === 'update') //若是由查詢按鈕觸發，則更新圖表
        update_chart(chart_record[i], dataset);
    }
    //chart_visible();
    chart_arr = []; //清空chart_arr等待給更新圖表時使用
  }, 600)
}

function POSTquery_chart(json_frormat) { //將page2或page3拿取並解析的資料送往後端進行query
  $.ajax({ //利用ajax動態向後端拿取資料並將結果儲存進chart_arr裡面
    url: "http://localhost:8080/page3", //將會向localhost:8080/page3這個位址發出POST請求
    type: "POST",
    dataType: 'json', //用json的文字格式將資料交給後端
    data: json_frormat,
    success: function(returnData) { //後端的資料回傳回來
      time = [];
      let power = [];
      let voltage = [];
      let current = [];
      let contact_temperature = [];
      let percentage_illuminance = [];
      let rate = [];
      let environment = [];
      for(let i=0; i<returnData.length; i++) { //把搜尋到的JSON格式資料一組一組存進陣列
        /*回傳的資料形式為 [{time: XXX, power: XXX, voltage...},
                          {time: XXX, power: XXX, voltage...},...]*/
        time.push(returnData[i]["time"]);
        power.push(returnData[i]["power"]);
        voltage.push(returnData[i]["voltage"]);
        current.push(returnData[i]["current"]);
        contact_temperature.push(returnData[i]["contact_temperature"]);
        percentage_illuminance.push(returnData[i]["percentage_illuminance"]);
        rate.push(returnData[i]["rate"]);
        environment.push(returnData[i]["environment"]);
      }
      /*chart_arr將會獲取所有query時間區間的各項參數陣列
        並且根據有被選取的區域數量決定會被push幾組資料進去*/
      chart_arr.push([[power], [voltage], [current], [contact_temperature],
                      [percentage_illuminance], [rate], [environment]])
    },
    error: function() { //後端若回傳資料失敗或沒反應，log出錯誤訊息
      console.log("ajax fail");
    }
  });
} //query最多6次以後，chart_arr已儲存所有繪圖要用到的資料

function generate_dataset(array) { //array內為1~6組區域的電壓資料/電流資料...
  let json_array = [] //json_array將會儲存每個區域的繪圖參數與數值資料
  for(let i=0; i<array.length; i++) {
    let obj = new Object;
    json_array.push(obj)
    json_array[i].label = '';
    json_array[i].data = array[i][0]; //arry[i]must add[0]
    json_array[i].backgroundColor = color_select[i][0];
    json_array[i].borderColor = color_select[i][1];
    json_array[i].borderWidth = "2";
    json_array[i].fill = false;
    json_array[i].lineTension = 0;
    json_array[i].fill = false;
    if (p1_p2_data[i].zone === 'all') //繪製特定區域的圖形，可以在這邊給與別人不同的效果
      json_array[i].type = 'bar';
    else
      json_array[i].type = 'line';
  }
  return json_array; //回傳內含1~6個obj的一維陣列，每個皆有描述繪圖相關參數與數值
}

function chart(ctx, title, dataset) { //繪圖函式
  let chart = new Chart(ctx, { //根據選到要渲染的ctx，根據dataset繪圖
    type: 'bar',
    data: {
      labels: time, //x軸的資料輸入時間資訊
      datasets: dataset //y軸輸入各區域的發電量/電壓/電流...
		},
    options: {
      title: { //設定圖表title
        display: true,
        text: title,
        fontSize: 20
      },
      scales: { //設定圖表度量衡
        xAxes: [{
          scaleLabel: {display: true, labelString: 'Time'},
          type: 'time',
          time: {
            unit: 'day'
          }
        }],
        yAxes: [{
          scaleLabel: {display: true, labelString: title}
        }]
      }
    }
  });
  chart_record.push(chart); //將繪製的chart送進chart_record，更新用
  //chart.render(); //渲染圖形
}

function update_chart(chart, new_dataset) {
  chart.data.labels = time; //更新繪圖時間
  chart.data.datasets = new_dataset; //更新繪圖資料
  chart.update(); //啟動更新圖表
}

function chart_visible() { //根據右下角按鈕狀態決定canvas是否要隱藏
  for(let i=0; i<visible_btn.length; i++) {
    if(visible_btn[i].checked) //若按鈕有被選取，圖形出現
      canvas[i].style.display="block";
    else //若按鈕沒被選取，圖形隱藏
      canvas[i].style.display="none";
  }
}

function matrix_reverse(sourceArr) { //將矩陣轉置
  let reversedArr = [];
  for(let i=0; i<sourceArr[0].length; i++) {
    reversedArr[i] = [];
    for(let j=0; j<sourceArr.length; j++)
      reversedArr[i][j] = sourceArr[j][i];
  }
  return reversedArr;
}

function add_position_selected(table_obj, number) { //根據被選取的區域數量新增左下的表
  let tr_node = document.createElement("tr"); //創立需要的row node
  let td_node0 = document.createElement("td"); //創立column node0
  let td_node1 = document.createElement("td"); //創立column node1
  let div_node = document.createElement("div"); //創立會放入column node0的圓圈
  div_node.className = "line_color" //CSS內先定義了圓圈的樣式，套用至該class
  //根據送來的number參數選擇圓圈形式
  div_node.style = "background-color:"+color_select[number][0]+";"+
                   "border-color:"+color_select[number][1]
  let add_text = p1_p2_data[number].zone; //組裝要放進表內的文字
  if(p1_p2_data[number].array !== undefined)
    add_text += ', '+p1_p2_data[number].array;
  if(p1_p2_data[number].string !== undefined)
    add_text += ', '+p1_p2_data[number].string;
  if(p1_p2_data[number].number !== undefined)
    add_text += ', '+p1_p2_data[number].number;
  let text_node = document.createTextNode(add_text); //將文字變成 node，準備加入表
  td_node0.appendChild(div_node); //將圓圈變成 td node
  td_node1.appendChild(text_node); //將文字 node變成 td node
  tr_node.appendChild(td_node0); //將兩個 td node 放進 tr node
  tr_node.appendChild(td_node1);
  table_obj.appendChild(tr_node); //將 tr node 放入送進來的表中
}
