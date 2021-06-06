

let is_parsed = false;
let population = 0;
let country;
let country_code;
let total_vaccination_history;
let people_fully_vaccinated_history;
let daily_vaccination_history;
let daily_vaccinations_per_million_history;
let daily_vaccinations_raw_history;
let daily_vaccinations_raw_history_sorted;
let daily_vaccinations_raw_history_exceptmonday;
let daily_vaccinations_raw_history_exceptmonday_sorted;
let daily_vaccinations_raw_max;
let daily_vaccinations_raw_max_exceptmonday;
let latest_value;
let previous_valuse;
let last_update;
let progress;
let remainingDays
let remainingDays60
let speed;
let speed_per_million;
let canvas_height_ratio = 0.5;
let error_code = 0;
let ui_select;
let ui_shareButton;
let ui_eulabutton_size = [200,30];
let ui_eulabutton_color = [255,255,255];
let ui_eulabutton_position_from_center = [0,-120];
let ui_ui_save_button;
let is_mouse_on_ULA_button = false;
let sel;
let day_jp = [ "日", "月", "火", "水", "木", "金", "土" ] ;

function setup() {
  country = pb_country;
  country_code = pb_country_code;
  createCanvas(window.innerWidth, windowHeight*canvas_height_ratio);
  requestPopulation();
  uiCreateShareButton(); //not required
}
function requestPopulation(){
  let url_population = 'https://raw.githubusercontent.com/owid/covid-19-data/master/scripts/input/un/population_2020.csv';
  loadTable(url_population,  'csv', 'header', gotPopTable);
}
function requestVaccination(){
  let url_vaccinations = 'https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/vaccinations/vaccinations.json';
  loadJSON(url_vaccinations, gotData);
}

function drawMilestone(){
  let text_w = 0;
  pb_milestone.forEach((item, i) => {
    let remainingDays = (item.absolute)? calcRemainingDays(item.value,latest_value) : calcRemainingDays(item.value * population,latest_value);
    let remainingDaysPrevious =  (item.absolute)? calcRemainingDays(item.value,previous_valuse) : calcRemainingDays(item.value * population,previous_valuse);
    let barRatio = (item.absolute)? item.value / population : item.value;

    let marker_x = width/10 + width*0.8*barRatio;
    let marker_y = height/2-15;
    let annotation_x = width/10;
    let annotation_y = (height/2+43) + i*18;
    if(item.marker){
      if(item.fill) fill(255);
      else noFill();
      if(item.stroke) stroke(255);
      else noStroke();
      drawMarker(marker_x, marker_y);
      drawMarker(annotation_x+5, annotation_y);
      annotation_x+=15;
    }
    noStroke();
    fill(255);
    let difference = remainingDays-remainingDaysPrevious;
    let plus = (difference>0)? '+' : '';
    let str_remainingDays = remainingDays.toLocaleString() + "日";
    let str_difference = plus+ difference +"日";
    if(country_code=="JPN"){
      str_remainingDays = str_difference = "調整中";
    }
    let textStr = item.label + "まで " + str_remainingDays+" (前日差 "+str_difference+")";
    text(textStr, annotation_x, annotation_y);
    text_w += textWidth(textStr);
  });

}

function drawMarker(x, y){
  let w = 8;
  let h = 8;
  triangle(x,y, x-w/2, y-h, x+w/2, y-h);
}

function gotPopTable(data){
  let rows = data.matchRows(country_code, 'iso_code');
  if(rows.length != 1) error_code = 1;
  else{
    population = rows[0].getNum('population');
  }
  if(error_code==0) requestVaccination();
}

