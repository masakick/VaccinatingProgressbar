

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

  last_update = country_data[country_data.length-1].date;

  progress = latest_value.people_fully_vaccinated.value / population;
  remainingDays = calcRemainingDays(population);
  remainingDays60 = calcRemainingDays(population *0.6);


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
	text("Loading", width/2 -50, 50);
  if(error_code !=0) text("Error code:" + error_code,width/2 -50, height/2-20);
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
  rect(width/10, height/2-12, width*0.8, 20);
  fill(0,180,255);
  rect(width/10, height/2-12, width*0.8*progress, 20);

  fill(255);
  textSize(16);
  text("Vaccinating "+country+"...  " + percentage +"%", width/10, height/2-41);
  textSize(12);
  text( "(2回接種: "+ latest_value.people_fully_vaccinated.value.toLocaleString() +"人/ " + population.toLocaleString()+"人)", width/10, height/2-22 )


  text("直近7日平均: " + speed.toLocaleString() + "回/日  (対人口比 "+speed_per_million.toLocaleString()+"回/日,100万人)", width/10, height/2+30);
  text("完了まで残り" + remainingDays.toLocaleString() + "日（60%まで残り"+remainingDays60.toLocaleString()+"日）", width/10, height/2+50);

  textSize(12);
  fill(32);
  textAlign(CENTER);
  text("last update:"+ last_update, width/2, height/2+100);


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
  sel.option('　イスラエル','ISR.html');
  sel.option('　シンガポール','SGP.html');
  sel.option('　韓国','KOR.html');
  sel.option('　インド','IND.html');

  sel.option('ーーヨーロッパーー');
  sel.disable('ーーヨーロッパーー');
  sel.option('　イギリス','GBR.html');
  sel.option('　フランス','FRA.html');
  sel.option('　ドイツ','DEU.html');
  sel.option('　ロシア','RUS.html');
  sel.option('　ハンガリー','HUN.html');

  sel.option('ーー北米ーー');
  sel.disable('ーー北米ーー');
  sel.option('　アメリカ','USA.html');

  sel.option('ーー南米ーー');
  sel.disable('ーー南米ーー');
  sel.option('　ブラジル','BRA.html');

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
  let date_ex = daily_vaccinations_raw_max_exceptmonday.date;
  let value_ex = daily_vaccinations_raw_max_exceptmonday.daily_vaccinations_raw;
  let day_ex = day_jp[( new Date(date_ex) ).getDay()];

  let date = daily_vaccinations_raw_max.date;
  let value = daily_vaccinations_raw_max.daily_vaccinations_raw;
  let day = day_jp[( new Date(date) ).getDay()];


  let ui_maxValue = createDiv('<p><strong>最多接種記録</strong><br/>(月曜除く) '+date_ex+'('+day_ex+') '+ value_ex.toLocaleString()+'回<br/>(月曜含む) '+date+'('+day+') '+ value.toLocaleString()+'回<p>');
  ui_maxValue.addClass('max-value');
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
  uiCreateMaxValue();
  uiCreateLatestTable();
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

function calcRemainingDays(people_shouldbe_vacinated){
  let people_single_vaccinated = latest_value.total_vaccinations.value - 2* latest_value.people_fully_vaccinated.value;
  let people_no_vacinated = people_shouldbe_vacinated - latest_value.people_fully_vaccinated.value - people_single_vaccinated;
  let people_remain_vacinated = people_shouldbe_vacinated - latest_value.people_fully_vaccinated.value;
  let remain_vacinations;
  if(people_single_vaccinated + latest_value.people_fully_vaccinated.value < people_shouldbe_vacinated){
    remain_vacinations = people_single_vaccinated + people_no_vacinated*2;
  }
  else{
    remain_vacinations = people_shouldbe_vacinated - latest_value.people_fully_vaccinated.value;
  }
  return Math.floor( Math.max(0, remain_vacinations / latest_value.daily_vaccinations.value) );
}
