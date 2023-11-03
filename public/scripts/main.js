var rhit = rhit || {};

rhit.FB_COLLECTION_BILL = "bill";
rhit.FB_COLLECTION_INDIVIDUAL = "individual";
rhit.FB_COLLECTION_GROUP = "group";
rhit.FB_KEY_NAME = "name";
rhit.FB_KEY_DESCRIPTION = "description";
rhit.FB_KEY_AMOUNT = "amount";
rhit.FB_KEY_FROM = "from";


rhit.main = function () {
 
}

// Piechart script: documentation @ https://developers.google.com/chart/interactive/docs/gallery/piechart
google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(drawChart);
function drawChart() {
  var data = google.visualization.arrayToDataTable([
  ['Expense', 'Amount Owed'], ['GROCERIES', 20],
  ['FAST FOOD', 10], ['TRIP', 50],
  ['GAMES', 10], ['SNACKS', 15]
  ]);
  var options = {
    fontName: 'Roboto',
    legend: {position: 'top', maxLines: '2'}
  };
  var chart = new google.visualization.PieChart(document.getElementById('piechart'));
  chart.draw(data, options);
}

rhit.main();