function gotData(data) {



  var country_data = data.filter(function(item, index){
    if (item.country == country) return true;
  });
  country_data = country_data[0].data;

  total_vaccination_history = country_data.filter(function(item, index){
    if(item.total_vaccinations) return true;
  });
  total_vaccination_latest = total_vaccination_history[total_vaccination_history.length-1];

  people_fully_vaccinated_history = country_data.filter(function(item, index){
    if(item.people_fully_vaccinated) return true;
  });
  people_fully_vaccinated_latest = people_fully_vaccinated_history[people_fully_vaccinated_history.length-1];

  daily_vaccination_history = country_data.filter(function(item, index){
    if(item.daily_vaccinations) return true;
  });
  daily_vaccination_latest = daily_vaccination_history[daily_vaccination_history.length-1];

  daily_vaccinations_raw_history = country_data.filter(function(item, index){
    if(item.daily_vaccinations_raw) return true;
  });

  daily_vaccinations_raw_history_sorted = daily_vaccinations_raw_history.slice();
  daily_vaccinations_raw_history_sorted.sort(compare_daily_vaccinations_raw);
  daily_vaccinations_raw_max = daily_vaccinations_raw_history_sorted[0];

  //remove Monday
  daily_vaccinations_raw_history_exceptmonday = country_data.filter(function(item, index){
    if(item.daily_vaccinations_raw){
      let date = new Date(item.date);
      if( date.getDay() != 1){
        return true;
      }
    }
  });

  daily_vaccinations_raw_history_exceptmonday_sorted = daily_vaccinations_raw_history_exceptmonday.slice();
  daily_vaccinations_raw_history_exceptmonday_sorted.sort(compare_daily_vaccinations_raw);
  daily_vaccinations_raw_max_exceptmonday = daily_vaccinations_raw_history_exceptmonday_sorted[0];

  daily_vaccinations_per_million_history = country_data.filter(function(item, index){
    if(item.daily_vaccinations_per_million) return true;
  });
  daily_vaccinations_per_million_history_latest = daily_vaccinations_per_million_history[daily_vaccinations_per_million_history.length-1];

  latest_value ={
    'total_vaccinations' :
      {
        'date' : total_vaccination_latest.date,
        'value': total_vaccination_latest.total_vaccinations
      },
    'people_fully_vaccinated':
      {
        'date' : people_fully_vaccinated_latest.date,
        'value': people_fully_vaccinated_latest.people_fully_vaccinated
      },
    'daily_vaccinations' :
      {
        'date' : daily_vaccination_latest.date,
        'value': daily_vaccination_latest.daily_vaccinations
      },
    'daily_vaccinations_per_million':
      {
        'date' : daily_vaccinations_per_million_history_latest.date,
        'value': daily_vaccinations_per_million_history_latest.daily_vaccinations_per_million
      }
  }

  previous_valuse = {
    'total_vaccinations' :
      {
        'date' : total_vaccination_history[total_vaccination_history.length-2].date,
        'value': total_vaccination_history[total_vaccination_history.length-2].total_vaccinations
      },
    'people_fully_vaccinated':
      {
        'date' : people_fully_vaccinated_history[people_fully_vaccinated_history.length-2].date,
        'value': people_fully_vaccinated_history[people_fully_vaccinated_history.length-2].people_fully_vaccinated
      },
    'daily_vaccinations' :
      {
        'date' : daily_vaccination_history[daily_vaccination_history.length-2].date,
        'value': daily_vaccination_history[daily_vaccination_history.length-2].daily_vaccinations
      },
    'daily_vaccinations_per_million':
      {
        'date' : daily_vaccinations_per_million_history[daily_vaccinations_per_million_history.length-2].date,
        'value': daily_vaccinations_per_million_history[daily_vaccinations_per_million_history.length-2].daily_vaccinations_per_million
      }
  }

  last_update = country_data[country_data.length-1].date;

  progress = latest_value.people_fully_vaccinated.value / population;
  remainingDays = calcRemainingDays(population,latest_value);
  remainingDays60 = calcRemainingDays(population *0.6,latest_value);


  speed = latest_value.daily_vaccinations.value;
  speed_per_million = latest_value.daily_vaccinations_per_million.value;

  is_parsed = true;
  createUI();

}

function draw() {
  if(is_parsed){
    drawProgressbar();
    noLoop();
  }
  else{
	background(200);
  textAlign(CENTER);
	text("Loading", width/2, 50);
  if(error_code !=0) text("Error code:" + error_code,width/2 -50, height/2-20);
  textAlign(LEFT);
  }
}

function windowResized(){
  if(is_parsed){
    drawProgressbar();
    noLoop();
  }
}

function drawProgressbar(){
  noCanvas();
  createCanvas(window.innerWidth, window.innerHeight*canvas_height_ratio);
  background(200);

  let percentage = Math.floor(progress*100000)/1000;

  fill(0,0,80)
  rect(width*0.065, height/2-70, width*0.87,140);
  textAlign(LEFT);
  noStroke();
  fill(48);
  rect(width/10, height/2-15, width*0.8, 20);
  fill(0,180,255);
  rect(width/10, height/2-15, width*0.8*progress, 20);


  fill(ui_eulabutton_color[0],ui_eulabutton_color[1],ui_eulabutton_color[2]);
  stroke(255);
  rect(width/2-ui_eulabutton_size[0]/2 + ui_eulabutton_position_from_center[0], height/2+ui_eulabutton_position_from_center[1], ui_eulabutton_size[0], ui_eulabutton_size[1]);
  noStroke();

  fill(0);
  textSize(16);

  textAlign(CENTER);
  text("利用規約",width/2 + ui_eulabutton_position_from_center[0], height/2+ui_eulabutton_position_from_center[1]+20)

  fill(255);
  textAlign(LEFT);

  text("Vaccinating "+country+"...  " + percentage +"%", width/10, height/2-46);
  textSize(12);
  text( "(2回接種: "+ latest_value.people_fully_vaccinated.value.toLocaleString() +"人/ " + population.toLocaleString()+"人)", width/10, height/2-28 )

  let str_speed = speed.toLocaleString()+ "回/日";
  let str_speed_per_million = speed_per_million.toLocaleString();+"回/日,100万人";
  if(country_code === "JPN"){
    str_speed = str_speed_per_million = "調整中";
  }
  text("直近7日平均: " + str_speed+ " (対人口比 "+str_speed_per_million+")", width/10, height/2+24);


  drawMilestone();

  textSize(12);
  fill(32);
  textAlign(CENTER);
  text("last update:"+ last_update, width/2, height/2+100);



}

