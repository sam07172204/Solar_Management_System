const place_select = document.getElementById("place_select"); //地點選單
const selected_zone = document.getElementById("selected_zone");  //左上被選取的zone區域
const start_datepicker = document.getElementById('start_datepicker'); //左側開始時間選單
const end_datepicker = document.getElementById('end_datepicker'); //左側結束時間選單
const selected_position = document.getElementById("selected_position"); //左下角被選取要繪圖的區域
const search_btn = document.getElementById("search_btn");
const remove_btn = document.getElementById("remove_btn");
const send_btn = document.getElementById("send_btn");
const array_area = document.getElementById("array_area"); //array_area=>array
const string_area = document.getElementById("string_area"); //string_area=>string
const number_area = document.getElementById("number_area");
const update_time_value = document.getElementById('update_time_value'); //顯示數值更新時間

var color_count = 0; //用來記錄繪圖顏色要劃第幾個
var start_time, end_time, zone_id, jsonObj; //紀錄起始、結束時間
var chart_area = [];
var array = [];

const color_select = [["rgba(220, 0, 120, 0.5)","rgba(220, 0, 160, 1)"], //pink
                      ["rgba(220, 120, 0, 0.5)","rgba(220, 160, 0, 1)"], //yellow
                      ["rgba(0, 220, 120, 0.5)","rgba(0, 220, 160, 1)"], //green
                      ["rgba(0, 120, 220, 0.5)","rgba(0, 160, 220, 1)"], //blue
                      ["rgba(120, 0, 220, 0.5)","rgba(160, 0, 220, 1)"], //purple
                      ["rgba(120, 120, 120, 0.5)","rgba(100, 100, 100, 1)"]]; //black

window.onload = main(); //網頁載入完成後執行main
function main() {
  start_time = localStorage.getItem('start_time'); //取得共用的開始時間
  end_time = localStorage.getItem('end_time'); //取得共用的結束時間
  update_time = localStorage.getItem('update_time'); //取得共用的更新時間
  place_select.selectedIndex = 0; //地點下拉式選單編號 先定為0且使用者不可改動
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
  document.oncontextmenu = function() {return false}; //禁止滑鼠右鍵選單顯示
  jsonObj = JSON.parse(localStorage.getItem('key'));
  //把array數量記錄起來
  for(let i=0; i<jsonObj.length; i++) {
    array.push(jsonObj[i]["array"]);
  }
  zone_buf = "Zone "+jsonObj[0].zone; //取得zone名稱
  selected_zone.innerHTML = zone_buf; //更新zone
  place = localStorage.getItem('place');
  zone_id = jsonObj[0].zone;
  create_array(); //剛進入畫面先產生array block
}

start_datepicker.addEventListener('click', function() { //監聽開始時間選單按下
  start_datepicker.max = end_datepicker.value; //開始時間選單時間最晚只能到結束時間選單的值
});

end_datepicker.addEventListener('click', function() { //監聽結束時間選單按下
  end_datepicker.min = start_datepicker.value; //結束時間選單最早只能到開始時間選單的值
});

search_btn.addEventListener("click",function() { //選擇時間 按下查詢按鈕
  start_time = start_datepicker.value; //將開始時間記錄進start_time
  end_time = end_datepicker.value; //將結束時間記錄進end_time
  localStorage.setItem('start_time', start_datepicker.value) //更新共用開始時間
  localStorage.setItem('end_time', end_datepicker.value) //更新共用結束時間
  remove_blocks("array_area"); //清空array按鈕
  remove_blocks("string_area"); //清空string按鈕
  remove_blocks("number_area"); //清空number按鈕
  create_array(); //創造array按鈕
});

remove_btn.addEventListener("click",function() { //點擊刪除按鈕
  //刪除所有選擇並且清空將傳送給page3的資料
  while (selected_position.firstChild) { //刪除左下角被選取區域
    selected_position.removeChild(selected_position.lastChild);
  }
  remove_blocks("array_area");  //刪除所有array 的block
  remove_blocks("string_area");  //刪除所有string 的block
  remove_blocks("number_area");  //刪除所有number 的block
  chart_area = [];
  color_count = 0;
  create_array(); //點擊刪除按鈕最後重新產生array block
});

content.addEventListener('click', function(some_element) {
  let element = some_element.target;
  console.log(element.id);
    if(element.className === "solar_array") { //點擊某個array
      remove_blocks("string_area"); //清空string按鈕
      remove_blocks("number_area"); //清空number按鈕
    }
  else if(element.className === "solar_string") { //點擊某個string
      remove_blocks("number_area"); //清空number按鈕
    }
  create_block(element.id);
});

send_btn.addEventListener("click",function() { // 監聽觀看圖表按鈕 按下按鈕 轉跳到page3
  jsonObjStr = JSON.stringify(chart_area); //chart_area 裡面放的是被選取的太陽能板編號
  console.log(chart_area)
  localStorage.setItem('chart_area',jsonObjStr); //存進localStorage 以傳給第三頁網頁
  setTimeout(function() {
    document.location.href = '../page3/page3.html';
  }, 500)
});

