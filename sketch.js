

let is_parsed = false;
let population = 0;
let country;
let country_code;
let total_vaccination_history;
let people_fully_vaccinated_history;
let daily_vaccination_history;
let daily_vaccinations_per_million_history;
let latest_value;
let last_update;
let progress;
let remainingDays
let speed;
let speed_per_million;
let canvas_height_ratio = 0.5;
let error_code = 0;
let ui_select;
let sel;

function setup() {
  country = pb_country;
  country_code = pb_country_code;
  createCanvas(window.innerWidth, windowHeight*canvas_height_ratio);
  requestPopulation();
  uiCreateSelect();

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
  remainingDays = (population *2 - latest_value.total_vaccinations.value) /  latest_value.daily_vaccinations.value;
  remainingDays = Math.floor(remainingDays);
  speed = latest_value.daily_vaccinations.value;
  speed_per_million = latest_value.daily_vaccinations_per_million.value;

  is_parsed = true;

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
  rect(width*0.075, height/2-70, width*0.85,140);
  textAlign(LEFT);
  noStroke();
  fill(48);
  rect(width/10, height/2-12, width*0.8, 20);
  fill(0,180,255);
  rect(width/10, height/2-12, width*0.8*progress, 20);

  fill(255);
  textSize(16);
  text("Vaccinating "+country+"... " + percentage +"% 完了", width/10, height/2-41);
  textSize(12);
  text( "(2回目接種済: "+ latest_value.people_fully_vaccinated.value +"人/ " + population+"人)", width/10, height/2-22 )


  text("直近7日平均速度: " + speed + "回/日  (対人口比 "+speed_per_million+"回/日,100万人)", width/10, height/2+30);
  text("完了まで残り  " + remainingDays + "日", width/10, height/2+50);

  textSize(12);
  fill(32);
  textAlign(CENTER);
  text("last update:"+ last_update, width/2, height/2+100);
}

function uiCreateSelect(){
  ui_select = createDiv('');
  ui_select.addClass('countrySelector');
  sel = createSelect();
  sel.option('他の国を見る',0);
  sel.selected('他の国を見る');

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

  sel.changed(uiChangeSelect);
  ui_select.child(sel);
}

function uiChangeSelect(){
  location.href=sel.value();
}