function mouseMoved(){
  let buttonLTX = width/2-ui_eulabutton_size[0]/2 + ui_eulabutton_position_from_center[0];
  let buttonWidth = ui_eulabutton_size[0];
  let buttonLTY = height/2+ui_eulabutton_position_from_center[1];
  let buttonHeight = ui_eulabutton_size[1];
  if(mouseX > buttonLTX &&  mouseX < buttonLTX + buttonWidth &&
     mouseY > buttonLTY && mouseY < buttonLTY + buttonHeight){
    cursor('pointer');
    is_mouse_on_ULA_button = true;
  }
  else{
    cursor('default');
    is_mouse_on_ULA_button = false;
  }
}

function mouseReleased(){
  if(is_mouse_on_ULA_button) location.href = "about.html";
}

function uiCreateSaveButton(){

  let ui_save_button_container = createDiv('');
  ui_save_button_container.addClass('saveButton');
  ui_save_button = createButton('画像を保存');
  ui_save_button.mousePressed(saveAsImage);
  ui_save_button_container.child(ui_save_button);
}

function uiCreateImportantNotificationButton(){
  let ui_important_notification_button_container = createDiv('');
  ui_important_notification_button_container.addClass('importantNotificationButton');
  ui_important_notification_button = createButton('重要なお知らせ');
  ui_important_notification_button.mousePressed(function(){ location.href="note.html"; });
  ui_important_notification_button_container.child(ui_important_notification_button);
}

function saveAsImage(){
  let filename = 'VPB'+'_'+pb_country_code+'_'+last_update+'.jpg';
  save(filename);
}

function uiCreateSelect(){
  ui_select = createDiv('');
  ui_select.addClass('countrySelector');
  sel = createSelect();
  sel.option('他の国・地域を見る',0);
  sel.selected('他の国・地域を見る');

  sel.option('ーーアジアーー');
  sel.disable('ーーアジアーー');
  sel.option('　日本','/');
  sel.option('　インドネシア','IDN.html');
  sel.option('　フィリピン','PHL.html');
  sel.option('　ベトナム','VNM.html');
  sel.option('　タイ','THA.html');
  sel.option('　シンガポール','SGP.html');
  sel.option('　韓国','KOR.html');
  sel.option('　インド','IND.html');
  sel.option('　パキスタン','PAK.html');
  sel.option('　イスラエル','ISR.html');
  sel.option('　ウズベキスタン','UZB.html');
  sel.option('　カザフスタン','KAZ.html');

  sel.option('ーーヨーロッパーー');
  sel.disable('ーーヨーロッパーー');
  sel.option('　イギリス','GBR.html');
  sel.option('　フランス','FRA.html');
  sel.option('　ドイツ','DEU.html');
  sel.option('　イタリア','ITA.html');
  sel.option('　スペイン','ESP.html');
  sel.option('　ウクライナ','UKR.html');
  sel.option('　ポーランド','POL.html');
  sel.option('　ルーマニア','ROU.html');
  sel.option('　オランダ','NLD.html');
  sel.option('　ベルギー','BEL.html');
  sel.option('　ギリシャ','GRC.html');
  sel.option('　チェコ','CZE.html');
  sel.option('　スウェーデン','SWE.html');
  sel.option('　ポルトガル','PRT.html');
  sel.option('　ハンガリー','HUN.html');
  sel.option('　ロシア','RUS.html');

  sel.option('ーー北米ーー');
  sel.disable('ーー北米ーー');
  sel.option('　アメリカ','USA.html');
  sel.option('　カナダ','CAN.html');

  sel.option('ーー南米ーー');
  sel.disable('ーー南米ーー');
  sel.option('　ブラジル','BRA.html');
  sel.option('　コロンビア','COL.html');

  sel.option('ーーアフリカーー');
  sel.disable('ーーアフリカーー');
  sel.option('　南アフリカ','ZAF.html');

  sel.option('ーーオセアニアーー');
  sel.disable('ーーオセアニアーー');
  sel.option('　ニュージーランド','NZL.html');

  sel.option('ーー地域ーー');
  sel.disable('ーー地域ーー');
  sel.option('　世界全体','OWID_WRL.html');
  sel.option('　アジア','OWID_ASI.html');
  sel.option('　ヨーロッパ','OWID_EUR.html');
  sel.option('　北米','OWID_NAM.html');
  sel.option('　南米','OWID_SAM.html');
  sel.option('　アフリカ','OWID_AFR.html');
  sel.option('　オセアニア','OWID_OCE.html');

  sel.changed(uiChangeSelect);
  ui_select.child(sel);
}