function shows(block_Obj){ //如果右鍵點擊方格 觸發這個function
  let chart_arr = [];
  block_Obj.style.background = color_select[color_count][0]; //背景變色
  block_Obj.style.borderColor = color_select[color_count][1]; //背景變色
  chart_arr.push(jsonObj[0].zone) //字串處理
  chart_arr.push(block_Obj.id.split(",")[0]) //字串處理
  chart_arr.push(block_Obj.id.split(",")[1]) //字串處理
  chart_arr.push(block_Obj.id.split(",")[2]) //字串處理
  json_arr = generate_json_arr(chart_arr) //將chart_arr的資料從陣列改成obj
  chart_area.push(json_arr); //給Page3的array
  var selects = document.createElement("span");
  select = block_Obj.id + '<br>'
  selects.innerHTML = select;
  //selected_position.appendChild(selects);
  add_position_selected(selected_position, color_count, block_Obj.id);
  color_count++;
}

function btnPOSTquery(search_data, block_id) //將要下query的字串與繪圖的區域畫出來
{
  $.ajax({
    url: "http://localhost:8080/page2",
    type: "POST",
    dataType: 'json',
    data: search_data,
    success: function(returnData) {
      console.log(returnData);
      if (JSON.parse(returnData[0]) === null) {
        console.log("無資料");
      }
      let values = JSON.parse(returnData[0]).mean.toFixed(2) +"kWh";
      let btn = document.createElement("span"); //在 Id='array_area' 下面創造一個 <span></span>的child
      show_value = block_id + "<br>" + values;
      //在 <span></span>下面創造一個 <button></button>的child
      if(block_id.toString().split(",").length === 1) { //array
        btn.innerHTML = "<button class=solar_array oncontextmenu=shows(this)"+
                        " id='"+ block_id +"'>"+ show_value +"</button >";
        array_area.appendChild(btn); //將btn child加入array_area物件中
      }
      else if (block_id.toString().split(",").length === 2) { //string
        btn.innerHTML = "<button class=solar_string oncontextmenu=shows(this)"+
                        " id='"+ block_id +"'>"+ show_value +"</button >";
        string_area.appendChild(btn); //將btn child加入string_area物件中
      }
      else if (block_id.toString().split(",").length === 3) { //number
        btn.innerHTML = "<button class=solar_number oncontextmenu=shows(this)"+
                        " id='"+ block_id +"'>"+ show_value +"</button >";
        number_area.appendChild(btn); //將btn child加入string_area物件中
      }
    },
    error: function() {
        console.log("ajax fail");
    }
  });
}

function create_block(element_id) { //根據點擊block的id產生新的block
  let block_number = count_block(element_id); //根據id決定要創建的block數量
  for(let i=1; i<block_number+1; i++) {
    search = zone_id+","+start_time+","+end_time+","+element_id+","+i;
    btnPOSTquery(search, element_id+","+i);
    var delay = 50 //凍結 0.05 秒
    var end = +new Date() + delay //這邊作一個簡單的delay
    while(new Date() < end)
      ;
  }
}

function create_array() { //創造Array方塊
  var array_number = Array.from(new Set(array)).length; //計算array數量
  for(let i=1; i<array_number+1; i++) { //i代表第幾個array
    search = zone_id+","+start_time+","+end_time+","+i; //區域 + 開始時間 + 結束時間 + 創造幾塊
    console.log('search : ', search);
    btnPOSTquery(search, i); //到後端拿取資料並創造array方塊
    var delay = 50 // 凍結 0.05 秒
    var end = +new Date() + delay//這邊作一個簡單的delay
    while(new Date() < end)
      ;
  }
};

//計算某條array下面string的數量 或是某條string下number的數量
function count_block(element_id) { //根據點擊block的id計算要產生的block數目
  var buffer = [];
  for(let i=0; i<jsonObj.length; i++) {
    if(element_id.toString().split(",").length === 1) {
      if (jsonObj[i].array === element_id) {
        buffer.push(jsonObj[i].string);
      }
    }
    else if(element_id.toString().split(",").length === 2) {
      if (jsonObj[i].array+","+jsonObj[i].string === element_id) {
        buffer.push(jsonObj[i].number);
      }
    }
  };
  return Array.from(new Set(buffer)).length; //計算string沒重複的數量並回傳
}

function remove_blocks(area) { //刪除block按鈕function
  const node = document.getElementById(area);
  while (node.firstChild) {
    node.removeChild(node.lastChild);
  }
}

function generate_json_arr(array) { //將陣列資料轉成obj
  var objs = new Object();
  objs.zone = array[0]; //以選擇區域得zone number
  objs.array = array[1]; //以選擇區域得array number
  objs.string = array[2]; //以選擇區域得string number
  objs.number = array[3]; //以選擇區域得number number
  return objs;
};

function add_position_selected(table_obj, number, block_id) { //根據被選取的區域數量新增左下的表
  let tr_node = document.createElement("tr"); //創立需要的row node
  let td_node0 = document.createElement("td"); //創立column node0
  let td_node1 = document.createElement("td"); //創立column node1
  let div_node = document.createElement("div"); //創立會放入column node0的圓圈
  div_node.className = "line_color" //CSS內先定義了圓圈的樣式，套用至該class
  //根據送來的number參數選擇圓圈形式
  div_node.style = "background-color:"+color_select[number][0]+";"+
                   "border-color:"+color_select[number][1]
  let text_node = document.createTextNode(block_id); //將文字變成 node，準備加入表
  td_node0.appendChild(div_node); //將圓圈變成 td node
  td_node1.appendChild(text_node); //將文字 node變成 td node
  tr_node.appendChild(td_node0); //將兩個 td node 放進 tr node
  tr_node.appendChild(td_node1);
  table_obj.appendChild(tr_node); //將 tr node 放入送進來的表中
}