function uiChangeSelect(){
  location.href=sel.value();
}

function uiCreateShareButton(){
  ui_shareButton = createDiv('');
  ui_shareButton.addClass('shareButton');
  let shareButtonLine = createDiv('<div class="line-it-button" data-lang="ja" data-type="share-a" data-ver="3" data-url="'+location.href+'" data-color="default" data-size="small" data-count="false" style="display: none;"></div>');
  let shareButtonTwitter = createDiv('<div><a href="https://twitter.com/share?ref_src=twsrc%5Etfw" class="twitter-share-button" data-show-count="false" data-text=" " data-hashtags="ワクチン接種プログレスバー">Tweet</a></div>');
  ui_shareButton.child(shareButtonLine);
  ui_shareButton.child(shareButtonTwitter);
}

function uiCreateMaxValue(){
  if(daily_vaccinations_raw_history.length>0){
    let date_ex = daily_vaccinations_raw_max_exceptmonday.date;
    let value_ex = daily_vaccinations_raw_max_exceptmonday.daily_vaccinations_raw;
    let day_ex = day_jp[( new Date(date_ex) ).getDay()];

    let date = daily_vaccinations_raw_max.date;
    let value = daily_vaccinations_raw_max.daily_vaccinations_raw;
    let day = day_jp[( new Date(date) ).getDay()];


    let ui_maxValue = createDiv('<p><strong>最多接種記録</strong><br/>(月曜除く) '+date_ex+'('+day_ex+') '+ value_ex.toLocaleString()+'回<br/>(月曜含む) '+date+'('+day+') '+ value.toLocaleString()+'回<p>');
    ui_maxValue.addClass('max-value');
  }
}

function uiCreateLatestTable(){
  let ui_latestTableDiv = createDiv('<p><strong>最近の接種履歴</strong><br/>');
  ui_latestTableDiv.addClass('latest-table');
  let ui_table = createElement('table');
  let limit = (daily_vaccinations_raw_history.length<=7)? daily_vaccinations_raw_history.length : 7;
  for(let i=0; i<limit; i++){
    let obj = daily_vaccinations_raw_history[daily_vaccinations_raw_history.length-1-i];
    let date = obj.date;
    let day = day_jp[( new Date(date) ).getDay()];
    let value = obj.daily_vaccinations_raw
    let row = createElement('tr','<td>'+date+'('+day+')</td><td>'+value.toLocaleString()+'回</td>');
    ui_table.child(row);
  }
  ui_latestTableDiv.child(ui_table);
}

function uiCriateRelatedLink(){
  let ui_relatedLink = createDiv('<p><strong>開発者の記事</strong><br/><p><a href="https://note.com/masakick/n/ne3062ef18274" target="_blank">長いワクチン待ちの行列はどのように消化されていくのかについて</a></p>');
}

function createUI(){
  if(country_code === "JPN"){
    uiCreateImportantNotificationButton();
  }
  uiCreateSaveButton();
  if(country_code !== "JPN"){
    uiCreateMaxValue();
    uiCreateLatestTable();
  }
  uiCreateSelect();
  uiCriateRelatedLink();
}


function compare_daily_vaccinations_raw(a, b) {
  const valA = a.daily_vaccinations_raw;
  const valB = b.daily_vaccinations_raw;

  let comparison = 0;
  if (valA < valB) {
    comparison = 1;
  } else if (valA > valB) {
    comparison = -1;
  }
  return comparison;
}

function calcRemainingDays(people_shouldbe_vacinated, data){
  let people_single_vaccinated = data.total_vaccinations.value - 2* data.people_fully_vaccinated.value;
  let people_no_vacinated = people_shouldbe_vacinated - data.people_fully_vaccinated.value - people_single_vaccinated;
  let people_remain_vacinated = people_shouldbe_vacinated - data.people_fully_vaccinated.value;
  let remain_vacinations;
  if(people_single_vaccinated + data.people_fully_vaccinated.value < people_shouldbe_vacinated){
    remain_vacinations = people_single_vaccinated + people_no_vacinated*2;
  }
  else{
    remain_vacinations = people_shouldbe_vacinated - data.people_fully_vaccinated.value;
  }
  return Math.floor( Math.max(0, remain_vacinations / data.daily_vaccinations.value) );
}
